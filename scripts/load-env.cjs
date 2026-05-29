/**
 * Preload for `node -r ./scripts/load-env.cjs …` so CLI tools see the same
 * env layering as Next.js: `.env` then `.env.local` (override).
 */
const path = require("node:path");
const dotenv = require("dotenv");

const root = path.resolve(__dirname, "..");
dotenv.config({ path: path.join(root, ".env") });
dotenv.config({ path: path.join(root, ".env.local"), override: true });

for (const key of ["MONGODB_URI", "MONGODB_DB", "MONGODB_DB_NAME"]) {
  const value = process.env[key];
  if (typeof value === "string") {
    process.env[key] = value.replace(/\r/g, "").replace(/\\n/g, "").trim();
  }
}
