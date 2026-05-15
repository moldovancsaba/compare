import rawCatalogDocument from "@/lib/data/watch-catalog.v1.json";
import {
  buildWatchCatalogDocument,
  parseWatchCatalogDocument,
  parseWatchSpec,
  watchCatalogDocumentVersion
} from "@/lib/data/watch-catalog-schema";
import { describe, expect, it } from "vitest";

describe("watch catalog schema", () => {
  it("parses the checked-in catalog document", () => {
    const parsed = parseWatchCatalogDocument(rawCatalogDocument);

    expect(parsed.version).toBe(watchCatalogDocumentVersion);
    expect(parsed.watches).toHaveLength(6);
    expect(parsed.watches[0]?.id).toBe("rolex-air-king-126900");
  });

  it("rejects duplicate aliases across the catalog with an actionable path", () => {
    const parsed = parseWatchCatalogDocument(rawCatalogDocument);
    const duplicate = JSON.parse(JSON.stringify(parsed));
    duplicate.watches[1].aliases[0] = duplicate.watches[0].aliases[0];

    expect(() => parseWatchCatalogDocument(duplicate)).toThrowError(
      /watches\.1\.aliases\.0: Duplicate alias already used by watches\[0\]/
    );
  });

  it("rejects duplicate aliases within a watch row", () => {
    const parsed = parseWatchCatalogDocument(rawCatalogDocument);
    const duplicate = JSON.parse(JSON.stringify(parsed.watches[0]));
    duplicate.aliases = ["air king", "Air King", "air king"];

    expect(() => parseWatchSpec(duplicate)).toThrowError(/aliases\.1: Duplicate alias in watch entry: Air King/);
  });

  it("builds a validated catalog document from watch rows", () => {
    const parsed = parseWatchCatalogDocument(rawCatalogDocument);
    const rebuilt = buildWatchCatalogDocument(parsed.watches);

    expect(rebuilt.version).toBe(1);
    expect(rebuilt.watches).toHaveLength(parsed.watches.length);
  });
});
