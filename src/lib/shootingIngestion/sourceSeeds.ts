import { sourceSeedDefaults } from "@/lib/shootingIngestion/sourceSeedDefaults";
import type { ShootingSourceSeedRow } from "@/lib/shootingIngestion/types";
import { readFileSync } from "node:fs";

type RawShootingSourceSeed = Partial<ShootingSourceSeedRow> & {
  sourceId?: string;
  sourceClass?: ShootingSourceSeedRow["sourceClass"];
  operatorName?: string;
  operatorType?: ShootingSourceSeedRow["operatorType"];
  canonicalUrl?: string;
  trustTier?: ShootingSourceSeedRow["trustTier"];
  fetchPolicy?: ShootingSourceSeedRow["fetchPolicy"];
};

function getEnvVar(name: string) {
  return process.env[name]?.trim();
}

function sanitizeSeed(seed: RawShootingSourceSeed): ShootingSourceSeedRow | null {
  const sourceClass = seed.sourceClass;
  const sourceId = (seed.sourceId ?? "").trim();
  const operatorName = (seed.operatorName ?? "").trim();
  const canonicalUrl = (seed.canonicalUrl ?? "").trim();
  const operatorType = seed.operatorType ?? "unknown";

  if (!sourceId || !sourceClass || !operatorName || !canonicalUrl) return null;
  if (!Array.isArray(seed.discoveryUrls) || seed.discoveryUrls.length === 0) return null;

  return {
    sourceId,
    sourceClass,
    operatorName,
    operatorType,
    canonicalUrl,
    discoveryUrls: seed.discoveryUrls
      .map((value) => String(value || "").trim())
      .filter(Boolean)
      .filter((value, idx, list) => list.indexOf(value) === idx),
    trustTier: seed.trustTier ?? "community_hint",
    fetchPolicy: seed.fetchPolicy ?? "html",
    robotsStatus: seed.robotsStatus ?? "unknown",
    requiresAuth: Boolean(seed.requiresAuth),
    disciplineHints: Array.isArray(seed.disciplineHints) ? seed.disciplineHints.map((item) => String(item)) : [],
    geoHints: Array.isArray(seed.geoHints) ? seed.geoHints.map((item) => String(item)) : [],
    freshnessSlaHours: Number(seed.freshnessSlaHours) > 0 ? Number(seed.freshnessSlaHours) : 24,
    countryCode: String(seed.countryCode || "HU").trim(),
    sourceNotes: seed.sourceNotes,
  };
}

function readJsonFromEnvOrFile() {
  const filePath = getEnvVar("SHOOTING_SOURCE_SEEDS_FILE");
  if (filePath) {
    try {
      return JSON.parse(readFileSync(filePath, "utf8"));
    } catch {
      return null;
    }
  }

  const raw = getEnvVar("SHOOTING_SOURCE_SEEDS_JSON");
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

function getExternalSourceSeeds() {
  const payload = readJsonFromEnvOrFile();
  if (!Array.isArray(payload)) return [] as ShootingSourceSeedRow[];
  const sanitized = payload
    .map((row) => sanitizeSeed(row as RawShootingSourceSeed))
    .filter((seed): seed is ShootingSourceSeedRow => seed !== null);
  const seen = new Set<string>();
  return sanitized.filter((seed) => {
    const key = `${seed.sourceClass}::${seed.sourceId}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

export function getShootingSourceSeeds(): ShootingSourceSeedRow[] {
  const external = getExternalSourceSeeds();
  const merged = new Map<string, ShootingSourceSeedRow>();

  for (const seed of sourceSeedDefaults) {
    merged.set(seed.sourceId, { ...seed });
  }

  for (const externalSeed of external) {
    const existing = merged.get(externalSeed.sourceId);
    merged.set(
      externalSeed.sourceId,
      existing ? ({ ...existing, ...externalSeed, sourceId: externalSeed.sourceId, discoveryUrls: externalSeed.discoveryUrls }) : externalSeed,
    );
  }

  return Array.from(merged.values());
}
