import type { Db } from "mongodb";
import { COL, buildCatalogScopeFilter, normalizeCatalogProject } from "@/lib/mongodb";
import { syncCatalogImageFingerprintForEntity } from "@/lib/contentIntelligence/catalogImageUniqueness";
import type { UploadedImageResult } from "@/lib/contentIntelligence/mediaPipeline";
import type { PublishGateResult } from "@/lib/contentIntelligence/publishGate";
import type { MeetupGroup } from "@/types/meetup";
import type { Provider } from "@/types/provider";
import { sanitizeMeetupForPublic, sanitizeProviderForPublic } from "@/lib/contentIntelligence/publicCopySanitizer";

export interface PublishRequest {
  draftId: string;
  entityKind: "provider" | "meetupGroup";
  draftPayload: Provider | MeetupGroup;
  gateResult: PublishGateResult;
  idempotencyKey: string;
  mediaResult?: UploadedImageResult | null;
  workflowMetadata?: Record<string, unknown>;
}

export interface PublishResult {
  status: "published" | "blocked" | "partial";
  publishedEntityId: string;
  publishedEntityType: "provider" | "meetupGroup";
  privateVerification: { verified: boolean; checkedAt: string; verificationSource: string; summary: string };
  publicVerification: {
    verified: boolean;
    checkedAt: string;
    verificationSource: string;
    summary: string;
    attemptsUsed?: number;
    candidateDomain?: string | null;
    publicUrl?: string | null;
  };
  publicUrl?: string | null;
  auditRef: string;
  retryable: boolean;
  diagnostics: string[];
  callbackResult?: {
    ok: boolean;
    skipped: boolean;
    status?: number;
  };
}

type VerificationOptions = {
  origin?: string;
  publicVerificationAttempts?: number;
  publicVerificationDelayMs?: number;
  fetchImpl?: typeof fetch;
  sleep?: (ms: number) => Promise<void>;
};

function inferCandidateDomainFromDraft(draftPayload: Provider | MeetupGroup) {
  const candidateUrl =
    typeof (draftPayload as Provider).website === "string" && (draftPayload as Provider).website.trim()
      ? (draftPayload as Provider).website.trim()
      : typeof (draftPayload as MeetupGroup).website === "string" && (draftPayload as MeetupGroup).website.trim()
        ? (draftPayload as MeetupGroup).website.trim()
        : "";
  if (!candidateUrl) return null;
  try {
    return new URL(candidateUrl).hostname.trim().toLowerCase();
  } catch {
    return null;
  }
}

async function verifyPrivatePublish(db: Db, entityKind: "provider" | "meetupGroup", id: string) {
  const collection = entityKind === "provider" ? COL.providers : COL.meetupGroups;
  const doc = await db.collection(collection).findOne(buildCatalogScopeFilter({ id }));
  return {
    verified: Boolean(doc),
    checkedAt: new Date().toISOString(),
    verificationSource: "private-mongodb",
    summary: doc ? "Entity persisted in private MongoDB." : "Entity missing from private MongoDB after publish.",
  };
}

function publicEntityMatchesDraft(
  entityKind: "provider" | "meetupGroup",
  row: Record<string, unknown> | undefined,
  draftPayload: Provider | MeetupGroup,
) {
  if (!row || row.id !== draftPayload.id) return false;

  if (entityKind === "provider") {
    return (
      row.name === (draftPayload as Provider).name &&
      row.borough === (draftPayload as Provider).borough &&
      row.neighborhood === (draftPayload as Provider).neighborhood &&
      row.image === (draftPayload as Provider).image
    );
  }

  return (
    row.name === (draftPayload as MeetupGroup).name &&
    row.borough === (draftPayload as MeetupGroup).borough &&
    row.neighborhood === (draftPayload as MeetupGroup).neighborhood &&
    row.coverImageUrl === (draftPayload as MeetupGroup).coverImageUrl
  );
}

async function verifyPublicPublish(
  origin: string | undefined,
  entityKind: "provider" | "meetupGroup",
  draftPayload: Provider | MeetupGroup,
  options: VerificationOptions = {},
) {
  const candidateDomain = inferCandidateDomainFromDraft(draftPayload);
  const publicUrl = origin
    ? `${origin}/?${entityKind === "provider" ? "provider" : "meetup"}=${encodeURIComponent(draftPayload.id)}`
    : null;
  if (!origin) {
    return {
      verified: false,
      checkedAt: new Date().toISOString(),
      verificationSource: "public-api-skipped",
      summary: "Public verification skipped because no origin was provided.",
      attemptsUsed: 0,
      candidateDomain,
      publicUrl,
    };
  }
  const endpoint = entityKind === "provider" ? "providers" : "meetup-groups";
  const attempts = Math.max(1, options.publicVerificationAttempts ?? 3);
  const delayMs = Math.max(0, options.publicVerificationDelayMs ?? 750);
  const fetchImpl = options.fetchImpl ?? fetch;
  const sleep = options.sleep ?? ((ms: number) => new Promise((resolve) => setTimeout(resolve, ms)));

  let lastFailureSummary = "Public API verification did not run.";
  let verified = false;

  for (let attempt = 1; attempt <= attempts; attempt += 1) {
    const response = await fetchImpl(`${origin}/api/public/${endpoint}`, { cache: "no-store" });
    if (!response.ok) {
      lastFailureSummary = `Public API verification failed with status ${response.status} on attempt ${attempt}/${attempts}.`;
    } else {
      const rows = (await response.json()) as Array<Record<string, unknown>>;
      const publicRow = rows.find((row) => row.id === draftPayload.id);
      verified = publicEntityMatchesDraft(entityKind, publicRow, draftPayload);
      if (verified) {
        return {
          verified: true,
          checkedAt: new Date().toISOString(),
          verificationSource: "public-api",
          summary: `Entity is visible in the public API and matches the published draft after ${attempt} attempt(s).`,
          attemptsUsed: attempt,
          candidateDomain,
          publicUrl,
        };
      }
      lastFailureSummary = `Entity was not yet visible with matching public fields on attempt ${attempt}/${attempts}.`;
    }

    if (attempt < attempts) {
      await sleep(delayMs);
    }
  }

  return {
    verified: false,
    checkedAt: new Date().toISOString(),
    verificationSource: "public-api",
    summary: lastFailureSummary,
    attemptsUsed: attempts,
    candidateDomain,
    publicUrl,
  };
}

export async function publishApprovedDraft(
  db: Db,
  input: PublishRequest,
  options: VerificationOptions = {},
): Promise<PublishResult> {
  if (!input.gateResult.approved) {
    return {
      status: "blocked",
      publishedEntityId: "blocked",
      publishedEntityType: input.entityKind,
      privateVerification: {
        verified: false,
        checkedAt: new Date().toISOString(),
        verificationSource: "publish-gate",
        summary: "The publish gate blocked this draft.",
      },
      publicVerification: {
        verified: false,
        checkedAt: new Date().toISOString(),
        verificationSource: "publish-gate",
        summary: "The publish gate blocked this draft.",
        publicUrl: null,
      },
      publicUrl: null,
      auditRef: input.idempotencyKey,
      retryable: false,
      diagnostics: input.gateResult.errors.map((error) => error.message),
    };
  }

  const collection = input.entityKind === "provider" ? COL.providers : COL.meetupGroups;
  const id = input.draftPayload.id;
  const sanitizedInput =
    input.entityKind === "provider"
      ? sanitizeProviderForPublic(input.draftPayload as Provider)
      : sanitizeMeetupForPublic(input.draftPayload as MeetupGroup);
  const draftPayload = {
    ...sanitizedInput.payload,
    catalogProject: normalizeCatalogProject(input.draftPayload as { catalogProject?: string }),
  } as Provider | MeetupGroup;
  const combinedDiagnostics = [
    ...input.gateResult.errors.map((error) => `error:${error.code}:${error.message}`),
    ...sanitizedInput.removedTerms.map((term) => `sanitized:${term}`),
  ];
  await db.collection(collection).replaceOne(buildCatalogScopeFilter({ id }), draftPayload as never, { upsert: true });
  if (input.entityKind === "provider") {
    await syncCatalogImageFingerprintForEntity(db, {
      entityKind: "provider",
      document: draftPayload as Provider,
      mediaResult: input.mediaResult,
    });
  } else {
    await syncCatalogImageFingerprintForEntity(db, {
      entityKind: "meetupGroup",
      document: draftPayload as MeetupGroup,
      mediaResult: input.mediaResult,
    });
  }

  const [privateVerification, publicVerification] = await Promise.all([
    verifyPrivatePublish(db, input.entityKind, id),
    verifyPublicPublish(options.origin, input.entityKind, draftPayload, options),
  ]);

  return {
    status: privateVerification.verified && publicVerification.verified ? "published" : "partial",
    publishedEntityId: id,
    publishedEntityType: input.entityKind,
    privateVerification,
    publicVerification,
    publicUrl: publicVerification.publicUrl,
    auditRef: input.idempotencyKey,
    retryable: !publicVerification.verified,
    diagnostics: publicVerification.verified ? combinedDiagnostics : [...combinedDiagnostics, publicVerification.summary],
  };
}
