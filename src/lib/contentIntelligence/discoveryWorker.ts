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
    host.endsWith(".nyc") ||
    host.includes("ymca") ||
    host.includes("museum") ||
    host.includes("library")
  ) {
    return { grade: "official" as const, score: 95 };
  }
  if (host.includes("facebook.com") || host.includes("instagram.com") || host.includes("eventbrite.")) {
    return { grade: "weak" as const, score: 35 };
  }
  return { grade: "authoritative" as const, score: 75 };
}

function inferListingKind(text: string) {
  if (/\b(parent meetup|playdate group|mom group|new parents|family meetup)\b/i.test(text)) {
    return "meetupGroup" as const;
  }
  return "provider" as const;
}

function inferCategory(text: string, targetCategory: string) {
  const hay = text.toLowerCase();
  if (hay.includes("birthday")) return "Birthday Parties";
  if (hay.includes("camp")) return "Camps";
  if (hay.includes("drop-in") || hay.includes("open play") || hay.includes("drop in")) return "Drop-In Activities";
  if (targetCategory === "Meet-Up Groups") return "Meet-Up Groups";
  return "Classes";
}

const ACTIVITY_KEYWORDS: Record<string, string[]> = {
  Sports: ["sport", "athletic"],
  Dance: ["dance", "ballet", "hip hop"],
  Gymnastics: ["gymnastics"],
  Art: ["art", "painting", "drawing", "craft"],
  Music: ["music", "sing", "piano", "guitar", "drum"],
  STEM: ["stem", "robot", "coding", "engineering"],
  "Martial Arts": ["martial arts", "karate", "taekwondo", "mma", "jiu jitsu"],
  Swimming: ["swim", "swimming", "aquatic"],
  Theater: ["theater", "theatre", "acting", "drama"],
  Language: ["spanish", "language", "mandarin", "bilingual"],
  Tutoring: ["tutoring", "academic support"],
  "Indoor Play": ["indoor play", "play space", "open play"],
  "Outdoor Activities": ["outdoor", "park", "garden"],
  Yoga: ["yoga"],
  Soccer: ["soccer"],
  Basketball: ["basketball"],
  Science: ["science"],
  "Birthday Entertainment": ["birthday"],
};

function inferActivityTypes(text: string) {
  const hay = text.toLowerCase();
  return Object.entries(ACTIVITY_KEYWORDS)
    .filter(([, keywords]) => keywords.some((keyword) => hay.includes(keyword)))
    .map(([activity]) => activity)
    .slice(0, 6);
}

function inferAgeRanges(text: string) {
  const hay = text.toLowerCase();
  const ages = new Set<string>();
  if (/\b(infant|baby|babies|toddler|0[-–]2)\b/.test(hay)) ages.add("0–2");
  if (/\b(preschool|pre-k|ages? 3 ?[-–] ?5|3 ?[-–] ?5)\b/.test(hay)) ages.add("3–5");
  if (/\b(kindergarten|ages? 5 ?[-–] ?8|6 ?[-–] ?8|elementary)\b/.test(hay)) ages.add("6–8");
  if (/\b(ages? 9 ?[-–] ?12|9 ?[-–] ?12|middle school)\b/.test(hay)) ages.add("9–12");
  if (/\b(teen|teens|ages? 13|high school)\b/.test(hay)) ages.add("Teens");
  return [...ages];
}

function inferKidsRelevance(text: string) {
  const hay = text.toLowerCase();
  let score = 0;
  if (/\b(kids|children|child|family|families|youth|toddler|teen)\b/.test(hay)) score += 55;
  if (/\b(class|program|camp|party|drop-in|lesson|workshop|meetup)\b/.test(hay)) score += 25;
  if (/\b(nyc|new york|brooklyn|queens|bronx|manhattan|staten island)\b/.test(hay)) score += 20;
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
  return authorityGrade === "reject" || authorityGrade === "weak" || kidsRelevanceScore < 45;
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
        prefilterReasons.push(authority.grade === "weak" ? "weak_source_authority" : "low_family_relevance");
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

  artifacts.sort((left, right) => right.scoreResult.score - left.scoreResult.score || right.officialnessScore - left.officialnessScore);
  return {
    targets,
    artifacts: artifacts.slice(0, input.maxCandidates ?? 6),
  };
}
