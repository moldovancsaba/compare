import { MongoClient, type Db } from "mongodb";

let clientPromise: Promise<MongoClient> | null = null;
let clientPromiseUri: string | null = null;

export function getMongoUri(): string | undefined {
  return process.env.MONGODB_URI;
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
  const name = process.env.MONGODB_DB ?? "rangescout";
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
