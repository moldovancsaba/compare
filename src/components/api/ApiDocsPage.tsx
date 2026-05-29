import type { ReactNode } from "react";
import Link from "next/link";
import {
  Anchor,
  Badge,
  Box,
  Button,
  Code,
  Divider,
  Group,
  List,
  Paper,
  ScrollArea,
  Stack,
  Table,
  Text,
  Title,
} from "@mantine/core";
import { DocsPageShell } from "@doneisbetter/gds-core/server";

function CodeBlock({ title, children }: { title?: string; children: string }) {
  return (
    <Stack gap="xs" my="md">
      {title ? (
        <Text size="xs" fw={500} c="dimmed">
          {title}
        </Text>
      ) : null}
      <Paper withBorder p={0} radius="xl">
        <ScrollArea.Autosize mah={520} type="auto">
          <Box component="pre" m={0} p="md" fz="13px" lh={1.6} style={{ whiteSpace: "pre" }}>
            <Code bg="transparent" c="inherit" fz="13px">
              {children}
            </Code>
          </Box>
        </ScrollArea.Autosize>
      </Paper>
    </Stack>
  );
}

function InlineCode({ children }: { children: ReactNode }) {
  return (
    <Code
      bg="var(--mantine-color-gray-1)"
      c="inherit"
      fz="0.92em"
      style={{ borderRadius: 6, paddingInline: 6, paddingBlock: 2 }}
    >
      {children}
    </Code>
  );
}

function MutedParagraph({ children }: { children: ReactNode }) {
  return (
    <Text component="p" size="sm" c="dimmed">
      {children}
    </Text>
  );
}

function BulletList({ children, size = "md" }: { children: ReactNode; size?: "sm" | "md" }) {
  return (
    <List withPadding spacing="xs" size={size}>
      {children}
    </List>
  );
}

function Section({
  id,
  title,
  children,
}: {
  id: string;
  title: string;
  children: ReactNode;
}) {
  return (
    <Stack id={id} gap="lg" py="3.5rem" style={{ scrollMarginTop: 96 }}>
      <Title order={2}>{title}</Title>
      <Stack gap="md" fz="15px" lh={1.75}>
        {children}
      </Stack>
      <Divider />
    </Stack>
  );
}

function EndpointCard({
  method,
  path,
  auth,
  children,
}: {
  method: "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
  path: string;
  auth: string;
  children: ReactNode;
}) {
  const methodColor =
    method === "GET"
      ? "green"
      : method === "POST"
        ? "blue"
        : method === "PUT"
          ? "yellow"
          : method === "PATCH"
            ? "violet"
            : "red";
  return (
    <Paper withBorder p="lg" radius="xl">
      <Group gap="sm" align="center" wrap="wrap">
        <Badge color={methodColor} variant="light" radius="md">
          {method}
        </Badge>
        <Code>{path}</Code>
      </Group>
      <Text size="xs" c="dimmed" mt="xs">
        <Text span fw={600} c="dark.6">
          Auth:
        </Text>{" "}
        {auth}
      </Text>
      <Stack gap="sm" mt="md" fz="sm" lh={1.7}>
        {children}
      </Stack>
    </Paper>
  );
}

const PROVIDER_FIELDS = `interface Provider {
  id: string;
  name: string;
  category: "Classes" | "Camps" | "Birthday Parties" | "Drop-In Activities";
  borough: "Germany" | "France" | "Spain" | "Italy" | "Poland";
  neighborhood: string;
  address: string;
  activityTypes: string[];
  ageRanges: ("0–2" | "3–5" | "6–8" | "9–12" | "Teens")[];
  dayTimeTags: ("Weekday" | "Weekend" | "Morning" | "Afternoon" | "Evening" | "After-school")[];
  pricePerClass: number;
  shortDescription: string;
  longDescription: string;
  rating: number;
  reviewCount: number;
  badges: ("Featured" | "Popular" | "New" | "Staff Pick" | "Great for Toddlers" | "Weekend Friendly")[];
  image: string;
  email: string;
  website: string;
  phone: string;
  announcementTitle?: string;
  announcementDescription?: string;
  announcementBadge?: string;
  galleryImages?: string[];
  recurringPrograms?: RecurringProgram[];
  scheduledInstances?: ScheduledInstance[];
  publishedAt?: string; // ISO-8601 UTC
  updatedAt?: string;   // ISO-8601 UTC
  nextOccurrence?: UpcomingOccurrence | null; // computed on public reads
  bookingEnabled?: boolean;
}

interface ScheduledInstance {
  id: string;
  title: string;
  startDate: string; // YYYY-MM-DD
  endDate?: string;  // YYYY-MM-DD
  startTime?: string; // HH:MM
  endTime?: string;   // HH:MM
  timeText?: string;
  locationNote?: string;
  ageRanges?: ("0–2" | "3–5" | "6–8" | "9–12" | "Teens")[];
  activityTypes?: string[];
  summary?: string;
  priceText?: string;
  registrationUrl?: string;
  isDropIn?: boolean;
}

interface UpcomingOccurrence {
  id: string;
  source: "scheduled-instance" | "recurring-program";
  title: string;
  startDate: string;
  endDate?: string;
  startTime?: string;
  endTime?: string;
  timeText?: string;
  weekday: "Monday" | "Tuesday" | "Wednesday" | "Thursday" | "Friday" | "Saturday" | "Sunday";
}

interface RecurringProgram {
  id: string;
  title: string;
  cadence: "Daily" | "Weekdays" | "Weekends" | "Weekly" | "Biweekly" | "Monthly" | "Seasonal" | "Custom";
  daysOfWeek: ("Monday" | "Tuesday" | "Wednesday" | "Thursday" | "Friday" | "Saturday" | "Sunday")[];
  timeText: string;
  locationNote?: string;
  ageRanges?: ("0–2" | "3–5" | "6–8" | "9–12" | "Teens")[];
  activityTypes?: string[];
  summary?: string;
  priceText?: string;
  registrationUrl?: string;
  startDate?: string; // YYYY-MM-DD
  endDate?: string;   // YYYY-MM-DD
  isDropIn?: boolean;
}`;

const MEETUP_FIELDS = `interface MeetupGroup {
  id: string;
  name: string;
  borough: Borough;
  neighborhood: string;
  groupType: "Parent Meetup" | "Mom Group" | "Playdate Group" | "New Parents" | "Neighborhood Families";
  ageRange: "0–2" | "0–3" | "0–5" | "0–6" | "2–5" | "2–8" | "3–5" | "All ages";
  cadence: "Weekly" | "Monthly" | "Weekend" | "Pop-up";
  instagram: string;
  website: string;
  description: string;
  initials: string;
  icon: "stroller" | "skyline" | "heart" | "coffee" | "playground" | "community";
  palette: "teal" | "orange" | "beige" | "charcoal";
  coverImageUrl?: string;
}`;

const SITE_DOC = `interface SiteDoc {
  _id: "main";
  logoUrl: string;
  homeHeroUrl: string;
  discoverHeroUrl: string;
  homeHeroTitle: string;
  homeHeroSubtitle: string;
  homeHeroPrimaryCta: string;
  homeHeroSecondaryCta: string;
  homeHeroTagline: string;
  homeCategoriesTitle: string;
  neighborhoodSectionTitle: string;
  /** Use "{borough}" as a placeholder for the selected borough name. */
  popularNeighborhoodsCaption: string;
  guidesSectionTitle: string;
  guidesViewAllLabel: string;
  guidesViewAllHref?: string;
  guides: SiteGuide[];
  howItWorksSectionTitle: string;
  howItWorksSteps: SiteHowStep[];
  trustPillars: SiteTrustPillar[];
  trustLines: string[];
  popularPicksSectionTitle: string;
  popularPicksViewAllLabel: string;
  newsletterTitle: string;
  newsletterSubtitle: string;
  newsletterPlaceholder: string;
  newsletterCta: string;
  newsletterFinePrint: string;
  sidebarTitle: string;
  sidebarBody: string;
  sidebarCtaLabel: string;
  homePopularPickProviderNames: string[];
  homePopularMeetupGroupId: string;
  calculator: SiteCalculatorCopy;
  account: SiteAccountSettings;
}

interface SiteCalculatorCopy {
  title: string;
  subtitle: string;
  clearAllCta: string;
  emptyTitle: string;
  emptyMessage: string;
  asideTitle: string;
  asideSubtitle: string;
  asideFootnote: string;
  providerLinePriceSuffix: string;
  estimatedTotalLabel: string;
}

/** My Account, family prefs, neighborhood preview, alerts — full shape in \`src/types/site.ts\`. */
interface SiteAccountSettings {
  page: { title: string; subtitle: string };
  navTabs: { id: string; label: string }[];
  saved: { tabId: string; title: string; filterChips: { label: string; categoryFilter: string }[]; /* … */ };
  activityPlan: { tabId: string; title: string; priceUnits: { class: string; week: string; party: string; visit: string }; /* … */ };
  familyPreferences: { tabId: string; sections: { id: string; label: string; options: string[]; defaultSelected: string[] }[]; /* … */ };
  neighborhood: { tabId: string; title: string; nearbyNeighborhoods: string[]; /* … */ };
  alerts: { tabId: string; options: string[]; frequencyChoices: string[]; /* … */ };
  privacy: { headline: string; supportEmail: string; /* … */ };
}

type SiteTone = "orange" | "teal" | "pink" | "amber" | "blue";
type SiteIconKey =
  | "map-pin" | "list-checks" | "heart" | "shield-check" | "compass" | "users" | "calculator";

interface SiteGuide {
  id?: string;
  title: string;
  desc: string;
  borough: Borough;
  neighborhood: string;
  imageUrl: string;
  tone: SiteTone;
  ctaLabel?: string;
  ctaHref?: string;
}

interface SiteHowStep {
  step: number;
  title: string;
  desc: string;
  tone: SiteTone;
  icon: SiteIconKey;
}

interface SiteTrustPillar {
  title: string;
  desc: string;
  tone: SiteTone;
  icon: SiteIconKey;
}`;

const INGEST_BATCH = `{
  "operations": [
    { "resource": "providers", "action": "list" },
    { "resource": "provider", "action": "get", "id": "my-studio" },
    { "resource": "site", "action": "get" },
    { "resource": "locations", "action": "list" },
    {
      "resource": "provider",
      "action": "upsert",
      "document": { "id": "my-studio", "...": "full Provider fields" }
    },
    {
      "resource": "providers",
      "action": "replaceAll",
      "documents": [{ "id": "a", "name": "..." }]
    },
    { "resource": "providers", "action": "deleteMany", "ids": ["legacy-1", "legacy-2"] },
    {
      "resource": "site",
      "action": "put",
      "document": { "logoUrl": "https://...", "...": "full SiteDoc fields" }
    },
    {
      "resource": "locations",
      "action": "replace",
      "locations": [
        { "borough": "France", "neighborhoods": ["Brittany"] }
      ]
    }
  ]
}`;

const INGEST_SINGLE = `{
  "resource": "provider",
  "action": "upsert",
  "document": { "id": "solo-provider", "name": "Example", "...": "remaining Provider fields" }
}`;

const INGEST_OPERATION_VARIANTS = `// Single-document provider operations
{ "resource": "provider", "action": "get", "id": "prov-example" }
{ "resource": "provider", "action": "upsert", "document": { "id": "prov-example", "...": "full Provider" } }
{ "resource": "provider", "action": "patch", "id": "prov-example", "patch": { "announcementBadge": "Updated" } }
{ "resource": "provider", "action": "delete", "id": "prov-example" }

// Bulk provider operations
{ "resource": "providers", "action": "list" }
{ "resource": "providers", "action": "upsertMany", "documents": [{ "id": "prov-a", "...": "full Provider" }] }
{ "resource": "providers", "action": "replaceAll", "documents": [{ "id": "prov-a", "...": "full Provider" }] }
{ "resource": "providers", "action": "deleteMany", "ids": ["prov-a", "prov-b"] }

// Meet-up operations
{ "resource": "meetupGroup", "action": "get", "id": "meetup-example" }
{ "resource": "meetupGroup", "action": "upsert", "document": { "id": "meetup-example", "...": "full MeetupGroup" } }
{ "resource": "meetupGroup", "action": "patch", "id": "meetup-example", "patch": { "description": "Updated text" } }
{ "resource": "meetupGroup", "action": "delete", "id": "meetup-example" }
{ "resource": "meetupGroups", "action": "list" }
{ "resource": "meetupGroups", "action": "upsertMany", "documents": [{ "id": "meetup-a", "...": "full MeetupGroup" }] }
{ "resource": "meetupGroups", "action": "replaceAll", "documents": [{ "id": "meetup-a", "...": "full MeetupGroup" }] }
{ "resource": "meetupGroups", "action": "deleteMany", "ids": ["meetup-a", "meetup-b"] }

// Site and locations
{ "resource": "site", "action": "get" }
{ "resource": "site", "action": "patch", "patch": { "homeHeroTitle": "New headline" } }
{ "resource": "site", "action": "put", "document": { "_id": "main", "...": "full SiteDoc" } }
{ "resource": "locations", "action": "list" }
{ "resource": "locations", "action": "replace", "locations": [{ "borough": "Germany", "neighborhoods": ["Bavaria"] }] }`;

const INGEST_RESPONSE = `{
  "ok": true,
  "results": [
    { "index": 0, "ok": true, "data": [ { "id": "...", "name": "..." } ] },
    { "index": 1, "ok": true, "data": { "id": "my-studio", "name": "..." } },
    { "index": 2, "ok": false, "error": "provider not found" }
  ]
}`;

const nav = [
  { href: "#overview", label: "Overview" },
  { href: "#public", label: "Public" },
  { href: "#ingest", label: "Ingest" },
  { href: "#admin", label: "Admin" },
  { href: "#errors", label: "Errors" },
];

export function ApiDocsPage({ origin }: { origin: string }) {
  const base = origin || "https://rangescout.vercel.app";

  return (
    <DocsPageShell
      title="HTTP API reference"
      eyebrow="RangeScout EU"
      lead={`Catalog, machine ingest, and admin endpoints for sport shooting discovery. All paths are relative to your deployment (for example ${base}).`}
      meta={
        <Group gap="sm">
          <Button component={Link} href="/" variant="light" color="dark" size="xs">
            Home
          </Button>
          <Button component={Link} href="/admin" variant="light" color="dark" size="xs">
            Admin
          </Button>
        </Group>
      }
      sideRail={
        <Stack gap="xs" style={{ position: "sticky", top: 24 }}>
          <Text size="xs" fw={700} c="dimmed" tt="uppercase" mb="xs">Navigation</Text>
          {nav.map((item) => (
            <Anchor key={item.href} href={item.href} size="sm" c="teal" fw={500} underline="hover">
              {item.label}
            </Anchor>
          ))}
        </Stack>
      }
    >
          <Section id="overview" title="Overview">
            <p>
              RangeScout exposes JSON APIs for the public catalog, a <strong>machine ingest</strong> pipeline secured by{" "}
              <InlineCode>INGEST_API_KEY</InlineCode>, and{" "}
              <strong>browser session</strong> APIs for the admin console. Unless noted, request and response bodies use{" "}
              <InlineCode>application/json</InlineCode> with UTF-8.
            </p>
            <BulletList>
              <List.Item>
                <strong>Public routes</strong> are read-only and safe to call from browsers or edge caches (no secrets
                required).
              </List.Item>
              <List.Item>
                <strong>Admin routes</strong> require an HTTP-only cookie set by <InlineCode>POST /api/admin/login</InlineCode>; use a
                browser or forward <InlineCode>Cookie</InlineCode> from the same origin.
              </List.Item>
              <List.Item>
                <strong>Ingest</strong> is intended for servers, ETL jobs, or trusted partners — never expose{" "}
                <InlineCode>INGEST_API_KEY</InlineCode> in client-side code.
              </List.Item>
              <List.Item>
                <strong>Stored raster media</strong> for providers, meetup groups, and site content is validated as ImgBB-hosted
                HTTPS when non-empty.
              </List.Item>
            </BulletList>
          </Section>

          <Section id="public" title="Public catalog (read)">
            <p>These endpoints read from MongoDB when <InlineCode>MONGODB_URI</InlineCode> is configured; otherwise they fall back to built-in defaults where noted.</p>

            <Stack gap="xl">
              <EndpointCard method="GET" path="/api/public/providers" auth="None">
                <p>
                  Returns <InlineCode>Provider[]</InlineCode> sorted newest-first by canonical publication time. Mongo <InlineCode>_id</InlineCode> is stripped from each object, and public responses may include computed <InlineCode>nextOccurrence</InlineCode> data for upcoming availability.
                </p>
                <MutedParagraph>
                  <strong>503</strong> if the database is not configured.
                </MutedParagraph>
              </EndpointCard>

              <EndpointCard method="GET" path="/api/public/meetup-groups" auth="None">
                <p>
                  Returns <InlineCode>MeetupGroup[]</InlineCode>. <InlineCode>_id</InlineCode> stripped.
                </p>
                <MutedParagraph>
                  <strong>503</strong> if the database is not configured.
                </MutedParagraph>
              </EndpointCard>

              <EndpointCard method="GET" path="/api/public/locations" auth="None">
                <p>
                  Returns a borough → neighborhoods map: <InlineCode>Record&lt;Borough, string[]&gt;</InlineCode>. If the
                  locations collection is empty or DB is unavailable, the app falls back to static neighborhood lists from the
                  codebase.
                </p>
              </EndpointCard>

              <EndpointCard method="GET" path="/api/public/site" auth="None">
                <p>
                  Returns the marketing shell document for <InlineCode>_id: &quot;main&quot;</InlineCode>, or merged defaults
                  when missing. This route falls back to merged defaults even when MongoDB is unavailable.
                </p>
                <CodeBlock title="Shape (SiteDoc)">{SITE_DOC}</CodeBlock>
              </EndpointCard>

            </Stack>

            <Title order={3} mt="xl">Entity references</Title>
            <CodeBlock title="Provider">{PROVIDER_FIELDS}</CodeBlock>
            <CodeBlock title="MeetupGroup (Borough same as Provider)">{MEETUP_FIELDS}</CodeBlock>
          </Section>

          <Section id="ingest" title="Machine ingest API">
            <p>
              Use <InlineCode>INGEST_API_KEY</InlineCode> for authenticated catalog and content operations: read
              live data, batch writes, upload images to ImgBB, and manage the same provider, meetup, site, and location
              documents that the admin UI updates. <strong>Stored raster URLs</strong> in provider, meetup, and site documents must be{" "}
              <InlineCode>https://</InlineCode> on <strong>imgbb.com</strong> (e.g. <InlineCode>i.ibb.co</InlineCode>) or empty; other hosts are rejected.
            </p>

            <Stack gap="xl">
              <EndpointCard method="GET" path="/api/cron/curator" auth="Bearer CRON_SECRET (Vercel Cron)">
                <p>
                  <strong>Optional automation:</strong> when <InlineCode>CURATOR_ENABLED=true</InlineCode>, runs Serper search → fetches an official page → OpenAI JSON → Zod validate → dedupe → Mongo{" "}
                  <InlineCode>provider</InlineCode> upsert (same as ingest). Requires <InlineCode>SERPER_API_KEY</InlineCode> and{" "}
                  <InlineCode>CURATOR_OPENAI_API_KEY</InlineCode>. Response JSON includes <InlineCode>steps</InlineCode>. Schedule in <InlineCode>vercel.json</InlineCode>.
                </p>
                <MutedParagraph>
                  <strong>401</strong> if the bearer token does not match <InlineCode>CRON_SECRET</InlineCode>. Returns <strong>200</strong> with a descriptive body for skip/config errors so crons do not retry endlessly.
                </MutedParagraph>
              </EndpointCard>

              <EndpointCard
                method="GET"
                path="/api/ingest"
                auth="Bearer INGEST_API_KEY or header X-Ingest-Key: &lt;key&gt;"
              >
                <p>
                  Returns a compact JSON summary of ingest capabilities and limits (same authentication as{" "}
                  <InlineCode>POST /api/ingest</InlineCode>).
                </p>
              </EndpointCard>

              <EndpointCard
                method="POST"
                path="/api/ingest/upload"
                auth="Bearer INGEST_API_KEY or header X-Ingest-Key: &lt;key&gt;"
              >
                <p>
                  Same behavior as <InlineCode>POST /api/admin/upload</InlineCode>, but for API clients:{" "}
                  <InlineCode>multipart/form-data</InlineCode> with field <InlineCode>file</InlineCode>. Requires{" "}
                  <InlineCode>IMGBB_API_KEY</InlineCode> on the server.
                </p>
                <MutedParagraph>
                  Success: <InlineCode>{'{ "url": string, "displayUrl": string }'}</InlineCode>.
                </MutedParagraph>
              </EndpointCard>

              <EndpointCard
                method="POST"
                path="/api/ingest"
                auth="Bearer INGEST_API_KEY or header X-Ingest-Key: &lt;key&gt;"
              >
              <p>
                Batch <strong>read and write</strong> operations for providers, meetup groups, site, and locations.
                Up to <strong>100 operations</strong> per request. Each result may include <InlineCode>data</InlineCode> for successful reads or write metadata (e.g.{" "}
                <InlineCode>{'{ "replaced": 12 }'}</InlineCode>, <InlineCode>{'{ "deletedCount": 3 }'}</InlineCode>).
              </p>
              <p>
                <strong>503</strong> if <InlineCode>INGEST_API_KEY</InlineCode> is not set. <strong>401</strong> if the key is missing or wrong.{" "}
                <strong>503</strong> if MongoDB is unavailable.
              </p>
              <p>
                <strong>Request:</strong> either a single operation object or <InlineCode>{'{ "operations": [ ... ] }'}</InlineCode>.
              </p>
              <CodeBlock title="Batch example (reads + writes)">{INGEST_BATCH}</CodeBlock>
              <CodeBlock title="Single operation (shorthand)">{INGEST_SINGLE}</CodeBlock>
              <CodeBlock title="Supported operation variants">{INGEST_OPERATION_VARIANTS}</CodeBlock>
              <p>
                <strong>Read actions</strong> (successful results include <InlineCode>data</InlineCode>)
              </p>
              <BulletList size="sm">
                <List.Item>
                  <InlineCode>providers</InlineCode> + <InlineCode>list</InlineCode> → <InlineCode>Provider[]</InlineCode> (<InlineCode>_id</InlineCode> stripped).
                </List.Item>
                <List.Item>
                  <InlineCode>provider</InlineCode> + <InlineCode>get</InlineCode> + <InlineCode>id</InlineCode> → one provider or error <InlineCode>provider not found</InlineCode>.
                </List.Item>
                <List.Item>
                  <InlineCode>meetupGroups</InlineCode> + <InlineCode>list</InlineCode> / <InlineCode>meetupGroup</InlineCode> + <InlineCode>get</InlineCode> — same pattern.
                </List.Item>
                <List.Item>
                  <InlineCode>site</InlineCode> + <InlineCode>get</InlineCode> → <InlineCode>SiteDoc</InlineCode> (defaults merged if missing).
                </List.Item>
                <List.Item>
                  <InlineCode>locations</InlineCode> + <InlineCode>list</InlineCode> → raw Mongo rows{" "}
                  <InlineCode>{'{ borough, neighborhoods }[]'}</InlineCode>.
                </List.Item>
              </BulletList>
              <p>
                <strong>Write actions</strong>
              </p>
              <BulletList size="sm">
                <List.Item>
                  <InlineCode>provider</InlineCode>: <InlineCode>upsert</InlineCode>, <InlineCode>patch</InlineCode>, <InlineCode>delete</InlineCode> (by <InlineCode>id</InlineCode>).
                </List.Item>
                <List.Item>
                  <InlineCode>providers</InlineCode>: <InlineCode>upsertMany</InlineCode> (bulk by <InlineCode>id</InlineCode>),{" "}
                  <InlineCode>replaceAll</InlineCode> (clears collection then inserts array; max <strong>2000</strong> docs),{" "}
                  <InlineCode>deleteMany</InlineCode> with <InlineCode>ids: string[]</InlineCode> (max <strong>500</strong> ids).
                </List.Item>
                <List.Item>
                  <InlineCode>meetupGroup</InlineCode> / <InlineCode>meetupGroups</InlineCode>: same as providers (including{" "}
                  <InlineCode>replaceAll</InlineCode> / <InlineCode>deleteMany</InlineCode>).
                </List.Item>
                <List.Item>
                  <InlineCode>site</InlineCode>: <InlineCode>patch</InlineCode> (partial merge) or <InlineCode>put</InlineCode> with full <InlineCode>document</InlineCode> (replaces <InlineCode>_id: &quot;main&quot;</InlineCode>).
                </List.Item>
                <List.Item>
                  <InlineCode>locations</InlineCode>: <InlineCode>replace</InlineCode> — deletes all rows, then inserts the provided array.
                </List.Item>
              </BulletList>
              <p>
                <strong>Response (JSON):</strong> per-operation results with optional <InlineCode>data</InlineCode>. HTTP <strong>200</strong> when every operation succeeded;{" "}
                <strong>422</strong> when any operation failed.
              </p>
              <CodeBlock title="Example response">{INGEST_RESPONSE}</CodeBlock>
              <MutedParagraph>
                <strong>curl</strong> example (replace the host and key):
              </MutedParagraph>
              <CodeBlock>{`curl -sS -X POST "${base}/api/ingest" \\
  -H "Authorization: Bearer $INGEST_API_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{"resource":"provider","action":"patch","id":"my-id","patch":{"rating":5}}'`}</CodeBlock>
            </EndpointCard>
            </Stack>
          </Section>

          <Section id="admin" title="Admin console APIs">
            <p>
              Used by <Anchor component={Link} href="/admin" c="teal" fw={500} underline="hover">/admin</Anchor>. Authenticate with{" "}
              <InlineCode>POST /api/admin/login</InlineCode>, then call other routes from the same origin with the session cookie.
            </p>

            <Stack gap="xl">
              <EndpointCard method="POST" path="/api/admin/login" auth="None (sets cookie on success)">
                <p>
                  Body: <InlineCode>{'{ "password": string }'}</InlineCode> matching <InlineCode>ADMIN_PASSWORD</InlineCode>.
                </p>
                <MutedParagraph>
                  <strong>200</strong> <InlineCode>{'{ "ok": true }'}</InlineCode> and sets HTTP-only cookie. <strong>401</strong> invalid password.{" "}
                  <strong>500</strong> if admin password env is missing.
                </MutedParagraph>
              </EndpointCard>

              <EndpointCard method="POST" path="/api/admin/logout" auth="None">
                <p>Clears the admin session cookie. Returns <InlineCode>{'{ "ok": true }'}</InlineCode>.</p>
              </EndpointCard>

              <EndpointCard method="POST" path="/api/admin/upload" auth="Admin session cookie">
                <p>
                  <InlineCode>multipart/form-data</InlineCode> with field name <InlineCode>file</InlineCode> (image blob). Uploads to ImgBB using{" "}
                  <InlineCode>IMGBB_API_KEY</InlineCode>.
                </p>
                <MutedParagraph>
                  Success: <InlineCode>{'{ "url": string, "displayUrl": string }'}</InlineCode>. Errors <strong>400</strong> missing file,{" "}
                  <strong>401</strong> not logged in, <strong>500</strong> missing ImgBB key, <strong>502</strong> ImgBB failure.
                </MutedParagraph>
              </EndpointCard>

              <EndpointCard method="GET" path="/api/admin/providers" auth="Admin session">
                <p>Returns raw Mongo documents (includes <InlineCode>_id</InlineCode>).</p>
              </EndpointCard>
              <EndpointCard method="POST" path="/api/admin/providers" auth="Admin session">
                <p>
                  Full replace/upsert by <InlineCode>id</InlineCode>. Body: full <InlineCode>Provider</InlineCode> (+ optional <InlineCode>_id</InlineCode> ignored).
                </p>
              </EndpointCard>
              <EndpointCard method="PATCH" path="/api/admin/providers" auth="Admin session">
                <p>
                  Body: <InlineCode>{'{ "id": string, ...partial fields }'}</InlineCode> — <InlineCode>$set</InlineCode> style merge.
                </p>
              </EndpointCard>
              <EndpointCard method="DELETE" path="/api/admin/providers?id=&lt;id&gt;" auth="Admin session">
                <p>Deletes one provider by <InlineCode>id</InlineCode> query param.</p>
              </EndpointCard>

              <EndpointCard method="GET" path="/api/admin/meetup-groups" auth="Admin session">
                <p>Returns raw Mongo meetup group documents, including <InlineCode>_id</InlineCode>.</p>
              </EndpointCard>
              <EndpointCard method="POST" path="/api/admin/meetup-groups" auth="Admin session">
                <p>Upsert full <InlineCode>MeetupGroup</InlineCode> by <InlineCode>id</InlineCode>.</p>
              </EndpointCard>
              <EndpointCard method="PATCH" path="/api/admin/meetup-groups" auth="Admin session">
                <p>Partial update by <InlineCode>id</InlineCode>.</p>
              </EndpointCard>
              <EndpointCard method="DELETE" path="/api/admin/meetup-groups?id=&lt;id&gt;" auth="Admin session">
                <p>Deletes one meetup group by <InlineCode>id</InlineCode> query param.</p>
              </EndpointCard>

              <EndpointCard method="GET" path="/api/admin/site" auth="Admin session">
                <p>Returns <InlineCode>SiteDoc</InlineCode> (or defaults).</p>
              </EndpointCard>
              <EndpointCard method="PATCH" path="/api/admin/site" auth="Admin session">
                <p>JSON partial patch merged into <InlineCode>_id: &quot;main&quot;</InlineCode>.</p>
              </EndpointCard>

              <EndpointCard method="GET" path="/api/admin/locations" auth="Admin session">
                <p>Array of <InlineCode>{'{ borough, neighborhoods }'}</InlineCode> rows.</p>
              </EndpointCard>
              <EndpointCard method="PUT" path="/api/admin/locations" auth="Admin session">
                <p>
                  Body: <InlineCode>{'{ "locations": LocRow[] }'}</InlineCode> — replaces the entire locations collection.
                </p>
              </EndpointCard>
            </Stack>
          </Section>

          <Section id="errors" title="Common errors and environment">
            <Table withTableBorder withColumnBorders={false} striped highlightOnHover>
              <Table.Thead>
                <Table.Tr>
                  <Table.Th>HTTP</Table.Th>
                  <Table.Th>Typical cause</Table.Th>
                </Table.Tr>
              </Table.Thead>
              <Table.Tbody>
                <Table.Tr>
                  <Table.Td><Code>400</Code></Table.Td>
                  <Table.Td>Malformed JSON, missing required fields, empty upload file, or invalid patch/replace payload shape.</Table.Td>
                </Table.Tr>
                <Table.Tr>
                  <Table.Td><Code>401</Code></Table.Td>
                  <Table.Td>Admin cookie missing/invalid, wrong admin password, or wrong ingest key.</Table.Td>
                </Table.Tr>
                <Table.Tr>
                  <Table.Td><Code>422</Code></Table.Td>
                  <Table.Td>Ingest: one or more operations failed (see <InlineCode>results[].error</InlineCode>).</Table.Td>
                </Table.Tr>
                <Table.Tr>
                  <Table.Td><Code>500 / 502</Code></Table.Td>
                  <Table.Td>Missing server env (ImgBB, admin password), or upstream upload errors.</Table.Td>
                </Table.Tr>
                <Table.Tr>
                  <Table.Td><Code>503</Code></Table.Td>
                  <Table.Td>Mongo not configured, or ingest key not configured on server.</Table.Td>
                </Table.Tr>
              </Table.Tbody>
            </Table>
            <Title order={3} mt="xl">Environment variables (server)</Title>
            <BulletList size="sm">
              <List.Item>
                <InlineCode>MONGODB_URI</InlineCode>, optional <InlineCode>MONGODB_DB</InlineCode>
              </List.Item>
              <List.Item>
                <InlineCode>ADMIN_PASSWORD</InlineCode>, optional <InlineCode>ADMIN_SESSION_SECRET</InlineCode>
              </List.Item>
              <List.Item>
                <InlineCode>INGEST_API_KEY</InlineCode> — required for authenticated <InlineCode>/api/ingest*</InlineCode> routes
              </List.Item>
              <List.Item>
                Optional <InlineCode>INGEST_BASE_URL</InlineCode> — for local ingest scripts only (see{" "}
                <InlineCode>scripts/ingest-listing-automation.cjs</InlineCode>); not required on Vercel.
              </List.Item>
              <List.Item>
                <InlineCode>IMGBB_API_KEY</InlineCode> — required for admin upload, ingest upload, and asset upload tooling
              </List.Item>
              <List.Item>
                Curator automation: <InlineCode>CURATOR_ENABLED</InlineCode>, <InlineCode>SERPER_API_KEY</InlineCode>, <InlineCode>CURATOR_OPENAI_API_KEY</InlineCode>, and <InlineCode>CRON_SECRET</InlineCode>
              </List.Item>
            </BulletList>
            <MutedParagraph>
              <InlineCode>npm run vercel:env:push</InlineCode> syncs Mongo, ImgBB, admin, session, ingest, optional{" "}
              <InlineCode>NEXT_PUBLIC_IMG_BB_*</InlineCode>, and optional curator keys (see{" "}
              <InlineCode>scripts/sync-vercel-env.cjs</InlineCode>). Run <InlineCode>npm run env:generate</InlineCode> locally to mint ingest/admin secrets into{" "}
              <InlineCode>.env.local</InlineCode>. See <InlineCode>.env.example</InlineCode> for the full list.
            </MutedParagraph>
          </Section>
    </DocsPageShell>
  );
}
