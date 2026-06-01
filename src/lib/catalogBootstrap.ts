import fs from "node:fs";
import path from "node:path";
import { BOROUGHS } from "@/data/locations";
import { applyIngestOperation } from "@/lib/ingestOperations";
import { isObsoleteFamilyMeetup, isObsoleteFamilyProvider } from "@/lib/catalogContentPolicy";
import { buildCatalogScopeFilter, getCatalogScope, getMongoDbName, COL } from "@/lib/mongodb";
import type { Db } from "mongodb";
import type { Provider } from "@/types/provider";
import type { MeetupGroup } from "@/types/meetup";

type LaunchPayload = {
  operations?: unknown[];
};

type BootstrapState = {
  promise?: Promise<boolean>;
};

const bootstrapStates = new Map<string, BootstrapState>();

function sanitize(value: string | undefined): string {
  return (value ?? "").replace(/\r/g, "").replace(/\n/g, "").trim();
}

function getBootstrapPayloadPath(): string {
  const configured = sanitize(process.env.CATALOG_LAUNCH_PAYLOAD_PATH);
  if (configured) return configured;
  return path.join(process.cwd(), "scripts/ingest-payloads/operations/compare-hungary-launch-content.json");
}

function getBootstrapEnabled(): boolean {
  const value = sanitize(process.env.CATALOG_BOOTSTRAP_ON_EMPTY);
  if (!value) return false;
  return value.toLowerCase() === "true" || value.toLowerCase() === "1";
}

function getBootstrapKey(scope: string[]): string {
  return `${getMongoDbName()}::${scope.join(",")}`;
}

function readLaunchOperations(): unknown[] {
  const payloadPath = getBootstrapPayloadPath();
  const raw = fs.readFileSync(payloadPath, "utf8");
  const parsed = JSON.parse(raw) as LaunchPayload;
  if (!parsed || typeof parsed !== "object" || !Array.isArray(parsed.operations)) {
    throw new Error(`Invalid launch payload format at ${payloadPath}`);
  }
  return parsed.operations;
}

function normalizeBorough(raw: unknown): string | null {
  if (typeof raw !== "string") return null;
  const cleaned = raw.trim();
  if (!cleaned) return null;
  const normalized = cleaned === "HU" ? "Hungary" : cleaned;
  return BOROUGHS.includes(normalized as never) ? normalized : null;
}

async function hasUsableScopedContent(db: Db): Promise<boolean> {
  const scopeFilter = buildCatalogScopeFilter({});
  const [providers, meetups] = await Promise.all([
    db
      .collection(COL.providers)
      .find(scopeFilter)
      .limit(200)
      .toArray() as unknown as Promise<(Provider & { _id?: unknown })[]>,
    db
      .collection(COL.meetupGroups)
      .find(scopeFilter)
      .limit(200)
      .toArray() as unknown as Promise<(MeetupGroup & { _id?: unknown })[]>,
  ]);

  const hasUsableProvider = providers.some((row) => {
    const borough = normalizeBorough((row as { borough?: unknown }).borough);
    return Boolean(borough) && !isObsoleteFamilyProvider(row);
  });

  const hasUsableMeetup = meetups.some((row) => {
    const borough = normalizeBorough((row as { borough?: unknown }).borough);
    return Boolean(borough) && !isObsoleteFamilyMeetup(row);
  });

  return hasUsableProvider || hasUsableMeetup;
}

export async function ensureLaunchCatalogSeeded(db: Db): Promise<{ seeded: boolean }> {
  const scope = getCatalogScope();
  const key = getBootstrapKey(scope);
  const existing = bootstrapStates.get(key);

  if (existing?.promise) {
    await existing.promise;
    return { seeded: false };
  }

  if (!getBootstrapEnabled()) {
    return { seeded: false };
  }

  const hasUsableContent = await hasUsableScopedContent(db);

  if (hasUsableContent) {
    return { seeded: false };
  }

  const bootstrapPromise = (async () => {
    const operations = readLaunchOperations();
    if (!operations.length) {
      return false;
    }
    for (const operation of operations) {
      const result = await applyIngestOperation(db, operation);
      if (!result.ok) {
        throw new Error((result as { ok: false; error: string }).error);
      }
    }
    return true;
  })();

  bootstrapStates.set(key, { promise: bootstrapPromise });

  try {
    const seeded = await bootstrapPromise;
    return { seeded };
  } finally {
    bootstrapStates.delete(key);
  }
}
