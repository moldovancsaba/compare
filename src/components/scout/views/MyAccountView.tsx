import {
  ActionIcon,
  Anchor,
  Badge,
  Box,
  Button,
  Card,
  Checkbox,
  Group,
  Paper,
  ScrollArea,
  SimpleGrid,
  Stack,
  Tabs,
  Text,
  ThemeIcon,
  Title,
} from "@mantine/core";
import { MetricCard, ProgressCard, StateBlock, StatsSection } from "@doneisbetter/gds-core/client";
import { useEffect, useMemo, useState } from "react";
import { Heart, Share2, Plus, Minus, X, Eye, MapPin, Mail, ArrowRight } from "@/lib/appIcons";
import { toast } from "@/lib/notify";
import { useProvidersCatalog, useSiteCatalog } from "@/hooks/useCatalog";
import { useSaved, useCalculator } from "@/store/useScout";
import type { Provider, BoroughChoice, Category } from "@/types/provider";
import type { AccountSavedCategoryFilter, SiteAccountSettings } from "@/types/site";
import { CMS_MEDIA } from "@/config/defaultMedia";
import { CdnImage } from "@/components/media/CdnImage";

interface Props {
  onNavigate: (
    view: Category | "Saved" | "Calculator" | "Meet-Up Groups",
    location?: { borough?: BoroughChoice; neighborhood?: string },
  ) => void;
  onOpenProvider: (p: Provider) => void;
  onShareProvider: (p: Provider) => void;
}

function badgeFor(cat: string) {
  switch (cat) {
    case "Classes":
      return { label: "Training", filter: "Classes", color: "teal" };
    case "Camps":
      return { label: "Range", filter: "Camps", color: "green" };
    case "Birthday Parties":
      return { label: "Competition", filter: "Birthdays", color: "pink" };
    case "Drop-In Activities":
      return { label: "Hunting", filter: "Drop-Ins", color: "yellow" };
    case "Meet-Up Group":
      return { label: "Club", filter: "Meet-Up Groups", color: "blue" };
    default:
      return { label: cat, filter: "All", color: "gray" };
  }
}

function priceUnitLabel(p: Provider, units: SiteAccountSettings["saved"]["priceUnits"]) {
  if (p.category === "Camps") return units.week;
  if (p.category === "Birthday Parties") return units.party;
  if (p.category === "Drop-In Activities") return units.visit;
  return units.class;
}

function withSaved(tab: string, savedTabId: string, sectionTabId: string) {
  return tab === savedTabId || tab === sectionTabId;
}

function interpolate(template: string, vars: Record<string, string>) {
  return template.replace(/\{(\w+)\}/g, (_, k) => vars[k] ?? "");
}

function SectionSurface({
  id,
  title,
  subtitle,
  visible,
  children,
}: {
  id: string;
  title: string;
  subtitle: string;
  visible: boolean;
  children: React.ReactNode;
}) {
  if (!visible) return null;

  return (
    <Paper id={`section-${id}`} bg="beige.1" p={{ base: "lg", sm: "xl" }} radius="xl">
      <Stack gap="xs">
        <Title order={2} size="h3">
          {title}
        </Title>
        <Text size="sm" c="dimmed">
          {subtitle}
        </Text>
      </Stack>
      <Box mt="lg">{children}</Box>
    </Paper>
  );
}

function PillButton({
  label,
  active,
  onClick,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <Button
      size="xs"
      radius="xl"
      variant={active ? "filled" : "light"}
      color={active ? "teal" : "dark"}
      onClick={onClick}
    >
      {label}
    </Button>
  );
}

export function MyAccountView({ onNavigate, onOpenProvider, onShareProvider }: Props) {
  const { data: siteData, isLoading: siteLoading, isError: siteError } = useSiteCatalog();
  const [tab, setTab] = useState("");
  const [filter, setFilter] = useState<AccountSavedCategoryFilter>("All");
  const { saved, toggle: toggleSaved } = useSaved();
  const { items: calculatorItems, add: addToCalc } = useCalculator();
  const { data: providers = [] } = useProvidersCatalog();

  useEffect(() => {
    if (siteData?.account.saved.tabId && !tab) setTab(siteData.account.saved.tabId);
  }, [siteData, tab]);

  const savedProviders: Provider[] = useMemo(() => providers.filter((p) => saved.includes(p.id)), [saved, providers]);

  type Item = { kind: "provider"; data: Provider; categoryFilter: AccountSavedCategoryFilter };

  const items: Item[] = useMemo(
    () =>
      savedProviders.map((p) => ({
        kind: "provider" as const,
        data: p,
        categoryFilter: badgeFor(p.category).filter as AccountSavedCategoryFilter,
      })),
    [savedProviders],
  );

  if (siteLoading || siteError || !siteData) return null;

  const s = siteData;
  const acc = s.account;

  const filtered = filter === "All" ? items : items.filter((i) => i.categoryFilter === filter);
  const planUnits = calculatorItems.reduce((sum, item) => sum + item.classes, 0);
  const alertOptions = acc.alerts.options.length;

  return (
    <Stack gap="xl">
      <Stack gap="xs">
        <Title order={1}>{acc.page.title}</Title>
        <Text size="sm" c="dimmed">
          {acc.page.subtitle}
        </Text>
      </Stack>

      <StatsSection
        title="At a glance"
      >
        <Text size="sm" c="dimmed">
          Your saved catalog, active plan, and account preferences stay local to this account view.
        </Text>
        <MetricCard
          label="Saved listings"
          value={savedProviders.length}
          description={savedProviders.length === 1 ? "1 saved favorite" : `${savedProviders.length} saved favorites`}
        />
        <MetricCard
          label="Plan items"
          value={planUnits}
          description={planUnits === 1 ? "1 planned session" : `${planUnits} planned sessions`}
        />
        <ProgressCard
          label="Alerts enabled"
          value={alertOptions}
          progress={100}
          progressLabel={alertOptions === 1 ? "1 alert type" : `${alertOptions} alert types`}
          description="Local notification preferences saved for this account."
        />
      </StatsSection>

      <Tabs value={tab} onChange={(value) => value && setTab(value)} keepMounted={false}>
        <ScrollArea.Autosize type="scroll" offsetScrollbars>
          <Tabs.List>
            {acc.navTabs.map((t) => (
              <Tabs.Tab key={t.id} value={t.id}>
                {t.label}
              </Tabs.Tab>
            ))}
          </Tabs.List>
        </ScrollArea.Autosize>
      </Tabs>

      <SectionSurface
        id={acc.saved.tabId}
        title={acc.saved.title}
        subtitle={acc.saved.subtitle}
        visible={tab === acc.saved.tabId}
      >
        <Group justify="space-between" align="flex-start" gap="md" wrap="wrap">
          <Group gap="xs" wrap="wrap">
            {acc.saved.filterChips.map((c) => (
              <PillButton
                key={c.label}
                label={c.label}
                active={c.categoryFilter === filter}
                onClick={() => setFilter(c.categoryFilter)}
              />
            ))}
          </Group>
          <Button
            variant="light"
            color="dark"
            radius="xl"
            rightSection={<ArrowRight size={16} />}
            onClick={() => onNavigate("Saved")}
          >
            {acc.saved.viewAllCta}
          </Button>
        </Group>

        <Box mt="xl">
          {filtered.length === 0 ? (
            <StateBlock
              variant="empty"
              title="No saved listings yet"
              description={acc.saved.emptyMessage}
              compact
              action={
                <Button size="xs" variant="light" color="dark" radius="xl" onClick={() => onNavigate("Saved")}>
                  Open saved view
                </Button>
              }
            />
          ) : (
            <SimpleGrid cols={{ base: 1, sm: 2, lg: 3, xl: 4 }} spacing="lg" verticalSpacing="lg">
              {filtered.map((item) => (
                <SavedProviderCard
                  key={`p-${item.data.id}`}
                  provider={item.data}
                  card={acc.saved.card}
                  priceUnits={acc.saved.priceUnits}
                  onView={() => onOpenProvider(item.data)}
                  onShare={() => onShareProvider(item.data)}
                  onAddToPlan={() => {
                    addToCalc(item.data.id);
                    toast.success(interpolate(acc.saved.toastAddedToPlan, { name: item.data.name }));
                  }}
                  onRemove={() => {
                    if (saved.includes(item.data.id)) {
                      toggleSaved(item.data.id);
                      toast(interpolate(acc.saved.toastRemoved, { name: item.data.name }));
                    } else {
                      toast(acc.saved.toastSampleRemove);
                    }
                  }}
                />
              ))}
            </SimpleGrid>
          )}
        </Box>
      </SectionSurface>

      <SimpleGrid cols={{ base: 1, lg: 2 }} spacing="lg" verticalSpacing="lg">
        <ActivityPlanCard acc={acc} tab={tab} onNavigate={onNavigate} providers={providers} />
        <FamilyPreferencesCard acc={acc} tab={tab} />
        <NeighborhoodCard acc={acc} tab={tab} onNavigate={onNavigate} />
        <AlertsCard acc={acc} tab={tab} />
      </SimpleGrid>

      <Paper bg="beige.1" p="lg" radius="xl">
        <Stack gap={4} ta="center">
          <Text size="sm" fw={600}>
            {acc.privacy.headline}
          </Text>
          <Text size="xs" c="dimmed">
            {acc.privacy.supportTextBefore}{" "}
            <Anchor href={`mailto:${acc.privacy.supportEmail}`} fw={600} c="teal.7">
              {acc.privacy.supportEmail}
            </Anchor>
            {acc.privacy.supportTextAfter ? ` ${acc.privacy.supportTextAfter}` : null}
          </Text>
        </Stack>
      </Paper>
    </Stack>
  );
}

function SavedProviderCard({
  provider,
  card,
  priceUnits,
  onView,
  onShare,
  onAddToPlan,
  onRemove,
}: {
  provider: Provider;
  card: SiteAccountSettings["saved"]["card"];
  priceUnits: SiteAccountSettings["saved"]["priceUnits"];
  onView: () => void;
  onShare: () => void;
  onAddToPlan: () => void;
  onRemove: () => void;
}) {
  const b = badgeFor(provider.category);
  const unit = priceUnitLabel(provider, priceUnits);

  return (
    <Card withBorder radius="xl" padding={0} style={{ overflow: "hidden" }}>
      <Box pos="relative" h={144}>
        <CdnImage
          resolveBase={provider.website}
          src={provider.image?.trim() ? provider.image : CMS_MEDIA.fallbackListing}
          alt={provider.name}
          style={{ width: "100%", height: "100%", objectFit: "cover" }}
        />
        <Badge color={b.color} variant="light" radius="xl" pos="absolute" top={12} left={12}>
          {b.label}
        </Badge>
        <ThemeIcon color="orange" variant="light" radius="xl" size="lg" pos="absolute" top={12} right={12}>
          <Heart size={16} fill="currentColor" />
        </ThemeIcon>
      </Box>

      <Stack p="md" gap="xs">
        <Title order={3} size="h5" lh={1.3}>
          {provider.name}
        </Title>
        <Text size="xs" c="dimmed">
          {provider.neighborhood}
        </Text>
        <Text size="xs" c="dimmed">
          Audience {provider.ageRanges[0]} · {provider.activityTypes[0]}
        </Text>
        <Text size="sm" fw={700} c="orange.7">
          EUR {provider.pricePerClass}
          <Text span size="xs" fw={400} c="dimmed">
            {" "}
            / {unit}
          </Text>
        </Text>

        <SimpleGrid cols={2} spacing="xs" verticalSpacing="xs" mt="sm">
          <Button size="xs" radius="xl" variant="light" color="dark" leftSection={<Eye size={14} />} onClick={onView}>
            {card.viewCta}
          </Button>
          <Button size="xs" radius="xl" variant="light" color="dark" leftSection={<Share2 size={14} />} onClick={onShare}>
            {card.shareCta}
          </Button>
          <Button size="xs" radius="xl" color="teal" leftSection={<Plus size={14} />} onClick={onAddToPlan}>
            {card.addToPlanCta}
          </Button>
          <Button size="xs" radius="xl" variant="subtle" color="dark" leftSection={<X size={14} />} onClick={onRemove}>
            {card.removeCta}
          </Button>
        </SimpleGrid>
      </Stack>
    </Card>
  );
}

function ActivityPlanCard({
  acc,
  tab,
  onNavigate,
  providers,
}: {
  acc: SiteAccountSettings;
  tab: string;
  onNavigate: Props["onNavigate"];
  providers: Provider[];
}) {
  const { items, setClasses, remove, clear } = useCalculator();
  const visible = withSaved(tab, acc.saved.tabId, acc.activityPlan.tabId);

  const rows = useMemo(
    () =>
      items
        .map((i) => {
          const p = providers.find((x) => x.id === i.providerId);
          if (!p) return null;
          return { providerId: i.providerId, provider: p, qty: i.classes, subtotal: p.pricePerClass * i.classes };
        })
        .filter((x): x is NonNullable<typeof x> => !!x),
    [items, providers],
  );

  const total = rows.reduce((s, r) => s + r.subtotal, 0);
  const units = acc.activityPlan.priceUnits;

  if (!visible) return null;

  return (
    <SectionSurface
      id={acc.activityPlan.tabId}
      title={acc.activityPlan.title}
      subtitle={acc.activityPlan.subtitle}
      visible={visible}
    >
      {rows.length === 0 ? (
        <StateBlock
          variant="empty"
          title="Your plan is empty"
          description={acc.activityPlan.emptyMessage}
          compact
          action={
            <Button size="xs" variant="light" color="dark" radius="xl" onClick={() => onNavigate("Calculator")}>
              Open planner
            </Button>
          }
        />
      ) : (
        <Stack gap="sm">
          {rows.map((r) => {
            const unit = priceUnitLabel(r.provider, units);
            return (
              <Paper key={r.providerId} withBorder p="sm" radius="xl">
                <Group justify="space-between" align="center" gap="sm" wrap="nowrap">
                  <Stack gap={2} miw={0}>
                    <Text fw={600} truncate>
                      {r.provider.name}
                    </Text>
                    <Text size="xs" c="dimmed">
                      EUR {r.provider.pricePerClass} / {unit}
                    </Text>
                  </Stack>
                  <Group gap="xs" wrap="nowrap">
                    <Group gap={4} wrap="nowrap">
                      <ActionIcon variant="light" color="dark" radius="xl" onClick={() => setClasses(r.providerId, r.qty - 1)} aria-label="Decrease">
                        <Minus size={14} />
                      </ActionIcon>
                      <Text size="sm" fw={600} miw={20} ta="center">
                        {r.qty}
                      </Text>
                      <ActionIcon variant="light" color="dark" radius="xl" onClick={() => setClasses(r.providerId, r.qty + 1)} aria-label="Increase">
                        <Plus size={14} />
                      </ActionIcon>
                    </Group>
                    <Text fw={700} c="orange.7" miw={64} ta="right">
                      EUR {r.subtotal}
                    </Text>
                    <ActionIcon variant="subtle" color="dark" radius="xl" onClick={() => remove(r.providerId)} aria-label="Remove">
                      <X size={14} />
                    </ActionIcon>
                  </Group>
                </Group>
              </Paper>
            );
          })}

          <Paper withBorder p="md" radius="xl">
            <Group justify="space-between" align="center">
              <Text fw={600}>{acc.activityPlan.estimatedTotalLabel}</Text>
              <Text size="xl" fw={700} c="orange.7">
                EUR {total}
              </Text>
            </Group>
          </Paper>
        </Stack>
      )}

      <Group gap="sm" mt="md">
        <Button color="teal" radius="xl" onClick={() => onNavigate("Calculator")}>
          {acc.activityPlan.viewFullCta}
        </Button>
        <Button variant="light" color="dark" radius="xl" onClick={() => clear()}>
          {acc.activityPlan.clearCta}
        </Button>
      </Group>
    </SectionSurface>
  );
}

function FamilyPreferencesCard({ acc, tab }: { acc: SiteAccountSettings; tab: string }) {
  const visible = withSaved(tab, acc.saved.tabId, acc.familyPreferences.tabId);
  const sections = acc.familyPreferences.sections;

  const initial = useMemo(() => {
    const m: Record<string, string[]> = {};
    for (const sec of sections) m[sec.id] = [...sec.defaultSelected];
    return m;
  }, [sections]);

  const [sel, setSel] = useState<Record<string, string[]>>(initial);

  useEffect(() => {
    setSel(initial);
  }, [initial]);

  const toggle = (id: string, set: string[], v: string) => {
    const next = set.includes(v) ? set.filter((x) => x !== v) : [...set, v];
    setSel((s) => ({ ...s, [id]: next }));
  };

  if (!visible) return null;

  return (
    <SectionSurface
      id={acc.familyPreferences.tabId}
      title={acc.familyPreferences.title}
      subtitle={acc.familyPreferences.subtitle}
      visible={visible}
    >
      <Stack gap="lg">
        {sections.map((sec) => (
          <Stack key={sec.id} gap="xs">
            <Text size="xs" fw={700} tt="uppercase" c="dimmed" style={{ letterSpacing: "0.1em" }}>
              {sec.label}
            </Text>
            <Group gap="xs" wrap="wrap">
              {sec.options.map((a) => (
                <PillButton
                  key={a}
                  label={a}
                  active={(sel[sec.id] ?? []).includes(a)}
                  onClick={() => toggle(sec.id, sel[sec.id] ?? [], a)}
                />
              ))}
            </Group>
          </Stack>
        ))}
      </Stack>

      <Button mt="md" color="teal" radius="xl" onClick={() => toast.success(acc.familyPreferences.savedToast)}>
        {acc.familyPreferences.editCta}
      </Button>
    </SectionSurface>
  );
}

function NeighborhoodCard({
  acc,
  tab,
  onNavigate,
}: {
  acc: SiteAccountSettings;
  tab: string;
  onNavigate: Props["onNavigate"];
}) {
  const n = acc.neighborhood;
  const visible = withSaved(tab, acc.saved.tabId, n.tabId);

  if (!visible) return null;

  return (
    <SectionSurface id={n.tabId} title={n.title} subtitle={n.subtitle} visible={visible}>
      <Paper withBorder p="lg" radius="xl">
        <Group align="flex-start" gap="md" wrap="nowrap">
          <ThemeIcon color="orange" variant="light" size="xl" radius="xl">
            <MapPin size={18} />
          </ThemeIcon>
          <Stack gap={4} style={{ flex: 1 }}>
            <Text fw={600}>{n.addressLine1}</Text>
            <Text size="sm" c="dimmed">
              {n.addressLine2}
            </Text>
            <Text size="xs" c="dimmed">
              {n.detectedLabelPrefix} <Text span fw={600} c="dark.7">{n.detectedNeighborhood}</Text> · {n.detectedBorough}
            </Text>
          </Stack>
          <Button size="xs" variant="light" color="dark" radius="xl" onClick={() => toast(n.updateAddressToast)}>
            {n.updateAddressCtaLabel}
          </Button>
        </Group>
      </Paper>

      <Stack gap="xs" mt="md">
        <Text size="xs" fw={700} tt="uppercase" c="dimmed" style={{ letterSpacing: "0.1em" }}>
          {n.nearbySectionLabel}
        </Text>
        <Group gap="xs" wrap="wrap">
          {n.nearbyNeighborhoods.map((hood) => (
            <PillButton
              key={hood}
              label={hood}
              active={false}
              onClick={() => onNavigate("Classes", { borough: n.nearbyNavigateBorough, neighborhood: hood })}
            />
          ))}
        </Group>
      </Stack>

      <Button
        mt="md"
        color="teal"
        radius="xl"
        rightSection={<ArrowRight size={16} />}
        onClick={() => onNavigate("Classes", { borough: n.browseNavigateBorough, neighborhood: n.browseNavigateNeighborhood })}
      >
        {n.browseCtaLabel}
      </Button>
    </SectionSurface>
  );
}

function AlertsCard({ acc, tab }: { acc: SiteAccountSettings; tab: string }) {
  const visible = withSaved(tab, acc.saved.tabId, acc.alerts.tabId);
  const a = acc.alerts;

  const [alerts, setAlerts] = useState<Record<string, boolean>>(() => Object.fromEntries(a.options.map((x) => [x, true])));
  useEffect(() => {
    setAlerts(Object.fromEntries(a.options.map((x) => [x, true])));
  }, [a.options]);

  const [freq, setFreq] = useState(a.frequencyChoices[0] ?? "Weekly");
  useEffect(() => {
    setFreq(a.frequencyChoices[0] ?? "Weekly");
  }, [a.frequencyChoices]);

  if (!visible) return null;

  return (
    <SectionSurface id={a.tabId} title={a.title} subtitle={a.subtitle} visible={visible}>
      <Stack gap="lg">
        <Stack gap="xs">
          <Text size="xs" fw={700} tt="uppercase" c="dimmed" style={{ letterSpacing: "0.1em" }}>
            {a.emailSectionLabel}
          </Text>
          <Stack gap="xs">
            {a.options.map((opt) => (
              <Paper key={opt} withBorder p="sm" radius="xl">
                <Checkbox
                  label={opt}
                  checked={alerts[opt] ?? false}
                  onChange={(event) => setAlerts((s) => ({ ...s, [opt]: event.currentTarget.checked }))}
                />
              </Paper>
            ))}
          </Stack>
        </Stack>

        <Stack gap="xs">
          <Text size="xs" fw={700} tt="uppercase" c="dimmed" style={{ letterSpacing: "0.1em" }}>
            {a.frequencySectionLabel}
          </Text>
          <Group gap="xs" wrap="wrap">
            {a.frequencyChoices.map((f) => (
              <PillButton key={f} label={f} active={f === freq} onClick={() => setFreq(f)} />
            ))}
          </Group>
        </Stack>
      </Stack>

      <Button mt="md" color="teal" radius="xl" leftSection={<Mail size={16} />} onClick={() => toast.success(a.savedToast)}>
        {a.saveCta}
      </Button>
    </SectionSurface>
  );
}
