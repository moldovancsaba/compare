export type WatchCollectionItemStatus = "owned" | "wishlist" | "sold";

export interface WatchCollectionItem {
  watchId: string;
  status: WatchCollectionItemStatus;
  note?: string;
  updatedAt?: string;
}

export interface WatchCollectionProfile {
  items: WatchCollectionItem[];
  preferredBrands: string[];
}

export interface WatchCollectionInsight {
  title: string;
  summary: string;
  citedWatchIds: string[];
  traits: string[];
}

export type WatchUpgradeClassification = "meaningful" | "lateral" | "emotional" | "poor_value";

export interface WatchUpgradeVerdict {
  classification: WatchUpgradeClassification;
  candidateWatchId: string;
  referenceWatchIds: string[];
  summary: string;
  changedTraits: string[];
}
