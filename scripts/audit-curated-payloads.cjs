#!/usr/bin/env node
const fs = require("fs");
const path = require("path");
const { checkPayloadQuality } = require("./lib/curated-payload-quality.cjs");
const { listPayloadFiles } = require("./lib/payload-files.cjs");

const includeOperations = process.argv.includes("--include-operations");
const files = listPayloadFiles(includeOperations ? "all" : "catalog");

const issues = [];

for (const file of files) {
  const payload = JSON.parse(fs.readFileSync(file, "utf8"));
  const op = payload.operations?.[0];
  if (!op) continue;
  const doc = op.document || {};
  const label = path.relative(process.cwd(), file);

  issues.push(...checkPayloadQuality(payload, { label, skipObsoleteFamilyContent: true }));

  if (op.resource === "provider") {
    const tags = new Set(doc.dayTimeTags || []);
    const badges = new Set(doc.badges || []);
    if (badges.has("Weekend Friendly") && !tags.has("Weekend")) {
      issues.push(`${label}\t${doc.id}\tWeekend Friendly badge without Weekend tag`);
    }
  }
}

if (issues.length) {
  console.log("Curated payload audit found issues:\n");
  for (const issue of issues) console.log(`- ${issue}`);
  process.exit(1);
}

console.log(`Curated payload audit passed for ${files.length} payloads.`);
