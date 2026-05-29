require("./load-env.cjs");

/**
 * Push non-empty values from local .env / .env.local to the linked Vercel project.
 * Usage: node -r ./scripts/load-env.cjs scripts/sync-vercel-env.cjs
 *
 * Preview uses `vercel env add … preview ""` (all preview branches). If that
 * step times out, the script continues and prints a warning — set Preview
 * vars in the Vercel dashboard if needed.
 */
const { spawnSync } = require("node:child_process");
const path = require("node:path");

const cwd = path.resolve(__dirname, "..");
const PREVIEW_TIMEOUT_MS = 90_000;

function stripQuotes(v) {
  const s = String(v).trim();
  if ((s.startsWith('"') && s.endsWith('"')) || (s.startsWith("'") && s.endsWith("'"))) {
    return s.slice(1, -1);
  }
  return s;
}

function vercel(args, timeoutMs = 120_000) {
  const env = { ...process.env, CI: "1" };
  const r = spawnSync("vercel", args, {
    cwd,
    stdio: ["ignore", "inherit", "inherit"],
    encoding: "utf8",
    timeout: timeoutMs,
    env,
  });
  if (r.error?.code === "ETIMEDOUT") {
    return { ok: false, timeout: true };
  }
  if (r.status !== 0) {
    return { ok: false, timeout: false };
  }
  return { ok: true };
}

function addSecret(name) {
  const v = stripQuotes(process.env[name] ?? "");
  if (!v) {
    console.log("skip (empty):", name);
    return;
  }
  console.log("sync:", name, "(sensitive prod/preview, plain dev)");

  let r = vercel(["env", "add", name, "production", "--value", v, "--yes", "--sensitive", "--force"]);
  if (!r.ok) {
    console.error("FAILED production:", name);
    process.exit(1);
  }

  r = vercel(
    ["env", "add", name, "preview", "", "--value", v, "--yes", "--sensitive", "--force"],
    PREVIEW_TIMEOUT_MS,
  );
  if (!r.ok) {
    console.warn("WARN: Preview not updated for", name, r.timeout ? "(timeout)" : "(error)");
  }

  r = vercel(["env", "add", name, "development", "--value", v, "--yes", "--force"]);
  if (!r.ok) {
    console.error("FAILED development:", name);
    process.exit(1);
  }
}

function addPlain(name) {
  const v = stripQuotes(process.env[name] ?? "");
  if (!v) {
    console.log("skip (empty):", name);
    return;
  }
  console.log("sync:", name, "(all targets)");

  let r = vercel(["env", "add", name, "production", "--value", v, "--yes", "--force"]);
  if (!r.ok) {
    console.error("FAILED production:", name);
    process.exit(1);
  }

  r = vercel(["env", "add", name, "preview", "", "--value", v, "--yes", "--force"], PREVIEW_TIMEOUT_MS);
  if (!r.ok) {
    console.warn("WARN: Preview not updated for", name, r.timeout ? "(timeout)" : "(error)");
  }

  r = vercel(["env", "add", name, "development", "--value", v, "--yes", "--force"]);
  if (!r.ok) {
    console.error("FAILED development:", name);
    process.exit(1);
  }
}

/**
 * Only variables this deployment uses. Omitted on purpose (set locally if you
 * need them, but not pushed here): INGEST_BASE_URL — see .env.example.
 * Optional curator keys (pushed when non-empty): CRON_SECRET, SERPER_API_KEY,
 * CURATOR_OPENAI_API_KEY, CURATOR_ENABLED, CURATOR_OPENAI_MODEL, CURATOR_OPENAI_BASE_URL.
 * Optional ImgBB CDN URLs for marketing/fallbacks (plain): NEXT_PUBLIC_IMG_BB_* — run `npm run imgbb:upload-assets`.
 */
const secrets = [
  "MONGODB_URI",
  "IMGBB_API_KEY",
  "ADMIN_PASSWORD",
  "ADMIN_SESSION_SECRET",
  "INGEST_API_KEY",
  "CRON_SECRET",
  "SERPER_API_KEY",
  "CURATOR_OPENAI_API_KEY",
];
const plain = [
  "MONGODB_DB",
  "CURATOR_ENABLED",
  "CURATOR_OPENAI_MODEL",
  "CURATOR_OPENAI_BASE_URL",
  "NEXT_PUBLIC_IMG_BB_HOME_HERO",
  "NEXT_PUBLIC_IMG_BB_DISCOVER_HERO",
  "NEXT_PUBLIC_IMG_BB_FALLBACK_LISTING",
  "NEXT_PUBLIC_IMG_BB_FALLBACK_MEETUP",
  "NEXT_PUBLIC_IMG_BB_GUIDE_CARD",
];

for (const n of secrets) addSecret(n);
for (const n of plain) addPlain(n);

console.log("Done. Run: vercel env ls");
