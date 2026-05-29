import type {
  ShootingSourceInventoryReport,
  ShootingSourceSeedRow,
  ShootingSourceStatus,
  ShootingSourceInventoryRow,
  ShootingSourceHealth,
} from "@/lib/shootingIngestion/types";
import { classifyShootingSource } from "@/lib/shootingIngestion/sourceClassifier";

const DEFAULT_USER_AGENT = "RangeScoutIngestion/1.0 (+https://rangescout.vercel.app)";
const DEFAULT_FETCH_TIMEOUT_MS = 12_000;

export interface SourceValidationError {
  sourceId: string;
  field: string;
  message: string;
}

export interface SourceInventoryBuildOptions {
  seeds: ShootingSourceSeedRow[];
  nowIso?: string;
  includeValidationErrors?: boolean;
  sourceFetchTimeoutMs?: number;
}

function normalizeUrl(raw: string) {
  try {
    return new URL(raw.trim()).toString();
  } catch {
    return "";
  }
}

function validateSeed(seed: ShootingSourceSeedRow) {
  const errors: SourceValidationError[] = [];
  if (!seed.sourceId?.trim()) errors.push({ sourceId: seed.sourceId || "unknown", field: "sourceId", message: "sourceId is required" });
  if (!seed.operatorName?.trim()) errors.push({ sourceId: seed.sourceId, field: "operatorName", message: "operatorName is required" });
  if (!seed.canonicalUrl?.trim() || !normalizeUrl(seed.canonicalUrl))
    errors.push({ sourceId: seed.sourceId, field: "canonicalUrl", message: "canonicalUrl is invalid" });
  if (!seed.discoveryUrls?.length)
    errors.push({ sourceId: seed.sourceId, field: "discoveryUrls", message: "discoveryUrls should contain at least one URL" });
  if (!seed.countryCode?.trim()) errors.push({ sourceId: seed.sourceId, field: "countryCode", message: "countryCode is required" });
  if (!seed.freshnessSlaHours || seed.freshnessSlaHours <= 0)
    errors.push({ sourceId: seed.sourceId, field: "freshnessSlaHours", message: "freshnessSlaHours should be > 0" });
  return errors;
}

function buildSeedValidationMap(seedRows: ShootingSourceSeedRow[]) {
  const canonicalSeen = new Set<string>();
  const sourceIdSeen = new Set<string>();
  const deduped: ShootingSourceSeedRow[] = [];
  let duplicates = 0;
  const errors: SourceValidationError[] = [];

  for (const seed of seedRows) {
    const canonical = normalizeUrl(seed.canonicalUrl) || seed.canonicalUrl;
    if (canonicalSeen.has(canonical)) {
      errors.push({ sourceId: seed.sourceId, field: "canonicalUrl", message: "duplicate canonical URL removed" });
      duplicates += 1;
      continue;
    }
    if (sourceIdSeen.has(seed.sourceId)) {
      errors.push({ sourceId: seed.sourceId, field: "sourceId", message: "duplicate sourceId removed" });
      duplicates += 1;
      continue;
    }
    canonicalSeen.add(canonical);
    sourceIdSeen.add(seed.sourceId);
    deduped.push(seed);
  }

  return { deduped, duplicates, errors };
}

function deriveStatus(seed: ShootingSourceSeedRow, health: Omit<ShootingSourceHealth, "status">): ShootingSourceStatus {
  if (health.httpStatus === 401 || health.httpStatus === 403) return "blocked";
  if (!health.reachable && health.httpStatus === null) return "timeout";
  if (!health.reachable) return "failed";
  if (seed.fetchPolicy === "manual_only" || seed.requiresAuth) return "inactive";
  return "active";
}

async function fetchHealth(checkUrl: string, timeoutMs: number) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const response = await fetch(checkUrl, {
      method: "HEAD",
      headers: {
        "User-Agent": DEFAULT_USER_AGENT,
      },
      signal: controller.signal,
      redirect: "follow",
    });
    return {
      httpStatus: response.status,
      reachable: response.ok || (response.status >= 300 && response.status < 400),
      requiresAuth: response.status === 401 || response.status === 403,
      lastCheckedAt: new Date().toISOString(),
    } satisfies Omit<ShootingSourceHealth, "status">;
  } catch {
    return {
      httpStatus: null,
      reachable: false,
      requiresAuth: false,
      lastCheckedAt: new Date().toISOString(),
    } satisfies Omit<ShootingSourceHealth, "status">;
  } finally {
    clearTimeout(timeout);
  }
}

function toInventoryRow(seed: ShootingSourceSeedRow, nowIso: string, sourceHealth: Omit<ShootingSourceHealth, "status">): ShootingSourceInventoryRow {
  const classification = classifyShootingSource({ seed });
  const normalizedCanonical = normalizeUrl(seed.canonicalUrl) || seed.canonicalUrl;

  const row: ShootingSourceInventoryRow = {
    sourceId: seed.sourceId,
    sourceClass: seed.sourceClass,
    operatorName: seed.operatorName,
    operatorType: seed.operatorType,
    canonicalUrl: normalizedCanonical,
    discoveryUrls: [...new Set(seed.discoveryUrls)],
    trustTier: seed.trustTier,
    fetchPolicy: seed.fetchPolicy,
    robotsStatus: seed.robotsStatus,
    requiresAuth: seed.requiresAuth,
    disciplineHints: [...seed.disciplineHints],
    geoHints: [...seed.geoHints],
    freshnessSlaHours: seed.freshnessSlaHours,
    countryCode: seed.countryCode,
    sourceNotes: seed.sourceNotes,
    normalizedUrl: normalizedCanonical,
    extractorHint: classification.extractorHint,
    routedExtractor: classification.routedExtractor,
    manualReviewRequired: classification.manualReviewRequired,
    sourceStatus: deriveStatus(seed, sourceHealth),
    health: { ...sourceHealth, status: "unknown" },
    scrapedAt: nowIso,
  };
  row.health = {
    ...sourceHealth,
    status: deriveStatus(seed, sourceHealth),
  };
  return row;
}

export async function buildShootingSourceInventory(
  options: SourceInventoryBuildOptions,
): Promise<ShootingSourceInventoryReport> {
  const {
    seeds,
    nowIso = new Date().toISOString(),
    includeValidationErrors = true,
    sourceFetchTimeoutMs = DEFAULT_FETCH_TIMEOUT_MS,
  } = options;

  const seedErrors: SourceValidationError[] = [];
  const { deduped, duplicates, errors } = buildSeedValidationMap(seeds);
  seedErrors.push(...errors);

  if (includeValidationErrors) {
    for (const seed of deduped) {
      seedErrors.push(...validateSeed(seed));
    }
  }

  const validSeeds = deduped.filter((seed) =>
    !seedErrors.some((error) => error.sourceId === seed.sourceId),
  );

  const healthRows = await Promise.all(
    validSeeds.map(async (seed) => {
      const targetUrl = normalizeUrl(seed.canonicalUrl);
      if (!targetUrl) {
        return {
          seed,
          health: {
            httpStatus: null,
            reachable: false,
            requiresAuth: seed.requiresAuth,
            lastCheckedAt: new Date().toISOString(),
          },
        };
      }
      const health = await fetchHealth(targetUrl, sourceFetchTimeoutMs);
      return { seed, health };
    }),
  );

  const rows: ShootingSourceInventoryRow[] = healthRows.map(({ seed, health }) =>
    toInventoryRow(seed, nowIso, health),
  );


  return {
    generatedAt: nowIso,
    sourceHost: "hungary-shooting",
    totalSeeds: seeds.length,
    totalRows: rows.length,
    activeRows: rows.filter((row) => row.sourceStatus === "active").length,
    blockedRows: rows.filter((row) => row.sourceStatus === "blocked").length,
    timeoutRows: rows.filter((row) => row.sourceStatus === "timeout").length,
    failedRows: rows.filter((row) => row.sourceStatus === "failed").length,
    duplicateRowsRemoved: duplicates,
    sourceValidationErrors: seedErrors,
    rows,
  };
}

function renderSummaryLine(report: ShootingSourceInventoryReport) {
  const lines = [
    "# Hungary-first Shooting Source Inventory",
    "",
    `Generated: ${report.generatedAt}`,
    `Source host: ${report.sourceHost}`,
    `Seeds loaded: ${report.totalSeeds}`,
    `Rows produced: ${report.totalRows}`,
    `Active rows: ${report.activeRows}`,
    `Blocked rows: ${report.blockedRows}`,
    `Timeout rows: ${report.timeoutRows}`,
    `Failed rows: ${report.failedRows}`,
    `Duplicate rows removed: ${report.duplicateRowsRemoved}`,
    `Validation errors: ${report.sourceValidationErrors.length}`,
    "",
    "## Rows",
  ];
  return lines.join("\n");
}

function renderRow(row: ShootingSourceInventoryRow) {
  return [
    `- ${row.sourceId}: ${row.sourceClass} @ ${row.canonicalUrl}`,
    `  - status: ${row.sourceStatus}`,
    `  - extractor: ${row.extractorHint} via ${row.routedExtractor}`,
    `  - trust: ${row.trustTier}, fetchPolicy: ${row.fetchPolicy}, requiresAuth: ${row.requiresAuth ? "yes" : "no"}`,
    `  - health: ${row.health?.status ?? "unknown"} (${row.health?.httpStatus ?? "n/a"})`,
    `  - disciplines: ${row.disciplineHints.join(", ") || "(none)"}`,
    `  - geo: ${row.geoHints.join(", ") || "(none)"}`,
  ];
}

export function renderShootingSourceInventoryMarkdown(report: ShootingSourceInventoryReport) {
  const lines = [renderSummaryLine(report)];
  for (const row of report.rows) {
    lines.push(...renderRow(row));
  }

  if (report.sourceValidationErrors.length) {
    lines.push("");
    lines.push("## Validation Errors");
    for (const error of report.sourceValidationErrors) {
      lines.push(`- [${error.sourceId}] ${error.field}: ${error.message}`);
    }
  }
  return `${lines.join("\n")}\n`;
}
