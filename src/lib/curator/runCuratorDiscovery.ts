import type { Db } from "mongodb";
import type { Provider } from "@/types/provider";
import { COL, buildCatalogScopeFilter } from "@/lib/mongodb";
import { applyIngestOperation } from "@/lib/ingestOperations";
import { CURATOR_SEARCH_QUERIES } from "@/lib/curator/constants";
import { serperSearch } from "@/lib/curator/serperSearch";
import { fetchPageText } from "@/lib/curator/fetchPageText";
import { extractProviderLocally } from "@/lib/curator/extractProviderLocally";

type SearchHit = Awaited<ReturnType<typeof serperSearch>>[number];

function normName(s: string) {
  return s
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

function decodeHtmlEntities(value: string) {
  return value
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&#(\d+);/g, (_, code) => String.fromCharCode(Number(code)));
}

function cleanHtmlText(value: string) {
  return decodeHtmlEntities(value)
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function decodeBingTarget(href: string) {
  const decoded = decodeHtmlEntities(href);
  try {
    const url = new URL(decoded, "https://www.bing.com");
    const encoded = url.searchParams.get("u");
    if (!encoded) return decoded;
    if (encoded.startsWith("a1")) {
      return Buffer.from(encoded.slice(2).replace(/-/g, "+").replace(/_/g, "/"), "base64").toString("utf8");
    }
    return encoded;
  } catch {
    return decoded;
  }
}

async function fallbackSearch(query: string): Promise<SearchHit[]> {
  const response = await fetch(`https://www.bing.com/search?q=${encodeURIComponent(query)}&count=10&setlang=en-US`, {
    headers: {
      "User-Agent": "CompareCuratorBot/1.0",
      Accept: "text/html,application/xhtml+xml;q=0.9,*/*;q=0.8",
      "Accept-Language": "en-US,en;q=0.9,hu;q=0.8",
    },
  });
  if (!response.ok) throw new Error(`Bing HTTP ${response.status}`);

  const html = await response.text();
  const hits: SearchHit[] = [];
  const blockRegex = /<li class="b_algo"[\s\S]*?<h2[^>]*>\s*<a[^>]+href="([^"]+)"[^>]*>([\s\S]*?)<\/a>[\s\S]*?(?:<p[^>]*>([\s\S]*?)<\/p>)?/gi;
  let match: RegExpExecArray | null = null;
  while ((match = blockRegex.exec(html)) && hits.length < 8) {
    const link = decodeBingTarget(match[1] || "");
    if (!link.startsWith("https://")) continue;
    hits.push({
      link,
      title: cleanHtmlText(match[2] || ""),
      snippet: cleanHtmlText(match[3] || ""),
    });
  }

  const officialSeeds: SearchHit[] = query.toLowerCase().includes("hung")
    ? [
        {
          title: "MDLSZ - Magyar Dinamikus Lövészsport Szövetség",
          link: "https://mdlsz.com/",
          snippet: "Official Hungarian dynamic shooting federation source.",
        },
        {
          title: "Hungarian Shooting Federation",
          link: "https://www.hunshooting.hu/",
          snippet: "Official Hungarian sport shooting federation source.",
        },
      ]
    : [];

  return [...hits, ...officialSeeds];
}

async function searchExternalSources(query: string): Promise<{ hits: SearchHit[]; source: string }> {
  try {
    return { hits: await serperSearch(query), source: "serper" };
  } catch {
    return { hits: await fallbackSearch(query), source: "fallback-search" };
  }
}

export type CuratorDiscoveryResult =
  | {
      ok: true;
      action: "ingested";
      providerId: string;
      providerName: string;
      sourceUrl: string;
      searchQuery: string;
      steps: string[];
    }
  | {
      ok: true;
      action: "skipped";
      reason: string;
      searchQuery: string;
      steps: string[];
    }
  | {
      ok: false;
      error: string;
      steps: string[];
    };

export async function runCuratorDiscovery(db: Db): Promise<CuratorDiscoveryResult> {
  const steps: string[] = [];

  if (process.env.CURATOR_ENABLED !== "true") {
    steps.push('Set CURATOR_ENABLED="true" to run discovery.');
    return { ok: true, action: "skipped", reason: "curator_disabled", searchQuery: "", steps };
  }

  const qIdx = Math.floor(Date.now() / 86_400_000) % CURATOR_SEARCH_QUERIES.length;
  const searchQuery = CURATOR_SEARCH_QUERIES[qIdx] ?? CURATOR_SEARCH_QUERIES[0];
  steps.push(`query: ${searchQuery}`);

  let organic: SearchHit[];
  try {
    const search = await searchExternalSources(searchQuery);
    organic = search.hits;
    steps.push(`search source: ${search.source}`);
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    return { ok: false, error: msg, steps };
  }
  steps.push(`search results: ${organic.length}`);

  const existing = (await db
    .collection(COL.providers)
    .find(buildCatalogScopeFilter({}))
    .project({ id: 1, name: 1 })
    .toArray()) as { id?: string; name?: string }[];

  const idSet = new Set(existing.map((p) => p.id).filter(Boolean) as string[]);
  const nameNorm = new Set(existing.map((p) => normName(String(p.name || ""))).filter(Boolean));

  for (const hit of organic) {
    const link = hit.link?.trim();
    if (!link || !link.startsWith("https://")) continue;

    let allowedHost: string;
    try {
      allowedHost = new URL(link).hostname;
    } catch {
      continue;
    }

    steps.push(`try: ${link}`);
    let page: { text: string; ogImage?: string };
    try {
      page = await fetchPageText(link, allowedHost);
    } catch (e) {
      steps.push(`fetch fail: ${e instanceof Error ? e.message : String(e)}`);
      continue;
    }

    const extracted = extractProviderLocally({
      sourceUrl: link,
      pageTitle: hit.title,
      pageText: page.text,
    });
    if (extracted.ok === false) {
      steps.push(`local-extractor: ${extracted.reason}`);
      continue;
    }

    const p = extracted.provider;
    if (idSet.has(p.id)) {
      steps.push(`skip duplicate id ${p.id}`);
      continue;
    }
    if (p.name && nameNorm.has(normName(p.name))) {
      steps.push(`skip duplicate name ${p.name}`);
      continue;
    }

    const op = { resource: "provider" as const, action: "upsert" as const, document: p as unknown as Provider };
    const res = await applyIngestOperation(db, op);
    if (res.ok === false) {
      steps.push(`ingest error: ${res.error}`);
      continue;
    }

    steps.push(`ingested ${p.id}`);
    return {
      ok: true,
      action: "ingested",
      providerId: p.id,
      providerName: p.name,
      sourceUrl: link,
      searchQuery,
      steps,
    };
  }

  return {
    ok: true,
    action: "skipped",
    reason: "no_acceptable_candidate",
    searchQuery,
    steps,
  };
}
