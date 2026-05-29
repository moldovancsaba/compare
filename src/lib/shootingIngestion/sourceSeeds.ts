import { sourceSeedDefaults } from "@/lib/shootingIngestion/sourceSeedDefaults";
import type { ShootingSourceSeedRow } from "@/lib/shootingIngestion/types";

export function getShootingSourceSeeds(): ShootingSourceSeedRow[] {
  return sourceSeedDefaults.map((seed) => ({
    ...seed,
  }));
}
