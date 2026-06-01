"use client";

import {
  Alert,
  Accordion,
  Button,
  Card,
  Container,
  Divider,
  FileButton,
  Group,
  Image,
  Paper,
  PasswordInput,
  SimpleGrid,
  Stack,
  Text,
  TextInput,
  Title,
} from "@mantine/core";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "@/lib/notify";
import { BOROUGHS, NEIGHBORHOODS } from "@/data/locations";
import type { BoroughChoice, Category } from "@/types/provider";
import type { SiteDoc, SiteGuide, SiteLocationHeroImage } from "@/types/site";

type AuthState = "loading" | "authorized" | "unauthorized";

type ImageSiteState = Pick<
  SiteDoc,
  "logoUrl" | "homeHeroUrl" | "discoverHeroUrl" | "guides" | "locationHeroImages"
>;

const CATEGORY_VIEWS: Array<Category | "Meet-Up Groups"> = [
  "Classes",
  "Camps",
  "Competitions",
  "Drop-In Activities",
  "Meet-Up Groups",
];

type EditableLocationHeroSlot = SiteLocationHeroImage & {
  key: string;
  title: string;
};

async function adminFetch(input: RequestInfo, init?: RequestInit) {
  return fetch(input, { ...init, credentials: "include" });
}

function normalizeSiteState(site: Partial<SiteDoc>): ImageSiteState {
  return {
    logoUrl: site.logoUrl ?? "",
    homeHeroUrl: site.homeHeroUrl ?? "",
    discoverHeroUrl: site.discoverHeroUrl ?? "",
    guides: Array.isArray(site.guides) ? site.guides : [],
    locationHeroImages: Array.isArray(site.locationHeroImages) ? site.locationHeroImages : [],
  };
}

function previewable(url: string): boolean {
  return /^https?:\/\//i.test(url.trim());
}

function normalize(value: string | undefined): string {
  return (value ?? "").trim().toLowerCase();
}

function slotKey(view: SiteLocationHeroImage["view"], borough: BoroughChoice, neighborhood = ""): string {
  return `${view}__${borough}__${normalize(neighborhood)}`;
}

function defaultAlt(view: SiteLocationHeroImage["view"], borough: BoroughChoice, neighborhood = ""): string {
  if (neighborhood.trim()) return `${view} in ${neighborhood}`;
  if (borough === "All") return `${view} in Hungary`;
  return `${view} in ${borough}`;
}

function slotTitle(view: SiteLocationHeroImage["view"], borough: BoroughChoice, neighborhood = ""): string {
  if (neighborhood.trim()) return `${view} in ${neighborhood}`;
  if (borough === "All") return `${view} in Hungary`;
  return `${view} in ${borough}`;
}

function buildLocationHeroSlots(existing: SiteLocationHeroImage[]): EditableLocationHeroSlot[] {
  const byKey = new Map(existing.map((item) => [slotKey(item.view, item.borough, item.neighborhood), item]));
  const slots: EditableLocationHeroSlot[] = [];

  for (const view of CATEGORY_VIEWS) {
    const globalKey = slotKey(view, "All", "");
    const globalExisting = byKey.get(globalKey);
    slots.push({
      key: globalKey,
      view,
      borough: "All",
      neighborhood: "",
      imageUrl: globalExisting?.imageUrl ?? "",
      alt: globalExisting?.alt ?? defaultAlt(view, "All", ""),
      title: slotTitle(view, "All", ""),
    });

    for (const borough of BOROUGHS) {
      const boroughKey = slotKey(view, borough, "");
      const boroughExisting = byKey.get(boroughKey);
      slots.push({
        key: boroughKey,
        view,
        borough,
        neighborhood: "",
        imageUrl: boroughExisting?.imageUrl ?? "",
        alt: boroughExisting?.alt ?? defaultAlt(view, borough, ""),
        title: slotTitle(view, borough, ""),
      });

      for (const neighborhood of NEIGHBORHOODS[borough]) {
        const key = slotKey(view, borough, neighborhood);
        const existingItem = byKey.get(key);
        slots.push({
          key,
          view,
          borough,
          neighborhood,
          imageUrl: existingItem?.imageUrl ?? "",
          alt: existingItem?.alt ?? defaultAlt(view, borough, neighborhood),
          title: slotTitle(view, borough, neighborhood),
        });
      }
    }
  }

  return slots;
}

export default function ImageCmsPage() {
  const router = useRouter();
  const [auth, setAuth] = useState<AuthState>("loading");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [saveState, setSaveState] = useState<"idle" | "saving" | "saved" | "error">("idle");
  const [site, setSite] = useState<ImageSiteState | null>(null);
  const [locationHeroSlots, setLocationHeroSlots] = useState<EditableLocationHeroSlot[]>([]);
  const hydratedRef = useRef(false);
  const saveTimerRef = useRef<number | null>(null);

  const load = async () => {
    const res = await adminFetch("/api/admin/site");
    if (res.status === 401) {
      setAuth("unauthorized");
      return;
    }
    if (!res.ok) {
      toast.error("Failed to load image CMS data");
      setAuth("authorized");
      return;
    }
    const data = (await res.json()) as SiteDoc;
    setSite(normalizeSiteState(data));
    setLocationHeroSlots(buildLocationHeroSlots(Array.isArray(data.locationHeroImages) ? data.locationHeroImages : []));
    hydratedRef.current = false;
    setAuth("authorized");
  };

  useEffect(() => {
    void load();
  }, []);

  const configuredCount = useMemo(() => {
    if (!site) return 0;
    const globals = [site.logoUrl, site.homeHeroUrl, site.discoverHeroUrl].filter((v) => v.trim()).length;
    const guides = site.guides.filter((g) => g.imageUrl.trim()).length;
    const locations = locationHeroSlots.filter((g) => g.imageUrl.trim()).length;
    return globals + guides + locations;
  }, [site, locationHeroSlots]);

  const signIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    try {
      const res = await fetch("/api/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });
      const body = (await res.json().catch(() => ({}))) as { error?: string };
      if (!res.ok) {
        toast.error(body.error || "Login failed");
        return;
      }
      setPassword("");
      setAuth("loading");
      await load();
      toast.success("Signed in");
    } finally {
      setBusy(false);
    }
  };

  const persist = useCallback(async (nextSite: ImageSiteState, nextLocationHeroSlots: EditableLocationHeroSlot[], silent = false) => {
    setBusy(true);
    setSaveState("saving");
    try {
      const payload: Partial<Omit<SiteDoc, "_id">> = {
        logoUrl: nextSite.logoUrl,
        homeHeroUrl: nextSite.homeHeroUrl,
        discoverHeroUrl: nextSite.discoverHeroUrl,
        guides: nextSite.guides,
        locationHeroImages: nextLocationHeroSlots
          .filter((item) => item.imageUrl.trim())
          .map((item) => ({
            view: item.view,
            borough: item.borough,
            neighborhood: item.neighborhood?.trim() || "",
            imageUrl: item.imageUrl.trim(),
            alt: item.alt?.trim() || defaultAlt(item.view, item.borough, item.neighborhood || ""),
          })),
      };
      const res = await adminFetch("/api/admin/site", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const body = (await res.json().catch(() => ({}))) as { error?: string };
      if (!res.ok) {
        toast.error(body.error || "Save failed");
        setSaveState("error");
        return;
      }
      if (!silent) toast.success("Saved");
      setSaveState("saved");
      router.refresh();
    } finally {
      setBusy(false);
    }
  }, [router]);

  useEffect(() => {
    if (auth !== "authorized" || !site) return;
    if (!hydratedRef.current) {
      hydratedRef.current = true;
      return;
    }
    if (saveTimerRef.current) window.clearTimeout(saveTimerRef.current);
    saveTimerRef.current = window.setTimeout(() => {
      void persist(site, locationHeroSlots, true);
    }, 500);
    return () => {
      if (saveTimerRef.current) {
        window.clearTimeout(saveTimerRef.current);
        saveTimerRef.current = null;
      }
    };
  }, [auth, site, locationHeroSlots, persist]);

  const upload = async (file: File | null, apply: (url: string) => void) => {
    if (!file) return;
    setBusy(true);
    try {
      const fd = new FormData();
      fd.append("file", file);
      const res = await adminFetch("/api/admin/upload", { method: "POST", body: fd });
      const body = (await res.json().catch(() => ({}))) as { error?: string; url?: string };
      if (!res.ok || !body.url) {
        toast.error(body.error || "Upload failed");
        return;
      }
      apply(body.url);
      toast.success("Image uploaded");
    } finally {
      setBusy(false);
    }
  };

  const updateGuide = (index: number, patch: Partial<SiteGuide>) => {
    setSite((current) =>
      current
        ? {
            ...current,
            guides: current.guides.map((guide, i) => (i === index ? { ...guide, ...patch } : guide)),
          }
        : current,
    );
  };

  const updateLocationHeroSlot = (key: string, patch: Partial<EditableLocationHeroSlot>) => {
    setLocationHeroSlots((current) =>
      current.map((item) => (item.key === key ? { ...item, ...patch } : item)),
    );
  };

  const groupedLocationHeroSlots = useMemo(() => {
    return CATEGORY_VIEWS.map((view) => ({
      view,
      items: locationHeroSlots.filter((item) => item.view === view),
    }));
  }, [locationHeroSlots]);

  const clearLocationHeroImage = (key: string) => {
    setLocationHeroSlots((current) =>
      current.map((item) => (item.key === key ? { ...item, imageUrl: "" } : item)),
    );
  };

  const uploadLocationHeroImage = async (key: string, file: File | null) => {
    await upload(file, (url) => updateLocationHeroSlot(key, { imageUrl: url }));
  };

  const uploadGuideImage = async (index: number, file: File | null) => {
    await upload(file, (url) => updateGuide(index, { imageUrl: url }));
  };

  const uploadGlobalImage = async (field: "logoUrl" | "homeHeroUrl" | "discoverHeroUrl", file: File | null) => {
    await upload(file, (url) =>
      setSite((current) => (current ? { ...current, [field]: url } : current)),
    );
  };

  if (auth === "loading") {
    return (
      <Container size="md" py="xl">
        <Text>Loading image CMS…</Text>
      </Container>
    );
  }

  if (auth === "unauthorized") {
    return (
      <Container size="xs" py="xl">
        <Paper withBorder radius="xl" p="xl" mt="xl">
          <form onSubmit={signIn}>
            <Stack gap="md">
              <Title order={1} size="h3">
                Compare Image CMS
              </Title>
              <Text size="sm" c="dimmed">
                Sign in with the admin password to edit site imagery.
              </Text>
              <PasswordInput
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.currentTarget.value)}
                placeholder="Password"
              />
              <Button type="submit" disabled={!password || busy} loading={busy}>
                Sign in
              </Button>
            </Stack>
          </form>
        </Paper>
      </Container>
    );
  }

  if (!site) {
    return (
      <Container size="md" py="xl">
        <Alert color="red" title="Image CMS unavailable">
          Failed to load the site image document.
        </Alert>
      </Container>
    );
  }

  return (
    <Container size="xl" py="xl">
      <Stack gap="lg">
        <Group justify="space-between" align="end">
          <div>
            <Title order={1}>Image CMS</Title>
            <Text c="dimmed" size="sm">
              Edit site imagery only. Uploads go to ImgBB and save automatically into the live site document.
            </Text>
          </div>
          <Group>
            <Button component={Link} href="/" variant="subtle">
              View site
            </Button>
            <Text size="sm" c={saveState === "error" ? "red.6" : "dimmed"}>
              {saveState === "saving"
                ? "Saving..."
                : saveState === "saved"
                  ? "Saved"
                  : saveState === "error"
                    ? "Save failed"
                    : "Autosave on"}
            </Text>
          </Group>
        </Group>

        <Alert color="blue" title="Configured image slots">
          {configuredCount} image URLs currently configured across globals, guides, and location heroes.
        </Alert>

        <Paper withBorder radius="xl" p="xl">
          <Stack gap="md">
            <Title order={2} size="h4">
              Global images
            </Title>
            <SimpleGrid cols={{ base: 1, md: 3 }} spacing="lg">
              {[
                { key: "logoUrl", label: "Logo", value: site.logoUrl },
                { key: "homeHeroUrl", label: "Home hero", value: site.homeHeroUrl },
                { key: "discoverHeroUrl", label: "Discover hero", value: site.discoverHeroUrl },
              ].map((item) => (
                <Card key={item.key} withBorder radius="lg" p="md">
                  <Stack gap="sm">
                    <Text fw={600}>{item.label}</Text>
                    {previewable(item.value) ? (
                      <Image src={item.value} alt={item.label} radius="md" h={160} fit="cover" />
                    ) : (
                      <Paper withBorder radius="md" p="md">
                        <Text size="sm" c="dimmed">
                          No image configured
                        </Text>
                      </Paper>
                    )}
                    <TextInput
                      value={item.value}
                      onChange={(e) =>
                        setSite((current) =>
                          current
                            ? {
                                ...current,
                                [item.key]: e.currentTarget.value,
                              }
                            : current,
                        )
                      }
                      placeholder="https://i.ibb.co/..."
                    />
                    <FileButton onChange={(file) => uploadGlobalImage(item.key as "logoUrl" | "homeHeroUrl" | "discoverHeroUrl", file)} accept="image/png,image/jpeg,image/webp">
                      {(props) => <Button variant="light" {...props}>Upload to ImgBB</Button>}
                    </FileButton>
                  </Stack>
                </Card>
              ))}
            </SimpleGrid>
          </Stack>
        </Paper>

        <Paper withBorder radius="xl" p="xl">
          <Stack gap="md">
            <Title order={2} size="h4">
              Guide images
            </Title>
            <SimpleGrid cols={{ base: 1, md: 2 }} spacing="lg">
              {site.guides.map((guide, index) => (
                <Card key={guide.id ?? `${guide.borough}-${guide.neighborhood}-${index}`} withBorder radius="lg" p="md">
                  <Stack gap="sm">
                    <div>
                      <Text fw={600}>{guide.title}</Text>
                      <Text size="sm" c="dimmed">
                        {guide.neighborhood}, {guide.borough}
                      </Text>
                    </div>
                    {previewable(guide.imageUrl) ? (
                      <Image src={guide.imageUrl} alt={guide.title} radius="md" h={180} fit="cover" />
                    ) : (
                      <Paper withBorder radius="md" p="md">
                        <Text size="sm" c="dimmed">
                          No image configured
                        </Text>
                      </Paper>
                    )}
                    <TextInput
                      label="Image URL"
                      value={guide.imageUrl}
                      onChange={(e) => updateGuide(index, { imageUrl: e.currentTarget.value })}
                      placeholder="https://i.ibb.co/..."
                    />
                    <FileButton onChange={(file) => uploadGuideImage(index, file)} accept="image/png,image/jpeg,image/webp">
                      {(props) => <Button variant="light" {...props}>Upload guide image</Button>}
                    </FileButton>
                  </Stack>
                </Card>
              ))}
            </SimpleGrid>
          </Stack>
        </Paper>

        <Paper withBorder radius="xl" p="xl">
          <Stack gap="md">
            <Title order={2} size="h4">
              Location hero images
            </Title>
            <Text size="sm" c="dimmed">
              Every possible page/place slot is listed here. Upload the exact photo for each context you care about.
            </Text>
            <Accordion multiple defaultValue={CATEGORY_VIEWS}>
              {groupedLocationHeroSlots.map((group) => (
                <Accordion.Item key={group.view} value={group.view}>
                  <Accordion.Control>
                    <Group justify="space-between" wrap="nowrap">
                      <Text fw={600}>{group.view}</Text>
                      <Text size="sm" c="dimmed">
                        {group.items.filter((item) => item.imageUrl.trim()).length}/{group.items.length} configured
                      </Text>
                    </Group>
                  </Accordion.Control>
                  <Accordion.Panel>
                    <SimpleGrid cols={{ base: 1, md: 2 }} spacing="lg">
                      {group.items.map((item) => (
                        <Card key={item.key} withBorder radius="lg" p="md">
                          <Stack gap="sm">
                            <div>
                              <Text fw={600}>{item.title}</Text>
                              <Text size="sm" c="dimmed">
                                {item.neighborhood?.trim()
                                  ? `${item.neighborhood}, ${item.borough}`
                                  : item.borough === "All"
                                    ? "All Europe"
                                    : item.borough}
                              </Text>
                            </div>
                            {previewable(item.imageUrl) ? (
                              <Image src={item.imageUrl} alt={item.alt || item.title} radius="md" h={200} fit="cover" />
                            ) : (
                              <Paper withBorder radius="md" p="md">
                                <Text size="sm" c="dimmed">
                                  No image configured
                                </Text>
                              </Paper>
                            )}
                            <TextInput
                              label="Image URL"
                              value={item.imageUrl}
                              onChange={(e) => updateLocationHeroSlot(item.key, { imageUrl: e.currentTarget.value })}
                              placeholder="https://i.ibb.co/..."
                            />
                            <TextInput
                              label="Alt text"
                              value={item.alt ?? ""}
                              onChange={(e) => updateLocationHeroSlot(item.key, { alt: e.currentTarget.value })}
                              placeholder={defaultAlt(item.view, item.borough, item.neighborhood || "")}
                            />
                            <Group>
                              <FileButton onChange={(file) => uploadLocationHeroImage(item.key, file)} accept="image/png,image/jpeg,image/webp">
                                {(props) => <Button variant="light" {...props}>Upload image</Button>}
                              </FileButton>
                              <Button variant="subtle" color="red" onClick={() => clearLocationHeroImage(item.key)}>
                                Clear
                              </Button>
                            </Group>
                          </Stack>
                        </Card>
                      ))}
                    </SimpleGrid>
                  </Accordion.Panel>
                </Accordion.Item>
              ))}
            </Accordion>
          </Stack>
        </Paper>

        <Divider />
        <Text size="xs" c="dimmed">
          This editor only manages site-level imagery. It does not touch provider/event catalog images.
        </Text>
      </Stack>
    </Container>
  );
}
