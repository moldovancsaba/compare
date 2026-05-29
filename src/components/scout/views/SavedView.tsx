import { Button, Group, Loader, SimpleGrid, Stack, Text, Title } from "@mantine/core";
import { useSaved } from "@/store/useScout";
import { ProviderCard } from "../ProviderCard";
import { MeetupGroupCard } from "../MeetupGroupCard";
import { EmptyState } from "../EmptyState";
import { ArrowRight, Heart } from "@/lib/appIcons";
import type { Category, Provider } from "@/types/provider";
import type { MeetupGroup } from "@/types/meetup";
import { useMeetupGroupsCatalog, useProvidersCatalog } from "@/hooks/useCatalog";

export function SavedView({
  onOpen,
  onShare,
  onOpenGroup,
  onShareGroup,
  onNavigate,
}: {
  onOpen: (p: Provider) => void;
  onShare: (p: Provider) => void;
  onOpenGroup: (g: MeetupGroup) => void;
  onShareGroup: (g: MeetupGroup) => void;
  onNavigate: (view: Category | "Calculator" | "Meet-Up Groups") => void;
}) {
  const { saved } = useSaved();
  const { data: providers = [], isLoading: loadingProviders } = useProvidersCatalog();
  const { data: groups = [], isLoading: loadingGroups } = useMeetupGroupsCatalog();
  const providerList = providers.filter((p) => saved.includes(p.id));
  const groupList = groups.filter((g) => saved.includes(g.id));
  const isLoading = loadingProviders || loadingGroups;
  const total = providerList.length + groupList.length;

  return (
    <Stack gap="lg">
      <Stack gap={4}>
        <Title order={1}>Saved items</Title>
        <Text c="dimmed" size="sm">
          Everything you&apos;ve bookmarked, in one place.
        </Text>
      </Stack>

      {isLoading ? (
        <Loader size="lg" mx="auto" my="xl" />
      ) : total === 0 ? (
        <EmptyState
          icon={Heart}
          title="No saved items yet"
          message="Save venues or clubs while browsing and they’ll appear here for quick comparison later."
          action={
            <Group gap="sm" justify="center">
              <Button variant="light" color="dark" onClick={() => onNavigate("Classes")}>
                Browse training
              </Button>
              <Button variant="subtle" color="gray" rightSection={<ArrowRight size={14} />} onClick={() => onNavigate("Meet-Up Groups")}>
                Browse clubs
              </Button>
            </Group>
          }
        />
      ) : (
        <Stack gap="xl">
          {providerList.length > 0 && (
            <Stack gap="md">
              <Title order={2} size="h3">
                Saved providers
              </Title>
              <SimpleGrid cols={{ base: 1, sm: 2, xl: 3 }} spacing="lg">
                {providerList.map((p) => (
                  <ProviderCard key={p.id} provider={p} onOpen={onOpen} onShare={onShare} />
                ))}
              </SimpleGrid>
            </Stack>
          )}

          {groupList.length > 0 && (
            <Stack gap="md">
              <Title order={2} size="h3">
                Saved clubs
              </Title>
              <SimpleGrid cols={{ base: 1, sm: 2, xl: 3 }} spacing="lg">
                {groupList.map((g) => (
                  <MeetupGroupCard key={g.id} group={g} onOpen={onOpenGroup} onShare={onShareGroup} />
                ))}
              </SimpleGrid>
            </Stack>
          )}
        </Stack>
      )}
    </Stack>
  );
}
