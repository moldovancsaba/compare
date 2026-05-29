import { BrowseSurface, PageHeader } from "@doneisbetter/gds-core/client";
import { Badge, Box, Button, Group, Loader, Select, SimpleGrid, Stack, Text, TextInput, Title } from "@mantine/core";
import { useEffect, useMemo } from "react";
import { BoroughBar } from "../BoroughBar";
import { NeighborhoodChips } from "../NeighborhoodChips";
import { Filters, EMPTY_FILTERS, type FilterState } from "../Filters";
import { ProviderCard } from "../ProviderCard";
import { EmptyState } from "../EmptyState";
import { NEIGHBORHOODS as FALLBACK_HOODS } from "@/data/locations";
import type { BoroughChoice, Provider, Category } from "@/types/provider";
import { MapPin, Sparkles } from "@/lib/appIcons";
import { CdnImage } from "@/components/media/CdnImage";
import { useProvidersCatalog, useNeighborhoodsCatalog, useSiteCatalog } from "@/hooks/useCatalog";
import { getLocationHero, getLocationHeroImage } from "@/lib/locationHero";
import { discoveryFeatureFlags } from "@/lib/discoveryConfig";
import { emitDiscoveryTelemetry } from "@/lib/discoveryTelemetry";
import { type DiscoverDateMode, type DiscoverSort, queryProviders } from "@/lib/providerQuery";
import { formatUpcomingOccurrenceLabel } from "@/lib/providerSchedule";

interface Props {
  category: Category | null;
  mode?: "category" | "this-week";
  onOpen: (p: Provider) => void;
  onShare: (p: Provider) => void;
  borough: BoroughChoice;
  neighborhood: string | null;
  filters: FilterState;
  q: string;
  sort: DiscoverSort;
  dateMode: DiscoverDateMode;
  onBoroughChange: (borough: BoroughChoice) => void;
  onNeighborhoodChange: (neighborhood: string | null) => void;
  onFiltersChange: (filters: FilterState) => void;
  onQueryChange: (query: string) => void;
  onSortChange: (sort: DiscoverSort) => void;
}

const DISPLAY_LABELS: Record<Category, string> = {
  Classes: "Training",
  Camps: "Ranges",
  "Birthday Parties": "Competitions",
  "Drop-In Activities": "Hunting Grounds",
};

export function DiscoverView({
  category,
  mode = "category",
  onOpen,
  onShare,
  borough,
  neighborhood,
  filters = EMPTY_FILTERS,
  q,
  sort,
  dateMode,
  onBoroughChange,
  onNeighborhoodChange,
  onFiltersChange,
  onQueryChange,
  onSortChange,
}: Props) {
  const { data: providers = [], isLoading: loadP, isError: errP } = useProvidersCatalog();
  const { data: neighborhoodsMap } = useNeighborhoodsCatalog();
  const { data: site } = useSiteCatalog();

  const hoodOptions = useMemo(() => {
    if (borough === "All") return [];
    if (neighborhoodsMap?.[borough]) return neighborhoodsMap[borough];
    return FALLBACK_HOODS[borough] ?? [];
  }, [borough, neighborhoodsMap]);

  const queryResult = useMemo(
    () => queryProviders(providers, category, { borough, neighborhood, filters, q, sort, dateMode }),
    [providers, category, borough, neighborhood, filters, q, sort, dateMode],
  );

  useEffect(() => {
    emitDiscoveryTelemetry(queryResult.diagnostics);
  }, [queryResult.diagnostics]);

  const filtered = queryResult.results;
  const featured = queryResult.featured;
  const pageCopy = mode === "this-week"
    ? {
        eyebrow: "This Week",
        title: neighborhood
          ? `Sessions coming up in ${neighborhood}`
          : borough === "All"
            ? "Sessions in the next 7 days across the EU catalog"
            : `Sessions in the next 7 days in ${borough}`,
        description: "Browse source-backed upcoming training sessions, range events, competitions, and hunting access windows happening within the next seven days.",
      }
    : getLocationHero(category ?? "Classes", borough, neighborhood);
  const heroImage = mode === "this-week" ? null : getLocationHeroImage(site, category ?? "Classes", borough, neighborhood);
  const currentSort = queryResult.diagnostics.sort;
  const resultHeading = mode === "this-week"
    ? neighborhood
      ? `This week in ${neighborhood}`
      : borough === "All"
        ? "This week across NYC"
        : `This week in ${borough}`
    : neighborhood
      ? `${category ? DISPLAY_LABELS[category] : "Listings"} in ${neighborhood}`
      : borough === "All"
        ? `${category ? DISPLAY_LABELS[category] : "Listings"} across Europe`
        : `${category ? DISPLAY_LABELS[category] : "Listings"} in ${borough}`;
  const hasActiveStructuredFilters = filters.ages.length > 0 || filters.times.length > 0 || Boolean(filters.activity);
  const hasActiveFilters = hasActiveStructuredFilters || Boolean(neighborhood) || Boolean(q.trim()) || borough !== "All";
  const activeFilterBadges = [
    ...(borough !== "All" ? [borough] : []),
    ...(neighborhood ? [neighborhood] : []),
    ...(q.trim() ? [`Search: ${q.trim()}`] : []),
    ...filters.ages,
    ...filters.times,
    ...(filters.activity ? [filters.activity] : []),
  ];
  const showFeatured = featured.length > 0 && mode !== "this-week" && !q.trim() && !hasActiveStructuredFilters;
  const sortOptions = [
    ...((q.trim() || currentSort === "relevance") ? [{ value: "relevance", label: "Best match" }] : []),
    { value: "newest", label: "Newest first" },
    { value: "oldest", label: "Oldest first" },
    ...((mode === "this-week" || currentSort === "upcoming") ? [{ value: "upcoming", label: "Soonest upcoming" }] : []),
  ];

  if (loadP) {
    return (
      <Stack align="center" gap="sm" py="xl">
        <Loader size="lg" />
        <Text size="sm" c="dimmed">
          Loading listings…
        </Text>
      </Stack>
    );
  }

  if (errP) {
    return (
      <EmptyState
        icon={MapPin}
        title="Can't load listings"
        message="Listings did not load right now. Refresh the page or try again in a moment. If the problem keeps happening, the venue catalog connection needs attention."
        action={
          <Button variant="light" color="dark" onClick={() => window.location.reload()}>
            Refresh page
          </Button>
        }
      />
    );
  }

  if (providers.length === 0) {
    return (
      <EmptyState
        icon={MapPin}
        title="No listings in the database"
        message="The catalog is still empty in this environment. Load venues from admin or ingest a curated payload before using the public browse experience."
        action={
          <Button component="a" href="/secret-cms-to-edit" variant="light" color="dark">
            Open admin
          </Button>
        }
      />
    );
  }

  return (
    <Stack gap="lg">
      <SimpleGrid cols={{ base: 1, md: heroImage ? 2 : 1 }} spacing="xl" verticalSpacing="md">
        <Box>
          <PageHeader
            eyebrow={pageCopy.eyebrow}
            eyebrowVariant="ornamental"
            title={pageCopy.title}
            description={pageCopy.description}
          />
        </Box>
        {heroImage ? (
          <CdnImage
            src={heroImage.imageUrl}
            alt={heroImage.alt}
            width={1024}
            height={640}
            style={{ display: "block", height: 220, width: "100%", borderRadius: "var(--mantine-radius-xl)", objectFit: "cover" }}
          />
        ) : null}
      </SimpleGrid>

      <BrowseSurface
        eyebrow="Browse listings"
        title={resultHeading}
        description={
          mode === "this-week"
            ? "Results only include providers with real upcoming dates in the next seven days. Every filter state is shareable by URL."
            : "Refine by country, region, keyword, and activity filters. Every filter state is shareable by URL."
        }
        resultCount={filtered.length}
        resultLabel="results"
        locationControls={
          <Stack gap="md">
            <BoroughBar value={borough} onChange={onBoroughChange} />
            {borough !== "All" && (
              <NeighborhoodChips
                options={hoodOptions}
                value={neighborhood}
                onChange={onNeighborhoodChange}
              />
            )}
          </Stack>
        }
        toolbar={{
          searchSlot: discoveryFeatureFlags.searchEnabled ? (
            <TextInput
              label="Search listings"
              value={q}
              placeholder={mode === "this-week" ? "Try IPSC, clay, hunter safety, Saturday..." : "Try rifle, clay, Bavaria, beginner..."}
              onChange={(event) => onQueryChange(event.currentTarget.value)}
            />
          ) : null,
          sortSlot: (
            <Select
              label="Sort"
              value={currentSort}
              data={sortOptions}
              allowDeselect={false}
              onChange={(next) => next && onSortChange(next as DiscoverSort)}
            />
          ),
          filterSlot: <Filters value={filters} onChange={onFiltersChange} />,
        }}
        content={null}
      />

      {(hasActiveFilters || mode === "this-week") && (
        <Stack gap="xs">
          <Group justify="space-between" align="center" gap="sm">
            <Text size="sm" fw={600}>
              {mode === "this-week" ? "Current browse scope" : "Active scope and filters"}
            </Text>
            {hasActiveFilters && (
              <Button
                variant="subtle"
                color="gray"
                size="compact-sm"
                onClick={() => {
                  onBoroughChange("All");
                  onNeighborhoodChange(null);
                  onQueryChange("");
                  onFiltersChange(EMPTY_FILTERS);
                }}
              >
                Clear browse state
              </Button>
            )}
          </Group>
          <Group gap="xs">
            {activeFilterBadges.length > 0 ? (
              activeFilterBadges.map((badge) => (
                <Badge key={badge} variant="light" color="teal" radius="xl">
                  {badge}
                </Badge>
              ))
            ) : (
              <Badge variant="light" color="gray" radius="xl">
                All EU
              </Badge>
            )}
            {mode === "this-week" && (
              <Badge variant="light" color="orange" radius="xl">
                Next 7 days only
              </Badge>
            )}
          </Group>
        </Stack>
      )}

      {showFeatured && (
        <Stack gap="md">
          <Group gap="xs">
            <Sparkles size={18} color="var(--mantine-color-orange-5)" />
            <Title order={2} size="h3">
              Featured providers
            </Title>
          </Group>
          <SimpleGrid cols={{ base: 1, sm: 2, xl: 3 }} spacing="lg">
            {featured.map((p) => (
              <ProviderCard key={p.id} provider={p} onOpen={onOpen} onShare={onShare} highlightUpcoming={false} />
            ))}
          </SimpleGrid>
        </Stack>
      )}

      <Stack gap="sm">
        <Group justify="space-between" align="end" gap="sm">
          <Stack gap={2}>
            <Title order={2} size="h4">
              {filtered.length === 1 ? "1 listing" : `${filtered.length} listings`}
            </Title>
            <Text size="sm" c="dimmed">
              {resultHeading}
            </Text>
          </Stack>
          <Text size="sm" c="dimmed">
            {mode === "this-week"
              ? "Real upcoming dates only"
              : currentSort === "relevance"
                ? "Sorted by best match"
                : currentSort === "oldest"
                  ? "Sorted oldest to newest"
                  : "Sorted newest to oldest"}
          </Text>
        </Group>

        {filtered.length === 0 ? (
          <EmptyState
            icon={MapPin}
            title={mode === "this-week" ? "No upcoming sessions in this window" : "No venues match this search"}
            message={
              mode === "this-week"
                ? "Nothing source-backed is scheduled in the next seven days for this location and filter set. Try another country, loosen a filter, or switch back to all listings."
                : q.trim()
                  ? `No venues matched “${q.trim()}”. Try a broader keyword, another region, or clear one of the active filters.`
                  : "No venues are showing for this combination yet. Try another nearby region or broaden your filters."
            }
            action={
              <Group gap="sm" justify="center">
                <Button
                  variant="light"
                  color="dark"
                  onClick={() => {
                    onQueryChange("");
                    onFiltersChange(EMPTY_FILTERS);
                    onNeighborhoodChange(null);
                  }}
                >
                  Clear search and filters
                </Button>
                <Button
                  variant="subtle"
                  color="gray"
                  onClick={() => onBoroughChange("All")}
                >
                  Browse all EU
                </Button>
              </Group>
            }
          />
        ) : (
          <SimpleGrid cols={{ base: 1, sm: 2, xl: 3 }} spacing="lg">
            {filtered.map((p) => (
              <ProviderCard
                key={p.id}
                provider={p}
                onOpen={onOpen}
                onShare={onShare}
                highlightUpcoming={mode === "this-week"}
                subtitle={mode === "this-week" ? formatUpcomingOccurrenceLabel(p.nextOccurrence) ?? undefined : undefined}
              />
            ))}
          </SimpleGrid>
        )}
      </Stack>
    </Stack>
  );
}
