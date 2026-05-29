import { PageHeader } from "@doneisbetter/gds-core/client";
import { useMemo } from "react";
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
  const { data: groups = [], isLoading, isError } = useMeetupGroupsCatalog();
  const { data: neighborhoodsMap } = useNeighborhoodsCatalog();
  const { data: site } = useSiteCatalog();

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
  const pageCopy = getLocationHero("Meet-Up Groups", borough, neighborhood);
  const heroImage = getLocationHeroImage(site, "Meet-Up Groups", borough, neighborhood);

  if (isLoading) {
    return (
      <Center py="5rem">
        <Stack align="center" gap="sm">
          <Loader color="teal" size="md" />
          <Text c="dimmed" size="sm">
            Loading clubs...
          </Text>
        </Stack>
      </Center>
    );
  }

  if (isError || groups.length === 0) {
    return (
      <EmptyState
        icon={Users}
        title="No clubs in the database"
        message="Seed MongoDB (`npm run db:seed`) or add clubs in `/admin`."
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
        <BoroughBar value={borough} onChange={onBoroughChange} />
        {borough !== "All" && (
          <NeighborhoodChips options={hoodOptions} value={neighborhood} onChange={onNeighborhoodChange} />
        )}
      </Stack>

      <Stack gap="md">
        <Group justify="space-between" align="end" gap="sm">
          <Stack gap={2}>
            <Title order={2} size="h3">
              {filtered.length === 1 ? "1 club" : `${filtered.length} clubs`}
            </Title>
            <Text c="dimmed" size="sm">
              {neighborhood
                ? `Clubs in ${neighborhood}`
                : borough === "All"
                  ? "Clubs across the EU"
                  : `Clubs in ${formatBoroughLabel(borough)}`}
            </Text>
          </Stack>
          <Text c="dimmed" size="sm">
            Member clubs, associations, and regional communities
          </Text>
        </Group>

        {filtered.length === 0 ? (
          <EmptyState
            icon={MapPin}
            title="No clubs yet"
            message="No clubs added here yet. Try another nearby region."
            action={
              <Group gap="sm" justify="center">
                <Button variant="light" color="dark" onClick={() => onNeighborhoodChange(null)}>
                  Clear neighborhood
                </Button>
                <Button variant="subtle" color="gray" onClick={() => onBoroughChange("All")}>
                  Browse all EU
                </Button>
              </Group>
            }
          />
        ) : (
          <SimpleGrid cols={{ base: 1, sm: 2, xl: 3 }} spacing="lg" verticalSpacing="lg">
            {filtered.map((g) => (
              <MeetupGroupCard key={g.id} group={g} onOpen={onOpen} onShare={onShare} />
            ))}
          </SimpleGrid>
        )}
      </Stack>
    </Stack>
  );
}
