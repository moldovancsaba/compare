import { NEIGHBORHOODS } from "@/data/locations";
import {
  CURATOR_AGE_RANGES,
  CURATOR_BADGES,
  CURATOR_BOROUGHS,
  CURATOR_CATEGORIES,
  CURATOR_DAY_TAGS,
} from "@/lib/curator/constants";
import { curatedProviderSchema, type CuratedProvider } from "@/lib/curator/providerSchema";

type Borough = (typeof CURATOR_BOROUGHS)[number];
type Category = (typeof CURATOR_CATEGORIES)[number];
type AgeRange = (typeof CURATOR_AGE_RANGES)[number];
type DayTag = (typeof CURATOR_DAY_TAGS)[number];
type Badge = (typeof CURATOR_BADGES)[number];

const DOMAIN_EVIDENCE =
  /\b(shooting|shoot|range|rifle|pistol|shotgun|firearm|firearms|hunter|hunting|competition|match|ipsc|idpa|practiscore|lőtér|lovesz|lövész|loveszet|lövészet|vadasz|vadász|vadaszat|vadászat|fegyver|sportlöv|mdlsz|hunshooting)\b/i;

function slugify(value: string) {
  return value
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 58);
}

function stripHtmlEntities(value: string) {
  return value
    .replace(/&#8211;/g, "-")
    .replace(/&amp;/g, "&")
    .replace(/&nbsp;/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function splitSentences(text: string) {
  return stripHtmlEntities(text)
    .split(/(?<=[.?!])\s+/)
    .map((sentence) => sentence.trim())
    .filter((sentence) => DOMAIN_EVIDENCE.test(sentence))
    .slice(0, 5);
}

function findEmail(text: string) {
  return text.match(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i)?.[0] ?? "";
}

function findPhone(text: string) {
  return text.match(/(?:\+\d{1,3}[-.\s]?)?(?:\(?\d{1,4}\)?[-.\s]?)?\d{2,4}[-.\s]?\d{3,4}[-.\s]?\d{3,4}/)?.[0] ?? "";
}

function inferBorough(text: string, sourceUrl: string): Borough | null {
  const hay = `${text} ${sourceUrl}`.toLowerCase();
  return CURATOR_BOROUGHS.find((borough) => hay.includes(borough.toLowerCase())) ?? (hay.includes(".hu") ? "Hungary" : null);
}

function inferNeighborhood(text: string, borough: Borough): string {
  const hay = text.toLowerCase();
  return NEIGHBORHOODS[borough].find((neighborhood) => hay.includes(neighborhood.toLowerCase())) ?? NEIGHBORHOODS[borough][0] ?? "";
}

function inferCategory(text: string): Category {
  const hay = text.toLowerCase();
  if (/\b(course|training|class|academy|clinic|education|képzés|tanfolyam|oktatás)\b/i.test(hay)) return "Classes";
  if (/\b(range|venue|facility|lőtér)\b/i.test(hay)) return "Camps";
  if (/\b(competition|match|calendar|cup|championship|verseny|bajnokság)\b/i.test(hay)) return "Competitions";
  return "Drop-In Activities";
}

function inferActivityTypes(text: string) {
  const activities: string[] = [];
  const checks: Array<[string, RegExp]> = [
    ["Rifle", /\brifle|puska|sportlöv/i],
    ["Pistol", /\bpistol|pisztoly/i],
    ["Shotgun", /\bshotgun|skeet|trap|clay|korong/i],
    ["IPSC", /\bipsc|dynamic|dinamikus/i],
    ["IDPA", /\bidpa|defensive/i],
    ["Range Training", /\brange|training|course|lőtér|képzés|tanfolyam/i],
    ["Competitions", /\bcompetition|match|cup|championship|verseny|bajnokság/i],
    ["Hunter Safety", /\bhunter|hunting|vadász|vadászat/i],
  ];
  for (const [label, pattern] of checks) {
    if (pattern.test(text)) activities.push(label);
  }
  return activities.slice(0, 8);
}

function inferAgeRanges(text: string): AgeRange[] {
  const ages = new Set<AgeRange>();
  if (/\bbeginner|intro|course|training|new shooter|tanfolyam|képzés/i.test(text)) ages.add("Beginner");
  if (/\byouth|junior|teen|ifjúsági|junior/i.test(text)) ages.add("Youth");
  if (/\blicen[cs]e|licensed|membership|hunter|vadász/i.test(text)) ages.add("Licensed Adult");
  if (/\bcompetition|match|championship|verseny|bajnokság|ipsc|idpa/i.test(text)) ages.add("Competition");
  if (/\bhunter|hunting|vadász|vadászat/i.test(text)) ages.add("Hunter Prep");
  return [...ages];
}

function inferDayTags(text: string): DayTag[] {
  const tags = new Set<DayTag>();
  if (/\bmonday|tuesday|wednesday|thursday|friday|hétfő|kedd|szerda|csütörtök|péntek/i.test(text)) tags.add("Weekday");
  if (/\bsaturday|sunday|weekend|szombat|vasárnap|hétvége/i.test(text)) tags.add("Weekend");
  if (/\bmorning|délelőtt/i.test(text)) tags.add("Morning");
  if (/\bafternoon|délután/i.test(text)) tags.add("Afternoon");
  if (/\bevening|este/i.test(text)) tags.add("Evening");
  if (/\bcalendar|season|competition|match|versenynaptár|verseny/i.test(text)) tags.add("Seasonal");
  return [...tags];
}

function inferBadges(activityTypes: string[], dayTimeTags: DayTag[]): Badge[] {
  const badges: Badge[] = [];
  if (activityTypes.includes("Competitions")) badges.push("Competition Ready");
  if (dayTimeTags.includes("Weekend")) badges.push("Weekend Friendly");
  if (activityTypes.includes("Range Training")) badges.push("Beginner Friendly");
  return badges.slice(0, 3);
}

function buildDescription(sentences: string[], sourceUrl: string) {
  return `${sentences.join(" ")}\n\nSources: ${sourceUrl}`;
}

export function extractProviderLocally(args: {
  sourceUrl: string;
  pageTitle?: string;
  pageText: string;
}): { ok: true; provider: CuratedProvider } | { ok: false; reason: string } {
  const pageText = stripHtmlEntities(args.pageText);
  const title = stripHtmlEntities(args.pageTitle || pageText.split(/[.!?]/)[0] || "");
  const evidenceText = `${title} ${pageText} ${args.sourceUrl}`;

  if (!DOMAIN_EVIDENCE.test(evidenceText)) {
    return { ok: false, reason: "local extractor found no Compare shooting/hunting/range evidence" };
  }

  const borough = inferBorough(evidenceText, args.sourceUrl);
  if (!borough) return { ok: false, reason: "local extractor could not map source to a supported country" };

  const activityTypes = inferActivityTypes(evidenceText);
  const ageRanges = inferAgeRanges(evidenceText);
  const dayTimeTags = inferDayTags(evidenceText);

  if (activityTypes.length === 0) return { ok: false, reason: "local extractor found no supported activity type" };
  if (ageRanges.length === 0) return { ok: false, reason: "local extractor found no supported audience signal" };
  if (dayTimeTags.length === 0) return { ok: false, reason: "local extractor found no schedule or season signal" };

  const name = title.slice(0, 120);
  if (name.length < 2) return { ok: false, reason: "local extractor could not derive a truthful title" };

  const descriptionSentences = splitSentences(pageText);
  if (descriptionSentences.length === 0) {
    return { ok: false, reason: "local extractor could not derive a truthful content summary from source facts" };
  }
  const longDescription = buildDescription(descriptionSentences, args.sourceUrl);
  const category = inferCategory(evidenceText);
  const neighborhood = inferNeighborhood(evidenceText, borough);
  const provider: CuratedProvider = {
    id: `prov-${slugify(name)}`,
    name,
    category,
    borough,
    neighborhood,
    address: `${neighborhood}, ${borough}`,
    activityTypes,
    ageRanges,
    dayTimeTags,
    pricePerClass: 0,
    shortDescription: descriptionSentences[0].slice(0, 380),
    longDescription,
    rating: 0,
    reviewCount: 0,
    badges: inferBadges(activityTypes, dayTimeTags),
    image: "",
    email: findEmail(pageText),
    website: args.sourceUrl,
    phone: findPhone(pageText),
    recurringPrograms: [
      {
        id: `${slugify(name)}-source-schedule`,
        title: `${name} source-backed schedule`,
        cadence: "Seasonal",
        daysOfWeek: [],
        timeText: "See official source",
        ageRanges,
        activityTypes,
        summary: "The local extractor found source-backed competition, range, training, or organization signals. Operators must review exact dates before publishing booking claims.",
        registrationUrl: args.sourceUrl,
      },
    ],
  };

  const parsed = curatedProviderSchema.safeParse(provider);
  if (!parsed.success) {
    return { ok: false, reason: `local schema: ${parsed.error.errors.map((error) => `${error.path.join(".")}:${error.message}`).join("; ")}` };
  }

  return { ok: true, provider: parsed.data };
}
