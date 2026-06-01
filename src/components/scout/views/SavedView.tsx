import { Button, Group, Loader, SimpleGrid, Stack, Text, Title } from "@mantine/core";
import { usePathname } from "next/navigation";
import { useSaved } from "@/store/useScout";
import { ProviderCard } from "../ProviderCard";
import { MeetupGroupCard } from "../MeetupGroupCard";
import { EmptyState } from "../EmptyState";
import { ArrowRight, Heart } from "@/lib/appIcons";
import type { Category, Provider } from "@/types/provider";
import type { MeetupGroup } from "@/types/meetup";
import { useMeetupGroupsCatalog, useProvidersCatalog, useSiteCatalog } from "@/hooks/useCatalog";
import { normalizeLocale } from "@/lib/i18n/config";
import { parseLocaleFromPathname } from "@/lib/i18n/paths";
import { getLocalText } from "@/lib/i18n/messages";

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
  const pathname = usePathname();
  const locale = normalizeLocale(parseLocaleFromPathname(pathname));
  const { saved } = useSaved();
  const { data: providers = [], isLoading: loadingProviders } = useProvidersCatalog();
  const { data: groups = [], isLoading: loadingGroups } = useMeetupGroupsCatalog();
  const { data: site } = useSiteCatalog(locale);
  const localText = <T extends Record<"en" | "hu" | "it", string>>(path: string, fallback: T) =>
    getLocalText(site, locale, path, fallback);
  const providerList = providers.filter((p) => saved.includes(p.id));
  const groupList = groups.filter((g) => saved.includes(g.id));
  const isLoading = loadingProviders || loadingGroups;
  const total = providerList.length + groupList.length;

  return (
    <Stack gap="lg">
      <Stack gap={4}>
        <Title order={1}>{localText("saved.title", { en: "Saved items", hu: "Mentett elemek", it: "Elementi salvati" })}</Title>
        <Text c="dimmed" size="sm">
          {localText("saved.subtitle", {
            en: "Everything you have bookmarked, in one place.",
            hu: "Minden elmentett találat egy helyen.",
            it: "Tutto ciò che hai salvato, in un unico posto.",
          })}
        </Text>
      </Stack>

      {isLoading ? (
        <Loader size="lg" mx="auto" my="xl" />
      ) : total === 0 ? (
        <EmptyState
          icon={Heart}
          title={localText("saved.emptyTitle", { en: "No saved items yet", hu: "Még nincs mentett elem", it: "Nessun elemento salvato" })}
          message={localText("saved.emptyMessage", {
            en: "Save venues or clubs while browsing and they will appear here for quick comparison later.",
            hu: "Ments el helyszíneket vagy klubokat böngészés közben, és itt gyorsan visszatalálsz hozzájuk.",
            it: "Salva sedi o club durante la navigazione e compariranno qui per un confronto rapido.",
          })}
          action={
            <Group gap="sm" justify="center">
              <Button variant="light" color="dark" onClick={() => onNavigate("Classes")}>
                {localText("calculator.browseTraining", {
                  en: "Browse training",
                  hu: "Képzések böngészése",
                  it: "Sfoglia allenamenti",
                })}
              </Button>
              <Button variant="subtle" color="gray" rightSection={<ArrowRight size={14} />} onClick={() => onNavigate("Meet-Up Groups")}>
                {localText("saved.browseClubs", { en: "Browse clubs", hu: "Klubok böngészése", it: "Sfoglia club" })}
              </Button>
            </Group>
          }
        />
      ) : (
        <Stack gap="xl">
          {providerList.length > 0 && (
            <Stack gap="md">
              <Title order={2} size="h3">
                {localText("saved.providersTitle", { en: "Saved providers", hu: "Mentett szolgáltatók", it: "Operatori salvati" })}
              </Title>
              <SimpleGrid cols={{ base: 1, sm: 2, xl: 3 }} spacing="lg">
                {providerList.map((p) => (
                  <ProviderCard key={p.id} provider={p} onOpen={onOpen} onShare={onShare} locale={locale} copySource={site} />
                ))}
              </SimpleGrid>
            </Stack>
          )}

          {groupList.length > 0 && (
            <Stack gap="md">
              <Title order={2} size="h3">
                {localText("saved.clubsTitle", { en: "Saved clubs", hu: "Mentett klubok", it: "Club salvati" })}
              </Title>
              <SimpleGrid cols={{ base: 1, sm: 2, xl: 3 }} spacing="lg">
                {groupList.map((g) => (
                  <MeetupGroupCard key={g.id} group={g} onOpen={onOpenGroup} onShare={onShareGroup} locale={locale} copySource={site} />
                ))}
              </SimpleGrid>
            </Stack>
          )}
        </Stack>
      )}
    </Stack>
  );
}
