import { Button, Group, Paper, SimpleGrid, Stack, Text, Title } from "@mantine/core";
import { usePathname } from "next/navigation";
import { MapPin } from "@/lib/appIcons";
import { EmptyState } from "@/components/scout/EmptyState";
import { CdnImage } from "@/components/media/CdnImage";
import { ProviderCard } from "@/components/scout/ProviderCard";
import { MeetupGroupCard } from "@/components/scout/MeetupGroupCard";
import { formatBoroughLabel } from "@/data/locations";
import type { MeetupGroup } from "@/types/meetup";
import type { BoroughChoice, Category, Provider } from "@/types/provider";
import type { SiteGuide } from "@/types/site";
import { useSiteCatalog } from "@/hooks/useCatalog";
import { normalizeLocale } from "@/lib/i18n/config";
import { parseLocaleFromPathname } from "@/lib/i18n/paths";
import { getLocalCategoryLabel, getLocalText, siteCopy } from "@/lib/i18n/messages";

const CATEGORY_ORDER: Category[] = ["Classes", "Camps", "Competitions", "Drop-In Activities"];

interface Props {
  borough: BoroughChoice;
  neighborhood: string | null;
  guides: SiteGuide[];
  providers: Provider[];
  meetupGroups: MeetupGroup[];
  onOpenProvider: (provider: Provider) => void;
  onShareProvider: (provider: Provider) => void;
  onOpenGroup: (group: MeetupGroup) => void;
  onShareGroup: (group: MeetupGroup) => void;
  onOpenCategory: (category: Category | "Meet-Up Groups", location: { borough?: BoroughChoice; neighborhood?: string }) => void;
}

export function NeighborhoodGuideView({
  borough,
  neighborhood,
  guides,
  providers,
  meetupGroups,
  onOpenProvider,
  onShareProvider,
  onOpenGroup,
  onShareGroup,
  onOpenCategory,
}: Props) {
  const pathname = usePathname();
  const locale = normalizeLocale(parseLocaleFromPathname(pathname));
  const { data: site } = useSiteCatalog(locale);
  const localText = <T extends Record<"en" | "hu" | "it", string>>(path: string, fallback: T) =>
    getLocalText(site, locale, path, fallback);
  const displayLabel = (category: Category | "Meet-Up Groups") =>
    category === "Meet-Up Groups" ? localText("nav.clubs", siteCopy.nav.clubs) : getLocalCategoryLabel(site, category, locale);

  if (!neighborhood || borough === "All") {
    return (
      <EmptyState
        icon={MapPin}
        title={localText("regionGuide.unavailableTitle", { en: "Region guide unavailable", hu: "A régiótérkép nem elérhető", it: "Guida regionale non disponibile" })}
        message={localText("regionGuide.unavailableMessage", {
          en: "Pick a specific country and region to view all listings for that location.",
          hu: "Válassz konkrét országot és régiót az ottani listák megtekintéséhez.",
          it: "Scegli un paese e una regione specifici per vedere gli annunci.",
        })}
      />
    );
  }

  const guide =
    guides.find((item) => item.borough === borough && item.neighborhood === neighborhood) ?? null;
  const localProviders = providers.filter((provider) => provider.borough === borough && provider.neighborhood === neighborhood);
  const localGroups = meetupGroups.filter((group) => group.borough === borough && group.neighborhood === neighborhood);

  const groupedProviders = CATEGORY_ORDER.map((category) => ({
    category,
    items: localProviders.filter((provider) => provider.category === category),
  })).filter((group) => group.items.length > 0);

  const totalItems = localProviders.length + localGroups.length;

  if (totalItems === 0) {
    return (
      <EmptyState
        icon={MapPin}
        title={localText("regionGuide.emptyTitle", {
          en: "Nothing listed in {region} yet",
          hu: "Még nincs lista ebben a régióban: {region}",
          it: "Nessun annuncio in {region}",
        }).replace("{region}", neighborhood)}
        message={localText("regionGuide.emptyMessage", {
          en: "No verified training, ranges, competitions, hunting grounds, or clubs are available for this region yet.",
          hu: "Ehhez a régióhoz még nincs ellenőrzött képzés, lőtér, verseny, vadászati lehetőség vagy klub.",
          it: "Non ci sono ancora allenamenti, poligoni, gare, aree venatorie o club verificati per questa regione.",
        })}
      />
    );
  }

  return (
    <Stack gap="xl">
      <Paper withBorder radius="xl" p={{ base: "lg", md: "xl" }}>
        <SimpleGrid cols={{ base: 1, lg: guide?.imageUrl?.trim() ? 2 : 1 }} spacing="xl" verticalSpacing="xl">
          <Stack gap="md" justify="center">
              <Text size="xs" fw={700} tt="uppercase" c="teal.6" style={{ letterSpacing: "0.2em" }}>
              {neighborhood} • {formatBoroughLabel(borough, locale)}
            </Text>
            <Title order={1}>{guide?.title ?? localText("regionGuide.defaultTitle", {
              en: "{region} sport shooting guide",
              hu: "{region} lősport régiótérkép",
              it: "Guida tiro sportivo {region}",
            }).replace("{region}", neighborhood)}</Title>
            <Text size="md" c="dimmed" maw={760}>
              {guide?.desc ?? localText("regionGuide.defaultDescription", {
                en: "Browse all verified listing types in {region}, from training and ranges to competitions, hunting grounds, and clubs.",
                hu: "Böngészd az ellenőrzött listákat ebben a régióban: {region}; képzések, lőterek, versenyek, vadászati lehetőségek és klubok.",
                it: "Sfoglia gli annunci verificati in {region}: allenamenti, poligoni, gare, aree venatorie e club.",
              }).replace("{region}", neighborhood)}
            </Text>
            <Group gap="sm" wrap="wrap">
              {CATEGORY_ORDER.map((category) => (
                <Button
                  key={category}
                  variant="light"
                  color="dark"
                  onClick={() => onOpenCategory(category, { borough, neighborhood })}
                >
                  {displayLabel(category)}
                </Button>
              ))}
              <Button variant="light" color="dark" onClick={() => onOpenCategory("Meet-Up Groups", { borough, neighborhood })}>
                {displayLabel("Meet-Up Groups")}
              </Button>
            </Group>
          </Stack>
          {guide?.imageUrl?.trim() ? (
            <CdnImage
              src={guide.imageUrl}
              alt={guide.title}
              style={{
                display: "block",
                width: "100%",
                height: "100%",
                minHeight: 320,
                maxHeight: 420,
                objectFit: "cover",
                borderRadius: "var(--mantine-radius-xl)",
              }}
            />
          ) : null}
        </SimpleGrid>
      </Paper>

      {groupedProviders.map((group) => (
        <Stack key={group.category} gap="md">
          <Group justify="space-between" align="baseline">
            <Title order={2} size="h3">
              {displayLabel(group.category)}
            </Title>
            <Button variant="subtle" color="dark" onClick={() => onOpenCategory(group.category, { borough, neighborhood })}>
              {localText("regionGuide.viewAll", { en: "View all {label}", hu: "Összes megtekintése: {label}", it: "Vedi tutti: {label}" }).replace("{label}", displayLabel(group.category).toLowerCase())}
            </Button>
          </Group>
          <SimpleGrid cols={{ base: 1, sm: 2, xl: 3 }} spacing="lg">
            {group.items.map((provider) => (
              <ProviderCard key={provider.id} provider={provider} onOpen={onOpenProvider} onShare={onShareProvider} locale={locale} copySource={site} />
            ))}
          </SimpleGrid>
        </Stack>
      ))}

      {localGroups.length > 0 ? (
        <Stack gap="md">
          <Group justify="space-between" align="baseline">
            <Title order={2} size="h3">
              {displayLabel("Meet-Up Groups")}
            </Title>
            <Button variant="subtle" color="dark" onClick={() => onOpenCategory("Meet-Up Groups", { borough, neighborhood })}>
              {localText("regionGuide.viewAll", { en: "View all {label}", hu: "Összes megtekintése: {label}", it: "Vedi tutti: {label}" }).replace("{label}", displayLabel("Meet-Up Groups").toLowerCase())}
            </Button>
          </Group>
          <SimpleGrid cols={{ base: 1, sm: 2, xl: 3 }} spacing="lg">
            {localGroups.map((group) => (
              <MeetupGroupCard key={group.id} group={group} onOpen={onOpenGroup} onShare={onShareGroup} locale={locale} copySource={site} />
            ))}
          </SimpleGrid>
        </Stack>
      ) : null}
    </Stack>
  );
}
