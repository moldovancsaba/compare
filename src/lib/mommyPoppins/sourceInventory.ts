import { NEIGHBORHOODS } from "@/data/locations";
import type {
  MommyPoppinsInventoryReport,
  MommyPoppinsRegionScope,
  MommyPoppinsSourceRecord,
  MommyPoppinsSurfaceType,
  MommyPoppinsTaxonomyMapRow,
} from "@/lib/mommyPoppins/types";
import { fetchText, safeJsonParse, slugify, unique } from "@/lib/mommyPoppins/shared";

const SOURCE_HOST = "https://mommypoppins.com";
const DIRECTORY_PAGE_LIMIT = 4;
const DIRECTORY_SEED_PATHS = [
  "/directory",
  "/directory/1670/anywhere/1365/family-fun/all/age/0/deals/all",
  "/directory/1670/anywhere/644/camps/all/age/0/deals/all",
  "/directory/1670/anywhere/645/classes/all/age/0/deals/all",
  "/directory/1670/anywhere/2474/childcare/all/age/0/deals/all",
  "/directory/1670/anywhere/648/party/all/age/0/deals/all",
  "/directory/1670/anywhere/1385/preschools-%26-schools/all/age/0/deals/all",
  "/directory/1670/anywhere/649/special-needs/all/age/0/deals/all",
  "/directory/1670/anywhere/1394/stores-%26-services/all/age/0/deals/all",
  "/directory/1670/anywhere/1656/virtual/all/age/0/deals/all",
] as const;

type DrupalSettingsPayload = {
  mp_core?: {
    regionMap?: Record<string, number>;
  };
};

export function extractSitemapPageUrls(xml: string) {
  return [...xml.matchAll(/<loc>(.*?)<\/loc>/g)].map((match) => match[1].trim());
}

export function extractSitemapEntries(xml: string) {
  return [...xml.matchAll(/<url>\s*<loc>(.*?)<\/loc>(?:\s*<lastmod>(.*?)<\/lastmod>)?[\s\S]*?<\/url>/g)].map((match) => ({
    url: match[1].trim(),
    lastmod: match[2]?.trim() ?? null,
  }));
}

export function normalizeRoutePath(url: string) {
  try {
    return new URL(url).pathname.replace(/\/+$/, "") || "/";
  } catch {
    return "";
  }
}

export function classifySurfaceType(url: string): MommyPoppinsSurfaceType {
  const path = normalizeRoutePath(url);
  if (path.includes("/directory/")) return "directory";
  if (path.includes("/event/") || path.startsWith("/events/")) return "event";
  if (path.includes("/mommy-poppins-business-listings")) return "submission";
  if (path.includes("guide") || path.includes("/family/") || path.includes("-family/")) return "article";
  if (path.startsWith("/new-york-city") || path.startsWith("/family-neighborhood-guide")) return "hub";
  return "unknown";
}

function resolveAbsoluteUrl(href: string) {
  try {
    return new URL(href, SOURCE_HOST).toString();
  } catch {
    return null;
  }
}

function extractDirectoryDetailUrls(html: string) {
  return unique(
    [...html.matchAll(/href="([^"]+)"/g)]
      .map((match) => match[1])
      .filter((href) => /\/[a-z-]+-kids\/directory\//.test(href))
      .map((href) => resolveAbsoluteUrl(href))
      .filter((href): href is string => Boolean(href)),
  ).sort();
}

export function extractDrupalRegionMap(html: string) {
  const raw = html.match(/<script[^>]+data-drupal-selector=["']drupal-settings-json["'][^>]*>([\s\S]*?)<\/script>/i)?.[1] ?? null;
  const parsed = safeJsonParse<DrupalSettingsPayload>(raw);
  return parsed?.mp_core?.regionMap ?? {};
}

export function collectNycRegionPrefixes(regionMap: Record<string, number>) {
  return unique(
    Object.keys(regionMap)
      .filter((route) => route.startsWith("/new-york-city"))
      .map((route) => route.replace(/\/+$/, "")),
  ).sort();
}

export function inferRegionScope(url: string, nycPrefixes: string[]): MommyPoppinsRegionScope {
  const path = normalizeRoutePath(url);
  if (!path) return "unknown";
  if (nycPrefixes.some((prefix) => path === prefix || path.startsWith(`${prefix}/`))) return "nyc";
  if (path.startsWith("/new-york-city-kids/directory/")) return "nyc";
  if (path.startsWith("/new-york-city-kids/event/")) return "nyc";
  return "non_nyc";
}

export function extractRegionId(path: string, regionMap: Record<string, number>) {
  const exact = regionMap[path];
  if (typeof exact === "number") return exact;
  const prefix = Object.entries(regionMap)
    .filter(([route]) => path === route || path.startsWith(`${route}/`))
    .sort((a, b) => b[0].length - a[0].length)[0];
  return prefix?.[1];
}

export function extractCategoryId(url: string) {
  const path = normalizeRoutePath(url);
  const directoryMatch = path.match(/^\/directory\/\d+\/[^/]+\/(\d+|all)\//);
  if (directoryMatch?.[1] && directoryMatch[1] !== "all") return Number(directoryMatch[1]);
  const eventMatch = path.match(/^\/events\/\d+\/[^/]+\/(\d+|all)\//);
  if (eventMatch?.[1] && eventMatch[1] !== "all") return Number(eventMatch[1]);
  return undefined;
}

export function extractAgeFilter(url: string) {
  const path = normalizeRoutePath(url);
  const match = path.match(/\/age\/([^/]+)/);
  return match?.[1] ? decodeURIComponent(match[1]) : null;
}

function titleHintFromUrl(url: string) {
  const path = normalizeRoutePath(url);
  const slug = path.split("/").filter(Boolean).at(-1) ?? "";
  return slug
    .replace(/-/g, " ")
    .replace(/\b\w/g, (letter) => letter.toUpperCase())
    .trim();
}

export function buildTaxonomyMap(records: MommyPoppinsSourceRecord[]): MommyPoppinsTaxonomyMapRow[] {
  const rows: MommyPoppinsTaxonomyMapRow[] = [];
  const neighborhoodRows = Object.entries(NEIGHBORHOODS).flatMap(([borough, neighborhoods]) =>
    neighborhoods.map((neighborhood) => ({
      sourceKey: "nyc-neighborhood",
      sourceValue: neighborhood,
      classScoutTarget: `${borough}:${neighborhood}`,
      confidence: "high" as const,
      notes: "Canonical ClassScout neighborhood support.",
    })),
  );
  rows.push(...neighborhoodRows);

  const categoryIds = unique(records.map((record) => record.mommyPoppinsCategoryId).filter((value): value is number => typeof value === "number"))
    .sort((a, b) => a - b);
  for (const categoryId of categoryIds) {
    const target =
      categoryId === 644 || categoryId === 247096
        ? "Camps"
        : categoryId === 645
          ? "Classes"
          : categoryId === 648
            ? "Birthday Parties"
            : categoryId === 1365 || categoryId === 1667 || categoryId === 2471 || categoryId === 1709
              ? "Drop-In Activities"
              : null;
    rows.push({
      sourceKey: "mommypoppins-category-id",
      sourceValue: String(categoryId),
      classScoutTarget: target,
      confidence: target ? "medium" : "low",
      notes: target ? "Heuristic mapping from public Mommy Poppins route taxonomy." : "No canonical ClassScout mapping inferred safely.",
    });
  }

  return rows;
}

async function discoverSupplementalDirectoryUrls() {
  const seedUrls = DIRECTORY_SEED_PATHS.flatMap((path) =>
    Array.from({ length: DIRECTORY_PAGE_LIMIT }, (_, page) => `${SOURCE_HOST}${path}${path.includes("?") ? "&" : "?"}page=${page}`),
  );
  const pages = await Promise.all(seedUrls.map((url) => fetchText(url).catch(() => "")));
  return unique(pages.flatMap((html) => extractDirectoryDetailUrls(html)));
}

export async function buildMommyPoppinsInventory(): Promise<MommyPoppinsInventoryReport> {
  const generatedAt = new Date().toISOString();
  const [homepageHtml, sitemapIndexXml] = await Promise.all([
    fetchText(`${SOURCE_HOST}/`),
    fetchText(`${SOURCE_HOST}/sitemap.xml`),
  ]);

  const regionMap = extractDrupalRegionMap(homepageHtml);
  const nycPrefixes = collectNycRegionPrefixes(regionMap);
  const sitemapPageUrls = extractSitemapPageUrls(sitemapIndexXml);

  const [sitemapPages, supplementalDirectoryUrls] = await Promise.all([
    Promise.all(sitemapPageUrls.map((url) => fetchText(url))),
    discoverSupplementalDirectoryUrls(),
  ]);
  const rawEntries = [
    ...sitemapPages.flatMap(extractSitemapEntries).map((entry) => ({ ...entry, discoveredFrom: "sitemap" as const })),
    ...supplementalDirectoryUrls.map((url) => ({ url, lastmod: null, discoveredFrom: "directory" as const })),
  ];
  const seen = new Set<string>();
  const records: MommyPoppinsSourceRecord[] = [];

  for (const entry of rawEntries) {
    const canonicalUrl = entry.url.trim();
    const duplicate = seen.has(canonicalUrl);
    seen.add(canonicalUrl);
    const path = normalizeRoutePath(canonicalUrl);
    const surfaceType = classifySurfaceType(canonicalUrl);
    const regionScope = inferRegionScope(canonicalUrl, nycPrefixes);
    const directorySeedEligible = entry.discoveredFrom === "directory" && surfaceType === "directory";
    const sourceStatus =
      duplicate ? "duplicate" : (regionScope === "nyc" || directorySeedEligible) && surfaceType !== "unknown" ? "eligible" : "out_of_scope";
    records.push({
      sourceId: slugify(path || canonicalUrl),
      url: canonicalUrl,
      canonicalUrl,
      surfaceType,
      regionScope,
      mommyPoppinsRegionId: extractRegionId(path, regionMap),
      mommyPoppinsCategoryId: extractCategoryId(canonicalUrl),
      mommyPoppinsAgeFilter: extractAgeFilter(canonicalUrl),
      titleHint: titleHintFromUrl(canonicalUrl),
      lastmod: entry.lastmod,
      discoveredFrom: entry.discoveredFrom,
      sourceStatus,
      scrapedAt: generatedAt,
    });
  }

  const taxonomyMap = buildTaxonomyMap(records);

  return {
    generatedAt,
    sourceHost: SOURCE_HOST,
    sitemapPageCount: sitemapPageUrls.length,
    totalUrlsDiscovered: records.length,
    nycEligibleCount: records.filter((record) => record.sourceStatus === "eligible").length,
    duplicateCount: records.filter((record) => record.sourceStatus === "duplicate").length,
    failedCount: records.filter((record) => record.sourceStatus === "failed").length,
    outOfScopeCount: records.filter((record) => record.sourceStatus === "out_of_scope").length,
    records,
    taxonomyMap,
  };
}

export function renderInventoryMarkdown(report: MommyPoppinsInventoryReport) {
  const lines: string[] = [];
  lines.push("# Mommy Poppins NYC Source Inventory");
  lines.push("");
  lines.push(`Generated: ${report.generatedAt}`);
  lines.push(`Sitemap pages: ${report.sitemapPageCount}`);
  lines.push(`Discovered URLs: ${report.totalUrlsDiscovered}`);
  lines.push(`NYC eligible URLs: ${report.nycEligibleCount}`);
  lines.push(`Out of scope URLs: ${report.outOfScopeCount}`);
  lines.push(`Duplicate URLs: ${report.duplicateCount}`);
  lines.push("");
  lines.push("## Eligible sources by surface");

  const surfaceCounts = new Map<string, number>();
  for (const record of report.records.filter((item) => item.sourceStatus === "eligible")) {
    surfaceCounts.set(record.surfaceType, (surfaceCounts.get(record.surfaceType) ?? 0) + 1);
  }
  for (const [surface, count] of [...surfaceCounts.entries()].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))) {
    lines.push(`- ${surface}: ${count}`);
  }

  lines.push("");
  lines.push("## Sample eligible URLs");
  for (const record of report.records.filter((item) => item.sourceStatus === "eligible").slice(0, 25)) {
    lines.push(`- [${record.titleHint || record.canonicalUrl}](${record.canonicalUrl}) — ${record.surfaceType}`);
  }

  lines.push("");
  lines.push("## Taxonomy mapping");
  for (const row of report.taxonomyMap.slice(0, 40)) {
    lines.push(`- ${row.sourceKey}=${row.sourceValue} -> ${row.classScoutTarget ?? "(no mapping)"} [${row.confidence}]`);
  }

  return `${lines.join("\n")}\n`;
}
