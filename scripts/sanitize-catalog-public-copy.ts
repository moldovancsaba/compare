import { config as loadEnv } from "dotenv";
import path from "node:path";
import { MongoClient, type Db } from "mongodb";
import type { MeetupGroup } from "../src/types/meetup";
import type { Provider } from "../src/types/provider";
import { buildCatalogScopeFilter, getCatalogScope, getMongoDbName } from "../src/lib/mongodb";
import { sanitizeMeetupForPublic, sanitizeProviderForPublic } from "../src/lib/contentIntelligence/publicCopySanitizer";

loadEnv({ path: path.join(process.cwd(), ".env") });
loadEnv({ path: path.join(process.cwd(), ".env.local"), override: true });

const uri = process.env.MONGODB_URI;
const args = new Set(process.argv.slice(2));

if (!uri) {
  console.error("Missing MONGODB_URI");
  process.exit(1);
}

const dryRun = args.has("--dry-run") || args.has("--dryrun");
const runProviders = args.has("--meetups-only") ? false : true;
const runMeetups = args.has("--providers-only") ? false : true;
const dbName = getMongoDbName();
const scopeFilter = buildCatalogScopeFilter({});
const scope = getCatalogScope();

function summarize(ids: string[]) {
  const sample = ids.slice(0, 20).join(", ");
  return ids.length > 20 ? `${sample}, ... +${ids.length - 20}` : sample;
}

async function sanitizeProviders(db: Db) {
  const rows = (await db.collection("providers").find(scopeFilter).toArray()) as unknown as Array<Provider & { _id: unknown }>;
  const changedIds: string[] = [];
  const cleanedIds: string[] = [];

  for (const row of rows) {
    const result = sanitizeProviderForPublic(row);
    const changed = result.changed;
    if (result.removedTerms.length > 0) {
      cleanedIds.push(row.id);
    }

    if (changed && runProviders) {
      if (!dryRun) {
        await db.collection("providers").replaceOne({ _id: row._id }, result.payload as never);
      }
      changedIds.push(row.id);
    }
  }

  return {
    total: rows.length,
    changed: changedIds.length,
    cleaned: cleanedIds.length,
    sampleChanged: summarize(changedIds),
    sampleCleaned: summarize(cleanedIds),
  };
}

async function sanitizeMeetups(db: Db) {
  const rows = (await db.collection("meetupGroups").find(scopeFilter).toArray()) as unknown as Array<MeetupGroup & { _id: unknown }>;
  const changedIds: string[] = [];
  const cleanedIds: string[] = [];

  for (const row of rows) {
    const result = sanitizeMeetupForPublic(row);
    if (result.removedTerms.length > 0) {
      cleanedIds.push(row.id);
    }
    if (result.changed) {
      if (!dryRun) {
        await db.collection("meetupGroups").replaceOne({ _id: row._id }, result.payload as never);
      }
      changedIds.push(row.id);
    }
  }

  return {
    total: rows.length,
    changed: changedIds.length,
    cleaned: cleanedIds.length,
    sampleChanged: summarize(changedIds),
    sampleCleaned: summarize(cleanedIds),
  };
}

async function main() {
  const client = new MongoClient(uri);
  await client.connect();
  const db = client.db(dbName);

  const [providers, meetups] = await Promise.all([
    runProviders ? sanitizeProviders(db) : Promise.resolve({ total: 0, changed: 0, cleaned: 0, sampleChanged: "", sampleCleaned: "" }),
    runMeetups ? sanitizeMeetups(db) : Promise.resolve({ total: 0, changed: 0, cleaned: 0, sampleChanged: "", sampleCleaned: "" }),
  ]);

  console.log(
    JSON.stringify(
      {
        ok: true,
        dryRun,
        scope,
        providers: {
          ...providers,
          executedWrite: runProviders && !dryRun,
        },
        meetups: {
          ...meetups,
          executedWrite: runMeetups && !dryRun,
        },
      },
      null,
      2,
    ),
  );

  await client.close();
}

main().catch((error) => {
  console.error("[sanitize-catalog-public-copy] failed:", error);
  process.exit(1);
});
