const fs = require("fs");
const path = require("path");

const ROOT_DIR = path.join(process.cwd(), "scripts/ingest-payloads");
const CATALOG_DIR = path.join(ROOT_DIR, "catalog");
const OPERATIONS_DIR = path.join(ROOT_DIR, "operations");

function walkJsonFiles(dir) {
  if (!fs.existsSync(dir)) return [];
  const out = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      out.push(...walkJsonFiles(full));
      continue;
    }
    if (entry.isFile() && entry.name.endsWith(".json")) out.push(full);
  }
  return out.sort();
}

function listPayloadFiles(scope = "catalog") {
  if (scope === "operations") return walkJsonFiles(OPERATIONS_DIR);
  if (scope === "all") return [...walkJsonFiles(CATALOG_DIR), ...walkJsonFiles(OPERATIONS_DIR)].sort();
  return walkJsonFiles(CATALOG_DIR);
}

module.exports = {
  ROOT_DIR,
  CATALOG_DIR,
  OPERATIONS_DIR,
  listPayloadFiles,
};
