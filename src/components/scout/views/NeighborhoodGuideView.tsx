import { Button, Group, Paper, SimpleGrid, Stack, Text, Title } from "@mantine/core";
import { MapPin } from "@/lib/appIcons";
import { EmptyState } from "@/components/scout/EmptyState";
import { CdnImage } from "@/components/media/CdnImage";
import { ProviderCard } from "@/components/scout/ProviderCard";
import { MeetupGroupCard } from "@/components/scout/MeetupGroupCard";
import { formatBoroughLabel } from "@/data/locations";
import type { MeetupGroup } from "@/types/meetup";
import type { BoroughChoice, Category, Provider } from "@/types/provider";
import type { SiteGuide } from "@/types/site";

const CATEGORY_ORDER: Category[] = ["Classes", "Camps", "Birthday Parties", "Drop-In Activities"];

const DISPLAY_LABELS: Record<Category | "Meet-Up Groups", string> = {
  Classes: "Training",
  Camps: "Ranges",
  "Birthday Parties": "Competitions",
  "Drop-In Activities": "Hunting Grounds",
  "Meet-Up Groups": "Clubs",
};

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
  if (!neighborhood || borough === "All") {
    return (
      <EmptyState
        icon={MapPin}
        title="Region guide unavailable"
        message="Pick a specific country and region to view all listings for that location."
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
        title={`Nothing listed in ${neighborhood} yet`}
        message="No training lanes, ranges, competitions, hunting grounds, or clubs are available for this region yet."
      />
    );
  }

  return (
    <Stack gap="xl">
      <Paper withBorder radius="xl" p={{ base: "lg", md: "xl" }}>
        <SimpleGrid cols={{ base: 1, lg: guide?.imageUrl?.trim() ? 2 : 1 }} spacing="xl" verticalSpacing="xl">
          <Stack gap="md" justify="center">
              <Text size="xs" fw={700} tt="uppercase" c="teal.6" style={{ letterSpacing: "0.2em" }}>
              {neighborhood} • {formatBoroughLabel(borough)}
            </Text>
            <Title order={1}>{guide?.title ?? `${neighborhood} sport shooting guide`}</Title>
            <Text size="md" c="dimmed" maw={760}>
              {guide?.desc ?? `Browse all listing types in ${neighborhood}, from training and ranges to competitions, hunting grounds, and clubs.`}
            </Text>
            <Group gap="sm" wrap="wrap">
              {CATEGORY_ORDER.map((category) => (
                <Button
                  key={category}
                  variant="light"
                  color="dark"
                  onClick={() => onOpenCategory(category, { borough, neighborhood })}
                >
                  {DISPLAY_LABELS[category]}
                </Button>
              ))}
              <Button variant="light" color="dark" onClick={() => onOpenCategory("Meet-Up Groups", { borough, neighborhood })}>
                Clubs
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
              {DISPLAY_LABELS[group.category]}
            </Title>
            <Button variant="subtle" color="dark" onClick={() => onOpenCategory(group.category, { borough, neighborhood })}>
              View all {DISPLAY_LABELS[group.category].toLowerCase()}
            </Button>
          </Group>
          <SimpleGrid cols={{ base: 1, sm: 2, xl: 3 }} spacing="lg">
            {group.items.map((provider) => (
              <ProviderCard key={provider.id} provider={provider} onOpen={onOpenProvider} onShare={onShareProvider} />
            ))}
          </SimpleGrid>
        </Stack>
      ))}

      {localGroups.length > 0 ? (
        <Stack gap="md">
          <Group justify="space-between" align="baseline">
            <Title order={2} size="h3">
              Clubs
            </Title>
            <Button variant="subtle" color="dark" onClick={() => onOpenCategory("Meet-Up Groups", { borough, neighborhood })}>
              View all clubs
            </Button>
          </Group>
          <SimpleGrid cols={{ base: 1, sm: 2, xl: 3 }} spacing="lg">
            {localGroups.map((group) => (
              <MeetupGroupCard key={group.id} group={group} onOpen={onOpenGroup} onShare={onShareGroup} />
            ))}
          </SimpleGrid>
        </Stack>
      ) : null}
    </Stack>
  );
}
