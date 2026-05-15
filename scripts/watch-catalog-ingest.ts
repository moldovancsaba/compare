import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import process from "node:process";

import { z } from "zod";

const ingestionManifestSchema = z.strictObject({
  officialProductUrl: z.string().url(),
  secondaryMarketUrl: z.string().url().optional(),
  draft: z.unknown()
});

type IngestionManifest = z.infer<typeof ingestionManifestSchema>;
const {
  buildWatchCatalogDocument,
  parseWatchCatalogDocument,
  parseWatchSpec
} = (await import(new URL("../src/lib/data/watch-catalog-schema.ts", import.meta.url).href)) as typeof import(
  "../src/lib/data/watch-catalog-schema"
);

function usage(): string {
  return [
    "Usage:",
    "  node scripts/watch-catalog-ingest.ts --manifest path/to/manifest.json [--output path/to/watch.json]",
    "",
    "Manifest fields:",
    '  "officialProductUrl": required URL',
    '  "secondaryMarketUrl": optional URL',
    '  "draft": required watch entry candidate'
  ].join("\n");
}

function parseArgs(argv: string[]): { manifestPath: string; outputPath?: string } {
  let manifestPath: string | undefined;
  let outputPath: string | undefined;

  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];

    if (arg === "--manifest") {
      manifestPath = argv[index + 1];
      index += 1;
      continue;
    }

    if (arg === "--output") {
      outputPath = argv[index + 1];
      index += 1;
      continue;
    }

    if (arg === "--help" || arg === "-h") {
      console.log(usage());
      process.exit(0);
    }
  }

  if (!manifestPath) {
    throw new Error(`Missing --manifest.\n\n${usage()}`);
  }

  return { manifestPath, outputPath };
}

async function readJsonFile(filePath: string): Promise<unknown> {
  return JSON.parse(await readFile(filePath, "utf8")) as unknown;
}

async function fetchSourceSummary(url: string): Promise<{
  url: string;
  ok: boolean;
  finalUrl: string | null;
  title: string | null;
  warning: string | null;
}> {
  try {
    const response = await fetch(url, {
      redirect: "follow",
      headers: {
        "user-agent": "compare-catalog-ingest/0.2.1"
      }
    });

    if (!response.ok) {
      return {
        url,
        ok: false,
        finalUrl: response.url || null,
        title: null,
        warning: `Source fetch returned ${response.status} ${response.statusText}`
      };
    }

    const html = await response.text();
    const titleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i);

    return {
      url,
      ok: true,
      finalUrl: response.url,
      title: titleMatch?.[1]?.trim() ?? null,
      warning: null
    };
  } catch (error) {
    return {
      url,
      ok: false,
      finalUrl: null,
      title: null,
      warning: error instanceof Error ? error.message : String(error)
    };
  }
}

async function main() {
  const { manifestPath, outputPath } = parseArgs(process.argv.slice(2));
  const manifestJson = await readJsonFile(manifestPath);
  const manifest: IngestionManifest = ingestionManifestSchema.parse(manifestJson);
  const draft = parseWatchSpec(manifest.draft);

  if (draft.productUrl !== manifest.officialProductUrl) {
    throw new Error("Manifest officialProductUrl must match draft.productUrl.");
  }

  if (manifest.secondaryMarketUrl) {
    if (!draft.secondaryMarket) {
      throw new Error("Manifest secondaryMarketUrl requires draft.secondaryMarket.");
    }

    if (draft.secondaryMarket.sourceUrl !== manifest.secondaryMarketUrl) {
      throw new Error("Manifest secondaryMarketUrl must match draft.secondaryMarket.sourceUrl.");
    }
  }

  const currentCatalog = parseWatchCatalogDocument(
    await readJsonFile(path.resolve("src/lib/data/watch-catalog.v1.json"))
  );
  buildWatchCatalogDocument([...currentCatalog.watches, draft]);

  const [officialSource, secondarySource] = await Promise.all([
    fetchSourceSummary(manifest.officialProductUrl),
    manifest.secondaryMarketUrl ? fetchSourceSummary(manifest.secondaryMarketUrl) : Promise.resolve(null)
  ]);

  const normalizedOutput = `${JSON.stringify(draft, null, 2)}\n`;

  if (outputPath) {
    const absoluteOutputPath = path.resolve(outputPath);
    await mkdir(path.dirname(absoluteOutputPath), { recursive: true });
    await writeFile(absoluteOutputPath, normalizedOutput, "utf8");
  } else {
    process.stdout.write(normalizedOutput);
  }

  console.error(
    JSON.stringify(
      {
        ok: true,
        insertedDraftId: draft.id,
        officialSource,
        secondarySource,
        warnings: [officialSource.warning, secondarySource?.warning].filter(Boolean),
        outputPath: outputPath ? path.resolve(outputPath) : "<stdout>"
      },
      null,
      2
    )
  );
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exit(1);
});
