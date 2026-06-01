import { Badge, Box, Button, Chip, Group, SimpleGrid, Stack, Text, TextInput as Input, ThemeIcon, Title } from "@mantine/core";
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
import { BOROUGHS, NEIGHBORHOODS, formatBoroughLabel } from "@/data/locations";
import { AccentPanel, EditorialCard, EditorialHero, FeatureBand, PublicBrandFooter } from "@doneisbetter/gds-core/client";
import { ProviderCard } from "@/components/scout/ProviderCard";
import { MeetupGroupCard } from "@/components/scout/MeetupGroupCard";
import { getNeighborhoodGuideHref } from "@/lib/scoutRoutes";
import { type AppLocale } from "@/lib/i18n/config";
import { getLocalCategoryLabel, getLocalText, siteCopy } from "@/lib/i18n/messages";

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
  description: Record<AppLocale, string>;
  tone: "orange" | "teal" | "pink" | "amber" | "blue";
}[] = [
  {
    key: "Classes",
    icon: GraduationCap,
    description: {
      en: "Safety courses, pistol fundamentals, youth academies, and licence preparation",
      hu: "Biztonsági képzések, pisztoly alapok, junior akadémiák és engedélyfelkészítés",
      it: "Corsi di sicurezza, basi di pistola, accademie junior e preparazione licenza",
    },
    tone: "orange",
  },
  {
    key: "Camps",
    icon: Tent,
    description: {
      en: "Indoor ranges, outdoor complexes, clay facilities, and long-range lanes",
      hu: "Beltéri lőterek, kültéri komplexumok, koronglövő helyszínek és távlövő pályák",
      it: "Poligoni indoor, complessi outdoor, strutture per piattello e linee lunga distanza",
    },
    tone: "teal",
  },
  {
    key: "Competitions",
    icon: PartyPopper,
    description: {
      en: "Match calendars, club events, open qualifiers, and hosted shooting days",
      hu: "Versenynaptárak, klubesemények, nyílt kvalifikációk és szervezett lőnapok",
      it: "Calendari gara, eventi dei club, qualificazioni aperte e giornate di tiro organizzate",
    },
    tone: "pink",
  },
  {
    key: "Drop-In Activities",
    icon: Sparkles,
    description: {
      en: "Managed hunting grounds, stalking weekends, field practice, and seasonal access",
      hu: "Kezelt vadászterületek, vadászati hétvégék, terepgyakorlatok és szezonális hozzáférés",
      it: "Aree venatorie gestite, weekend di caccia, pratica sul campo e accesso stagionale",
    },
    tone: "amber",
  },
  {
    key: "Meet-Up Groups",
    icon: Users,
    description: {
      en: "Sport shooting clubs, hunting associations, and regional member communities",
      hu: "Sportlövő klubok, vadászegyesületek és regionális tagsági közösségek",
      it: "Club di tiro sportivo, associazioni venatorie e comunità regionali",
    },
    tone: "blue",
  },
];

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
  const localText = <T extends Record<AppLocale, string>>(path: string, fallback: T) => getLocalText(s, locale, path, fallback);
  const categoryLabel = (key: Category | "Meet-Up Groups") =>
    key === "Meet-Up Groups" ? localText("nav.clubs", siteCopy.nav.clubs) : getLocalCategoryLabel(s, key, locale);

  const popularPicks = s.homePopularPickProviderNames
    .map((name) => providers.find((p) => p.name === name))
    .filter((p): p is Provider => !!p);

  const popularGroup = s.homePopularMeetupGroupId.trim()
    ? meetups.find((g) => g.id === s.homePopularMeetupGroupId.trim())
    : undefined;
  const visibleGuides = (s.guides ?? []).filter((guide) => {
    const hasProvider = providers.some((provider) => provider.borough === guide.borough && provider.neighborhood === guide.neighborhood);
    const hasMeetup = meetups.some((group) => group.borough === guide.borough && group.neighborhood === guide.neighborhood);
    return hasProvider || hasMeetup;
  });

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
          s.homeHeroUrl?.trim() ? (
            <CdnImage
              src={s.homeHeroUrl}
              alt={localText("home.heroImageAlt", {
                en: "Sport shooting venue image",
                hu: "Lősport helyszín képe",
                it: "Immagine sede tiro sportivo",
              })}
              width={1280}
              height={1024}
              style={{ display: "block", width: "100%", height: "100%", objectFit: "cover" }}
            />
          ) : (
            <Box h="100%" p="xl" bg="teal.0" style={{ display: "flex", alignItems: "center", justifyContent: "center" }}>
              <Text size="xs" fw={700} tt="uppercase" ta="center" c="teal.8" style={{ letterSpacing: "0.14em" }}>
                {localText("providerCard.imageUnavailable", {
                  en: "Image not available",
                  hu: "Kép nem elérhető",
                  it: "Immagine non disponibile",
                })}
              </Text>
            </Box>
          )
        }
      />

      <section>
        <Stack gap="sm" align="center" ta="center">
          <Title order={2}>{s.homeCategoriesTitle}</Title>
          <Text size="sm" c="dimmed" maw={720}>
            {localText("home.categoryIntro", {
              en: "Discover trainers, ranges, competitions, and hunting access by country and region.",
              hu: "Fedezz fel képzéseket, lőtereket, versenyeket és vadászati lehetőségeket ország és régió szerint.",
              it: "Scopri allenamenti, poligoni, gare e accessi venatori per paese e regione.",
            })}
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
                    {categoryLabel(key)}
                  </Text>
                  <Badge variant="filled" color={TONE_BG[tone]} radius="xl">
                    {localText("home.explore", siteCopy.home.explore)}
                  </Badge>
                </Stack>
                <ThemeIcon size={64} radius="xl" variant="light" color={TONE_BG[tone]}>
                  <Icon size={28} />
                </ThemeIcon>
                <Text size="sm" c="dimmed">
                  {localText(`home.categoryDescriptions.${key}`, description)}
                </Text>
                <Button
                  variant="light"
                  color="dark"
                  radius="xl"
                  rightSection={<ArrowRight size={14} />}
                  onClick={() => onNavigate(key === "Meet-Up Groups" ? "Meet-Up Groups" : (key as Category))}
                  aria-label={`${localText("home.explore", siteCopy.home.explore)} ${categoryLabel(key)}`}
                >
                  {localText("home.explore", siteCopy.home.explore)}
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
          badge={borough === "All" ? localText("home.neighborhoodFallback", siteCopy.home.neighborhoodFallback) : formatBoroughLabel(borough, locale)}
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
                  {choice === "All" ? localText("common.fallbackAll", siteCopy.common.fallbackAll) : formatBoroughLabel(choice, locale)}
                </Chip>
              ))}
            </Group>
            <Text size="sm" c="dimmed">
              {borough === "All"
                ? localText("home.allRegionsDescription", {
                  en: "Browse every EU region, or pick a country above to narrow down operators and clubs.",
                  hu: "Böngéssz minden EU-régiót, vagy válassz országot a szolgáltatók és klubok szűkítéséhez.",
                  it: "Sfoglia ogni regione UE oppure scegli un paese per restringere operatori e club.",
                })
                : s.popularNeighborhoodsCaption.replace(/\{borough\}/g, formatBoroughLabel(borough, locale))}
            </Text>
            <Group gap="xs" wrap="wrap">
              {borough === "All" ? (
                <Chip checked={false} onChange={() => onNavigate("Classes", { borough: "All" })} radius="xl" variant="outline" color="gray">
                  {localText("discover.browseAllEu", siteCopy.discover.browseAllEu)}
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
                    {localText("home.explore", siteCopy.home.explore)}
                  </Chip>
                </>
              )}
            </Group>
          </Stack>
        </AccentPanel>
      </section>

      {visibleGuides.length > 0 && (
        <section>
          <Group mb="lg" justify="space-between" align="flex-end">
            <Stack gap={4}>
              <Title order={2}>{s.guidesSectionTitle}</Title>
            <Text size="sm" c="dimmed">
                Region-guided recommendations for operators, hunters, and sport shooters.
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
            {visibleGuides.map((g) => (
              <EditorialCard
                key={g.id ?? g.title}
                media={g.imageUrl?.trim() ? (
                  <CdnImage
                    src={g.imageUrl}
                    alt={g.title}
                    style={{ display: "block", width: "100%", height: 180, objectFit: "cover" }}
                  />
                ) : (
                  <Box h={180} p="lg" bg="teal.0" style={{ display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <Text size="xs" fw={700} tt="uppercase" ta="center" c="teal.8" style={{ letterSpacing: "0.14em" }}>
                      {localText("providerCard.imageUnavailable", {
                        en: "Image not available",
                        hu: "Kép nem elérhető",
                        it: "Immagine non disponibile",
                      })}
                    </Text>
                  </Box>
                )}
                eyebrow={formatBoroughLabel(g.borough, locale)}
                title={g.title}
                description={g.desc}
                tone={g.tone === "amber" ? "warm" : g.tone === "blue" ? "cool" : "default"}
                ctaLabel={g.ctaLabel?.trim() || localText("home.explore", siteCopy.home.explore)}
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
            {localText("home.howItWorksDescription", {
              en: "Use RangeScout to scan regional competitions, ranges, clubs, and training lanes, save your best fits, and act fast.",
              hu: "A RangeScout segít áttekinteni a regionális versenyeket, lőtereket, klubokat és képzéseket, elmenteni a legjobb találatokat, majd gyorsan továbblépni.",
              it: "Usa RangeScout per esaminare gare, poligoni, club e allenamenti regionali, salvare le opzioni migliori e agire rapidamente.",
            })}
          </Text>
        </Stack>
        <FeatureBand
          columns={3}
          items={s.howItWorksSteps.map((step) => ({
            id: String(step.step),
            title: step.title,
            description: step.desc,
            meta: locale === "hu" ? `${step.step}. lépés` : locale === "it" ? `Passo ${step.step}` : `Step ${step.step}`,
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
              <ProviderCard key={p.id} provider={p} onOpen={onOpenProvider} onShare={() => {}} locale={locale} copySource={s} />
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
