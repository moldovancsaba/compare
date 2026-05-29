"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { DiscoveryShell, PublicSiteFooter } from "@doneisbetter/gds-core/client";
import { ActionIcon, Badge, Box, Button, Group, Indicator, Stack, Text } from "@mantine/core";
import { Sidebar, type ViewKey } from "@/components/scout/Sidebar";
import { DiscoverView } from "@/components/scout/views/DiscoverView";
import { SavedView } from "@/components/scout/views/SavedView";
import { CalculatorView } from "@/components/scout/views/CalculatorView";
import { MeetupGroupsView } from "@/components/scout/views/MeetupGroupsView";
import { HomeView } from "@/components/scout/views/HomeView";
import { MyAccountView } from "@/components/scout/views/MyAccountView";
import { NeighborhoodGuideView } from "@/components/scout/views/NeighborhoodGuideView";
import { ProviderProfile } from "@/components/scout/panels/ProviderProfile";
import { ShareDialog } from "@/components/scout/panels/ShareDialog";
import { MeetupGroupProfile } from "@/components/scout/panels/MeetupGroupProfile";
import { MeetupShareDialog } from "@/components/scout/panels/MeetupShareDialog";
import { TrustStrip } from "@/components/scout/TrustStrip";
import { Logo } from "@/components/scout/Logo";
import type { Provider, BoroughChoice, Category } from "@/types/provider";
import type { MeetupGroup } from "@/types/meetup";
import { Heart, UserCircle } from "@/lib/appIcons";
import { useSaved, useCalculator } from "@/store/useScout";
import { useMeetupGroupsCatalog, useProvidersCatalog, useSiteCatalog } from "@/hooks/useCatalog";
import {
  getDiscoverHref,
  getHrefForView,
  getMeetupGroupsHref,
  getViewFromPathname,
  isDiscoverCategory,
  parseDiscoverState,
  parseNeighborhoodGuideState,
  parseMeetupState,
} from "@/lib/scoutRoutes";
import type { FilterState } from "@/components/scout/Filters";
import type { DiscoverDateMode, DiscoverSort } from "@/lib/providerQuery";
import { Plus } from "@/lib/appIcons";

export default function ClassScoutShell() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const view = getViewFromPathname(pathname) as ViewKey;
  const [openProvider, setOpenProvider] = useState<Provider | null>(null);
  const [shareProvider, setShareProvider] = useState<Provider | null>(null);
  const [openGroup, setOpenGroup] = useState<MeetupGroup | null>(null);
  const [shareGroup, setShareGroup] = useState<MeetupGroup | null>(null);
  const { saved } = useSaved();
  const { items } = useCalculator();
  const { data: site } = useSiteCatalog();
  const { data: providers = [] } = useProvidersCatalog();
  const { data: meetupGroups = [] } = useMeetupGroupsCatalog();

  const savedCount = useMemo(() => {
    const providerIds = new Set(providers.map((p) => p.id));
    const groupIds = new Set(meetupGroups.map((g) => g.id));
    return saved.filter((id) => providerIds.has(id) || groupIds.has(id)).length;
  }, [saved, providers, meetupGroups]);

  const calculatorCount = useMemo(() => {
    const providerIds = new Set(providers.map((p) => p.id));
    return items.filter((item) => providerIds.has(item.providerId)).length;
  }, [items, providers]);

  const currentQuery = useMemo(() => new URLSearchParams(searchParams.toString()), [searchParams]);
  const discoverState = useMemo(() => parseDiscoverState(new URLSearchParams(searchParams.toString())), [searchParams]);
  const meetupState = useMemo(() => parseMeetupState(new URLSearchParams(searchParams.toString())), [searchParams]);
  const neighborhoodGuideState = useMemo(
    () => parseNeighborhoodGuideState(new URLSearchParams(searchParams.toString())),
    [searchParams],
  );

  const navigate = (href: string) => {
    router.push(href);
  };

  const handleNavigate = (
    next: Category | "This Week" | "Saved" | "Calculator" | "Meet-Up Groups" | "My Account",
    location?: { borough?: BoroughChoice; neighborhood?: string },
  ) => {
    if (next === "Meet-Up Groups") {
      navigate(
        getMeetupGroupsHref({
          borough: location?.borough ?? null,
          neighborhood: location?.borough === "All" ? null : location?.neighborhood ?? null,
        }),
      );
      return;
    }
    if (next === "Saved" || next === "Calculator" || next === "My Account") {
      navigate(getHrefForView(next));
      return;
    }
    navigate(
      getDiscoverHref(next, {
        borough: location?.borough ?? null,
        neighborhood: location?.borough === "All" ? null : location?.neighborhood ?? null,
        dateMode: next === "This Week" ? "this-week" : "all",
      }),
    );
  };

  const updateDiscoverState = (patch: {
    borough?: BoroughChoice;
    neighborhood?: string | null;
    filters?: FilterState;
    q?: string;
    sort?: DiscoverSort;
    dateMode?: DiscoverDateMode;
  }) => {
    if (!isDiscoverCategory(view)) return;
    navigate(
      getDiscoverHref(view, {
        borough: patch.borough ?? discoverState.borough,
        neighborhood: patch.neighborhood !== undefined ? patch.neighborhood : discoverState.neighborhood,
        filters: patch.filters ?? discoverState.filters,
        q: patch.q ?? discoverState.q,
        sort: patch.sort ?? discoverState.sort,
        dateMode: patch.dateMode ?? "all",
      }),
    );
  };

  const updateMeetupState = (patch: { borough?: BoroughChoice; neighborhood?: string | null }) => {
    navigate(
      getMeetupGroupsHref({
        borough: patch.borough ?? meetupState.borough,
        neighborhood: patch.neighborhood !== undefined ? patch.neighborhood : meetupState.neighborhood,
      }),
    );
  };

  const homeHref = currentQuery.toString() ? `/?${currentQuery.toString()}` : "/";
  const shellActions = (
    <Group gap="xs" wrap="nowrap">
      <Indicator
        inline
        disabled={savedCount === 0}
        label={savedCount}
        color="orange"
        size={18}
        offset={6}
        position="top-end"
      >
        <ActionIcon
          component={Link}
          href={getHrefForView("Saved")}
          variant={view === "Saved" ? "filled" : "light"}
          color="teal"
          radius="xl"
          size="lg"
          aria-label="Saved"
        >
          <Heart size={18} />
        </ActionIcon>
      </Indicator>
      <Button
        component={Link}
        href={getHrefForView("Calculator")}
        variant={view === "Calculator" ? "filled" : "light"}
        color={view === "Calculator" ? "teal" : "dark"}
        radius="xl"
        visibleFrom="sm"
        leftSection={<Plus size={16} />}
        rightSection={calculatorCount > 0 ? <Badge color="orange">{calculatorCount}</Badge> : undefined}
      >
        Calculator
      </Button>
      <ActionIcon
        component={Link}
        href={getHrefForView("My Account")}
        variant={view === "My Account" ? "filled" : "light"}
        color="teal"
        radius="xl"
        size="lg"
        aria-label="My account"
      >
        <UserCircle size={18} />
      </ActionIcon>
    </Group>
  );
  const shellHeader = (
    <Group justify="space-between" align="center" gap="md" wrap="nowrap">
      <Group gap="sm" wrap="nowrap" style={{ flex: 1, minWidth: 0 }}>
        <Box
          component={Link}
          href={homeHref}
          aria-label="Go to home"
          style={{
            width: 44,
            height: 44,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flexShrink: 0,
          }}
        >
          <Logo logoUrl={site?.logoUrl} withWordmark={false} size={40} />
        </Box>
        <Stack gap={2} style={{ flex: 1, minWidth: 0 }}>
          <Text size="xs" tt="uppercase" fw={700} c="teal.7" style={{ letterSpacing: "0.14em" }}>
            RangeScout EU
          </Text>
          <Text size="lg" fw={700} lh={1.2} truncate>
            Curated shooting venues and clubs
          </Text>
          <Text size="sm" c="dimmed" visibleFrom="md" truncate>
            Fast country-first browsing for training, ranges, competitions, hunting grounds, and clubs.
          </Text>
        </Stack>
      </Group>
      {shellActions}
    </Group>
  );

  return (
    <DiscoveryShell
      header={shellHeader}
      sidebar={
        <Sidebar
          active={view}
          sidebarPromo={
            site
              ? {
                  title: site.sidebarTitle,
                  body: site.sidebarBody,
                  cta: site.sidebarCtaLabel,
                  href: `mailto:${site.account.privacy.supportEmail}?subject=${encodeURIComponent("Request listing info")}`,
                }
              : undefined
          }
        />
      }
      headerHeight={72}
      sidebarWidth={288}
      shellPadding="md"
      collapseBreakpoint="lg"
    >
      <Box maw={1400} mx="auto" w="100%">
        <Stack gap="lg" pb="xl">
            {view === "Home" && (
              <HomeView onNavigate={handleNavigate} onOpenProvider={setOpenProvider} onOpenGroup={setOpenGroup} />
            )}
            {view === "Neighborhood Guide" && (
              <NeighborhoodGuideView
                borough={neighborhoodGuideState.borough}
                neighborhood={neighborhoodGuideState.neighborhood}
                guides={site?.guides ?? []}
                providers={providers}
                meetupGroups={meetupGroups}
                onOpenProvider={setOpenProvider}
                onShareProvider={setShareProvider}
                onOpenGroup={setOpenGroup}
                onShareGroup={setShareGroup}
                onOpenCategory={handleNavigate}
              />
            )}
            {isDiscoverCategory(view) && (
              <DiscoverView
                category={view}
                mode="category"
                onOpen={setOpenProvider}
                onShare={setShareProvider}
                borough={discoverState.borough}
                neighborhood={discoverState.neighborhood}
                filters={discoverState.filters}
                q={discoverState.q}
                sort={discoverState.sort}
                dateMode="all"
                onBoroughChange={(borough) =>
                  updateDiscoverState({ borough, neighborhood: borough === "All" ? null : null })
                }
                onNeighborhoodChange={(neighborhood) => updateDiscoverState({ neighborhood })}
                onFiltersChange={(filters) => updateDiscoverState({ filters })}
                onQueryChange={(q) => navigate(getDiscoverHref(view, { ...discoverState, q, dateMode: "all" }))}
                onSortChange={(sort) => navigate(getDiscoverHref(view, { ...discoverState, sort, dateMode: "all" }))}
              />
            )}
            {view === "This Week" && (
              <DiscoverView
                category={null}
                mode="this-week"
                onOpen={setOpenProvider}
                onShare={setShareProvider}
                borough={discoverState.borough}
                neighborhood={discoverState.neighborhood}
                filters={discoverState.filters}
                q={discoverState.q}
                sort={discoverState.sort}
                dateMode="this-week"
                onBoroughChange={(borough) =>
                  navigate(getDiscoverHref("This Week", {
                    ...discoverState,
                    borough,
                    neighborhood: borough === "All" ? null : null,
                    dateMode: "this-week",
                  }))
                }
                onNeighborhoodChange={(neighborhood) => navigate(getDiscoverHref("This Week", { ...discoverState, neighborhood, dateMode: "this-week" }))}
                onFiltersChange={(filters) => navigate(getDiscoverHref("This Week", { ...discoverState, filters, dateMode: "this-week" }))}
                onQueryChange={(q) => navigate(getDiscoverHref("This Week", { ...discoverState, q, dateMode: "this-week" }))}
                onSortChange={(sort) => navigate(getDiscoverHref("This Week", { ...discoverState, sort, dateMode: "this-week" }))}
              />
            )}
            {view === "Saved" && (
              <SavedView
                onOpen={setOpenProvider}
                onShare={setShareProvider}
                onOpenGroup={setOpenGroup}
                onShareGroup={setShareGroup}
                onNavigate={handleNavigate}
              />
            )}
            {view === "Calculator" && <CalculatorView onNavigate={handleNavigate} />}
            {view === "Meet-Up Groups" && (
              <MeetupGroupsView
                onOpen={setOpenGroup}
                onShare={setShareGroup}
                borough={meetupState.borough}
                neighborhood={meetupState.neighborhood}
                onBoroughChange={(borough) => updateMeetupState({ borough, neighborhood: null })}
                onNeighborhoodChange={(neighborhood) => updateMeetupState({ neighborhood })}
              />
            )}
            {view === "My Account" && (
              <MyAccountView
                onNavigate={handleNavigate}
                onOpenProvider={setOpenProvider}
                onShareProvider={setShareProvider}
              />
            )}
            {view !== "Home" && <TrustStrip />}
            <PublicSiteFooter
              meta="RangeScout EU · Trusted. Regional. Built for sport shooting and hunting operators. · Demo prices for planning purposes only."
            >
              <Group gap="xs">
                <Text component={Link} href="/admin" c="dimmed" size="xs">
                  Staff admin
                </Text>
              </Group>
            </PublicSiteFooter>
        </Stack>
      </Box>

      <ProviderProfile
        provider={openProvider}
        onClose={() => setOpenProvider(null)}
        onShare={setShareProvider}
        onOpenAnother={(p) => setOpenProvider(p)}
      />
      <ShareDialog provider={shareProvider} onClose={() => setShareProvider(null)} />
      <MeetupGroupProfile
        group={openGroup}
        onClose={() => setOpenGroup(null)}
        onShare={setShareGroup}
        onOpenAnother={(g) => setOpenGroup(g)}
      />
      <MeetupShareDialog group={shareGroup} onClose={() => setShareGroup(null)} />
    </DiscoveryShell>
  );
}
