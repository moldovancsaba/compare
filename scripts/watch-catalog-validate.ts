import { readFile } from "node:fs/promises";
import path from "node:path";

const catalogPath = path.resolve("src/lib/data/watch-catalog.v1.json");
const rawCatalogDocument = JSON.parse(await readFile(catalogPath, "utf8")) as unknown;
const { parseWatchCatalogDocument } = (await import(
  new URL("../src/lib/data/watch-catalog-schema.ts", import.meta.url).href
)) as typeof import("../src/lib/data/watch-catalog-schema");
const catalog = parseWatchCatalogDocument(rawCatalogDocument);

console.log(
  JSON.stringify(
    {
      ok: true,
      version: catalog.version,
      watches: catalog.watches.length
    },
    null,
    2
  )
);
