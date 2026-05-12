import { watchCatalog } from "@/lib/data/watch-catalog";
import { watchDisplayName } from "@/lib/domains/watch-entity";
import type { ComparisonContext } from "@/types/comparison";
import type { WatchSpec } from "@/types/watch";
import type { WatchCollectionItem, WatchCollectionItemStatus, WatchCollectionProfile } from "@/types/watch-collection";

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
