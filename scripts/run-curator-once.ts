/**
 * Run one curator discovery cycle locally (same logic as GET /api/cron/curator).
 *
 * Usage from repo root:
 *   npm run curator:run
 *
 * Requires in .env / .env.local:
 *   CURATOR_ENABLED=true, SERPER_API_KEY, CURATOR_OPENAI_API_KEY, MONGODB_URI
 */
import { config as loadEnv } from "dotenv";
import path from "node:path";

loadEnv({ path: path.join(process.cwd(), ".env") });
loadEnv({ path: path.join(process.cwd(), ".env.local"), override: true });

async function main() {
  process.env.CURATOR_ENABLED = "true";
  const { getDb } = await import("../src/lib/mongodb");
  const { runCuratorDiscovery } = await import("../src/lib/curator/runCuratorDiscovery");

  const db = await getDb();
  if (!db) {
    console.error("No database (MONGODB_URI?)");
    process.exit(1);
  }
  const result = await runCuratorDiscovery(db);
  console.log(JSON.stringify(result, null, 2));
  if (!result.ok) process.exit(1);
  if (result.action === "skipped") process.exit(0);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
