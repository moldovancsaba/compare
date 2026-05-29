/**
 * Seed MongoDB with borough/neighborhood reference rows and site defaults.
 * Run from repo root: npm run db:seed
 *
 * Does **not** insert demo providers or meet-up groups — add real listings via /admin or `npm run ingest:listing`.
 */
import { config as loadEnv } from "dotenv";
import path from "node:path";

loadEnv({ path: path.join(process.cwd(), ".env") });
loadEnv({ path: path.join(process.cwd(), ".env.local"), override: true });
import { MongoClient } from "mongodb";
import { NEIGHBORHOODS, BOROUGHS } from "../src/data/locations";
import { DEFAULT_SITE } from "../src/types/site";

const uri = process.env.MONGODB_URI;
if (!uri) {
  console.error("Missing MONGODB_URI");
  process.exit(1);
}

const dbName = (process.env.MONGODB_DB_NAME ?? process.env.MONGODB_DB ?? "rangescout").trim();

async function main() {
  const client = new MongoClient(uri);
  await client.connect();
  const db = client.db(dbName);

  await db.collection("providers").deleteMany({});
  await db.collection("meetupGroups").deleteMany({});

  const locs = BOROUGHS.map((borough) => ({ borough, neighborhoods: NEIGHBORHOODS[borough] }));
  await db.collection("locations").deleteMany({});
  await db.collection("locations").insertMany(locs);

  await db.collection("site").updateOne(
    { _id: "main" },
    { $set: { _id: "main", ...DEFAULT_SITE } },
    { upsert: true },
  );
  console.log("Seed complete: cleared providers and meetup groups; seeded borough locations + site defaults.");
  await client.close();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
