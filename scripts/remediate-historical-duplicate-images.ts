import dotenv from "dotenv";
import { getDb } from "@/lib/mongodb";
import {
  runHistoricalDuplicateImageRemediation,
  seedHistoricalDuplicateImageQueue,
} from "@/lib/contentIntelligence/historicalImageRemediation";

dotenv.config({ path: ".env.local" });
dotenv.config();

function getArg(name: string, fallback: string) {
  const index = process.argv.findIndex((value) => value === name);
  return index >= 0 ? process.argv[index + 1] || fallback : fallback;
}

function hasFlag(name: string) {
  return process.argv.includes(name);
}

async function main() {
  const db = await getDb();
  if (!db) throw new Error("No database connection available");

  const doSeed = hasFlag("--seed");
  const doRun = hasFlag("--run");
  const limit = Number.parseInt(getArg("--limit", "10"), 10);

  const result: Record<string, unknown> = {};

  if (doSeed || (!doSeed && !doRun)) {
    result.seed = await seedHistoricalDuplicateImageQueue(db, {
      includeNearDuplicates: true,
      nearDuplicateThreshold: 0,
    });
  }

  if (doRun || (!doSeed && !doRun)) {
    result.run = await runHistoricalDuplicateImageRemediation(db, { limit });
  }

  console.log(JSON.stringify(result, null, 2));
}

main().catch((error) => {
  console.error("[remediate-historical-duplicate-images] failed:", error);
  process.exitCode = 1;
});
