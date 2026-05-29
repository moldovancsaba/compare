/**
 * Seed only the curated EU launch payload used for webapp bring-up.
 * Uses operation semantics so we can fully replace providers/meetup groups.
 */
import { config as loadEnv } from "dotenv";
import path from "node:path";
import fs from "node:fs";
import { MongoClient } from "mongodb";
import type { Db } from "mongodb";
import { applyIngestOperation } from "../src/lib/ingestOperations";
import { getCatalogScope, getMongoDbName } from "../src/lib/mongodb";

loadEnv({ path: path.join(process.cwd(), ".env") });
loadEnv({ path: path.join(process.cwd(), ".env.local"), override: true });

const uri = process.env.MONGODB_URI;
if (!uri) {
  console.error("Missing MONGODB_URI");
  process.exit(1);
}

const payloadPath = process.argv[2] || path.join(process.cwd(), "scripts/ingest-payloads/operations/rangescout-eu-launch-content.json");

function readPayload(filePath: string) {
  const raw = fs.readFileSync(filePath, "utf8");
  const parsed = JSON.parse(raw);
  if (!parsed || typeof parsed !== "object" || !Array.isArray((parsed as { operations?: unknown }).operations)) {
    throw new Error(`Invalid payload format at ${filePath}`);
  }
  return (parsed as { operations: unknown[] }).operations;
}

async function main() {
  const dbName = getMongoDbName();
  const scope = getCatalogScope();
  const ops = readPayload(payloadPath);
  const client = new MongoClient(uri);

  await client.connect();
  const db: Db = client.db(dbName);

  let ok = 0;
  console.log(`Applying launch payload with catalog scope: ${scope.join(", ")}`);

  for (const op of ops) {
    const result = await applyIngestOperation(db, op);
    if (!result.ok) {
      console.error("FAILED operation:", JSON.stringify(op, null, 2));
      console.error(result.error);
      await client.close();
      process.exit(1);
    }
    ok++;
    const outcome = result.data ? JSON.stringify(result.data) : "{}";
    console.log(`OK op ${ok}:`, outcome);
  }

  const providerCount = await db.collection("providers").countDocuments();
  const meetupCount = await db.collection("meetupGroups").countDocuments();
  console.log(`Launch seed complete. providers=${providerCount}, meetupGroups=${meetupCount}`);
  await client.close();
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
