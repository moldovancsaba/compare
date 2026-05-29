/**
 * Generate high-entropy secrets for local ClassScout development and merge
 * them into `.env.local` (gitignored via `*.local`).
 *
 * Only auto-fills keys the app can mint itself:
 *   INGEST_API_KEY, ADMIN_SESSION_SECRET, ADMIN_PASSWORD
 *
 * Third-party keys (MONGODB_URI, IMGBB_API_KEY, …) are preserved if already set;
 * otherwise left empty for you to paste.
 *
 * Usage:
 *   node scripts/generate-env-secrets.cjs              # merge missing auto-secrets into .env.local
 *   node scripts/generate-env-secrets.cjs --dry-run  # preview only
 *   node scripts/generate-env-secrets.cjs --force    # rotate all auto-generated keys
 *   node scripts/generate-env-secrets.cjs --ingest-only   # rotate INGEST_API_KEY only (then vercel:env:push)
 */
const fs = require("fs");
const path = require("node:path");
const { randomBytes } = require("node:crypto");
const { parse } = require("dotenv");

const root = path.resolve(__dirname, "..");
const envLocalPath = path.join(root, ".env.local");

const AUTO_KEYS = ["INGEST_API_KEY", "ADMIN_SESSION_SECRET", "ADMIN_PASSWORD"];

/** 32 bytes → 64 hex chars (Bearer / shared-secret strength). */
function hex32() {
  return randomBytes(32).toString("hex");
}

/** Memorable-enough random password for local admin login. */
function adminPassword() {
  return randomBytes(18).toString("base64url");
}

const generators = {
  INGEST_API_KEY: hex32,
  ADMIN_SESSION_SECRET: hex32,
  ADMIN_PASSWORD: adminPassword,
};

/** Canonical key order for new / merged files (matches .env.example). */
const KEY_ORDER = [
  "MONGODB_URI",
  "MONGODB_DB",
  "MONGODB_APP_NAME",
  "IMGBB_API_KEY",
  "NEXT_PUBLIC_IMG_BB_HOME_HERO",
  "NEXT_PUBLIC_IMG_BB_DISCOVER_HERO",
  "NEXT_PUBLIC_IMG_BB_FALLBACK_LISTING",
  "NEXT_PUBLIC_IMG_BB_FALLBACK_MEETUP",
  "NEXT_PUBLIC_IMG_BB_GUIDE_CARD",
  "INGEST_API_KEY",
  "INGEST_BASE_URL",
  "ADMIN_PASSWORD",
  "ADMIN_SESSION_SECRET",
];

function loadExisting() {
  if (!fs.existsSync(envLocalPath)) return {};
  try {
    return parse(fs.readFileSync(envLocalPath, "utf8"));
  } catch {
    return {};
  }
}

function isEmpty(v) {
  return v === undefined || v === null || String(v).trim() === "";
}

function escapeValue(val) {
  const s = String(val);
  if (/[\s#"'\\]/.test(s)) return `"${s.replace(/\\/g, "\\\\").replace(/"/g, '\\"')}"`;
  return s;
}

function serialize(env) {
  const header = [
    "# Local secrets & config (gitignored). Do not commit.",
    "# Merged by scripts/generate-env-secrets.cjs — empty keys are omitted so they do not override `.env`.",
    "",
  ];
  const keys = new Set(Object.keys(env));
  const ordered = [...KEY_ORDER.filter((k) => keys.has(k)), ...[...keys].sort((a, b) => a.localeCompare(b))];
  const seen = new Set();
  const lines = [];
  for (const k of ordered) {
    if (seen.has(k)) continue;
    seen.add(k);
    const v = env[k];
    if (v === undefined || v === "") lines.push(`${k}=`);
    else lines.push(`${k}=${escapeValue(v)}`);
  }
  return header.join("\n") + lines.join("\n") + "\n";
}

function main() {
  const dry = process.argv.includes("--dry-run");
  const force = process.argv.includes("--force");
  const ingestOnly = process.argv.includes("--ingest-only");
  const rotateKeys = ingestOnly ? ["INGEST_API_KEY"] : AUTO_KEYS;

  const existing = loadExisting();
  const merged = { ...existing };
  const changes = [];

  for (const key of rotateKeys) {
    const cur = merged[key];
    const need =
      (ingestOnly && key === "INGEST_API_KEY") || (!ingestOnly && (force || isEmpty(cur)));
    if (!need) continue;
    const next = generators[key]();
    const before = isEmpty(cur) ? "(empty)" : "(existing value, replacing)";
    changes.push({ key, before });
    merged[key] = next;
  }

  console.log("ClassScout env secret generator\n");
  console.log("Target file:", envLocalPath);
  if (changes.length === 0) {
    console.log(
      "\nNo changes: use --ingest-only to mint a new INGEST_API_KEY, or --force to rotate all auto-generated keys.",
    );
    process.exit(0);
  }

  console.log("\nPlanned updates (values not printed):");
  for (const c of changes) {
    console.log(`  - ${c.key}: ${c.before} → <new random>`);
  }

  if (dry) {
    console.log("\n--dry-run: not writing. Omit --dry-run to write .env.local");
    process.exit(0);
  }

  // Do not write empty placeholders: they would override real values in `.env`
  // when scripts/load-env.cjs applies `.env.local` with override: true.
  for (const k of Object.keys(merged)) {
    if (isEmpty(merged[k]) && !AUTO_KEYS.includes(k)) delete merged[k];
  }

  fs.writeFileSync(envLocalPath, serialize(merged), { mode: 0o600 });
  try {
    fs.chmodSync(envLocalPath, 0o600);
  } catch {
    /* Windows may ignore mode; best-effort */
  }
  console.log(`\nWrote ${changes.length} secret(s) to .env.local (file mode 0600).`);
  console.log("Add MONGODB_URI / MONGODB_DB / IMGBB_API_KEY manually if not set (see .env.example).");
  console.log("Never commit .env.local.");
}

main();
