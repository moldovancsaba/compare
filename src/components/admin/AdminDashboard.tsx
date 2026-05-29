"use client";

import { PageHeader as AdminPageHeader, ResponsiveDataView } from "@doneisbetter/gds-admin/client";
import { FormField, SectionPanel as PanelSection, StateBlock } from "@doneisbetter/gds-core/client";
import {
  Anchor,
  Box,
  Button,
  Code,
  Group,
  Paper,
  ScrollArea,
  SimpleGrid,
  Stack,
  Tabs,
  Text,
  TextInput as Input,
  Textarea,
  Title,
} from "@mantine/core";
import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "@/lib/notify";
import type { CatalogImageRemediationQueueItem } from "@/lib/contentIntelligence/catalogImageUniqueness";
import type { Provider } from "@/types/provider";
import type { RecurringProgram } from "@/types/provider";
import type { MeetupGroup } from "@/types/meetup";
import type { SiteDoc, SiteAccountSettings, SiteCalculatorCopy } from "@/types/site";
import type { Borough } from "@/types/provider";

const TabsContent = Tabs.Panel;
const TabsList = Tabs.List;
const TabsTrigger = Tabs.Tab;

async function adminFetch(input: RequestInfo, init?: RequestInit) {
  return fetch(input, { ...init, credentials: "include" });
}

export default function AdminDashboard() {
  const router = useRouter();
  const [providers, setProviders] = useState<Provider[]>([]);
  const [meetups, setMeetups] = useState<MeetupGroup[]>([]);
  const [site, setSite] = useState<Partial<SiteDoc> | null>(null);
  const [locationsJson, setLocationsJson] = useState("");
  const [guidesDraft, setGuidesDraft] = useState("[]");
  const [locationHeroImagesDraft, setLocationHeroImagesDraft] = useState("[]");
  const [howItWorksDraft, setHowItWorksDraft] = useState("[]");
  const [trustPillarsDraft, setTrustPillarsDraft] = useState("[]");
  const [trustLinesDraft, setTrustLinesDraft] = useState("");
  const [popularNamesDraft, setPopularNamesDraft] = useState("");
  const [meetupGroupIdDraft, setMeetupGroupIdDraft] = useState("");
  const [calculatorDraft, setCalculatorDraft] = useState("{}");
  const [accountDraft, setAccountDraft] = useState("{}");
  const [checklistCompanyId, setChecklistCompanyId] = useState("");
  const [liveRevisionStatuses, setLiveRevisionStatuses] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    const [pr, mg, st, loc] = await Promise.all([
      adminFetch("/api/admin/providers"),
      adminFetch("/api/admin/meetup-groups"),
      adminFetch("/api/admin/site"),
      adminFetch("/api/admin/locations"),
    ]);
    if (pr.status === 401) {
      router.push("/admin/login");
      return;
    }
    if (pr.ok) setProviders(await pr.json());
    if (mg.ok) setMeetups(await mg.json());
    if (st.ok) {
      const s = await st.json();
      setSite(s);
      if (s.guides) setGuidesDraft(JSON.stringify(s.guides, null, 2));
      setLocationHeroImagesDraft(JSON.stringify(s.locationHeroImages ?? [], null, 2));
      setHowItWorksDraft(JSON.stringify(s.howItWorksSteps ?? [], null, 2));
      setTrustPillarsDraft(JSON.stringify(s.trustPillars ?? [], null, 2));
      setTrustLinesDraft((s.trustLines ?? []).join("\n"));
      setPopularNamesDraft((s.homePopularPickProviderNames ?? []).join("\n"));
      setMeetupGroupIdDraft(s.homePopularMeetupGroupId ?? "");
      setCalculatorDraft(JSON.stringify(s.calculator ?? {}, null, 2));
      setAccountDraft(JSON.stringify(s.account ?? {}, null, 2));
    }
    if (loc.ok) {
      const rows = await loc.json();
      setLocationsJson(JSON.stringify(rows, null, 2));
    }
  }, [router]);

  useEffect(() => {
    load();
  }, [load]);

  const logout = async () => {
    await adminFetch("/api/admin/logout", { method: "POST" });
    router.push("/admin/login");
    router.refresh();
  };

  const saveProviderImage = async (id: string, image: string) => {
    setBusy(true);
    try {
      const r = await adminFetch("/api/admin/providers", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, image }),
      });
      if (!r.ok) throw new Error();
      toast.success("Provider image updated");
      await load();
    } catch {
      toast.error("Save failed");
    } finally {
      setBusy(false);
    }
  };

  const saveProviderRecurringPrograms = async (id: string, recurringPrograms: RecurringProgram[]) => {
    setBusy(true);
    try {
      const r = await adminFetch("/api/admin/providers", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, recurringPrograms }),
      });
      const body = await r.json().catch(() => ({}));
      if (!r.ok) throw new Error(body.error || "Save failed");
      toast.success("Recurring programs updated");
      await load();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Save failed");
    } finally {
      setBusy(false);
    }
  };

  const saveMeetupCover = async (id: string, coverImageUrl: string) => {
    setBusy(true);
    try {
      const r = await adminFetch("/api/admin/meetup-groups", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, coverImageUrl }),
      });
      if (!r.ok) throw new Error();
      toast.success("Meet-up cover updated");
      await load();
    } catch {
      toast.error("Save failed");
    } finally {
      setBusy(false);
    }
  };

  const saveSite = async () => {
    if (!site) return;
    setBusy(true);
    try {
      let guides: SiteDoc["guides"];
      let locationHeroImages: SiteDoc["locationHeroImages"];
      let howItWorksSteps: SiteDoc["howItWorksSteps"];
      let trustPillars: SiteDoc["trustPillars"];
      let account: SiteAccountSettings;
      let calculator: SiteCalculatorCopy;
      try {
        guides = JSON.parse(guidesDraft);
        locationHeroImages = JSON.parse(locationHeroImagesDraft);
        howItWorksSteps = JSON.parse(howItWorksDraft);
        trustPillars = JSON.parse(trustPillarsDraft);
        account = JSON.parse(accountDraft);
        calculator = JSON.parse(calculatorDraft);
      } catch {
        toast.error("Invalid JSON in guides, location hero images, steps, pillars, account, or calculator");
        setBusy(false);
        return;
      }
      const trustLines = trustLinesDraft
        .split("\n")
        .map((l) => l.trim())
        .filter(Boolean);
      const homePopularPickProviderNames = popularNamesDraft
        .split("\n")
        .map((l) => l.trim())
        .filter(Boolean);
      const homePopularMeetupGroupId = meetupGroupIdDraft.trim();
      const {
        _id,
        guides: _g,
        locationHeroImages: _lhi,
        howItWorksSteps: _h,
        trustPillars: _tp,
        trustLines: _tl,
        account: _a,
        calculator: _c,
        homePopularPickProviderNames: _hpn,
        homePopularMeetupGroupId: _hmg,
        ...rest
      } = site as SiteDoc;
      const r = await adminFetch("/api/admin/site", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...rest,
          guides,
          locationHeroImages,
          howItWorksSteps,
          trustPillars,
          trustLines,
          account,
          calculator,
          homePopularPickProviderNames,
          homePopularMeetupGroupId,
        }),
      });
      if (!r.ok) throw new Error();
      toast.success("Site settings saved");
    } catch {
      toast.error("Save failed");
    } finally {
      setBusy(false);
    }
  };

  const saveLocations = async () => {
    setBusy(true);
    try {
      const rows = JSON.parse(locationsJson) as { borough: Borough; neighborhoods: string[] }[];
      const r = await adminFetch("/api/admin/locations", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ locations: rows }),
      });
      if (!r.ok) throw new Error();
      toast.success("Locations saved");
    } catch {
      toast.error("Invalid JSON or save failed");
    } finally {
      setBusy(false);
    }
  };

  const upload = async (file: File | null) => {
    if (!file) return;
    setBusy(true);
    try {
      const fd = new FormData();
      fd.append("file", file);
      const r = await adminFetch("/api/admin/upload", { method: "POST", body: fd });
      const j = await r.json();
      if (!r.ok) throw new Error(j.error);
      await navigator.clipboard.writeText(j.url);
      toast.success("Uploaded — URL copied to clipboard", { description: j.url });
    } catch {
      toast.error("Upload failed — check IMGBB_API_KEY");
    } finally {
      setBusy(false);
    }
  };

  const updateLiveRevisionStatus = (key: string, message: string) => {
    setLiveRevisionStatuses((current) => ({ ...current, [key]: message }));
  };

  const launchLiveRevision = async (listingType: "provider" | "meetupGroup", listingId: string) => {
    const key = `${listingType}:${listingId}`;
    updateLiveRevisionStatus(key, "Preparing revision packet...");
    try {
      const response = await adminFetch("/api/admin/content-intelligence/live-listings/revision", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          checklistCompanyId,
          listingType,
          listingId,
        }),
      });
      const json = await response.json();
      if (!response.ok) throw new Error(json.error || "Revision launch failed");
      const packetState =
        json.data && typeof json.data === "object" && json.data && "packetState" in json.data
          ? String((json.data as { packetState?: string }).packetState || "submitted")
          : "submitted";
      const reviewPacketId =
        json.data && typeof json.data === "object" && json.data && "reviewPacketId" in json.data
          ? String((json.data as { reviewPacketId?: string }).reviewPacketId || "")
          : "";
      updateLiveRevisionStatus(key, reviewPacketId ? `${packetState} · packet ${reviewPacketId}` : packetState);
      toast.success("Checklist revision packet created");
    } catch (error) {
      updateLiveRevisionStatus(key, "revision failed");
      toast.error(error instanceof Error ? error.message : "Revision launch failed");
    }
  };

  const refreshLiveRevisionStatus = async (listingType: "provider" | "meetupGroup", listingId: string) => {
    const key = `${listingType}:${listingId}`;
    updateLiveRevisionStatus(key, "Loading revision status...");
    try {
      const response = await adminFetch("/api/admin/content-intelligence/live-listings/revision-status", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          checklistCompanyId,
          listingType,
          listingId,
        }),
      });
      const json = await response.json();
      if (!response.ok) throw new Error(json.error || "Revision status failed");
      const latestPacket =
        json.data && typeof json.data === "object" && json.data && "latestPacket" in json.data
          ? (json.data as { latestPacket?: { packetState?: string; id?: string } | null }).latestPacket
          : null;
      if (!latestPacket) {
        updateLiveRevisionStatus(key, "No revision packet yet");
        return;
      }
      updateLiveRevisionStatus(
        key,
        latestPacket.id ? `${latestPacket.packetState ?? "unknown"} · packet ${latestPacket.id}` : latestPacket.packetState ?? "unknown",
      );
    } catch (error) {
      updateLiveRevisionStatus(key, "status unavailable");
      toast.error(error instanceof Error ? error.message : "Revision status failed");
    }
  };

  return (
    <Box mih="100vh" bg="beige.0">
      <Paper radius={0} withBorder>
        <Group justify="space-between" align="center" px="lg" py="md" gap="md" wrap="wrap">
          <Group gap="md" align="baseline">
            <Anchor component={Link} href="/" c="dark.8" underline="never">
              <Title order={3}>RangeScout EU</Title>
            </Anchor>
            <Text c="dimmed">Admin</Text>
          </Group>
          <Group gap="sm">
            <Button component={Link} href="/" variant="light" color="dark" size="sm">
              View site
            </Button>
            <Button variant="light" color="dark" size="sm" onClick={() => load()} disabled={busy}>
              Refresh data
            </Button>
            <Button color="red" size="sm" onClick={logout}>
              Log out
            </Button>
          </Group>
        </Group>
      </Paper>

      <Box maw={1200} mx="auto" px={{ base: "md", sm: "lg" }} py="xl">
        <Paper withBorder p="lg" radius="xl" mb="lg">
          <AdminPageHeader
            eyebrow="GDS admin console"
            title="Catalog operations"
            description="Manage provider media, recurring programs, meet-up covers, neighborhoods, site content, and ImgBB uploads from one Mantine-admin surface."
            secondaryActions={
              <Button component={Link} href="/" variant="light" color="dark" size="sm">
                View site
              </Button>
            }
            primaryAction={
              <Group gap="sm">
                <Button variant="light" color="dark" size="sm" onClick={() => load()} disabled={busy}>
                  Refresh data
                </Button>
                <Button color="red" size="sm" onClick={logout}>
                  Log out
                </Button>
              </Group>
            }
          />
        </Paper>
        <Paper withBorder p="lg" radius="xl" mb="lg">
          <Stack gap="sm">
            <Text fw={600}>Checklist revision bridge</Text>
            <Text size="sm" c="dimmed">
              Use this company id for existing compare listing revisions. When blank, the server falls back to <Code>CHECKLIST_DEFAULT_COMPANY_ID</Code>.
            </Text>
            <Input
              value={checklistCompanyId}
              onChange={(event) => setChecklistCompanyId(event.currentTarget.value)}
              placeholder="Checklist company id"
            />
          </Stack>
        </Paper>
        <Tabs defaultValue="providers">
          <TabsList>
            <TabsTrigger value="providers">Classes & providers</TabsTrigger>
            <TabsTrigger value="meetups">Meet-Up Groups</TabsTrigger>
            <TabsTrigger value="locations">Neighborhoods</TabsTrigger>
            <TabsTrigger value="site">Site & images</TabsTrigger>
            <TabsTrigger value="intelligence">Content intelligence</TabsTrigger>
            <TabsTrigger value="upload">ImgBB upload</TabsTrigger>
          </TabsList>

          <TabsContent value="providers" pt="md">
            <PanelSection
              title="Provider media and recurring schedules"
              description="All provider categories share this editor. Update listing images and structured recurringPrograms data here."
            >
              <Stack gap="md">
                {providers.length ? (
                  <ScrollArea.Autosize mah={480}>
                    <ResponsiveDataView
                      data={providers.slice(0, 80) as unknown as Record<string, unknown>[]}
                      columns={[
                        {
                          key: "provider",
                          label: "Provider editor",
                          render: (provider) => (
                            <ProviderRow
                              p={provider as unknown as Provider}
                              disabled={busy}
                              onSaveImage={saveProviderImage}
                              onSaveRecurringPrograms={saveProviderRecurringPrograms}
                              onLaunchRevision={launchLiveRevision}
                              onRefreshRevisionStatus={refreshLiveRevisionStatus}
                              revisionStatus={liveRevisionStatuses[`provider:${(provider as unknown as Provider).id}`] ?? ""}
                            />
                          ),
                        },
                      ]}
                      renderCard={(provider) => (
                        <ProviderRow
                          p={provider as unknown as Provider}
                          disabled={busy}
                          onSaveImage={saveProviderImage}
                          onSaveRecurringPrograms={saveProviderRecurringPrograms}
                          onLaunchRevision={launchLiveRevision}
                          onRefreshRevisionStatus={refreshLiveRevisionStatus}
                          revisionStatus={liveRevisionStatuses[`provider:${(provider as unknown as Provider).id}`] ?? ""}
                        />
                      )}
                    />
                  </ScrollArea.Autosize>
                ) : (
                  <StateBlock
                    variant="empty"
                    title="No providers yet"
                    description="Load providers into the catalog first, then use this editor to manage images and recurring schedules."
                  />
                )}
                {providers.length > 80 && (
                  <Text size="xs" c="dimmed">
                    Showing first 80 of {providers.length}. Use Mongo tools for bulk edits.
                  </Text>
                )}
              </Stack>
            </PanelSection>
          </TabsContent>

          <TabsContent value="meetups" pt="md">
            <PanelSection
              title="Meet-up group covers"
              description="Maintain optional hero imagery for meet-up groups using direct CDN URLs."
            >
              <Stack gap="md">
                {meetups.length ? (
                  <ScrollArea.Autosize mah={480}>
                    <ResponsiveDataView
                      data={meetups as unknown as Record<string, unknown>[]}
                      columns={[
                        {
                          key: "meetup",
                          label: "Meet-up editor",
                          render: (meetup) => (
                            <MeetupRow
                              g={meetup as unknown as MeetupGroup}
                              disabled={busy}
                              onSave={saveMeetupCover}
                              onLaunchRevision={launchLiveRevision}
                              onRefreshRevisionStatus={refreshLiveRevisionStatus}
                              revisionStatus={liveRevisionStatuses[`meetupGroup:${(meetup as unknown as MeetupGroup).id}`] ?? ""}
                            />
                          ),
                        },
                      ]}
                      renderCard={(meetup) => (
                        <MeetupRow
                          g={meetup as unknown as MeetupGroup}
                          disabled={busy}
                          onSave={saveMeetupCover}
                          onLaunchRevision={launchLiveRevision}
                          onRefreshRevisionStatus={refreshLiveRevisionStatus}
                          revisionStatus={liveRevisionStatuses[`meetupGroup:${(meetup as unknown as MeetupGroup).id}`] ?? ""}
                        />
                      )}
                    />
                  </ScrollArea.Autosize>
                ) : (
                  <StateBlock
                    variant="empty"
                    title="No meet-up groups yet"
                    description="Add meet-up groups to the catalog first, then use this editor to manage cover images."
                  />
                )}
              </Stack>
            </PanelSection>
          </TabsContent>

          <TabsContent value="locations" pt="md">
            <PanelSection
              title="Neighborhood registry"
              description='Canonical array of { borough, neighborhoods: string[] } used by Discover and Meet-Up routes.'
            >
              <Stack gap="md">
                <Textarea value={locationsJson} onChange={(e) => setLocationsJson(e.target.value)} rows={16} styles={{ input: { fontFamily: "monospace", fontSize: 12 } }} />
                <Button onClick={saveLocations} disabled={busy}>
                  Save neighborhoods
                </Button>
              </Stack>
            </PanelSection>
          </TabsContent>

          <TabsContent value="site" pt="md">
            <PanelSection
              title="Site copy, media, and account configuration"
              description="This section governs home-page copy, hero images, guides, trust messaging, calculator settings, and account-page JSON."
            >
            {site && (
              <Stack gap="lg">
                <SimpleGrid cols={{ base: 1, sm: 2 }} spacing="md" verticalSpacing="md">
                  <Field label="Logo URL (ImgBB)">
                    <Input value={site.logoUrl ?? ""} onChange={(e) => setSite({ ...site, logoUrl: e.target.value })} />
                  </Field>
                  <Field label="Home hero image URL">
                    <Input value={site.homeHeroUrl ?? ""} onChange={(e) => setSite({ ...site, homeHeroUrl: e.target.value })} />
                  </Field>
                  <Field label="Discover hero image URL">
                    <Input value={site.discoverHeroUrl ?? ""} onChange={(e) => setSite({ ...site, discoverHeroUrl: e.target.value })} />
                  </Field>
                </SimpleGrid>
                <Box>
                  <Text size="sm" fw={600}>Home hero copy</Text>
                  <SimpleGrid cols={{ base: 1, sm: 2 }} spacing="md" verticalSpacing="md" mt="sm">
                  <Field label="Home hero title">
                    <Input value={site.homeHeroTitle ?? ""} onChange={(e) => setSite({ ...site, homeHeroTitle: e.target.value })} />
                  </Field>
                  <Field label="Home hero subtitle">
                    <Input value={site.homeHeroSubtitle ?? ""} onChange={(e) => setSite({ ...site, homeHeroSubtitle: e.target.value })} />
                  </Field>
                  <Field label="Primary CTA label">
                    <Input value={site.homeHeroPrimaryCta ?? ""} onChange={(e) => setSite({ ...site, homeHeroPrimaryCta: e.target.value })} />
                  </Field>
                  <Field label="Secondary CTA label">
                    <Input value={site.homeHeroSecondaryCta ?? ""} onChange={(e) => setSite({ ...site, homeHeroSecondaryCta: e.target.value })} />
                  </Field>
                  <Field label="Hero tagline" span={2}>
                    <Input value={site.homeHeroTagline ?? ""} onChange={(e) => setSite({ ...site, homeHeroTagline: e.target.value })} />
                  </Field>
                  </SimpleGrid>
                </Box>
                <Box>
                  <Text size="sm" fw={600}>Home sections</Text>
                  <SimpleGrid cols={{ base: 1, sm: 2 }} spacing="md" verticalSpacing="md" mt="sm">
                  <Field label="Categories section title">
                    <Input value={site.homeCategoriesTitle ?? ""} onChange={(e) => setSite({ ...site, homeCategoriesTitle: e.target.value })} />
                  </Field>
                  <Field label="Neighborhood section title">
                    <Input
                      value={site.neighborhoodSectionTitle ?? ""}
                      onChange={(e) => setSite({ ...site, neighborhoodSectionTitle: e.target.value })}
                    />
                  </Field>
                  <Field label="Popular neighborhoods caption (use {borough} token)" span={2}>
                    <Input
                      value={site.popularNeighborhoodsCaption ?? ""}
                      onChange={(e) => setSite({ ...site, popularNeighborhoodsCaption: e.target.value })}
                    />
                  </Field>
                  <Field label="Guides section title">
                    <Input value={site.guidesSectionTitle ?? ""} onChange={(e) => setSite({ ...site, guidesSectionTitle: e.target.value })} />
                  </Field>
                  <Field label='Guides "view all" label'>
                    <Input value={site.guidesViewAllLabel ?? ""} onChange={(e) => setSite({ ...site, guidesViewAllLabel: e.target.value })} />
                  </Field>
                  <Field label='Guides "view all" URL (optional, https or /path)' span={2}>
                    <Input value={site.guidesViewAllHref ?? ""} onChange={(e) => setSite({ ...site, guidesViewAllHref: e.target.value })} />
                  </Field>
                  <Field label="How it works section title" span={2}>
                    <Input
                      value={site.howItWorksSectionTitle ?? ""}
                      onChange={(e) => setSite({ ...site, howItWorksSectionTitle: e.target.value })}
                    />
                  </Field>
                  <Field label="Popular picks section title">
                    <Input
                      value={site.popularPicksSectionTitle ?? ""}
                      onChange={(e) => setSite({ ...site, popularPicksSectionTitle: e.target.value })}
                    />
                  </Field>
                  <Field label='Popular picks "view all" label'>
                    <Input
                      value={site.popularPicksViewAllLabel ?? ""}
                      onChange={(e) => setSite({ ...site, popularPicksViewAllLabel: e.target.value })}
                    />
                  </Field>
                  </SimpleGrid>
                </Box>
                <Box>
                  <Text size="sm" fw={600}>Newsletter</Text>
                  <SimpleGrid cols={{ base: 1, sm: 2 }} spacing="md" verticalSpacing="md" mt="sm">
                  <Field label="Newsletter title" span={2}>
                    <Input value={site.newsletterTitle ?? ""} onChange={(e) => setSite({ ...site, newsletterTitle: e.target.value })} />
                  </Field>
                  <Field label="Newsletter subtitle" span={2}>
                    <Input value={site.newsletterSubtitle ?? ""} onChange={(e) => setSite({ ...site, newsletterSubtitle: e.target.value })} />
                  </Field>
                  <Field label="Email placeholder">
                    <Input
                      value={site.newsletterPlaceholder ?? ""}
                      onChange={(e) => setSite({ ...site, newsletterPlaceholder: e.target.value })}
                    />
                  </Field>
                  <Field label="Submit button label">
                    <Input value={site.newsletterCta ?? ""} onChange={(e) => setSite({ ...site, newsletterCta: e.target.value })} />
                  </Field>
                  <Field label="Fine print" span={2}>
                    <Input value={site.newsletterFinePrint ?? ""} onChange={(e) => setSite({ ...site, newsletterFinePrint: e.target.value })} />
                  </Field>
                  </SimpleGrid>
                </Box>
                <Field label="Guides JSON (SiteGuide[]: id?, title, desc, borough, neighborhood, imageUrl, tone, ctaLabel?, ctaHref?)">
                  <Textarea value={guidesDraft} onChange={(e) => setGuidesDraft(e.target.value)} rows={10} styles={{ input: { fontFamily: "monospace", fontSize: 12 } }} />
                </Field>
                <Field label='Location hero images JSON (SiteLocationHeroImage[]: view, borough, neighborhood?, imageUrl, alt?)'>
                  <Textarea value={locationHeroImagesDraft} onChange={(e) => setLocationHeroImagesDraft(e.target.value)} rows={10} styles={{ input: { fontFamily: "monospace", fontSize: 12 } }} />
                </Field>
                <Field label="How it works steps JSON (step, title, desc, tone, icon)">
                  <Textarea value={howItWorksDraft} onChange={(e) => setHowItWorksDraft(e.target.value)} rows={8} styles={{ input: { fontFamily: "monospace", fontSize: 12 } }} />
                </Field>
                <Field label="Trust pillars JSON (title, desc, tone, icon)">
                  <Textarea value={trustPillarsDraft} onChange={(e) => setTrustPillarsDraft(e.target.value)} rows={8} styles={{ input: { fontFamily: "monospace", fontSize: 12 } }} />
                </Field>
                <Field label="Home popular pick provider names (exact catalog name per line)">
                  <Textarea
                    value={popularNamesDraft}
                    onChange={(e) => setPopularNamesDraft(e.target.value)}
                    rows={6}
                    styles={{ input: { fontFamily: "monospace", fontSize: 12 } }}
                  />
                </Field>
                <Field label="Home popular meet-up group id (empty hides card; use a real group id from your database)">
                  <Input value={meetupGroupIdDraft} onChange={(e) => setMeetupGroupIdDraft(e.target.value)} />
                </Field>
                <Field label="Calculator page JSON (title, subtitle, empty copy, aside, etc.)">
                  <Textarea value={calculatorDraft} onChange={(e) => setCalculatorDraft(e.target.value)} rows={12} styles={{ input: { fontFamily: "monospace", fontSize: 12 } }} />
                </Field>
                <Field label="My Account JSON (nav tabs, saved filters, prefs sections, neighborhood card, alerts)">
                  <Textarea value={accountDraft} onChange={(e) => setAccountDraft(e.target.value)} rows={20} styles={{ input: { fontFamily: "monospace", fontSize: 12 } }} />
                </Field>
                <Field label="Trust lines (footer rotating lines; one per line)">
                  <Textarea value={trustLinesDraft} onChange={(e) => setTrustLinesDraft(e.target.value)} rows={4} styles={{ input: { fontFamily: "monospace", fontSize: 12 } }} />
                </Field>
                <SimpleGrid cols={{ base: 1, sm: 3 }} spacing="md" verticalSpacing="md">
                  <Field label="Sidebar promo title">
                    <Input value={site.sidebarTitle ?? ""} onChange={(e) => setSite({ ...site, sidebarTitle: e.target.value })} />
                  </Field>
                  <Field label="Sidebar promo body">
                    <Input value={site.sidebarBody ?? ""} onChange={(e) => setSite({ ...site, sidebarBody: e.target.value })} />
                  </Field>
                  <Field label="Sidebar CTA label">
                    <Input value={site.sidebarCtaLabel ?? ""} onChange={(e) => setSite({ ...site, sidebarCtaLabel: e.target.value })} />
                  </Field>
                </SimpleGrid>
                <Button onClick={saveSite} disabled={busy}>
                  Save site & branding
                </Button>
              </Stack>
            )}
            </PanelSection>
          </TabsContent>

          <TabsContent value="intelligence" pt="md">
            <ContentIntelligencePanel />
          </TabsContent>

          <TabsContent value="upload" pt="md">
            <PanelSection
              title="ImgBB upload"
              description="Upload an image to ImgBB. The direct URL is copied to your clipboard for pasting into provider and site fields."
            >
              <Stack gap="md">
                <Input type="file" accept="image/*" disabled={busy} onChange={(e) => upload(e.target.files?.[0] ?? null)} />
              </Stack>
            </PanelSection>
          </TabsContent>
        </Tabs>
      </Box>
    </Box>
  );
}

function Field({ label, children, span = 1 }: { label: string; children: React.ReactNode; span?: 1 | 2 }) {
  return (
    <Box style={span === 2 ? { gridColumn: "span 2" } : undefined}>
      <FormField label={label}>{children}</FormField>
    </Box>
  );
}

function ContentIntelligencePanel() {
  const [normalizedJson, setNormalizedJson] = useState(
    JSON.stringify(
      {
        title: "Sample Family Art Class",
        listingKindHint: "provider",
        categoryHint: "Classes",
        boroughRaw: "Brooklyn",
        neighborhoodRaw: "Park Slope",
        addressRaw: "123 Example St, Brooklyn, NY",
        activityTypesRaw: ["Art"],
        ageRangesRaw: ["3–5", "6–8"],
        scheduleBlocks: [
          {
            daysOfWeek: ["Saturday"],
            timeText: "10:00 AM - 11:00 AM",
            title: "Weekend Art Class",
            summary: "Hands-on art exploration for kids.",
          },
        ],
        descriptionFacts: [
          "Official family art class in Park Slope.",
          "Weekend sessions for children ages 3–8.",
        ],
        contactFacts: {
          website: "https://example.com/family-art",
          email: "hello@example.com",
        },
        imageCandidates: [{ uploadedUrl: "https://i.ibb.co/example-upload.jpg" }],
        sourceUrls: {
          canonical: "https://example.com/family-art",
          registration: "https://example.com/family-art/register",
        },
      },
      null,
      2,
    ),
  );
  const [resolvedDraftJson, setResolvedDraftJson] = useState("{}");
  const [diagnosticsJson, setDiagnosticsJson] = useState("[]");
  const [evidenceSummaryJson, setEvidenceSummaryJson] = useState(
    JSON.stringify(
      {
        sourceCount: 1,
        sourceUrls: ["https://example.com/family-art"],
        scarcityReason: "Use for workflow-backed review packets and publish rehearsals.",
      },
      null,
      2,
    ),
  );
  const [mediaSummaryJson, setMediaSummaryJson] = useState(
    JSON.stringify(
      {
        uploadedUrl: "https://i.ibb.co/example-upload.jpg",
        sourceDocumentUrl: "https://example.com/family-art",
      },
      null,
      2,
    ),
  );
  const [mediaResultJson, setMediaResultJson] = useState(
    JSON.stringify(
      {
        status: "ready",
        uploadedUrl: "https://i.ibb.co/example-upload.jpg",
      },
      null,
      2,
    ),
  );
  const [workflowMetadataJson, setWorkflowMetadataJson] = useState(
    JSON.stringify(
      {
        checklistCompanyId: "",
        workflowRunId: "",
        candidateId: "",
        bridgeVersion: "v1",
      },
      null,
      2,
    ),
  );
  const [gateResultJson, setGateResultJson] = useState("{}");
  const [resultLogJson, setResultLogJson] = useState("{}");
  const [remediationRows, setRemediationRows] = useState<CatalogImageRemediationQueueItem[]>([]);
  const [draftId, setDraftId] = useState("draft-sample-1");
  const [entityKind, setEntityKind] = useState<"provider" | "meetupGroup">("provider");
  const [adapterVersion, setAdapterVersion] = useState("compare-range-adapter@v1");
  const [idempotencyKey, setIdempotencyKey] = useState("content-intelligence-sample-1");
  const [busy, setBusy] = useState(false);

  const loadImageRemediationQueue = useCallback(async () => {
    try {
      const response = await adminFetch("/api/admin/content-intelligence/image-remediation");
      const json = await response.json();
      if (!response.ok) throw new Error(json.error || "Image remediation load failed");
      setRemediationRows(Array.isArray(json) ? (json as CatalogImageRemediationQueueItem[]) : []);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Image remediation load failed");
    }
  }, []);

  const seedImageRemediationQueue = async () => {
    setBusy(true);
    try {
      const response = await adminFetch("/api/admin/content-intelligence/image-remediation/run", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "seed" }),
      });
      const json = await response.json();
      if (!response.ok) throw new Error(json.error || "Queue seed failed");
      await loadImageRemediationQueue();
      toast.success(`Seeded ${json.result?.totalQueued ?? 0} remediation items`);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Queue seed failed");
    } finally {
      setBusy(false);
    }
  };

  const runImageRemediationBatch = async () => {
    setBusy(true);
    try {
      const response = await adminFetch("/api/admin/content-intelligence/image-remediation/run", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "run", limit: 10 }),
      });
      const json = await response.json();
      if (!response.ok) throw new Error(json.error || "Remediation batch failed");
      await loadImageRemediationQueue();
      toast.success(
        `Batch processed ${json.result?.processed ?? 0} items, resolved ${json.result?.resolved ?? 0}`,
      );
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Remediation batch failed");
    } finally {
      setBusy(false);
    }
  };

  useEffect(() => {
    void loadImageRemediationQueue();
  }, [loadImageRemediationQueue]);

  const parseJson = <T,>(value: string, label: string): T | null => {
    try {
      return JSON.parse(value) as T;
    } catch (error) {
      toast.error(`${label} must be valid JSON`, {
        description: error instanceof Error ? error.message : "Invalid JSON",
      });
      return null;
    }
  };

  const runResolve = async () => {
    const payload = parseJson<Record<string, unknown>>(normalizedJson, "Normalized listing JSON");
    if (!payload) return;

    setBusy(true);
    try {
      const response = await adminFetch("/api/admin/content-intelligence/resolve-draft", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const json = await response.json();
      setResultLogJson(JSON.stringify(json, null, 2));
      if (!response.ok && !json.draft) throw new Error(json.error || "Resolve failed");
      if (json.draft) setResolvedDraftJson(JSON.stringify(json.draft, null, 2));
      if (json.diagnostics) setDiagnosticsJson(JSON.stringify(json.diagnostics, null, 2));
      if (json.entityKind === "provider" || json.entityKind === "meetupGroup") setEntityKind(json.entityKind);
      if (typeof json.adapterVersion === "string") setAdapterVersion(json.adapterVersion);
      toast.success("Resolved compare draft");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Resolve failed");
    } finally {
      setBusy(false);
    }
  };

  const runPublishGate = async () => {
    const draftPayload = parseJson<Record<string, unknown>>(resolvedDraftJson, "Resolved draft JSON");
    const mediaResult = parseJson<Record<string, unknown>>(mediaResultJson, "Media result JSON");
    if (!draftPayload || !mediaResult) return;

    setBusy(true);
    try {
      const response = await adminFetch("/api/admin/content-intelligence/publish-gate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          entityKind,
          draftPayload,
          adapterVersion,
          mediaResult,
        }),
      });
      const json = await response.json();
      setGateResultJson(JSON.stringify(json, null, 2));
      setResultLogJson(JSON.stringify(json, null, 2));
      if (!response.ok && !json.errors) throw new Error(json.error || "Publish gate failed");
      toast.success(json.approved ? "Publish gate approved draft" : "Publish gate returned review findings");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Publish gate failed");
    } finally {
      setBusy(false);
    }
  };

  const submitReviewPacket = async () => {
    const draftPayload = parseJson<Record<string, unknown>>(resolvedDraftJson, "Resolved draft JSON");
    const evidenceSummary = parseJson<Record<string, unknown>>(evidenceSummaryJson, "Evidence summary JSON");
    const diagnostics = parseJson<unknown>(diagnosticsJson, "Diagnostics JSON");
    const mediaSummary = parseJson<Record<string, unknown>>(mediaSummaryJson, "Media summary JSON");
    const workflowMetadata = parseJson<Record<string, unknown>>(workflowMetadataJson, "Workflow metadata JSON");
    const gateResult = parseJson<Record<string, unknown>>(gateResultJson, "Gate result JSON");
    if (!draftPayload || !evidenceSummary || !diagnostics || !mediaSummary || !workflowMetadata) return;

    setBusy(true);
    try {
      const response = await adminFetch("/api/admin/content-intelligence/review-packet", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          draftId,
          candidateId: workflowMetadata.candidateId,
          entityKind,
          adapterVersion,
          draftPayload,
          evidenceSummary,
          diagnostics: {
            issues: diagnostics,
          },
          mediaSummary,
          gateApproved: Boolean(gateResult?.approved),
          workflowMetadata,
        }),
      });
      const json = await response.json();
      setResultLogJson(JSON.stringify(json, null, 2));
      if (!response.ok) throw new Error(json.error || "Review packet submission failed");
      toast.success("Checklist review packet submitted");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Review packet submission failed");
    } finally {
      setBusy(false);
    }
  };

  const prepareReviewPacket = async () => {
    const normalizedListing = parseJson<Record<string, unknown>>(normalizedJson, "Normalized listing JSON");
    const evidenceSummary = parseJson<Record<string, unknown>>(evidenceSummaryJson, "Evidence summary JSON");
    const workflowMetadata = parseJson<Record<string, unknown>>(workflowMetadataJson, "Workflow metadata JSON");
    const mediaSummary = parseJson<Record<string, unknown>>(mediaSummaryJson, "Media summary JSON");
    if (!normalizedListing || !evidenceSummary || !workflowMetadata || !mediaSummary) return;

    setBusy(true);
    try {
      const uploadedUrl =
        typeof mediaSummary.uploadedUrl === "string" && mediaSummary.uploadedUrl.trim()
          ? mediaSummary.uploadedUrl.trim()
          : null;
      const sourceImageUrl =
        typeof mediaSummary.sourceImageUrl === "string" && mediaSummary.sourceImageUrl.trim()
          ? mediaSummary.sourceImageUrl.trim()
          : null;
      const sourceDocumentUrl =
        typeof mediaSummary.sourceDocumentUrl === "string" && mediaSummary.sourceDocumentUrl.trim()
          ? mediaSummary.sourceDocumentUrl.trim()
          : null;

      const normalizedWithMedia = {
        ...normalizedListing,
        imageCandidates: uploadedUrl
          ? [...(((normalizedListing.imageCandidates as Array<Record<string, unknown>> | undefined) ?? [])), { uploadedUrl }]
          : normalizedListing.imageCandidates,
      };

      const response = await adminFetch("/api/admin/content-intelligence/prepare-review", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          draftId,
          normalizedListing: normalizedWithMedia,
          evidenceSummary,
          workflowMetadata,
          mediaRequest:
            !uploadedUrl && sourceImageUrl && sourceDocumentUrl
              ? {
                  candidateId:
                    typeof workflowMetadata.candidateId === "string" && workflowMetadata.candidateId
                      ? workflowMetadata.candidateId
                      : draftId,
                  sourceImageUrl,
                  sourceDocumentUrl,
                  destinationEntityKind: entityKind,
                  requestedBy: "compare-admin",
                }
              : null,
        }),
      });
      const json = await response.json();
      setResultLogJson(JSON.stringify(json, null, 2));
      if (json.resolvedDraft?.draft) setResolvedDraftJson(JSON.stringify(json.resolvedDraft.draft, null, 2));
      if (json.resolvedDraft?.diagnostics) setDiagnosticsJson(JSON.stringify(json.resolvedDraft.diagnostics, null, 2));
      if (json.gateResult) setGateResultJson(JSON.stringify(json.gateResult, null, 2));
      if (json.mediaResult) setMediaResultJson(JSON.stringify(json.mediaResult, null, 2));
      await loadImageRemediationQueue();
      if (!response.ok && !json.resolvedDraft) throw new Error(json.error || "Prepare review failed");
      toast.success(
        json.status === "review_submitted"
          ? "Checklist review packet prepared and submitted"
          : json.status === "ready_without_review"
            ? "Draft prepared but review packet not submitted"
            : "Draft preparation found blocking issues",
      );
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Prepare review failed");
    } finally {
      setBusy(false);
    }
  };

  const publishDraft = async () => {
    const draftPayload = parseJson<Record<string, unknown>>(resolvedDraftJson, "Resolved draft JSON");
    const gateResult = parseJson<Record<string, unknown>>(gateResultJson, "Gate result JSON");
    const mediaResult = parseJson<Record<string, unknown>>(mediaResultJson, "Media result JSON");
    const workflowMetadata = parseJson<Record<string, unknown>>(workflowMetadataJson, "Workflow metadata JSON");
    if (!draftPayload || !gateResult || !mediaResult || !workflowMetadata) return;

    setBusy(true);
    try {
      const response = await adminFetch("/api/admin/content-intelligence/publish", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          draftId,
          entityKind,
          draftPayload,
          gateResult,
          mediaResult,
          idempotencyKey,
          workflowMetadata,
        }),
      });
      const json = await response.json();
      setResultLogJson(JSON.stringify(json, null, 2));
      if (!response.ok) throw new Error(json.error || "Publish failed");
      toast.success(json.status === "published" ? "Draft published" : "Draft publish needs follow-up");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Publish failed");
    } finally {
      setBusy(false);
    }
  };

  const updateRemediationStatus = async (
    queueId: string,
    status: CatalogImageRemediationQueueItem["status"],
    resolutionNotes?: string,
  ) => {
    setBusy(true);
    try {
      const response = await adminFetch("/api/admin/content-intelligence/image-remediation", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ queueId, status, resolutionNotes, resolved: status === "resolved" }),
      });
      const json = await response.json();
      if (!response.ok) throw new Error(json.error || "Remediation update failed");
      await loadImageRemediationQueue();
      toast.success(status === "resolved" ? "Remediation item resolved" : "Remediation item updated");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Remediation update failed");
    } finally {
      setBusy(false);
    }
  };

  const loadCatalogSnapshot = async () => {
    setBusy(true);
    try {
      const response = await adminFetch("/api/admin/catalog-intelligence/snapshot");
      const json = await response.json();
      setResultLogJson(JSON.stringify(json, null, 2));
      if (!response.ok) throw new Error(json.error || "Catalog snapshot failed");
      toast.success("Loaded catalog intelligence snapshot");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Catalog snapshot failed");
    } finally {
      setBusy(false);
    }
  };

  return (
    <PanelSection
      title="Content intelligence workflow controls"
      description="Run compare draft resolution, publish gating, Checklist review submission, and destination publish callbacks from one admin surface."
    >
      <Stack gap="md">
        <SimpleGrid cols={{ base: 1, sm: 2 }} spacing="md">
          <Field label="Draft id">
            <Input value={draftId} onChange={(event) => setDraftId(event.target.value)} />
          </Field>
          <Field label="Entity kind">
            <Input
              value={entityKind}
              onChange={(event) =>
                setEntityKind(event.target.value === "meetupGroup" ? "meetupGroup" : "provider")
              }
              aria-describedby="entity-kind-hint"
            />
          </Field>
          <Field label="Adapter version">
            <Input value={adapterVersion} onChange={(event) => setAdapterVersion(event.target.value)} />
          </Field>
          <Field label="Idempotency key">
            <Input value={idempotencyKey} onChange={(event) => setIdempotencyKey(event.target.value)} />
          </Field>
        </SimpleGrid>
        <Text id="entity-kind-hint" size="xs" c="dimmed">
          Use <Code>provider</Code> for classes, camps, birthday parties, and drop-in activities. Use <Code>meetupGroup</Code> for parent and family groups.
        </Text>
        <SimpleGrid cols={{ base: 1, lg: 2 }} spacing="md" verticalSpacing="md">
          <Field label="Normalized listing JSON">
            <Textarea value={normalizedJson} onChange={(event) => setNormalizedJson(event.target.value)} rows={18} styles={{ input: { fontFamily: "monospace", fontSize: 12 } }} />
          </Field>
          <Field label="Resolved draft JSON">
            <Textarea value={resolvedDraftJson} onChange={(event) => setResolvedDraftJson(event.target.value)} rows={18} styles={{ input: { fontFamily: "monospace", fontSize: 12 } }} />
          </Field>
          <Field label="Diagnostics JSON">
            <Textarea value={diagnosticsJson} onChange={(event) => setDiagnosticsJson(event.target.value)} rows={12} styles={{ input: { fontFamily: "monospace", fontSize: 12 } }} />
          </Field>
          <Field label="Gate result JSON">
            <Textarea value={gateResultJson} onChange={(event) => setGateResultJson(event.target.value)} rows={12} styles={{ input: { fontFamily: "monospace", fontSize: 12 } }} />
          </Field>
          <Field label="Evidence summary JSON">
            <Textarea value={evidenceSummaryJson} onChange={(event) => setEvidenceSummaryJson(event.target.value)} rows={10} styles={{ input: { fontFamily: "monospace", fontSize: 12 } }} />
          </Field>
          <Field label="Workflow metadata JSON">
            <Textarea value={workflowMetadataJson} onChange={(event) => setWorkflowMetadataJson(event.target.value)} rows={10} styles={{ input: { fontFamily: "monospace", fontSize: 12 } }} />
          </Field>
          <Field label="Media summary JSON">
            <Textarea value={mediaSummaryJson} onChange={(event) => setMediaSummaryJson(event.target.value)} rows={8} styles={{ input: { fontFamily: "monospace", fontSize: 12 } }} />
          </Field>
          <Field label="Media result JSON">
            <Textarea value={mediaResultJson} onChange={(event) => setMediaResultJson(event.target.value)} rows={8} styles={{ input: { fontFamily: "monospace", fontSize: 12 } }} />
          </Field>
        </SimpleGrid>
        <Group gap="sm" wrap="wrap">
          <Button variant="light" color="dark" onClick={loadCatalogSnapshot} disabled={busy}>
            Load catalog snapshot
          </Button>
          <Button color="dark" onClick={prepareReviewPacket} disabled={busy}>
            Prepare Checklist review packet
          </Button>
          <Button onClick={runResolve} disabled={busy}>
            Resolve draft
          </Button>
          <Button onClick={runPublishGate} disabled={busy}>
            Run publish gate
          </Button>
          <Button variant="light" color="dark" onClick={submitReviewPacket} disabled={busy}>
            Submit Checklist review packet
          </Button>
          <Button color="teal" onClick={publishDraft} disabled={busy}>
            Publish approved draft
          </Button>
        </Group>
        <Field label="Result log JSON">
          <Textarea value={resultLogJson} onChange={(event) => setResultLogJson(event.target.value)} rows={12} styles={{ input: { fontFamily: "monospace", fontSize: 12 } }} />
        </Field>
        <PanelSection
          title="Duplicate image remediation queue"
          description="Review newer listings that were blocked because the system could not automatically find a unique official image."
        >
          <Stack gap="sm">
            <Group justify="space-between" align="center">
              <Text size="sm" c="dimmed">
                {remediationRows.length ? `${remediationRows.length} queued or tracked remediation items` : "No queued remediation items"}
              </Text>
              <Group gap="sm">
                <Button variant="light" color="dark" onClick={loadImageRemediationQueue} disabled={busy}>
                  Refresh queue
                </Button>
                <Button variant="light" color="dark" onClick={seedImageRemediationQueue} disabled={busy}>
                  Seed historical duplicates
                </Button>
                <Button color="teal" onClick={runImageRemediationBatch} disabled={busy}>
                  Run remediation batch
                </Button>
              </Group>
            </Group>
            {remediationRows.length ? (
              <ResponsiveDataView
                data={remediationRows as unknown as Record<string, unknown>[]}
                columns={[
                  {
                    key: "remediation",
                    label: "Image remediation item",
                    render: (row) => (
                      <ImageRemediationRow
                        item={row as unknown as CatalogImageRemediationQueueItem}
                        disabled={busy}
                        onUpdateStatus={updateRemediationStatus}
                      />
                    ),
                  },
                ]}
                renderCard={(row) => (
                  <ImageRemediationRow
                    item={row as unknown as CatalogImageRemediationQueueItem}
                    disabled={busy}
                    onUpdateStatus={updateRemediationStatus}
                  />
                )}
                emptyTitle="No duplicate image remediation items"
                emptyDescription="Blocked duplicate-image cases will appear here when the automatic alternate-image retry cannot find a unique official source."
              />
            ) : (
              <StateBlock
                variant="empty"
                title="No duplicate image remediation items"
                description="Blocked duplicate-image cases will appear here when the automatic alternate-image retry cannot find a unique official source."
                compact
              />
            )}
          </Stack>
        </PanelSection>
      </Stack>
    </PanelSection>
  );
}

function ImageRemediationRow({
  item,
  disabled,
  onUpdateStatus,
}: {
  item: CatalogImageRemediationQueueItem;
  disabled: boolean;
  onUpdateStatus: (
    queueId: string,
    status: CatalogImageRemediationQueueItem["status"],
    resolutionNotes?: string,
  ) => Promise<void>;
}) {
  const [notes, setNotes] = useState(item.resolutionNotes ?? "");

  useEffect(() => {
    setNotes(item.resolutionNotes ?? "");
  }, [item.queueId, item.resolutionNotes]);

  return (
    <Paper withBorder p="md" radius="lg">
      <Stack gap="sm">
        <Group justify="space-between" align="flex-start" gap="sm" wrap="wrap">
          <Stack gap={2} style={{ flex: 1, minWidth: 220 }}>
            <Text size="sm" fw={600}>
              {item.entityKind} {item.entityId}
            </Text>
            <Text size="xs" c="dimmed">
              {item.duplicateKind} duplicate · status {item.status} · incumbent {item.incumbentEntityKind} {item.incumbentEntityId}
            </Text>
          </Stack>
          <Code>{item.queueId}</Code>
        </Group>
        <SimpleGrid cols={{ base: 1, md: 2 }} spacing="sm">
          <Box>
            <Text size="xs" c="dimmed">Stored image</Text>
            <Anchor href={item.uploadedUrl} target="_blank" rel="noreferrer" size="sm">
              {item.uploadedUrl}
            </Anchor>
          </Box>
          <Box>
            <Text size="xs" c="dimmed">Source image</Text>
            {item.sourceImageUrl ? (
              <Anchor href={item.sourceImageUrl} target="_blank" rel="noreferrer" size="sm">
                {item.sourceImageUrl}
              </Anchor>
            ) : (
              <Text size="sm">Unavailable</Text>
            )}
          </Box>
        </SimpleGrid>
        <Text size="sm">{item.duplicateReason}</Text>
        <Textarea
          label="Resolution notes"
          value={notes}
          onChange={(event) => setNotes(event.currentTarget.value)}
          rows={3}
        />
        <Group gap="sm" wrap="wrap">
          <Button
            size="xs"
            color="teal"
            disabled={disabled}
            onClick={() => onUpdateStatus(item.queueId, "resolved", notes)}
          >
            Mark resolved
          </Button>
          <Button
            size="xs"
            variant="light"
            color="dark"
            disabled={disabled}
            onClick={() => onUpdateStatus(item.queueId, "queued", notes)}
          >
            Return to queued
          </Button>
          <Button
            size="xs"
            variant="subtle"
            color="gray"
            disabled={disabled}
            onClick={() => onUpdateStatus(item.queueId, "blocked_no_unique_candidate", notes)}
          >
            Keep blocked
          </Button>
        </Group>
      </Stack>
    </Paper>
  );
}

function ProviderRow({
  p,
  disabled,
  onSaveImage,
  onSaveRecurringPrograms,
  onLaunchRevision,
  onRefreshRevisionStatus,
  revisionStatus,
}: {
  p: Provider;
  disabled: boolean;
  onSaveImage: (id: string, image: string) => void;
  onSaveRecurringPrograms: (id: string, recurringPrograms: RecurringProgram[]) => void;
  onLaunchRevision: (listingType: "provider" | "meetupGroup", listingId: string) => Promise<void>;
  onRefreshRevisionStatus: (listingType: "provider" | "meetupGroup", listingId: string) => Promise<void>;
  revisionStatus: string;
}) {
  const [img, setImg] = useState(p.image);
  const [programsDraft, setProgramsDraft] = useState(JSON.stringify(p.recurringPrograms ?? [], null, 2));
  const [programsOpen, setProgramsOpen] = useState(false);

  useEffect(() => {
    setImg(p.image);
    setProgramsDraft(JSON.stringify(p.recurringPrograms ?? [], null, 2));
  }, [p.image, p.recurringPrograms]);

  return (
    <Paper withBorder p="md" radius="lg">
      <Stack gap="sm">
      <Group justify="space-between" align="flex-end" gap="sm" wrap="wrap">
        <Stack gap={2} style={{ flex: 1, minWidth: 140 }}>
          <Text size="xs" fw={600}>{p.name}</Text>
          <Text size="10px" c="dimmed">
            {p.category} · {p.borough} · {p.id}
          </Text>
        </Stack>
        <Button size="xs" variant="light" color="dark" disabled={disabled} onClick={() => setProgramsOpen((v) => !v)}>
          {programsOpen ? "Hide recurring programs" : "Manage recurring programs"}
        </Button>
      </Group>
      <Group align="flex-end" gap="sm" wrap="wrap">
        <Input
          style={{ flex: 2, minWidth: 200 }}
          styles={{ input: { fontFamily: "monospace", fontSize: 12 } }}
          value={img}
          onChange={(e) => setImg(e.target.value)}
          placeholder="https://i.ibb.co/..."
        />
        <Button size="xs" disabled={disabled} onClick={() => onSaveImage(p.id, img)}>
          Save image
        </Button>
      </Group>
      {programsOpen && (
        <Paper bg="beige.0" p="sm" radius="lg">
          <Stack gap="sm">
          <Text size="xs" c="dimmed">
            JSON array of recurring programs. Supported fields: <Code>id</Code>, <Code>title</Code>, <Code>cadence</Code>, <Code>daysOfWeek</Code>, <Code>timeText</Code>, optional <Code>summary</Code>, <Code>priceText</Code>, <Code>registrationUrl</Code>, <Code>startDate</Code>, <Code>endDate</Code>, <Code>locationNote</Code>, <Code>ageRanges</Code>, <Code>activityTypes</Code>, <Code>isDropIn</Code>.
          </Text>
          <Textarea
            rows={10}
            styles={{ input: { fontFamily: "monospace", fontSize: 12 } }}
            value={programsDraft}
            onChange={(e) => setProgramsDraft(e.target.value)}
            placeholder='[{"id":"sat-storytime","title":"Saturday Storytime","cadence":"Weekly","daysOfWeek":["Saturday"],"timeText":"10:30 AM - 11:15 AM"}]'
          />
          <Group gap="sm">
            <Button
              size="xs"
              disabled={disabled}
              onClick={() => {
                try {
                  const parsed = JSON.parse(programsDraft) as RecurringProgram[];
                  if (!Array.isArray(parsed)) throw new Error("Recurring programs must be a JSON array");
                  onSaveRecurringPrograms(p.id, parsed);
                } catch (error) {
                  toast.error(error instanceof Error ? error.message : "Invalid recurring programs JSON");
                }
              }}
            >
              Save recurring programs
            </Button>
            <Button size="xs" variant="light" color="dark" disabled={disabled} onClick={() => setProgramsDraft(JSON.stringify(p.recurringPrograms ?? [], null, 2))}>
              Reset
            </Button>
          </Group>
          </Stack>
        </Paper>
      )}
      <Paper bg="beige.0" p="sm" radius="lg">
        <Stack gap="xs">
          <Group justify="space-between" align="center" gap="sm" wrap="wrap">
            <Text size="xs" fw={600}>Checklist revision workflow</Text>
            <Text size="10px" c="dimmed">
              {revisionStatus || "No revision packet loaded"}
            </Text>
          </Group>
          <Group gap="sm" wrap="wrap">
            <Button size="xs" variant="light" color="dark" disabled={disabled} onClick={() => void onRefreshRevisionStatus("provider", p.id)}>
              Refresh revision status
            </Button>
            <Button size="xs" color="dark" disabled={disabled} onClick={() => void onLaunchRevision("provider", p.id)}>
              Create revision packet
            </Button>
          </Group>
        </Stack>
      </Paper>
      </Stack>
    </Paper>
  );
}

function MeetupRow({
  g,
  disabled,
  onSave,
  onLaunchRevision,
  onRefreshRevisionStatus,
  revisionStatus,
}: {
  g: MeetupGroup;
  disabled: boolean;
  onSave: (id: string, url: string) => void;
  onLaunchRevision: (listingType: "provider" | "meetupGroup", listingId: string) => Promise<void>;
  onRefreshRevisionStatus: (listingType: "provider" | "meetupGroup", listingId: string) => Promise<void>;
  revisionStatus: string;
}) {
  const [url, setUrl] = useState(g.coverImageUrl ?? "");
  return (
    <Paper withBorder p="sm" radius="lg">
      <Stack gap="sm">
        <Group align="flex-end" gap="sm" wrap="wrap">
          <Stack gap={2} style={{ flex: 1, minWidth: 160 }}>
            <Text size="xs" fw={600}>{g.name}</Text>
            <Text size="10px" c="dimmed">{g.id}</Text>
          </Stack>
          <Input
            style={{ flex: 2, minWidth: 200 }}
            styles={{ input: { fontFamily: "monospace", fontSize: 12 } }}
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="Cover image URL"
          />
          <Button size="xs" disabled={disabled} onClick={() => onSave(g.id, url)}>
            Save
          </Button>
        </Group>
        <Paper bg="beige.0" p="sm" radius="lg">
          <Stack gap="xs">
            <Group justify="space-between" align="center" gap="sm" wrap="wrap">
              <Text size="xs" fw={600}>Checklist revision workflow</Text>
              <Text size="10px" c="dimmed">
                {revisionStatus || "No revision packet loaded"}
              </Text>
            </Group>
            <Group gap="sm" wrap="wrap">
              <Button size="xs" variant="light" color="dark" disabled={disabled} onClick={() => void onRefreshRevisionStatus("meetupGroup", g.id)}>
                Refresh revision status
              </Button>
              <Button size="xs" color="dark" disabled={disabled} onClick={() => void onLaunchRevision("meetupGroup", g.id)}>
                Create revision packet
              </Button>
            </Group>
          </Stack>
        </Paper>
      </Stack>
    </Paper>
  );
}
