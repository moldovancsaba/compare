import { PageHeader } from "@doneisbetter/gds-core/client";
import { Badge, Box, Button, Group, Loader, Select, SimpleGrid, Stack, Text, TextInput, Title, VisuallyHidden } from "@mantine/core";
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
import { formatBoroughLabel } from "@/data/locations";
import type { AppLocale } from "@/lib/i18n/config";
import { getLocalCategoryLabel, getLocalFilterValueLabel, getLocalText, interpolate, siteCopy } from "@/lib/i18n/messages";

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
  locale?: AppLocale;
}

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
  locale = "en",
}: Props) {
  const { data: providers = [], isLoading: loadP, isError: errP } = useProvidersCatalog();
  const { data: neighborhoodsMap } = useNeighborhoodsCatalog();
  const { data: site } = useSiteCatalog(locale);

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
  const d = siteCopy.discover;
  const localText = <T extends Record<AppLocale, string>>(path: string, fallback: T) => getLocalText(site, locale, path, fallback);
  const pageCopy = mode === "this-week"
    ? {
        eyebrow: localText("discover.thisWeekEyebrow", d.thisWeekEyebrow),
        title: neighborhood
          ? interpolate(localText("discover.thisWeekRegionTitle", d.thisWeekRegionTitle), { region: neighborhood })
          : borough === "All"
            ? localText("discover.thisWeekAllTitle", d.thisWeekAllTitle)
            : interpolate(localText("discover.thisWeekCountryTitle", d.thisWeekCountryTitle), { country: formatBoroughLabel(borough, locale) }),
        description: localText("discover.thisWeekDescription", d.thisWeekDescription),
      }
    : getLocationHero(category ?? "Classes", borough, neighborhood, locale);
  const heroImage = mode === "this-week" ? null : getLocationHeroImage(site, category ?? "Classes", borough, neighborhood);
  const currentSort = queryResult.diagnostics.sort;
  const listingLabel = category ? getLocalCategoryLabel(site, category, locale) : locale === "hu" ? "Listák" : locale === "it" ? "Annunci" : "Listings";
  const resultHeading = mode === "this-week"
        ? neighborhood
          ? locale === "hu" ? `Ezen a héten itt: ${neighborhood}` : locale === "it" ? `Questa settimana a ${neighborhood}` : `This week in ${neighborhood}`
          : borough === "All"
            ? locale === "hu" ? "Ezen a héten Európában" : locale === "it" ? "Questa settimana in Europa" : "This week across Europe"
            : locale === "hu" ? `Ezen a héten itt: ${formatBoroughLabel(borough, locale)}` : locale === "it" ? `Questa settimana in ${formatBoroughLabel(borough, locale)}` : `This week in ${formatBoroughLabel(borough, locale)}`
    : neighborhood
      ? locale === "hu" ? `${listingLabel} itt: ${neighborhood}` : locale === "it" ? `${listingLabel} a ${neighborhood}` : `${listingLabel} in ${neighborhood}`
      : borough === "All"
        ? locale === "hu" ? `${listingLabel} Európában` : locale === "it" ? `${listingLabel} in Europa` : `${listingLabel} across Europe`
        : locale === "hu" ? `${listingLabel} itt: ${formatBoroughLabel(borough, locale)}` : locale === "it" ? `${listingLabel} in ${formatBoroughLabel(borough, locale)}` : `${listingLabel} in ${formatBoroughLabel(borough, locale)}`;
  const hasDuplicateTopHeading = mode !== "this-week" && borough === "All" && !neighborhood && !q.trim() && !filters.activity && filters.ages.length === 0 && filters.times.length === 0;
  const sectionTitle = hasDuplicateTopHeading
    ? localText("discover.browseEyebrow", d.browseEyebrow)
    : resultHeading;
  const browseSectionDescription = mode === "this-week"
    ? localText("discover.thisWeekBrowseDescription", d.thisWeekBrowseDescription).trim()
    : localText("discover.browseDescription", d.browseDescription).trim();
  const showBrowseHeading = !hasDuplicateTopHeading || browseSectionDescription.length > 0;
  const hasActiveStructuredFilters = filters.ages.length > 0 || filters.times.length > 0 || Boolean(filters.activity);
  const hasActiveFilters = hasActiveStructuredFilters || Boolean(neighborhood) || Boolean(q.trim()) || borough !== "All";
  const activeFilterBadges = [
    ...(borough !== "All" ? [formatBoroughLabel(borough, locale)] : []),
    ...(neighborhood ? [neighborhood] : []),
    ...(q.trim() ? [`${localText("discover.searchBadgePrefix", d.searchBadgePrefix)}: ${q.trim()}`] : []),
    ...filters.ages.map((value) => getLocalFilterValueLabel(site, value, locale)),
    ...filters.times.map((value) => getLocalFilterValueLabel(site, value, locale)),
    ...(filters.activity ? [getLocalFilterValueLabel(site, filters.activity, locale)] : []),
  ];
  const showFeatured = featured.length > 0 && mode !== "this-week" && !q.trim() && !hasActiveStructuredFilters;
  const sortOptions = [
    ...((q.trim() || currentSort === "relevance") ? [{ value: "relevance", label: localText("discover.sortBestMatch", d.sortBestMatch) }] : []),
    { value: "newest", label: localText("discover.sortNewest", d.sortNewest) },
    { value: "oldest", label: localText("discover.sortOldest", d.sortOldest) },
    ...((mode === "this-week" || currentSort === "upcoming") ? [{ value: "upcoming", label: localText("discover.sortSoonest", d.sortSoonest) }] : []),
  ];

  if (loadP) {
    return (
      <Stack align="center" gap="sm" py="xl">
        <Loader size="lg" />
        <Text size="sm" c="dimmed">
          {localText("discover.loadingListings", d.loadingListings)}
        </Text>
      </Stack>
    );
  }

  if (errP) {
    return (
      <EmptyState
        icon={MapPin}
        title={localText("discover.loadErrorTitle", d.loadErrorTitle)}
        message={localText("discover.loadErrorMessage", d.loadErrorMessage)}
        action={
          <Button variant="light" color="dark" onClick={() => window.location.reload()}>
            {localText("discover.refreshPage", d.refreshPage)}
          </Button>
        }
      />
    );
  }

  if (providers.length === 0) {
    return (
      <EmptyState
        icon={MapPin}
        title={localText("discover.emptyDatabaseTitle", d.emptyDatabaseTitle)}
        message={localText("discover.emptyDatabaseMessage", d.emptyDatabaseMessage)}
        action={
          <Button component="a" href={`/${locale}`} variant="light" color="dark">
            {localText("discover.browseAllEu", d.browseAllEu)}
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

      <Box
        component="section"
        aria-labelledby="compare-discover-results-title"
        style={{
          border: "1px solid var(--mantine-color-gray-3)",
          borderRadius: "var(--mantine-radius-xl)",
          padding: "clamp(1.25rem, 3vw, 2rem)",
          background: "var(--mantine-color-body)",
        }}
      >
        <Stack gap="lg">
          <Group justify="space-between" align="flex-start" gap="md">
            <Box>
              {showBrowseHeading ? (
                <>
                  <Text size="xs" fw={700} c="dimmed" tt="uppercase" style={{ letterSpacing: "0.32em" }}>
                    {localText("discover.browseEyebrow", d.browseEyebrow)}
                  </Text>
                  <Title id="compare-discover-results-title" order={2} mt="xs">
                    {sectionTitle}
                  </Title>
                  {browseSectionDescription ? (
                    <Text size="lg" c="dimmed" maw={760} mt="sm">
                      {browseSectionDescription}
                    </Text>
                  ) : null}
                </>
              ) : (
                <VisuallyHidden>
                  <Title id="compare-discover-results-title" order={2}>
                    {listingLabel}
                  </Title>
                </VisuallyHidden>
              )}
            </Box>
            <Badge size="lg" radius="xl" variant="light" color="violet">
              {filtered.length} {localText("discover.resultLabel", d.resultLabel)}
            </Badge>
          </Group>

          <Stack gap="xs">
            <Text size="sm" fw={600} c="dimmed">
              {localText("discover.locationLabel", { en: "Location", hu: "Helyszín", it: "Località" })}
            </Text>
            <Stack gap="md">
              <BoroughBar value={borough} onChange={onBoroughChange} locale={locale} copySource={site} />
              {borough !== "All" && (
                <NeighborhoodChips
                  options={hoodOptions}
                  value={neighborhood}
                  onChange={onNeighborhoodChange}
                  locale={locale}
                  copySource={site}
                />
              )}
            </Stack>
          </Stack>

          <SimpleGrid cols={{ base: 1, sm: discoveryFeatureFlags.searchEnabled ? 3 : 2 }} spacing="md">
            {discoveryFeatureFlags.searchEnabled ? (
              <TextInput
                label={localText("discover.searchLabel", d.searchLabel)}
                value={q}
                placeholder={
                  mode === "this-week"
                    ? localText("discover.thisWeekSearchPlaceholder", d.thisWeekSearchPlaceholder)
                    : localText("discover.searchPlaceholder", d.searchPlaceholder)
                }
                onChange={(event) => onQueryChange(event.currentTarget.value)}
              />
            ) : null}
            <Filters value={filters} onChange={onFiltersChange} locale={locale} copySource={site} />
            <Select
              label={localText("discover.sortLabel", d.sortLabel)}
              value={currentSort}
              data={sortOptions}
              allowDeselect={false}
              onChange={(next) => next && onSortChange(next as DiscoverSort)}
            />
          </SimpleGrid>
        </Stack>
      </Box>

      {(hasActiveFilters || mode === "this-week") && (
        <Stack gap="xs">
          <Group justify="space-between" align="center" gap="sm">
            <Text size="sm" fw={600}>
              {mode === "this-week" ? localText("discover.currentScope", d.currentScope) : localText("discover.activeScope", d.activeScope)}
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
                {localText("discover.clearBrowseState", d.clearBrowseState)}
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
                {localText("discover.allEu", d.allEu)}
              </Badge>
            )}
            {mode === "this-week" && (
              <Badge variant="light" color="orange" radius="xl">
                {localText("discover.nextSevenDays", d.nextSevenDays)}
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
              {localText("discover.featuredProviders", d.featuredProviders)}
            </Title>
          </Group>
          <SimpleGrid cols={{ base: 1, sm: 2, xl: 3 }} spacing="lg">
            {featured.map((p) => (
              <ProviderCard key={p.id} provider={p} onOpen={onOpen} onShare={onShare} highlightUpcoming={false} locale={locale} copySource={site} />
            ))}
          </SimpleGrid>
        </Stack>
      )}

      <Stack gap="sm">
        <Group justify="space-between" align="end" gap="sm">
          <Stack gap={2}>
            <Title order={2} size="h4">
              {filtered.length === 1 ? localText("discover.oneListing", d.oneListing) : interpolate(localText("discover.listingCount", d.listingCount), { count: filtered.length })}
            </Title>
            <Text size="sm" c="dimmed">
              {resultHeading}
            </Text>
          </Stack>
          <Text size="sm" c="dimmed">
            {mode === "this-week"
              ? localText("discover.sortedUpcoming", d.sortedUpcoming)
              : currentSort === "relevance"
                ? localText("discover.sortedBestMatch", d.sortedBestMatch)
                : currentSort === "oldest"
                  ? localText("discover.sortedOldest", d.sortedOldest)
                  : localText("discover.sortedNewest", d.sortedNewest)}
          </Text>
        </Group>

        {filtered.length === 0 ? (
          <EmptyState
            icon={MapPin}
            title={mode === "this-week" ? localText("discover.noUpcomingTitle", d.noUpcomingTitle) : localText("discover.noMatchTitle", d.noMatchTitle)}
            message={
              mode === "this-week"
                ? localText("discover.noUpcomingMessage", d.noUpcomingMessage)
                : q.trim()
                  ? interpolate(localText("discover.noQueryMatchMessage", d.noQueryMatchMessage), { query: q.trim() })
                  : localText("discover.noFilterMatchMessage", d.noFilterMatchMessage)
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
                  {localText("discover.clearSearchFilters", d.clearSearchFilters)}
                </Button>
                <Button
                  variant="subtle"
                  color="gray"
                  onClick={() => onBoroughChange("All")}
                >
                  {localText("discover.browseAllEu", d.browseAllEu)}
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
                locale={locale}
                copySource={site}
              />
            ))}
          </SimpleGrid>
        )}
      </Stack>
    </Stack>
  );
}
