import { MongoClient, type Db } from "mongodb";

let clientPromise: Promise<MongoClient> | null = null;
let clientPromiseUri: string | null = null;

export function getMongoUri(): string | undefined {
  return process.env.MONGODB_URI;
}

function resolveMongoDbName(value: string | undefined, fallback: string): string {
  return (value ?? fallback).trim();
}

export function getMongoDbName(): string {
  return resolveMongoDbName(
    process.env.MONGODB_DB_NAME ?? process.env.MONGODB_DB,
    "rangescout"
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
