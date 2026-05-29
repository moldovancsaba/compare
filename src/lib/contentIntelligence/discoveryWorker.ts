import { fetchPageText } from "@/lib/curator/fetchPageText";
import { serperSearch, type SerperOrganic } from "@/lib/curator/serperSearch";
import { buildDedupeSupportIndex, type CatalogDedupeSupportIndex, type CatalogSnapshot } from "@/lib/catalogIntelligence";
import { buildRangeScoutDiscoveryTargets, type DiscoveryTarget } from "@/lib/contentIntelligence/discoveryTargets";
import { scoreRangeScoutCandidate, type ScarcityScoreResult } from "@/lib/contentIntelligence/scarcityRulebook";
import type { NormalizedListingInput } from "@/lib/contentIntelligence/rangeScoutAdapter";
import type { MeetupGroup } from "@/types/meetup";
import type { Provider } from "@/types/provider";

export interface DiscoveryArtifact {
  artifactId: string;
  targetId: string;
  searchQuery: string;
  sourceUrl: string;
  sourceHost: string;
  title: string;
  snippet: string;
  authorityGrade: "official" | "authoritative" | "weak" | "reject";
  listingKindHint: "provider" | "meetupGroup";
  categoryHint: string;
  boroughGuess: string;
  neighborhoodGuess: string;
  activityTypesRaw: string[];
  ageRangesRaw: string[];
  ogImageUrl?: string;
  rawText: string;
  officialnessScore: number;
  kidsRelevanceScore: number;
  prefilterReasons: string[];
  scarcityTargets: string[];
  rationale: string[];
  scoreResult: ScarcityScoreResult;
}

function slugify(value: string) {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}

function normalize(value: string | null | undefined) {
  return String(value ?? "").trim().toLowerCase();
}

function decodeDuckDuckGoTarget(href: string) {
  try {
    const url = new URL(href, "https://html.duckduckgo.com");
    const target = url.searchParams.get("uddg");
    return target ? decodeURIComponent(target) : href;
  } catch {
    return href;
  }
}

async function fallbackSearch(query: string): Promise<SerperOrganic[]> {
  const response = await fetch(`https://html.duckduckgo.com/html/?q=${encodeURIComponent(query)}`, {
    headers: {
      "User-Agent": "RangeScoutCuratorBot/1.0",
      Accept: "text/html",
    },
  });
  if (!response.ok) {
    throw new Error(`DuckDuckGo HTTP ${response.status}`);
  }
  const html = await response.text();
  const results: SerperOrganic[] = [];
  const anchorRegex = /<a[^>]+class="result__a"[^>]+href="([^"]+)"[^>]*>([\s\S]*?)<\/a>/gi;
  let match: RegExpExecArray | null = null;
  while ((match = anchorRegex.exec(html)) && results.length < 8) {
    const href = decodeDuckDuckGoTarget(match[1] || "");
    const title = (match[2] || "").replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
    if (!href.startsWith("https://")) continue;
    results.push({ title, link: href, snippet: "" });
  }
  return results;
}

async function searchWeb(query: string) {
  try {
    return await serperSearch(query);
  } catch {
    return fallbackSearch(query);
  }
}

function scoreAuthority(url: URL) {
  const host = url.hostname.toLowerCase();
  if (
    host.endsWith(".org") ||
    host.endsWith(".gov") ||
    host.includes(".hu") ||
    host.includes("mssz") ||
    host.includes("mdlsz") ||
    host.includes("ipsc") ||
    host.includes("idpa") ||
    host.includes("practiscore")
  ) {
    return { grade: "official" as const, score: 95 };
  }
  if (host.includes("facebook.com") || host.includes("instagram.com") || host.includes("eventbrite.")) {
    return { grade: "weak" as const, score: 35 };
  }
  return { grade: "authoritative" as const, score: 75 };
}

function inferListingKind(text: string) {
  if (/\b(club|association|meetup|group|hunting|shooting team|competitor)\b/i.test(text)) {
    return "meetupGroup" as const;
  }
  return "provider" as const;
}

function inferCategory(text: string, targetCategory: string) {
  const hay = text.toLowerCase();
  if (hay.includes("cup") || hay.includes("match") || hay.includes("tournament") || hay.includes("competition")) {
    return "Birthday Parties";
  }
  if (hay.includes("range") || hay.includes("facility")) {
    return "Camps";
  }
  if (hay.includes("hunting") || hay.includes("hunt") || hay.includes("field") || hay.includes("club")) {
    return "Drop-In Activities";
  }
  if (hay.includes("course") || hay.includes("training") || hay.includes("class")) {
    return "Classes";
  }
  if (targetCategory === "Meet-Up Groups") return "Meet-Up Groups";
  return "Classes";
}

const ACTIVITY_KEYWORDS: Record<string, string[]> = {
  Rifle: ["rifle", "precision rifle", "small-bore", "air rifle", "long range"],
  Pistol: ["pistol", "handgun", "air pistol", "service pistol"],
  Shotgun: ["shotgun", "clay", "skeet", "trap", "sport clay"],
  IPSC: ["ipsc", "practical", "practi", "action stage", "dynamic"],
  IDPA: ["idpa", "defensive", "defence", "self defense", "self-defence"],
  Hunting: ["hunting", "hunter", "hunting grounds", "game season"],
  "Course / Clinic": ["course", "training", "lesson", "clinic", "instructor", "licence"],
  Range: ["range", "lőtér", "shooting lane", "booking", "open lane"],
  Regulations: ["rules", "licence", "practiscore", "registration", "entry"],
};

function inferActivityTypes(text: string) {
  const hay = text.toLowerCase();
  return Object.entries(ACTIVITY_KEYWORDS)
    .filter(([, keywords]) => keywords.some((keyword) => hay.includes(keyword)))
    .map(([activity]) => activity)
    .slice(0, 8);
}

function inferAgeRanges(text: string) {
  const hay = text.toLowerCase();
  const ages = new Set<string>();
  if (/\bbeginner|new shooter|first class|newcomer|alapszint/.test(hay)) ages.add("Beginner");
  if (/\byouth|junior|teen|teenage|ifjúság|fiatal/.test(hay)) ages.add("Youth");
  if (/\bcompetition|advanced|elite|ranking|osztályos/.test(hay)) ages.add("Competition");
  if (/\blicensed|licence|licensed|membership|hunter/.test(hay)) ages.add("Licensed Adult");
  if (/\bhunter prep|hunter examination|vadászat/.test(hay)) ages.add("Hunter Prep");
  if (ages.size === 0) ages.add("Licensed Adult");
  return [...ages];
}

function inferKidsRelevance(text: string) {
  const hay = text.toLowerCase();
  let score = 30;
  if (/\b(competition|match|cup|tournament|range|club|course|training|registration|federation|practiscore|mssz|mdlsz|ipsc|idpa|shotgun|rifle|pistol|hunting)\b/i.test(hay)) {
    score += 55;
  }
  if (/\b(official|calendar|event|notice|document|rule|score|member|registration)\b/i.test(hay)) {
    score += 10;
  }
  return Math.min(score, 100);
}

function inferTitle(hit: SerperOrganic, text: string) {
  const fromHit = (hit.title ?? "").split("|")[0]?.trim();
  if (fromHit) return fromHit;
  const firstSentence = text.split(/[.?!]/)[0]?.trim();
  return firstSentence?.slice(0, 100) || "Untitled listing";
}

function inferBoroughAndNeighborhood(text: string, target: DiscoveryTarget) {
  const borough = target.borough;
  const neighborhood = target.neighborhood;
  const hay = text.toLowerCase();
  return {
    borough: hay.includes(borough.toLowerCase()) ? borough : target.borough,
    neighborhood: hay.includes(neighborhood.toLowerCase()) ? neighborhood : target.neighborhood,
  };
}

function buildProvisionalNormalizedListing(input: {
  title: string;
  listingKindHint: "provider" | "meetupGroup";
  categoryHint: string;
  boroughGuess: string;
  neighborhoodGuess: string;
  activityTypesRaw: string[];
  ageRangesRaw: string[];
  sourceUrl: string;
  ogImageUrl?: string;
  text: string;
}): NormalizedListingInput {
  return {
    title: input.title,
    listingKindHint: input.listingKindHint,
    categoryHint: input.categoryHint,
    boroughRaw: input.boroughGuess,
    neighborhoodRaw: input.neighborhoodGuess,
    activityTypesRaw: input.activityTypesRaw,
    ageRangesRaw: input.ageRangesRaw,
    descriptionFacts: [input.text.slice(0, 280)],
    contactFacts: { website: input.sourceUrl },
    imageCandidates: input.ogImageUrl ? [{ uploadedUrl: undefined }] : [],
    sourceUrls: { canonical: input.sourceUrl },
  };
}

function isDuplicateUrl(url: string, dedupeIndex: CatalogDedupeSupportIndex) {
  return dedupeIndex.websites.includes(normalize(url));
}

function isWeakCandidate(authorityGrade: DiscoveryArtifact["authorityGrade"], kidsRelevanceScore: number) {
  return authorityGrade === "reject" || authorityGrade === "weak" || kidsRelevanceScore < 40;
}

export async function discoverRangeScoutCandidates(input: {
  snapshot: CatalogSnapshot;
  providers: Provider[];
  meetups: MeetupGroup[];
  maxTargets?: number;
  maxCandidates?: number;
}) {
  const targets = buildRangeScoutDiscoveryTargets(input.snapshot, input.maxTargets ?? 4);
  const dedupeIndex = buildDedupeSupportIndex(input.providers, input.meetups);
  const artifacts: DiscoveryArtifact[] = [];

  for (const target of targets) {
    const hits = await searchWeb(target.query);
    for (const hit of hits) {
      if (artifacts.length >= (input.maxCandidates ?? 6)) break;
      const sourceUrl = String(hit.link ?? "").trim();
      if (!sourceUrl.startsWith("https://")) continue;

      let parsed: URL;
      try {
        parsed = new URL(sourceUrl);
      } catch {
        continue;
      }

      if (isDuplicateUrl(sourceUrl, dedupeIndex)) continue;

      const authority = scoreAuthority(parsed);
      let page;
      try {
        page = await fetchPageText(sourceUrl, parsed.hostname);
      } catch {
        continue;
      }

      const mergedText = `${hit.title ?? ""} ${hit.snippet ?? ""} ${page.text}`.replace(/\s+/g, " ").trim();
      const listingKindHint = inferListingKind(mergedText);
      const categoryHint = inferCategory(mergedText, target.category);
      const geo = inferBoroughAndNeighborhood(mergedText, target);
      const activityTypesRaw = inferActivityTypes(mergedText);
      const ageRangesRaw = inferAgeRanges(mergedText);
      const kidsRelevanceScore = inferKidsRelevance(mergedText);
      const title = inferTitle(hit, mergedText);
      const provisional = buildProvisionalNormalizedListing({
        title,
        listingKindHint,
        categoryHint,
        boroughGuess: geo.borough,
        neighborhoodGuess: geo.neighborhood,
        activityTypesRaw,
        ageRangesRaw,
        sourceUrl,
        ogImageUrl: page.ogImage,
        text: page.text,
      });
      const scoreResult = await scoreRangeScoutCandidate({
        normalizedListing: provisional,
        providers: input.providers,
        meetups: input.meetups,
        snapshot: input.snapshot,
      });

      const prefilterReasons: string[] = [];
      if (isWeakCandidate(authority.grade, kidsRelevanceScore)) {
        prefilterReasons.push(authority.grade === "weak" ? "weak_source_authority" : "low_shooting_relevance");
      }
      if (!page.ogImage) prefilterReasons.push("missing_official_image_candidate");
      if (scoreResult.score < 60) prefilterReasons.push("low_preliminary_scarcity_score");

      if (prefilterReasons.includes("weak_source_authority")) continue;

      artifacts.push({
        artifactId: slugify(`${target.targetId}-${title}-${parsed.hostname}`),
        targetId: target.targetId,
        searchQuery: target.query,
        sourceUrl,
        sourceHost: parsed.hostname,
        title,
        snippet: (hit.snippet ?? "").trim(),
        authorityGrade: authority.grade,
        listingKindHint,
        categoryHint,
        boroughGuess: geo.borough,
        neighborhoodGuess: geo.neighborhood,
        activityTypesRaw,
        ageRangesRaw,
        ogImageUrl: page.ogImage,
        rawText: page.text,
        officialnessScore: authority.score,
        kidsRelevanceScore,
        prefilterReasons,
        scarcityTargets: target.scarcityTargets,
        rationale: [...scoreResult.rationale, target.rationale],
        scoreResult,
      });
    }
  }

  artifacts.sort(
    (left, right) =>
      right.scoreResult.score - left.scoreResult.score || right.officialnessScore - left.officialnessScore || right.kidsRelevanceScore - left.kidsRelevanceScore,
  );
  return {
    targets,
    artifacts: artifacts.slice(0, input.maxCandidates ?? 6),
  };
}
