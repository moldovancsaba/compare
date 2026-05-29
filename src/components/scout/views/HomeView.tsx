import { Badge, Button, Chip, Group, SimpleGrid, Stack, Text, TextInput as Input, ThemeIcon, Title } from "@mantine/core";
import { useState } from "react";
import {
  GraduationCap,
  Tent,
  PartyPopper,
  Sparkles,
  Users,
  ArrowRight,
  Mail,
} from "@/lib/appIcons";
import type { BoroughChoice, Category, Provider } from "@/types/provider";
import type { MeetupGroup } from "@/types/meetup";
import { toast } from "@/lib/notify";
import { CdnImage } from "@/components/media/CdnImage";
import { SiteLucideIcon } from "@/lib/siteLucideIcon";
import { useProvidersCatalog, useMeetupGroupsCatalog, useSiteCatalog, useNeighborhoodsCatalog } from "@/hooks/useCatalog";
import { BOROUGHS, NEIGHBORHOODS } from "@/data/locations";
import { AccentPanel, EditorialCard, EditorialHero, FeatureBand, PublicBrandFooter } from "@doneisbetter/gds-core/client";
import { ProviderCard } from "@/components/scout/ProviderCard";
import { MeetupGroupCard } from "@/components/scout/MeetupGroupCard";
import { getNeighborhoodGuideHref } from "@/lib/scoutRoutes";
import { type AppLocale } from "@/lib/i18n/config";

const HOME_BOROUGH_CHOICES: BoroughChoice[] = ["All", ...BOROUGHS];

function openMarketingLink(href: string | undefined, inApp: () => void) {
  const h = (href ?? "").trim();
  if (!h) {
    inApp();
    return;
  }
  if (h.startsWith("http://") || h.startsWith("https://")) {
    window.open(h, "_blank", "noopener,noreferrer");
    return;
  }
  if (h.startsWith("#")) {
    window.location.hash = h;
    return;
  }
  window.location.assign(h.startsWith("/") ? h : `/${h}`);
}

const CATEGORIES: {
  key: Category | "Meet-Up Groups";
  icon: React.ComponentType<{ className?: string; size?: string | number }>;
  description: string;
  tone: "orange" | "teal" | "pink" | "amber" | "blue";
}[] = [
  { key: "Classes", icon: GraduationCap, description: "Safety courses, pistol fundamentals, youth academies, and licence preparation", tone: "orange" },
  { key: "Camps", icon: Tent, description: "Indoor ranges, outdoor complexes, clay facilities, and long-range lanes", tone: "teal" },
  { key: "Birthday Parties", icon: PartyPopper, description: "Match calendars, club events, open qualifiers, and hosted shooting days", tone: "pink" },
  { key: "Drop-In Activities", icon: Sparkles, description: "Managed hunting grounds, stalking weekends, field practice, and seasonal access", tone: "amber" },
  { key: "Meet-Up Groups", icon: Users, description: "Sport shooting clubs, hunting associations, and regional member communities", tone: "blue" },
];

const DISPLAY_LABELS: Record<Category | "Meet-Up Groups", string> = {
  Classes: "Training",
  Camps: "Ranges",
  "Birthday Parties": "Competitions",
  "Drop-In Activities": "Hunting Grounds",
  "Meet-Up Groups": "Clubs",
};

const TONE_BG: Record<string, string> = {
  orange: "orange",
  teal: "teal",
  pink: "grape",
  amber: "yellow",
  blue: "blue",
};

const ACCENT_TONE: Record<string, "amber" | "blue" | "green" | "red" | "violet"> = {
  orange: "amber",
  teal: "green",
  pink: "violet",
  amber: "amber",
  blue: "blue",
};

interface Props {
  onNavigate: (view: Category | "Saved" | "Calculator" | "Meet-Up Groups", location?: { borough?: BoroughChoice; neighborhood?: string }) => void;
  onOpenProvider: (p: Provider) => void;
  onOpenGroup: (g: MeetupGroup) => void;
  locale: AppLocale;
}

export function HomeView({ onNavigate, onOpenProvider, onOpenGroup, locale }: Props) {
  const [borough, setBorough] = useState<BoroughChoice>("All");
  const [email, setEmail] = useState("");
  const { data: providers = [] } = useProvidersCatalog();
  const { data: meetups = [] } = useMeetupGroupsCatalog();
  const { data: siteData, isLoading: siteLoading, isError: siteError } = useSiteCatalog(locale);
  const { data: locationsByBorough } = useNeighborhoodsCatalog();
  const hoodList =
    borough === "All" ? [] : (locationsByBorough?.[borough] ?? NEIGHBORHOODS[borough]);

  const scrollToNeighborhoods = () => {
    document.getElementById("home-neighborhoods")?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  if (siteLoading || siteError || !siteData) return null;

  const s = siteData;

  const popularPicks = s.homePopularPickProviderNames
    .map((name) => providers.find((p) => p.name === name))
    .filter((p): p is Provider => !!p);

  const popularGroup = s.homePopularMeetupGroupId.trim()
    ? meetups.find((g) => g.id === s.homePopularMeetupGroupId.trim())
    : undefined;

  return (
    <Stack gap="2.75rem">
      <EditorialHero
        eyebrow="RangeScout EU"
        title={s.homeHeroTitle}
        description={s.homeHeroSubtitle}
        actions={[
          { label: s.homeHeroPrimaryCta, onClick: () => onNavigate("Classes"), variant: "primary" },
          { label: s.homeHeroSecondaryCta, onClick: scrollToNeighborhoods, variant: "secondary" },
        ]}
        meta={[{ id: "hero-tagline", label: s.homeHeroTagline, icon: <Sparkles size={14} /> }]}
        media={
          <CdnImage
            src={s.homeHeroUrl}
            alt="Sport shooter on an outdoor range"
            width={1280}
            height={1024}
            style={{ display: "block", width: "100%", height: "100%", objectFit: "cover" }}
          />
        }
      />

      <section>
        <Stack gap="sm" align="center" ta="center">
          <Title order={2}>{s.homeCategoriesTitle}</Title>
          <Text size="sm" c="dimmed" maw={720}>
            Start with the lane you need, then narrow by country, region, audience, and timing.
          </Text>
        </Stack>
        <SimpleGrid mt="lg" cols={{ base: 1, sm: 2, lg: 5 }} spacing="lg">
          {CATEGORIES.map(({ key, icon: Icon, description, tone }) => (
            <AccentPanel
              key={key}
              tone={ACCENT_TONE[tone]}
            >
              <Stack align="center" ta="center" gap="md" h="100%" justify="space-between">
                <Stack gap="xs" w="100%" align="flex-start">
                  <Text fw={700} size="1.05rem" lh={1.2} ta="left">
                    {DISPLAY_LABELS[key]}
                  </Text>
                  <Badge variant="filled" color={TONE_BG[tone]} radius="xl">
                    Explore
                  </Badge>
                </Stack>
                <ThemeIcon size={64} radius="xl" variant="light" color={TONE_BG[tone]}>
                  <Icon size={28} />
                </ThemeIcon>
                <Text size="sm" c="dimmed">
                  {description}
                </Text>
                <Button
                  variant="light"
                  color="dark"
                  radius="xl"
                  rightSection={<ArrowRight size={14} />}
                  onClick={() => onNavigate(key === "Meet-Up Groups" ? "Meet-Up Groups" : (key as Category))}
                  aria-label={`Explore ${DISPLAY_LABELS[key]}`}
                >
                  Explore
                </Button>
              </Stack>
            </AccentPanel>
          ))}
        </SimpleGrid>
      </section>

      <section id="home-neighborhoods">
        <AccentPanel
          tone="amber"
          title={s.neighborhoodSectionTitle}
          badge={borough === "All" ? "All countries" : borough}
        >
          <Stack gap="lg">
            <Group gap="xs" wrap="wrap">
              {HOME_BOROUGH_CHOICES.map((choice) => (
                <Chip
                  key={choice}
                  checked={choice === borough}
                  onChange={() => setBorough(choice)}
                  radius="xl"
                  variant={choice === borough ? "filled" : "outline"}
                  color={choice === borough ? "dark" : "gray"}
                >
                  {choice === "All" ? "All" : choice}
                </Chip>
              ))}
            </Group>
            <Text size="sm" c="dimmed">
              {borough === "All"
                ? "Browse every country at once in Discover, or pick a country above to explore its regions."
                : s.popularNeighborhoodsCaption.replace(/\{borough\}/g, borough)}
            </Text>
            <Group gap="xs" wrap="wrap">
              {borough === "All" ? (
                <Chip checked={false} onChange={() => onNavigate("Classes", { borough: "All" })} radius="xl" variant="outline" color="gray">
                  Open Discover (all EU)
                </Chip>
              ) : (
                <>
                  {hoodList.map((hood) => (
                    <Chip
                      key={hood}
                      checked={false}
                      onChange={() => onNavigate("Classes", { borough, neighborhood: hood })}
                      radius="xl"
                      variant="outline"
                      color="gray"
                    >
                      {hood}
                    </Chip>
                  ))}
                  <Chip checked={false} onChange={() => onNavigate("Classes", { borough })} radius="xl" variant="outline" color="gray">
                    View all
                  </Chip>
                </>
              )}
            </Group>
          </Stack>
        </AccentPanel>
      </section>

      {s.guides.length > 0 && (
        <section>
          <Group mb="lg" justify="space-between" align="flex-end">
            <Stack gap={4}>
              <Title order={2}>{s.guidesSectionTitle}</Title>
              <Text size="sm" c="dimmed">
                Region-focused ideas for clubs, hunters, and sport shooters who want a quicker way into local picks.
              </Text>
            </Stack>
            <Button
              variant="subtle"
              color="dark"
              rightSection={<ArrowRight size={14} />}
              onClick={() =>
                openMarketingLink(s.guidesViewAllHref, () => {
                  onNavigate("Classes");
                })
              }
            >
              {s.guidesViewAllLabel}
            </Button>
          </Group>
          <SimpleGrid cols={{ base: 1, sm: 2, lg: 4 }} spacing="lg">
            {s.guides.map((g) => (
              <EditorialCard
                key={g.id ?? g.title}
                media={
                  <CdnImage
                    src={g.imageUrl}
                    alt={g.title}
                    style={{ display: "block", width: "100%", height: 180, objectFit: "cover" }}
                  />
                }
                eyebrow={g.borough}
                title={g.title}
                description={g.desc}
                tone={g.tone === "amber" ? "warm" : g.tone === "blue" ? "cool" : "default"}
                ctaLabel={g.ctaLabel?.trim() || "Explore guide"}
                onClick={() =>
                  openMarketingLink(g.ctaHref, () => {
                    window.location.assign(
                      getNeighborhoodGuideHref({ borough: g.borough, neighborhood: g.neighborhood }, locale),
                    );
                  })
                }
              />
            ))}
          </SimpleGrid>
        </section>
      )}

      <section>
        <Stack gap="sm" align="center" ta="center">
          <Title order={2}>{s.howItWorksSectionTitle}</Title>
          <Text size="sm" c="dimmed" maw={640}>
            Use ClassScout to browse local options quickly, save strong fits, and compare plans without starting from scratch.
          </Text>
        </Stack>
        <FeatureBand
          columns={3}
          items={s.howItWorksSteps.map((step) => ({
            id: String(step.step),
            title: step.title,
            description: step.desc,
            meta: `Step ${step.step}`,
            icon: <SiteLucideIcon name={step.icon} size={20} />,
          }))}
        />
      </section>

      {(popularPicks.length > 0 || popularGroup) && (
        <section>
          <Group mb="lg" justify="space-between" align="flex-end">
            <Title order={2}>{s.popularPicksSectionTitle}</Title>
            <Button variant="subtle" color="dark" rightSection={<ArrowRight size={14} />} onClick={() => onNavigate("Classes")}>
              {s.popularPicksViewAllLabel}
            </Button>
          </Group>
          <SimpleGrid cols={{ base: 1, sm: 2, lg: 3 }}>
            {popularPicks.map((p) => (
              <ProviderCard key={p.id} provider={p} onOpen={onOpenProvider} onShare={() => {}} />
            ))}
            {popularGroup && (
              <MeetupGroupCard key={popularGroup.id} group={popularGroup} onOpen={onOpenGroup} onShare={() => {}} />
            )}
          </SimpleGrid>
        </section>
      )}

      <PublicBrandFooter
        media={
          <ThemeIcon size={56} radius="xl" variant="light" color="grape">
            <Mail size={24} />
          </ThemeIcon>
        }
        brandTitle={s.newsletterTitle}
        description={s.newsletterSubtitle}
        actions={
          <Group
            component="form"
            onSubmit={(e) => {
              e.preventDefault();
              if (!email) return;
              toast.success("You're on the list! We'll be in touch soon.");
              setEmail("");
            }}
            gap="sm"
            align="stretch"
            wrap="wrap"
          >
            <Input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder={s.newsletterPlaceholder}
              radius="xl"
              size="md"
              style={{ minWidth: 240 }}
            />
            <Button type="submit" radius="xl" color="dark">
              {s.newsletterCta}
            </Button>
          </Group>
        }
        legal={s.newsletterFinePrint}
      />
    </Stack>
  );
}
