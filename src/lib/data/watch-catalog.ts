import rawCatalogDocument from "@/lib/data/watch-catalog.v1.json";
import { parseWatchCatalogDocument, watchCatalogDocumentVersion } from "@/lib/data/watch-catalog-schema";

const watchCatalogDocument = parseWatchCatalogDocument(rawCatalogDocument);

export const watchCatalog = watchCatalogDocument.watches;
export const watchCatalogVersion = watchCatalogDocumentVersion;
