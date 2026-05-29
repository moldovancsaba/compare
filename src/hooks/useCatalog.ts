"use client";

import { useQuery } from "@tanstack/react-query";
import type { Provider } from "@/types/provider";
import type { MeetupGroup } from "@/types/meetup";
import type { Borough } from "@/types/provider";
import type { SiteDoc } from "@/types/site";

export function useProvidersCatalog() {
  return useQuery({
    queryKey: ["catalog", "providers"],
    queryFn: async () => {
      const r = await fetch("/api/public/providers");
      if (!r.ok) {
        const j = await r.json().catch(() => ({}));
        throw new Error((j as { error?: string }).error || "Failed to load providers");
      }
      return r.json() as Promise<Provider[]>;
    },
    staleTime: 60_000,
  });
}

export function useMeetupGroupsCatalog() {
  return useQuery({
    queryKey: ["catalog", "meetups"],
    queryFn: async () => {
      const r = await fetch("/api/public/meetup-groups");
      if (!r.ok) {
        const j = await r.json().catch(() => ({}));
        throw new Error((j as { error?: string }).error || "Failed to load meetups");
      }
      return r.json() as Promise<MeetupGroup[]>;
    },
    staleTime: 60_000,
  });
}

export function useNeighborhoodsCatalog() {
  return useQuery({
    queryKey: ["catalog", "locations"],
    queryFn: async () => {
      const r = await fetch("/api/public/locations");
      if (!r.ok) throw new Error("Failed to load locations");
      return r.json() as Promise<Record<Borough, string[]>>;
    },
    staleTime: 300_000,
  });
}

export function useSiteCatalog() {
  return useQuery({
    queryKey: ["catalog", "site"],
    queryFn: async () => {
      const r = await fetch("/api/public/site");
      if (r.status === 404) return null;
      if (!r.ok) throw new Error("Failed to load site");
      return (await r.json()) as SiteDoc | null;
    },
    staleTime: 60_000,
  });
}
