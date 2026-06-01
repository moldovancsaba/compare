import { PageHeader } from "@doneisbetter/gds-core/client";
import { useMemo } from "react";
import { usePathname } from "next/navigation";
import { Button, Card, Center, Group, Loader, Paper, SimpleGrid, Stack, Text, Title } from "@mantine/core";
import { BoroughBar } from "../BoroughBar";
import { NeighborhoodChips } from "../NeighborhoodChips";
import { MeetupGroupCard } from "../MeetupGroupCard";
import { EmptyState } from "../EmptyState";
import { NEIGHBORHOODS as FALLBACK_HOODS } from "@/data/locations";
import { formatBoroughLabel } from "@/data/locations";
import type { BoroughChoice } from "@/types/provider";
import type { MeetupGroup } from "@/types/meetup";
import { MapPin, Users } from "@/lib/appIcons";
import { useMeetupGroupsCatalog, useNeighborhoodsCatalog, useSiteCatalog } from "@/hooks/useCatalog";
import { CdnImage } from "@/components/media/CdnImage";
import { getLocationHero, getLocationHeroImage } from "@/lib/locationHero";
import { normalizeLocale } from "@/lib/i18n/config";
import { parseLocaleFromPathname } from "@/lib/i18n/paths";
import { getLocalText, siteCopy } from "@/lib/i18n/messages";

interface Props {
  onOpen: (g: MeetupGroup) => void;
  onShare: (g: MeetupGroup) => void;
  borough: BoroughChoice;
  neighborhood: string | null;
  onBoroughChange: (borough: BoroughChoice) => void;
  onNeighborhoodChange: (neighborhood: string | null) => void;
}

export function MeetupGroupsView({
  onOpen,
  onShare,
  borough,
  neighborhood,
  onBoroughChange,
  onNeighborhoodChange,
}: Props) {
  const pathname = usePathname();
  const locale = normalizeLocale(parseLocaleFromPathname(pathname));
  const { data: groups = [], isLoading, isError } = useMeetupGroupsCatalog();
  const { data: neighborhoodsMap } = useNeighborhoodsCatalog();
  const { data: site } = useSiteCatalog(locale);
  const localText = <T extends Record<"en" | "hu" | "it", string>>(path: string, fallback: T) =>
    getLocalText(site, locale, path, fallback);

  const hoodOptions = useMemo(() => {
    if (borough === "All") return [];
    if (neighborhoodsMap?.[borough]) return neighborhoodsMap[borough];
    return FALLBACK_HOODS[borough] ?? [];
  }, [borough, neighborhoodsMap]);

  const filtered = useMemo(
    () =>
      groups
        .filter((g) => (borough === "All" ? true : g.borough === borough))
        .filter((g) => (neighborhood ? g.neighborhood === neighborhood : true)),
    [groups, borough, neighborhood],
  );
  const pageCopy = getLocationHero("Meet-Up Groups", borough, neighborhood, locale);
  const heroImage = getLocationHeroImage(site, "Meet-Up Groups", borough, neighborhood);

  if (isLoading) {
    return (
      <Center py="5rem">
        <Stack align="center" gap="sm">
          <Loader color="teal" size="md" />
          <Text c="dimmed" size="sm">
            {localText("meetups.loading", { en: "Loading clubs...", hu: "Klubok betöltése...", it: "Caricamento club..." })}
          </Text>
        </Stack>
      </Center>
    );
  }

  if (isError || groups.length === 0) {
    return (
      <EmptyState
        icon={Users}
        title={localText("meetups.emptyDatabaseTitle", {
          en: "No verified clubs are published yet",
          hu: "Még nincs publikált, ellenőrzött klub",
          it: "Non ci sono ancora club verificati pubblicati",
        })}
        message={localText("discover.emptyDatabaseMessage", siteCopy.discover.emptyDatabaseMessage)}
        action={
          <Button component="a" href="/secret-cms-to-edit" variant="light" color="dark">
            {localText("meetups.openAdmin", { en: "Open admin", hu: "Admin megnyitása", it: "Apri admin" })}
          </Button>
        }
      />
    );
  }

  return (
    <Stack gap="lg">
      <Paper withBorder p={{ base: "lg", md: "2rem" }}>
        <SimpleGrid cols={{ base: 1, md: heroImage ? 2 : 1 }} spacing="lg" verticalSpacing="md">
          <Stack gap="sm" maw={540}>
            <PageHeader
              eyebrow={pageCopy.eyebrow}
              eyebrowVariant="ornamental"
              title={pageCopy.title}
              description={pageCopy.description}
            />
          </Stack>
          {heroImage ? (
            <Center visibleFrom="md">
              <Card radius="xl" p={0} miw={240} maw={560} w="100%" h={176} style={{ overflow: "hidden" }}>
                <CdnImage
                  src={heroImage.imageUrl}
                  alt={heroImage.alt}
                  width={1024}
                  height={640}
                  style={{ display: "block", width: "100%", height: "100%", objectFit: "cover" }}
                />
              </Card>
            </Center>
          ) : null}
        </SimpleGrid>
      </Paper>

      <Stack gap="md">
        <BoroughBar value={borough} onChange={onBoroughChange} locale={locale} copySource={site} />
        {borough !== "All" && (
          <NeighborhoodChips options={hoodOptions} value={neighborhood} onChange={onNeighborhoodChange} locale={locale} copySource={site} />
        )}
      </Stack>

      <Stack gap="md">
        <Group justify="space-between" align="end" gap="sm">
          <Stack gap={2}>
            <Title order={2} size="h3">
              {filtered.length === 1
                ? localText("meetups.oneClub", { en: "1 club", hu: "1 klub", it: "1 club" })
                : localText("meetups.clubCount", { en: "{count} clubs", hu: "{count} klub", it: "{count} club" }).replace("{count}", String(filtered.length))}
            </Title>
            <Text c="dimmed" size="sm">
              {neighborhood
                ? `${localText("nav.clubs", siteCopy.nav.clubs)}: ${neighborhood}`
                : borough === "All"
                  ? localText("meetups.clubsAcrossEu", { en: "Clubs in Hungary", hu: "Klubok Magyarországon", it: "Club in Ungheria" })
                  : `${localText("nav.clubs", siteCopy.nav.clubs)}: ${formatBoroughLabel(borough, locale)}`}
            </Text>
          </Stack>
          <Text c="dimmed" size="sm">
            {localText("meetups.summary", {
              en: "Member clubs, associations, and regional communities",
              hu: "Tagsági klubok, egyesületek és regionális közösségek",
              it: "Club associativi, associazioni e comunità regionali",
            })}
          </Text>
        </Group>

        {filtered.length === 0 ? (
          <EmptyState
            icon={MapPin}
            title={localText("meetups.emptyTitle", { en: "No clubs yet", hu: "Még nincs klub", it: "Nessun club" })}
            message={localText("meetups.emptyMessage", {
              en: "No verified clubs are showing for this region yet. Try another nearby region.",
              hu: "Ehhez a régióhoz még nincs ellenőrzött klub. Próbálj másik közeli régiót.",
              it: "Non ci sono ancora club verificati per questa regione. Prova un'altra area vicina.",
            })}
            action={
              <Group gap="sm" justify="center">
                <Button variant="light" color="dark" onClick={() => onNeighborhoodChange(null)}>
                  {localText("meetups.clearRegion", { en: "Clear region", hu: "Régió törlése", it: "Cancella regione" })}
                </Button>
                <Button variant="subtle" color="gray" onClick={() => onBoroughChange("All")}>
                  {localText("discover.browseAllEu", siteCopy.discover.browseAllEu)}
                </Button>
              </Group>
            }
          />
        ) : (
          <SimpleGrid cols={{ base: 1, sm: 2, xl: 3 }} spacing="lg" verticalSpacing="lg">
            {filtered.map((g) => (
              <MeetupGroupCard key={g.id} group={g} onOpen={onOpen} onShare={onShare} locale={locale} copySource={site} />
            ))}
          </SimpleGrid>
        )}
      </Stack>
    </Stack>
  );
}
