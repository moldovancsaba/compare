import { ActionIcon, Button, Divider, Group, Paper, SimpleGrid, Stack, Text, Title } from "@mantine/core";
import { useCalculator } from "@/store/useScout";
import { ArrowRight, Calculator, Minus, Plus, Trash2, X } from "@/lib/appIcons";
import { EmptyState } from "../EmptyState";
import { CdnImage } from "@/components/media/CdnImage";
import { useProvidersCatalog, useSiteCatalog } from "@/hooks/useCatalog";
import { CMS_MEDIA } from "@/config/defaultMedia";
import type { Category } from "@/types/provider";

export function CalculatorView({
  onNavigate,
}: {
  onNavigate: (view: Category | "Saved") => void;
}) {
  const { items, setClasses, remove, clear } = useCalculator();
  const { data: providers = [], isLoading } = useProvidersCatalog();
  const { data: siteData, isLoading: siteLoading, isError: siteError } = useSiteCatalog();
  if (siteLoading || siteError || !siteData) return null;

  const s = siteData;
  const c = s.calculator;

  const rows = items
    .map((i) => {
      const p = providers.find((x) => x.id === i.providerId);
      if (!p) return null;
      return { ...i, provider: p, subtotal: p.pricePerClass * i.classes };
    })
    .filter((x): x is NonNullable<typeof x> => !!x);

  const total = rows.reduce((sum, r) => sum + r.subtotal, 0);

  if (isLoading) return null;

  return (
    <Stack gap="lg">
      <Group justify="space-between" align="end">
        <Stack gap={4}>
          <Title order={1}>{c.title}</Title>
          <Text size="sm" c="dimmed">
            {c.subtitle}
          </Text>
        </Stack>
        {rows.length > 0 && (
          <Button variant="default" color="dark" onClick={clear} leftSection={<Trash2 size={16} />}>
            {c.clearAllCta}
          </Button>
        )}
      </Group>

      {rows.length === 0 ? (
        <EmptyState
          icon={Calculator}
          title={c.emptyTitle}
          message={c.emptyMessage}
          action={
            <Group gap="sm" justify="center">
              <Button variant="light" color="dark" onClick={() => onNavigate("Classes")}>
                Browse training
              </Button>
              <Button variant="subtle" color="gray" rightSection={<ArrowRight size={14} />} onClick={() => onNavigate("Saved")}>
                Open saved items
              </Button>
            </Group>
          }
        />
      ) : (
        <SimpleGrid cols={{ base: 1, lg: 2 }} spacing="lg" verticalSpacing="lg">
          <Stack gap="sm">
            {rows.map((r) => (
              <Paper key={r.providerId} withBorder radius="xl" p="md">
                <Group align="center" wrap="nowrap">
                <CdnImage
                  resolveBase={r.provider.website}
                  src={r.provider.image?.trim() ? r.provider.image : CMS_MEDIA.fallbackListing}
                  alt=""
                  style={{ height: 64, width: 64, borderRadius: "var(--mantine-radius-lg)", objectFit: "cover" }}
                />
                <Stack gap={2} style={{ flex: 1, minWidth: 0 }}>
                  <Text ff="heading" fw={600} truncate>
                    {r.provider.name}
                  </Text>
                  <Text size="xs" c="dimmed">
                    {r.provider.neighborhood}, {r.provider.borough} · EUR {r.provider.pricePerClass}
                    {c.providerLinePriceSuffix}
                  </Text>
                </Stack>
                <Group gap={4} wrap="nowrap">
                  <ActionIcon
                    variant="light"
                    color="gray"
                    radius="xl"
                    onClick={() => setClasses(r.providerId, r.classes - 1)}
                    aria-label="Decrease classes"
                  >
                    <Minus size={14} />
                  </ActionIcon>
                  <Text w={32} ta="center" fw={600}>
                    {r.classes}
                  </Text>
                  <ActionIcon
                    variant="light"
                    color="gray"
                    radius="xl"
                    onClick={() => setClasses(r.providerId, r.classes + 1)}
                    aria-label="Increase classes"
                  >
                    <Plus size={14} />
                  </ActionIcon>
                </Group>
                <Text ff="heading" fw={700} c="orange.5" w={80} ta="right">
                  EUR {r.subtotal}
                </Text>
                <ActionIcon
                  variant="subtle"
                  color="gray"
                  radius="xl"
                  onClick={() => remove(r.providerId)}
                  aria-label={`Remove ${r.provider.name}`}
                >
                  <X size={16} />
                </ActionIcon>
                </Group>
              </Paper>
            ))}
          </Stack>

          <Paper withBorder radius="xl" p="lg" h="fit-content">
            <Stack gap="md">
            <Stack gap={2}>
              <Title order={3} size="h4">
                {c.asideTitle}
              </Title>
              <Text size="xs" c="dimmed">
                {c.asideSubtitle}
              </Text>
            </Stack>
            <Divider />
            <Stack gap="xs">
              {rows.map((r) => (
                <Group key={r.providerId} justify="space-between" align="start">
                  <Text size="sm" c="dimmed" pr="sm" style={{ flex: 1 }}>
                    {r.provider.name} × {r.classes}
                  </Text>
                  <Text size="sm" fw={500}>
                    EUR {r.subtotal}
                  </Text>
                </Group>
              ))}
            </Stack>
            <Divider />
            <Group justify="space-between" align="end">
              <Text ff="heading" fw={600} size="sm">
                {c.estimatedTotalLabel}
              </Text>
              <Text ff="heading" fw={700} size="2rem" c="orange.5">
                EUR {total}
              </Text>
            </Group>
            <Text size="xs" c="dimmed">
              {c.asideFootnote}
            </Text>
            </Stack>
          </Paper>
        </SimpleGrid>
      )}
    </Stack>
  );
}
