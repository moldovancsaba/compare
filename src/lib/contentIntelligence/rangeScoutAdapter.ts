import { NEIGHBORHOODS } from "@/data/locations";
import { validateMeetupDocument } from "@/lib/meetupValidation";
import { validateProviderDocument } from "@/lib/providerValidation";
import type { CuratedMeetup } from "@/lib/meetupSchema";
import type { CuratedProvider } from "@/lib/curator/providerSchema";
import type { MeetupCadence, MeetupGroupType, MeetupIcon } from "@/types/meetup";
import type {
  AgeRange,
  Borough,
  Category,
  DayTimeTag,
  FeaturedBadge,
  Provider,
  RecurringProgram,
  RecurringProgramDay,
} from "@/types/provider";

export interface NormalizedScheduleBlock {
  daysOfWeek: RecurringProgramDay[];
  startTime?: string;
  endTime?: string;
  timeText?: string;
  title?: string;
  registrationUrl?: string;
  priceText?: string;
  summary?: string;
}

export interface NormalizedListingInput {
  title: string;
  listingKindHint?: "provider" | "meetupGroup";
  categoryHint?: string;
  boroughRaw?: string;
  neighborhoodRaw?: string;
  addressRaw?: string;
  activityTypesRaw?: string[];
  ageRangesRaw?: string[];
  scheduleBlocks?: NormalizedScheduleBlock[];
  descriptionFacts?: string[];
  contactFacts?: {
    website?: string;
    email?: string;
    phone?: string;
    instagram?: string;
  };
  imageCandidates?: {
    uploadedUrl?: string;
  }[];
  sourceUrls?: {
    canonical?: string;
    registration?: string;
  };
  missingOrUncertain?: string[];
}

export interface ResolutionDiagnostic {
  code: string;
  severity: "warning" | "error";
  message: string;
  fieldPath: string;
  recommendedAction: string;
}

type ResolvedDraft =
  | { entityKind: "provider"; draft: CuratedProvider }
  | { entityKind: "meetupGroup"; draft: CuratedMeetup };

export interface ResolvedDraftResult {
  entityKind: "provider" | "meetupGroup";
  draft: CuratedProvider | CuratedMeetup;
  diagnostics: ResolutionDiagnostic[];
  blockingIssues: ResolutionDiagnostic[];
  warningIssues: ResolutionDiagnostic[];
  adapterVersion: string;
  resolvedAt: string;
}

const ADAPTER_VERSION = "compare-range-adapter@v1";
const CATEGORIES: Category[] = ["Classes", "Camps", "Birthday Parties", "Drop-In Activities"];
const AGE_RANGES: AgeRange[] = ["0–2", "3–5", "6–8", "9–12", "Teens", "Youth", "Beginner", "Licensed Adult", "Competition", "Hunter Prep"];
const FEATURED_BADGES: FeaturedBadge[] = [
  "Featured",
  "Popular",
  "New",
  "Staff Pick",
  "Great for Toddlers",
  "Weekend Friendly",
  "Beginner Friendly",
  "Licence Support",
];
const MEETUP_GROUP_TYPES: MeetupGroupType[] = ["Parent Meetup", "Mom Group", "Playdate Group", "New Parents", "Neighborhood Families"];
const MEETUP_CADENCES: MeetupCadence[] = ["Weekly", "Monthly", "Weekend", "Pop-up"];
const MEETUP_ICONS: MeetupIcon[] = ["stroller", "skyline", "heart", "coffee", "playground", "community"];

function slugify(value: string) {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60);
}

function normalizeBorough(value?: string): Borough | null {
  const normalized = (value ?? "").trim().toLowerCase();
  const supported: Borough[] = [
    "Manhattan",
    "Brooklyn",
    "Queens",
    "Bronx",
    "Staten Island",
    "Germany",
    "France",
    "Spain",
    "Italy",
    "Poland",
  ];

  return supported.find((item) => item.toLowerCase() === normalized) ?? null;
}

function normalizeNeighborhood(borough: Borough | null, value?: string) {
  if (!borough || !value) return null;
  return NEIGHBORHOODS[borough].find((item) => item.toLowerCase() === value.trim().toLowerCase()) ?? null;
}

function resolveCategory(value?: string): Category | null {
  return CATEGORIES.find((category) => category.toLowerCase() === (value ?? "").trim().toLowerCase()) ?? null;
}

function normalizeAgeRanges(values?: string[]) {
  return (values ?? []).filter((value): value is AgeRange => AGE_RANGES.includes(value as AgeRange));
}

function deriveScheduleSignals(scheduleBlocks: NormalizedScheduleBlock[]) {
  const timeTags = new Set<DayTimeTag>();
  const badges = new Set<FeaturedBadge>();

  const textSupports = (text: string, expressions: RegExp[]) => expressions.some((expression) => expression.test(text));

  for (const block of scheduleBlocks) {
    if (block.daysOfWeek.some((day) => ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"].includes(day))) {
      timeTags.add("Weekday");
    }
    if (block.daysOfWeek.some((day) => ["Saturday", "Sunday"].includes(day))) {
      timeTags.add("Weekend");
      badges.add("Weekend Friendly");
    }

    const text = `${block.startTime ?? ""} ${block.timeText ?? ""}`.toLowerCase();
    if (textSupports(text, [/\b(?:8|9|10|11)(?::\d{2})?\s*am\b/, /\bmorning\b/])) timeTags.add("Morning");
    if (textSupports(text, [/\b(?:12|1|2|3|4)(?::\d{2})?\s*pm\b/, /\bafternoon\b/])) timeTags.add("Afternoon");
    if (textSupports(text, [/\b(?:5|6|7|8)(?::\d{2})?\s*pm\b/, /\bevening\b/])) timeTags.add("Evening");
    if (textSupports(text, [/\b(?:3|4|5)(?::\d{2})?\s*pm\b/, /\bafter-school\b/])) timeTags.add("After-school");
  }

  return {
    timeTags: [...timeTags],
    badges: [...badges],
  };
}

function buildRecurringPrograms(input: NormalizedListingInput): RecurringProgram[] {
  return (input.scheduleBlocks ?? []).map((block, index) => ({
    id: `${slugify(input.title)}-${index + 1}`,
    title: block.title?.trim() || input.title,
    cadence: block.daysOfWeek.length >= 5 ? "Weekdays" : block.daysOfWeek.some((day) => ["Saturday", "Sunday"].includes(day)) ? "Weekends" : "Weekly",
    daysOfWeek: block.daysOfWeek,
    timeText: block.timeText?.trim() || [block.startTime, block.endTime].filter(Boolean).join("–") || "See official schedule",
    ageRanges: normalizeAgeRanges(input.ageRangesRaw),
    activityTypes: input.activityTypesRaw?.filter(Boolean),
    summary: block.summary?.trim(),
    priceText: block.priceText?.trim(),
    registrationUrl: block.registrationUrl || input.sourceUrls?.registration,
  }));
}

function collectDiagnostics(input: NormalizedListingInput, resolved: ResolvedDraft) {
  const diagnostics: ResolutionDiagnostic[] = [];
  const borough = normalizeBorough(input.boroughRaw);
  const neighborhood = normalizeNeighborhood(borough, input.neighborhoodRaw);

  if (!borough) {
    diagnostics.push({
      code: "unsupported_borough",
      severity: "error",
      message: "The listing country or operating region is missing or unsupported by compare.",
      fieldPath: "borough",
      recommendedAction: "Resolve the canonical country before publishing.",
    });
  }

  if (!neighborhood) {
    diagnostics.push({
      code: "unsupported_neighborhood",
      severity: "error",
      message: "The listing region is missing or unsupported by compare.",
      fieldPath: "neighborhood",
      recommendedAction: "Map the listing to a canonical supported region.",
    });
  }

  if (!(input.imageCandidates ?? []).some((candidate) => Boolean(candidate.uploadedUrl))) {
    diagnostics.push({
      code: "missing_uploaded_image",
      severity: "error",
      message: "No verified uploaded destination image is attached to this draft.",
      fieldPath: resolved.entityKind === "provider" ? "image" : "coverImageUrl",
      recommendedAction: "Run the compare media pipeline and attach a verified uploaded image URL.",
    });
  }

  if (resolved.entityKind === "provider" && (resolved.draft as CuratedProvider).recurringPrograms?.length === 0 && (input.scheduleBlocks?.length ?? 0) > 0) {
    diagnostics.push({
      code: "missing_recurring_programs",
      severity: "warning",
      message: "Schedule evidence exists but recurringPrograms is empty.",
      fieldPath: "recurringPrograms",
      recommendedAction: "Represent recurring schedule blocks explicitly when the source supports them.",
    });
  }

  for (const note of input.missingOrUncertain ?? []) {
    diagnostics.push({
      code: "missing_or_uncertain",
      severity: "warning",
      message: note,
      fieldPath: "missingOrUncertain",
      recommendedAction: "Resolve or preserve this uncertainty before live publish.",
    });
  }

  const validationError =
    resolved.entityKind === "provider"
      ? validateProviderDocument(resolved.draft as unknown as Provider)
      : validateMeetupDocument(resolved.draft as CuratedMeetup);
  if (validationError) {
    diagnostics.push({
      code: "schema_validation_failed",
      severity: "error",
      message: validationError,
      fieldPath: "draft",
      recommendedAction: "Fix the resolved draft so it matches the native compare schema.",
    });
  }

  return diagnostics;
}

function resolveProviderDraft(input: NormalizedListingInput): CuratedProvider {
  const borough = normalizeBorough(input.boroughRaw) ?? "Germany";
  const neighborhood = normalizeNeighborhood(borough, input.neighborhoodRaw) ?? NEIGHBORHOODS[borough][0];
  const category = resolveCategory(input.categoryHint) ?? "Classes";
  const scheduleSignals = deriveScheduleSignals(input.scheduleBlocks ?? []);
  const activityTypes = (input.activityTypesRaw ?? []).filter(Boolean);
  const image = input.imageCandidates?.find((candidate) => candidate.uploadedUrl)?.uploadedUrl ?? "";

  return {
    id: `prov-${slugify(input.title)}`,
    name: input.title.trim(),
    category,
    borough: borough as never,
    neighborhood: neighborhood as never,
    address: input.addressRaw?.trim() || `${neighborhood}, ${borough}`,
    activityTypes,
    ageRanges: normalizeAgeRanges(input.ageRangesRaw),
    dayTimeTags: scheduleSignals.timeTags,
    pricePerClass: 0,
    shortDescription: (input.descriptionFacts?.[0] ?? `${input.title.trim()} in ${neighborhood}.`).slice(0, 400),
    longDescription: input.descriptionFacts?.join(" ") || `${input.title.trim()} is an officially sourced compare listing in ${neighborhood}.`,
    rating: 0,
    reviewCount: 0,
    badges: scheduleSignals.badges.filter((badge): badge is FeaturedBadge => FEATURED_BADGES.includes(badge)),
    image,
    email: input.contactFacts?.email ?? "",
    website: input.contactFacts?.website ?? input.sourceUrls?.canonical ?? "https://example.com",
    phone: input.contactFacts?.phone ?? "",
    recurringPrograms: buildRecurringPrograms(input),
  } as unknown as CuratedProvider;
}

function resolveMeetupDraft(input: NormalizedListingInput): CuratedMeetup {
  const borough = normalizeBorough(input.boroughRaw) ?? "Germany";
  const neighborhood = normalizeNeighborhood(borough, input.neighborhoodRaw) ?? NEIGHBORHOODS[borough][0];
  const icon = input.activityTypesRaw?.some((item) => item.toLowerCase().includes("play")) ? "playground" : "community";
  const cadence = buildRecurringPrograms(input).some((program) => program.cadence === "Weekends") ? "Weekend" : "Weekly";

  return {
    id: `meetup-${slugify(input.title)}`,
    name: input.title.trim(),
    borough: borough as never,
    neighborhood: neighborhood as never,
    groupType: MEETUP_GROUP_TYPES.includes("Neighborhood Families") ? "Neighborhood Families" : "Parent Meetup",
    ageRange: normalizeAgeRanges(input.ageRangesRaw)[0] === "0–2" ? "0–2" : "0–5",
    cadence: MEETUP_CADENCES.includes(cadence) ? cadence : "Weekly",
    instagram: input.contactFacts?.instagram ?? "",
    website: input.contactFacts?.website ?? input.sourceUrls?.canonical ?? "https://example.com",
    description: input.descriptionFacts?.join(" ") || `${input.title.trim()} brings together local members in ${neighborhood}.`,
    initials: input.title
      .split(/\s+/)
      .slice(0, 2)
      .map((part) => part[0]?.toUpperCase() ?? "")
      .join("")
      .slice(0, 12),
    icon: MEETUP_ICONS.includes(icon) ? icon : "community",
    palette: "teal",
    coverImageUrl: input.imageCandidates?.find((candidate) => candidate.uploadedUrl)?.uploadedUrl ?? "",
  } as unknown as CuratedMeetup;
}

export function resolveRangeScoutDraft(input: NormalizedListingInput): ResolvedDraftResult {
  const entityKind = input.listingKindHint === "meetupGroup" ? "meetupGroup" : "provider";
  const resolved: ResolvedDraft =
    entityKind === "meetupGroup"
      ? { entityKind, draft: resolveMeetupDraft(input) }
      : { entityKind, draft: resolveProviderDraft(input) };
  const diagnostics = collectDiagnostics(input, resolved);

  return {
    entityKind,
    draft: resolved.draft,
    diagnostics,
    blockingIssues: diagnostics.filter((issue) => issue.severity === "error"),
    warningIssues: diagnostics.filter((issue) => issue.severity === "warning"),
    adapterVersion: ADAPTER_VERSION,
    resolvedAt: new Date().toISOString(),
  };
}
