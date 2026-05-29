import { MongoClient, type Db } from "mongodb";
import { PROJECT_KEY } from "@/lib/workflow/projectConfig";

let clientPromise: Promise<MongoClient> | null = null;
let clientPromiseUri: string | null = null;

export function getMongoUri(): string | undefined {
  return sanitizeValue(process.env.MONGODB_URI);
}

function sanitizeValue(value: string | undefined): string {
  return (value ?? "").replace(/\r/g, "").replace(/\\n/g, "").trim();
}

function resolveMongoDbName(value: string | undefined, fallback: string): string {
  return sanitizeValue(value) || fallback;
}

export function getMongoDbName(): string {
  return resolveMongoDbName(
    process.env.MONGODB_DB_NAME ?? process.env.MONGODB_DB,
    PROJECT_KEY,
  );
}

function parseCatalogScope(value: string | undefined): string[] {
  const normalized = sanitizeValue(value) || PROJECT_KEY;
  const parts = normalized.split(",").map((item) => item.trim()).filter(Boolean);
  return parts.length > 0 ? parts : [PROJECT_KEY];
}

export function getCatalogScope(): string[] {
  return parseCatalogScope(process.env.CATALOG_SCOPE);
}

export function buildCatalogScopeFilter<T extends Record<string, unknown>>(filter: T = {} as T) {
  const scope = getCatalogScope();
  const hasSingleScope = scope.length === 1;
  return {
    ...filter,
    catalogProject: hasSingleScope ? scope[0] : { $in: scope },
  };
}

export function normalizeCatalogProject(document: { catalogProject?: string } | undefined) {
  return (
    sanitizeValue(document?.catalogProject) || getCatalogScope()[0] || PROJECT_KEY
  );
}

export async function getMongoClient(): Promise<MongoClient | null> {
  const uri = getMongoUri();
  if (!uri) return null;
  if (clientPromise && clientPromiseUri === uri) return clientPromise;
  clientPromise = MongoClient.connect(uri);
  clientPromiseUri = uri;
  return clientPromise;
}

export async function getDb(): Promise<Db | null> {
  const c = await getMongoClient();
  if (!c) return null;
  const name = getMongoDbName();
  return c.db(name);
}

export const COL = {
  providers: "providers",
  meetupGroups: "meetupGroups",
  locations: "locations",
  site: "site",
  mediaFingerprints: "catalogMediaFingerprints",
  imageRemediationQueue: "catalogImageRemediationQueue",
} as const;
