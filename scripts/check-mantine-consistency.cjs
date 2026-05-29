#!/usr/bin/env node
const fs = require("fs");
const path = require("path");

const ROOT = process.cwd();
const SRC = path.join(ROOT, "src");

const bannedImports = [
  "@radix-ui/",
  "sonner",
  "next-themes",
  "vaul",
  "react-day-picker",
  "cmdk",
  "input-otp",
];

const staleGdsRefs = [
  "MANTINE_PLATFORM.md",
  "MANTINE_RUNTIME.md",
  "COMPONENT_CONTRACTS.md",
  "NAVIGATION_RESPONSIVE.md",
  "UX_PATTERNS.md",
  "GOVERNANCE.md",
  "IMPLEMENTATION_READINESS.md",
];

const protectedMantineSurfaces = [
  path.join(ROOT, "src", "app", "not-found.tsx"),
  path.join(ROOT, "src", "components", "scout", "Sidebar.tsx"),
  path.join(ROOT, "src", "components", "scout", "EmptyState.tsx"),
  path.join(ROOT, "src", "components", "scout", "ProviderCard.tsx"),
  path.join(ROOT, "src", "components", "scout", "MeetupGroupCard.tsx"),
  path.join(ROOT, "src", "components", "scout", "Filters.tsx"),
  path.join(ROOT, "src", "components", "scout", "BoroughBar.tsx"),
  path.join(ROOT, "src", "components", "scout", "NeighborhoodChips.tsx"),
  path.join(ROOT, "src", "components", "scout", "ClassScoutShell.tsx"),
  path.join(ROOT, "src", "components", "scout", "views", "DiscoverView.tsx"),
  path.join(ROOT, "src", "components", "scout", "views", "HomeView.tsx"),
  path.join(ROOT, "src", "components", "scout", "views", "MeetupGroupsView.tsx"),
  path.join(ROOT, "src", "components", "scout", "views", "MyAccountView.tsx"),
  path.join(ROOT, "src", "components", "scout", "panels", "ProviderProfile.tsx"),
  path.join(ROOT, "src", "components", "scout", "panels", "MeetupGroupProfile.tsx"),
];

const violations = [];

function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function walk(dir) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      walk(full);
      continue;
    }
    if (!/\.(ts|tsx|js|jsx|md)$/.test(entry.name)) continue;

    const rel = path.relative(ROOT, full);
    const text = fs.readFileSync(full, "utf8");

    for (const banned of bannedImports) {
      if (text.includes(banned)) {
        violations.push(`${rel}: banned import/reference "${banned}"`);
      }
    }

    if (rel.startsWith(path.join("src", "components", "ui") + path.sep)) {
      violations.push(`${rel}: legacy ui wrapper directory must remain empty`);
    }

    if (text.includes("@/components/ui/")) {
      violations.push(`${rel}: imports from removed ui wrapper directory are prohibited`);
    }
  }
}

walk(SRC);

for (const doc of [path.join(ROOT, "README.md"), path.join(ROOT, "docs", "design-system-adapter.md")]) {
  const rel = path.relative(ROOT, doc);
  const text = fs.readFileSync(doc, "utf8");
  if (text.includes("shadcn/sonner infrastructure")) {
    violations.push(`${rel}: stale pre-Mantine wording remains`);
  }
}

for (const doc of [
  path.join(ROOT, "README.md"),
  path.join(ROOT, "docs", "design-system-adapter.md"),
  path.join(ROOT, "docs", "architecture.md"),
  path.join(ROOT, "docs", "operations.md"),
]) {
  const rel = path.relative(ROOT, doc);
  const text = fs.readFileSync(doc, "utf8");
  for (const staleRef of staleGdsRefs) {
    const pattern = new RegExp("(^|[\\s\\(/\\[\\`])" + escapeRegExp(staleRef) + "($|[\\s\\)\\]\\`])");
    if (pattern.test(text)) {
      violations.push(`${rel}: stale GDS reference "${staleRef}" remains`);
    }
  }
}

for (const file of protectedMantineSurfaces) {
  const rel = path.relative(ROOT, file);
  const text = fs.readFileSync(file, "utf8");
  if (
    text.includes('className="') ||
    text.includes("className={`") ||
    text.includes("className={cn(") ||
    text.includes("className={") ||
    text.includes(" cn(")
  ) {
    violations.push(`${rel}: Mantine-first surface still contains Tailwind-heavy className composition`);
  }
}

if (violations.length) {
  console.error("Mantine consistency check failed:\n");
  for (const line of violations) console.error(`- ${line}`);
  process.exit(1);
}

console.log("Mantine consistency check passed.");
