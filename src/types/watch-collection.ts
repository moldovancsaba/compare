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
