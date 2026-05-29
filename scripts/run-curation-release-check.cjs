#!/usr/bin/env node
const { spawnSync } = require("child_process");

const steps = [
  { label: "Curated payload audit", cmd: "npm", args: ["run", "audit:curated"] },
  { label: "Live catalog audit", cmd: "npm", args: ["run", "catalog:audit"] },
  { label: "Scarcity report", cmd: "npm", args: ["run", "scarcity:report"] },
];

for (const step of steps) {
  console.log(`\n==> ${step.label}`);
  const result = spawnSync(step.cmd, step.args, { stdio: "inherit", shell: false });
  if (result.status !== 0) process.exit(result.status || 1);
}

console.log("\nCuration release check passed.");
