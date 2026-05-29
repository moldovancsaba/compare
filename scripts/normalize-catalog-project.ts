/**
 * Ensure legacy catalog documents inherit the active scope project key.
 * Run after introducing catalog scoping: `npx tsx scripts/normalize-catalog-project.ts`
 */
import { config as loadEnv } from "dotenv";
import path from "node:path";
import { MongoClient } from "mongodb";
import { PROJECT_KEY } from "../src/lib/workflow/projectConfig";
import { getCatalogScope, getMongoDbName } from "../src/lib/mongodb";

loadEnv({ path: path.join(process.cwd(), ".env") });
loadEnv({ path: path.join(process.cwd(), ".env.local"), override: true });

const uri = process.env.MONGODB_URI;
if (!uri) {
  console.error("Missing MONGODB_URI");
  process.exit(1);
}

function resolveScopeProject(): string {
  const envScope = getCatalogScope();
  if (envScope.length > 0) return envScope[0];
  const legacy = process.env.CATALOG_SCOPE?.trim();
  if (legacy) return legacy;
  return PROJECT_KEY;
}

async function main() {
  const dbName = getMongoDbName();
  const catalogProject = resolveScopeProject();
  const client = new MongoClient(uri);
  await client.connect();
  const db = client.db(dbName);

  const [providersResult, meetupResult] = await Promise.all([
    db.collection("providers").updateMany(
      { catalogProject: { $exists: false } },
      { $set: { catalogProject } },
    ),
    db.collection("meetupGroups").updateMany(
      { catalogProject: { $exists: false } },
      { $set: { catalogProject } },
    ),
  ]);

  console.log(
    `Normalized legacy catalog documents in ${dbName} to catalogProject="${catalogProject}"`,
  );
  console.log(
    `Providers updated: ${providersResult.modifiedCount}/${providersResult.matchedCount}, meetups updated: ${meetupResult.modifiedCount}/${meetupResult.matchedCount}`,
  );

  await client.close();
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
