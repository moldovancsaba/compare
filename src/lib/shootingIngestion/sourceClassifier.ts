import type { ClassifiedSource, ShootingSourceSeedRow } from "@/lib/shootingIngestion/types";

export interface ShootingSourceClassificationInput {
  seed: ShootingSourceSeedRow;
  pageText?: string | null;
  pageTitle?: string | null;
  routeHints?: string[];
}

const EXTRACTOR_BY_CLASS: Record<ShootingSourceSeedRow["sourceClass"], ClassifiedSource["routedExtractor"]> = {
  federation: "shooting-federation-collector",
  competition_surface: "shooting-competition-collector",
  club_surface: "shooting-club-collector",
  range_surface: "shooting-range-collector",
  course_surface: "shooting-course-collector",
  registration_surface: "shooting-registration-collector",
  document_surface: "shooting-document-collector",
  event_surface: "shooting-event-collector",
  document: "shooting-document-collector",
};

function normalizeText(value: string | null | undefined) {
  return (value ?? "").toLowerCase();
}

function hasTextNeedle(value: string | null | undefined, needles: string[]) {
  const normalized = normalizeText(value);
  return needles.some((needle) => normalized.includes(needle));
}

function inferHintFromText(text: string, sourceClass: ShootingSourceSeedRow["sourceClass"]) {
  if (sourceClass === "competition_surface" || hasTextNeedle(text, ["competition", "verseny", "cup", "match", "versenyek"])) {
    return "competition_calendar" as const;
  }
  if (sourceClass === "event_surface" || hasTextNeedle(text, ["practice", "session", "group", "meetup", "find-group", "event"])) {
    return "club_events" as const;
  }
  if (sourceClass === "club_surface" || hasTextNeedle(text, ["tag", "tagok", "club", "egylet"])) {
    return "club_profile" as const;
  }
  if (sourceClass === "range_surface" || hasTextNeedle(text, ["range", "pálya", "palyasz", "shooting range", "lőtér"])) {
    return "range_profile" as const;
  }
  if (sourceClass === "course_surface" || hasTextNeedle(text, ["course", "training", "képzés", "tanfolyam", "oktatás"])) {
    return "course_offer" as const;
  }
  if (sourceClass === "registration_surface" || hasTextNeedle(text, ["regisztráció", "regisztracio", "register", "signup", "bejelentkezés"])) {
    return "registration_page" as const;
  }
  if (sourceClass === "document_surface" || sourceClass === "document" || hasTextNeedle(text, [".pdf", "document", "feltetelek", "szabalyzat"])) {
    return "document" as const;
  }
  return "unknown" as const;
}

function inferHintFromUrl(seed: ShootingSourceSeedRow) {
  return inferHintFromText(seed.canonicalUrl, seed.sourceClass);
}

export function classifyShootingSource(input: ShootingSourceClassificationInput): ClassifiedSource {
  const sourceHints = [input.seed.canonicalUrl, ...(input.seed.discoveryUrls ?? []), ...(input.routeHints ?? [])]
    .map((item) => normalizeText(item))
    .join(" ");
  const text = [input.pageTitle, input.pageText, sourceHints].filter(Boolean).join(" ");
  const extractorHint = inferHintFromText(text, input.seed.sourceClass) || inferHintFromUrl(input.seed);
  const routedExtractor = EXTRACTOR_BY_CLASS[input.seed.sourceClass];
  const features: string[] = [];
  if (input.seed.sourceClass === "federation") features.push("official-operator");
  if (input.seed.requiresAuth) features.push("requires-auth");
  if (input.seed.trustTier === "official_primary") features.push("high-trust");
  if (input.seed.trustTier === "official_secondary") features.push("trusted-secondary");
  if (input.seed.fetchPolicy === "pdf") features.push("document-centric");
  if (input.seed.disciplineHints.length > 0) features.push(`disciplines:${input.seed.disciplineHints.length}`);
  if (input.seed.geoHints.length > 0) features.push(`geo:${input.seed.geoHints.join(",")}`);

  const manualReviewRequired =
    extractorHint === "unknown" ||
    input.seed.fetchPolicy === "manual_only" ||
    input.seed.fetchPolicy === "pdf" ||
    input.seed.requiresAuth;

  const confidence =
    extractorHint === "unknown"
      ? "low"
      : manualReviewRequired
        ? "medium"
        : "high";

  const notes: string[] = [];
  if (extractorHint === "unknown") notes.push("No routing rule matched; requires manual triage.");
  if (input.seed.fetchPolicy === "pdf") notes.push("PDF-first source; extraction requires parser-specific handling.");
  if (input.seed.requiresAuth) notes.push("Auth-gated source requires session-safe registration enrichment.");

  return {
    sourceId: input.seed.sourceId,
    canonicalUrl: input.seed.canonicalUrl,
    sourceClass: input.seed.sourceClass,
    extractorHint,
    routedExtractor,
    confidence,
    features,
    manualReviewRequired,
    notes,
  };
}

export function classifySources(seeds: ShootingSourceSeedRow[]): ClassifiedSource[] {
  return seeds.map((seed) => classifyShootingSource({ seed }));
}
