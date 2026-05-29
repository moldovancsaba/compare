function readBoolean(value: string | undefined, fallback: boolean) {
  if (value === undefined) return fallback;
  return value === "1" || value.toLowerCase() === "true";
}

export interface DiscoveryFeatureFlags {
  newestSortEnabled: boolean;
  searchEnabled: boolean;
  thisWeekEnabled: boolean;
  upcomingRenderingEnabled: boolean;
  debugTelemetry: boolean;
}

export const discoveryFeatureFlags: DiscoveryFeatureFlags = {
  newestSortEnabled: readBoolean(process.env.NEXT_PUBLIC_DISCOVERY_NEWEST_SORT_ENABLED, true),
  searchEnabled: readBoolean(process.env.NEXT_PUBLIC_DISCOVERY_SEARCH_ENABLED, true),
  thisWeekEnabled: readBoolean(process.env.NEXT_PUBLIC_DISCOVERY_THIS_WEEK_ENABLED, true),
  upcomingRenderingEnabled: readBoolean(process.env.NEXT_PUBLIC_DISCOVERY_UPCOMING_RENDERING_ENABLED, true),
  debugTelemetry: readBoolean(process.env.NEXT_PUBLIC_DISCOVERY_DEBUG_TELEMETRY, false),
};
