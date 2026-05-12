import { watchCatalog } from "@/lib/data/watch-catalog";
import { watchDisplayName } from "@/lib/domains/watch-entity";
import type { ComparisonContext } from "@/types/comparison";
import type { WatchSpec } from "@/types/watch";
import type {
  WatchCollectionBalanceReport,
  WatchCollectionBalanceScore,
  WatchCollectionInsight,
  WatchCollectionItem,
  WatchCollectionItemStatus,
  WatchCollectionProfile,
  WatchUpgradeVerdict
} from "@/types/watch-collection";

const collectionStatuses = new Set<WatchCollectionItemStatus>(["owned", "wishlist", "sold"]);

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object";
}

function normalizeNote(value: unknown): string | undefined {
  if (typeof value !== "string") {
    return undefined;
  }

  const trimmed = value.trim();
  return trimmed ? trimmed.slice(0, 240) : undefined;
}

function normalizeCollectionItem(value: unknown): WatchCollectionItem | null {
  if (!isRecord(value) || typeof value.watchId !== "string" || typeof value.status !== "string") {
    return null;
  }

  if (!collectionStatuses.has(value.status as WatchCollectionItemStatus)) {
    return null;
  }

  if (!watchCatalog.some((watch) => watch.id === value.watchId)) {
    return null;
  }

  return {
    watchId: value.watchId,
    status: value.status as WatchCollectionItemStatus,
    ...(normalizeNote(value.note) ? { note: normalizeNote(value.note) } : {}),
    ...(typeof value.updatedAt === "string" ? { updatedAt: value.updatedAt } : {})
  };
}

export function normalizeWatchCollectionProfile(value: unknown): WatchCollectionProfile | null {
  if (!isRecord(value) || !Array.isArray(value.items)) {
    return null;
  }

  const dedupedItems = new Map<string, WatchCollectionItem>();

  for (const item of value.items) {
    const normalized = normalizeCollectionItem(item);

    if (normalized) {
      dedupedItems.set(normalized.watchId, normalized);
    }
  }

  const preferredBrands = Array.isArray(value.preferredBrands)
    ? Array.from(
        new Set(
          value.preferredBrands
            .filter((brand): brand is string => typeof brand === "string")
            .map((brand) => brand.trim())
            .filter(Boolean)
            .slice(0, 8)
        )
      )
    : [];

  return {
    items: Array.from(dedupedItems.values()).slice(0, 30),
    preferredBrands
  };
}

export function watchCollectionProfileFromContext(context?: ComparisonContext): WatchCollectionProfile | null {
  return normalizeWatchCollectionProfile(context?.watchCollectionProfile);
}

export function collectionStatusFor(
  profile: WatchCollectionProfile | null | undefined,
  watch: WatchSpec
): WatchCollectionItemStatus | null {
  return profile?.items.find((item) => item.watchId === watch.id)?.status ?? null;
}

export function summarizeCollectionContext(
  left: WatchSpec,
  right: WatchSpec,
  profile: WatchCollectionProfile | null | undefined
): string | null {
  if (!profile || (profile.items.length === 0 && profile.preferredBrands.length === 0)) {
    return null;
  }

  const leftStatus = collectionStatusFor(profile, left);
  const rightStatus = collectionStatusFor(profile, right);
  const ownedCount = profile.items.filter((item) => item.status === "owned").length;
  const wishlistCount = profile.items.filter((item) => item.status === "wishlist").length;
  const soldCount = profile.items.filter((item) => item.status === "sold").length;
  const brandPreference = profile.preferredBrands.length
    ? ` Preferred brands: ${profile.preferredBrands.join(", ")}.`
    : "";
  const comparedStatus = [
    leftStatus ? `${watchDisplayName(left)} is marked ${leftStatus}` : null,
    rightStatus ? `${watchDisplayName(right)} is marked ${rightStatus}` : null
  ]
    .filter(Boolean)
    .join("; ");

  return `${comparedStatus || "Neither compared watch is already in the saved collection."} Current profile has ${ownedCount} owned, ${wishlistCount} wishlist, and ${soldCount} sold watches.${brandPreference}`;
}

function ownedWatches(profile: WatchCollectionProfile): WatchSpec[] {
  const ownedIds = new Set(profile.items.filter((item) => item.status === "owned").map((item) => item.watchId));
  return watchCatalog.filter((watch) => ownedIds.has(watch.id));
}

function citedLabels(watches: WatchSpec[]): string {
  return watches.map(watchDisplayName).join(", ");
}

export function analyzeWatchCollectionGaps(profile: WatchCollectionProfile): WatchCollectionInsight[] {
  const owned = ownedWatches(profile);

  if (owned.length === 0) {
    return [
      {
        title: "No owned watches saved yet",
        summary:
          "Add at least one owned watch before trusting collection-gap advice. Until then, {compare} can only use wishlist and brand preferences as weak signals.",
        citedWatchIds: [],
        traits: ["owned-count:0", "confidence:low"]
      }
    ];
  }

  if (owned.length === 1) {
    const onlyWatch = owned[0];
    return [
      {
        title: "Single-watch baseline",
        summary: `${watchDisplayName(onlyWatch)} is the whole saved collection right now, so gap analysis should be treated as a next-slot prompt rather than a collection diagnosis.`,
        citedWatchIds: [onlyWatch.id],
        traits: [`style:${onlyWatch.style}`, `diameter:${onlyWatch.caseDiameterMm}`]
      },
      {
        title: "Add contrast before optimizing",
        summary:
          "The next useful addition should create a different wearing role, not a slightly different version of the same daily experience.",
        citedWatchIds: [onlyWatch.id],
        traits: ["owned-count:1", "redundancy-risk:unknown"]
      }
    ];
  }

  const insights: WatchCollectionInsight[] = [];
  const styles = new Map<WatchSpec["style"], WatchSpec[]>();
  const brands = new Map<string, WatchSpec[]>();

  for (const watch of owned) {
    styles.set(watch.style, [...(styles.get(watch.style) ?? []), watch]);
    brands.set(watch.brand, [...(brands.get(watch.brand) ?? []), watch]);
  }

  const allStyles: WatchSpec["style"][] = ["dress-sport", "dive", "explorer", "field"];
  const missingStyles = allStyles.filter(
    (style) => !styles.has(style)
  );

  if (missingStyles.length > 0) {
    insights.push({
      title: "Missing wearing roles",
      summary: `The saved owned watches do not yet cover ${missingStyles.join(", ")} roles. That means the next buy should probably solve a new use case before chasing a similar dial or brand story.`,
      citedWatchIds: owned.map((watch) => watch.id),
      traits: missingStyles.map((style) => `missing-style:${style}`)
    });
  }

  for (const [style, watches] of styles) {
    if (watches.length >= 2) {
      insights.push({
        title: "Style overlap",
        summary: `${citedLabels(watches)} all sit in the ${style} role. Another similar watch may feel exciting at purchase time but redundant in rotation.`,
        citedWatchIds: watches.map((watch) => watch.id),
        traits: [`overlap-style:${style}`, `count:${watches.length}`]
      });
    }
  }

  for (const [brand, watches] of brands) {
    if (watches.length >= 2) {
      insights.push({
        title: "Brand concentration",
        summary: `${brand} dominates the saved collection through ${citedLabels(watches)}. That can be intentional, but it narrows design language and ownership personality.`,
        citedWatchIds: watches.map((watch) => watch.id),
        traits: [`brand:${brand}`, `count:${watches.length}`]
      });
      break;
    }
  }

  const averageDiameter = owned.reduce((total, watch) => total + watch.caseDiameterMm, 0) / owned.length;
  const allCompact = owned.every((watch) => watch.caseDiameterMm <= 38);
  const allLarge = owned.every((watch) => watch.caseDiameterMm >= 39);

  if (allCompact || allLarge) {
    insights.push({
      title: "Size balance gap",
      summary: `The owned collection averages ${averageDiameter.toFixed(1)}mm and leans ${allCompact ? "compact" : "large"}. A different case size could add a genuinely different wearing experience.`,
      citedWatchIds: owned.map((watch) => watch.id),
      traits: [`average-diameter:${averageDiameter.toFixed(1)}`, allCompact ? "all-compact" : "all-large"]
    });
  }

  const dateCount = owned.filter((watch) => watch.dateWindow).length;

  if (dateCount === 0 || dateCount === owned.length) {
    insights.push({
      title: "Complication balance",
      summary:
        dateCount === 0
          ? "Every owned watch is no-date. That keeps dials clean, but a date-equipped daily watch could add practical contrast."
          : "Every owned watch has a date. A no-date watch could add cleaner dial symmetry and a more relaxed ownership feel.",
      citedWatchIds: owned.map((watch) => watch.id),
      traits: [dateCount === 0 ? "missing-date" : "missing-no-date"]
    });
  }

  return insights.slice(0, 5);
}

function overlapScore(candidate: WatchSpec, owned: WatchSpec): number {
  let score = 0;

  if (candidate.style === owned.style) {
    score += 5;
  }

  if (candidate.brand === owned.brand) {
    score += 2;
  }

  if (Math.abs(candidate.caseDiameterMm - owned.caseDiameterMm) <= 2) {
    score += 2;
  }

  if (candidate.dateWindow === owned.dateWindow) {
    score += 1;
  }

  return score;
}

function capabilityGains(candidate: WatchSpec, owned: WatchSpec): string[] {
  const gains: string[] = [];

  if (candidate.waterResistanceM >= owned.waterResistanceM + 50) {
    gains.push("water resistance");
  }

  if (candidate.microAdjust && !owned.microAdjust) {
    gains.push("bracelet adjustment");
  }

  if (candidate.powerReserveHours >= owned.powerReserveHours + 10) {
    gains.push("power reserve");
  }

  if ((candidate.antiMagneticGauss ?? 0) > (owned.antiMagneticGauss ?? 0) * 2) {
    gains.push("anti-magnetism");
  }

  return gains;
}

function fitGains(candidate: WatchSpec, owned: WatchSpec): string[] {
  const gains: string[] = [];

  if (candidate.caseDiameterMm <= owned.caseDiameterMm - 2) {
    gains.push("smaller diameter");
  }

  if (candidate.caseThicknessMm <= owned.caseThicknessMm - 0.5) {
    gains.push("lower thickness");
  }

  if (candidate.weightFeel === "light" && owned.weightFeel !== "light") {
    gains.push("lighter wrist feel");
  }

  return gains;
}

function brandStatusGain(candidate: WatchSpec, owned: WatchSpec): boolean {
  return candidate.brand === "Rolex" && owned.brand !== "Rolex";
}

export function analyzeWatchUpgradePath(
  candidate: WatchSpec,
  profile: WatchCollectionProfile
): WatchUpgradeVerdict | null {
  const owned = ownedWatches(profile).filter((watch) => watch.id !== candidate.id);

  if (owned.length === 0) {
    return null;
  }

  const closestOwned = owned
    .map((watch) => ({
      watch,
      overlap: overlapScore(candidate, watch)
    }))
    .sort((a, b) => b.overlap - a.overlap)[0];

  if (!closestOwned) {
    return null;
  }

  const capability = capabilityGains(candidate, closestOwned.watch);
  const fit = fitGains(candidate, closestOwned.watch);
  const fillsMissingStyle = !owned.some((watch) => watch.style === candidate.style);
  const changedTraits = [
    ...capability,
    ...fit,
    ...(fillsMissingStyle ? [`new ${candidate.style} role`] : []),
    ...(brandStatusGain(candidate, closestOwned.watch) ? ["brand/status step-up"] : [])
  ];
  const pricePremium = candidate.msrpUsd - closestOwned.watch.msrpUsd;
  const highOverlap = closestOwned.overlap >= 7;
  const preferredStatusStep =
    brandStatusGain(candidate, closestOwned.watch) && profile.preferredBrands.includes(candidate.brand);

  if (
    ((candidate.brand === "Rolex" && closestOwned.watch.brand === "Rolex" && pricePremium > 0) || pricePremium > 750) &&
    capability.length === 0 &&
    fit.length === 0 &&
    candidate.brand === closestOwned.watch.brand
  ) {
    return {
      classification: "poor_value",
      candidateWatchId: candidate.id,
      referenceWatchIds: [closestOwned.watch.id],
      summary: `${watchDisplayName(candidate)} looks like a poor-value swap against ${watchDisplayName(closestOwned.watch)} because it asks for more money without adding clear capability or fit improvement.`,
      changedTraits: ["same-brand overlap", `price premium:${pricePremium}`]
    };
  }

  if (highOverlap && changedTraits.length === 0 && pricePremium > 1000) {
    return {
      classification: "poor_value",
      candidateWatchId: candidate.id,
      referenceWatchIds: [closestOwned.watch.id],
      summary: `${watchDisplayName(candidate)} looks like a poor-value swap against ${watchDisplayName(closestOwned.watch)} because it overlaps heavily without adding clear capability, fit, or role improvement.`,
      changedTraits: ["high overlap", `price premium:${pricePremium}`]
    };
  }

  if (preferredStatusStep) {
    return {
      classification: "emotional",
      candidateWatchId: candidate.id,
      referenceWatchIds: [closestOwned.watch.id],
      summary: `${watchDisplayName(candidate)} is mostly an emotional or status upgrade over ${watchDisplayName(closestOwned.watch)}. Your saved brand preference makes that understandable, but the practical ownership gain is limited.`,
      changedTraits: ["brand/status step-up"]
    };
  }

  if (capability.length + fit.length >= 2 || fillsMissingStyle) {
    return {
      classification: "meaningful",
      candidateWatchId: candidate.id,
      referenceWatchIds: [closestOwned.watch.id],
      summary: `${watchDisplayName(candidate)} is a meaningful upgrade path because it changes ${changedTraits.join(", ")} relative to ${watchDisplayName(closestOwned.watch)}.`,
      changedTraits
    };
  }

  if (brandStatusGain(candidate, closestOwned.watch)) {
    return {
      classification: "emotional",
      candidateWatchId: candidate.id,
      referenceWatchIds: [closestOwned.watch.id],
      summary: `${watchDisplayName(candidate)} is mostly an emotional or status upgrade over ${watchDisplayName(closestOwned.watch)}. That can be valid, but the practical ownership gain is limited.`,
      changedTraits: ["brand/status step-up"]
    };
  }

  return {
    classification: "lateral",
    candidateWatchId: candidate.id,
    referenceWatchIds: [closestOwned.watch.id],
    summary: `${watchDisplayName(candidate)} is a lateral move against ${watchDisplayName(closestOwned.watch)}: appealing, but close enough that taste and rotation overlap matter more than objective upgrade logic.`,
    changedTraits: changedTraits.length ? changedTraits : ["similar role", "similar capability"]
  };
}

function clampScore(score: number): number {
  return Math.max(0, Math.min(100, Math.round(score)));
}

function uniqueCount(values: string[]): number {
  return new Set(values).size;
}

function concentrationPenalty(values: string[]): number {
  const counts = new Map<string, number>();

  for (const value of values) {
    counts.set(value, (counts.get(value) ?? 0) + 1);
  }

  const highestShare = Math.max(...Array.from(counts.values())) / values.length;
  return highestShare > 0.5 ? (highestShare - 0.5) * 120 : 0;
}

export function calculateWatchCollectionBalance(profile: WatchCollectionProfile): WatchCollectionBalanceReport {
  const owned = ownedWatches(profile);

  if (owned.length === 0) {
    const scores: WatchCollectionBalanceScore[] = [
      {
        dimension: "versatility",
        label: "Versatility",
        score: 0,
        contributors: ["No owned watches saved"],
        suggestion: "Add owned watches before treating balance scores as useful."
      }
    ];

    return {
      overallScore: 0,
      summary: "Balance scoring needs at least one owned watch. This is setup guidance, not a collection judgment.",
      scores
    };
  }

  const styleCount = uniqueCount(owned.map((watch) => watch.style));
  const brandCount = uniqueCount(owned.map((watch) => watch.brand));
  const dateCount = owned.filter((watch) => watch.dateWindow).length;
  const formalCount = owned.filter((watch) => watch.style === "dress-sport" || watch.style === "explorer").length;
  const casualCount = owned.length - formalCount;
  const stableOwnershipCount = owned.filter(
    (watch) =>
      watch.ownershipProfile?.serviceExpectation !== "high" &&
      watch.ownershipProfile?.resaleStability !== "soft" &&
      watch.ownershipProfile?.reliability !== "standard"
  ).length;
  const serviceHeavyCount = owned.filter((watch) => watch.ownershipProfile?.serviceExpectation === "high").length;
  const stylePenalty = concentrationPenalty(owned.map((watch) => watch.style));
  const brandPenalty = concentrationPenalty(owned.map((watch) => watch.brand));
  const versatility = clampScore((styleCount / 4) * 75 + (owned.some((watch) => watch.waterResistanceM >= 150) ? 15 : 0));
  const redundancy = clampScore(100 - stylePenalty - brandPenalty);
  const formality = clampScore((Math.min(formalCount, casualCount) / Math.max(formalCount, casualCount, 1)) * 80 + 20);
  const complication = clampScore(dateCount > 0 && dateCount < owned.length ? 90 : owned.length >= 2 ? 45 : 35);
  const ownershipRisk = clampScore((stableOwnershipCount / owned.length) * 80 + (serviceHeavyCount === 0 ? 20 : 5));

  const scores: WatchCollectionBalanceScore[] = [
    {
      dimension: "versatility",
      label: "Versatility",
      score: versatility,
      contributors: [`${styleCount} of 4 style roles covered`, `${owned.length} owned watches analyzed`],
      suggestion:
        styleCount >= 3
          ? "Versatility is broad enough; the next buy should be about quality of fit, not role coverage."
          : "Add a watch that solves a missing wearing role before buying another close substitute."
    },
    {
      dimension: "redundancy",
      label: "Redundancy control",
      score: redundancy,
      contributors: [`${brandCount} brands represented`, `style concentration penalty ${Math.round(stylePenalty)}`],
      suggestion:
        redundancy >= 75
          ? "Overlap is controlled; similar future purchases should still justify their rotation role."
          : "The collection is concentrated enough that another similar watch may create rotation regret."
    },
    {
      dimension: "formality",
      label: "Formality balance",
      score: formality,
      contributors: [`${formalCount} formal-flex watches`, `${casualCount} casual/tool watches`],
      suggestion:
        formality >= 70
          ? "Formal and casual coverage are reasonably balanced."
          : "Consider whether the next watch should move the collection toward the underrepresented side."
    },
    {
      dimension: "complication",
      label: "Complication diversity",
      score: complication,
      contributors: [`${dateCount} date watches`, `${owned.length - dateCount} no-date watches`],
      suggestion:
        complication >= 70
          ? "Date and no-date ownership experiences are both represented."
          : "A different date/no-date setup could add practical variety without changing the whole collection identity."
    },
    {
      dimension: "ownership_risk",
      label: "Ownership risk",
      score: ownershipRisk,
      contributors: [`${stableOwnershipCount} lower-friction profiles`, `${serviceHeavyCount} high-service-burden watches`],
      suggestion:
        ownershipRisk >= 70
          ? "Ownership risk looks manageable in the curated profile."
          : "Future additions should be checked for service burden, resale softness, and reliability before purchase."
    }
  ];
  const overallScore = clampScore(scores.reduce((total, score) => total + score.score, 0) / scores.length);

  return {
    overallScore,
    summary:
      "This score is a decision aid, not a grade. Use it to spot concentration and missing contrast before deciding what belongs in the collection.",
    scores
  };
}
