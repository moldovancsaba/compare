import { buildDedupeSupportIndex, type CatalogDedupeSupportIndex } from "@/lib/catalogIntelligence";
import {
  buildCatalogImageUniquenessIndex,
  evaluateCatalogImageUniqueness,
  type CatalogImageUniquenessIndex,
} from "@/lib/contentIntelligence/catalogImageUniqueness";
import { checkCuratedPayloadQuality } from "@/lib/contentIntelligence/curatedPayloadQuality";
import type { UploadedImageResult } from "@/lib/contentIntelligence/mediaPipeline";
import { validateMeetupDocument } from "@/lib/meetupValidation";
import { validateProviderDocument } from "@/lib/providerValidation";
import type { MeetupGroup } from "@/types/meetup";
import type { Provider } from "@/types/provider";

export interface PublishGateFinding {
  code: string;
  severity: "warning" | "error";
  message: string;
  fieldPath: string;
  source: string;
  remediationHint: string;
}

export interface PublishGateRequest {
  entityKind: "provider" | "meetupGroup";
  draftPayload: Provider | MeetupGroup;
  adapterVersion: string;
  mediaResult?: UploadedImageResult | null;
  dedupeIndex?: CatalogDedupeSupportIndex;
  imageUniquenessIndex?: CatalogImageUniquenessIndex;
}

export interface PublishGateResult {
  approved: boolean;
  errors: PublishGateFinding[];
  warnings: PublishGateFinding[];
  validatorVersion: string;
  validatedAt: string;
  duplicateRisk: "low" | "medium" | "high";
  duplicateImage?: {
    status: "unique" | "duplicate_exact" | "duplicate_near";
    incumbent?: {
      entityKind: "provider" | "meetupGroup";
      entityId: string;
      uploadedUrl: string;
    };
    matches: Array<{
      entityKind: "provider" | "meetupGroup";
      entityId: string;
      uploadedUrl: string;
      reason: string;
      distance?: number;
    }>;
  };
  auditMetadata: {
    qualityIssues: string[];
  };
}

function computeDuplicateRisk(input: PublishGateRequest) {
  if (!input.dedupeIndex) return "low" as const;
  const name = input.draftPayload.name.trim().toLowerCase();
  const website = "website" in input.draftPayload ? String(input.draftPayload.website || "").trim().toLowerCase() : "";
  const nameHit =
    input.entityKind === "provider"
      ? input.dedupeIndex.providerNames.includes(name)
      : input.dedupeIndex.meetupNames.includes(name);
  const websiteHit = website ? input.dedupeIndex.websites.includes(website) : false;
  if (nameHit && websiteHit) return "high" as const;
  if (nameHit || websiteHit) return "medium" as const;
  return "low" as const;
}

function imageFieldForEntity(entityKind: "provider" | "meetupGroup") {
  return entityKind === "provider" ? "image" : "coverImageUrl";
}

export async function runRangeScoutPublishGate(input: PublishGateRequest): Promise<PublishGateResult> {
  const findings: PublishGateFinding[] = [];
  const validationError =
    input.entityKind === "provider"
      ? validateProviderDocument(input.draftPayload as Provider)
      : validateMeetupDocument(input.draftPayload as MeetupGroup);
  if (validationError) {
    findings.push({
      code: "schema_validation_failed",
      severity: "error",
      message: validationError,
      fieldPath: "draftPayload",
      source: "native-validation",
      remediationHint: "Fix the payload so it matches the native compare schema.",
    });
  }

  if (input.mediaResult && input.mediaResult.status !== "ready") {
    findings.push({
      code: "media_not_ready",
      severity: "error",
      message: "The media pipeline did not produce a publishable image result.",
      fieldPath: input.entityKind === "provider" ? "image" : "coverImageUrl",
      source: "media-pipeline",
      remediationHint: "Resolve the image pipeline failure before publishing.",
    });
  }

  const qualityIssues = checkCuratedPayloadQuality({
    operations: [{ resource: input.entityKind === "provider" ? "provider" : "meetupGroup", action: "upsert", document: input.draftPayload }],
  });
  for (const issue of qualityIssues) {
    findings.push({
      code: "quality_invariant_failed",
      severity: "error",
      message: issue,
      fieldPath: "draftPayload",
      source: "curated-payload-quality",
      remediationHint: "Align the draft with curated payload quality invariants.",
    });
  }

  const duplicateRisk = computeDuplicateRisk(input);
  if (duplicateRisk === "high") {
    findings.push({
      code: "duplicate_risk_high",
      severity: "warning",
      message: "This draft strongly resembles an existing catalog entry.",
      fieldPath: "name",
      source: "catalog-dedupe",
      remediationHint: "Review existing catalog rows before publishing a duplicate.",
    });
  }

  const uploadedUrl =
    input.entityKind === "provider"
      ? String((input.draftPayload as Provider).image || "").trim()
      : String((input.draftPayload as MeetupGroup).coverImageUrl || "").trim();
  const uniqueness =
    input.imageUniquenessIndex && uploadedUrl
      ? evaluateCatalogImageUniqueness({
          entityKind: input.entityKind,
          entityId: input.draftPayload.id,
          uploadedUrl,
          contentHash: input.mediaResult?.contentHash,
          perceptualHash: input.mediaResult?.perceptualHash,
          sourceImageUrl: input.mediaResult?.originalUrl,
          index: input.imageUniquenessIndex,
        })
      : null;

  if (uniqueness?.status === "duplicate_exact") {
    findings.push({
      code: "duplicate_image_exact",
      severity: "error",
      message: uniqueness.incumbent
        ? `This image is already used by ${uniqueness.incumbent.entityKind} ${uniqueness.incumbent.entityId}.`
        : "This image is already used by another live catalog row.",
      fieldPath: imageFieldForEntity(input.entityKind),
      source: "catalog-image-uniqueness",
      remediationHint: "Find a different official image for the newer listing before publishing.",
    });
  }

  if (uniqueness?.status === "duplicate_near") {
    findings.push({
      code: "duplicate_image_near",
      severity: "error",
      message: uniqueness.incumbent
        ? `This image is visually too close to ${uniqueness.incumbent.entityKind} ${uniqueness.incumbent.entityId}.`
        : "This image is visually too close to another live catalog row.",
      fieldPath: imageFieldForEntity(input.entityKind),
      source: "catalog-image-uniqueness",
      remediationHint: "Choose a visually distinct official image for the newer listing.",
    });
  }

  return {
    approved: findings.every((finding) => finding.severity !== "error"),
    errors: findings.filter((finding) => finding.severity === "error"),
    warnings: findings.filter((finding) => finding.severity === "warning"),
    validatorVersion: "compare-range-publish-gate@v1",
    validatedAt: new Date().toISOString(),
    duplicateRisk,
    duplicateImage: uniqueness
      ? {
          status: uniqueness.status,
          incumbent: uniqueness.incumbent
            ? {
                entityKind: uniqueness.incumbent.entityKind,
                entityId: uniqueness.incumbent.entityId,
                uploadedUrl: uniqueness.incumbent.uploadedUrl,
              }
            : undefined,
          matches: uniqueness.matches,
        }
      : undefined,
    auditMetadata: {
      qualityIssues: [
        ...qualityIssues,
        ...(uniqueness?.matches.map((match) => `${uniqueness.status}:${match.entityKind}:${match.entityId}:${match.reason}`) ?? []),
      ],
    },
  };
}

export function buildDedupeIndexForGate(providers: Provider[], meetups: MeetupGroup[]) {
  return buildDedupeSupportIndex(providers, meetups);
}

export function buildImageUniquenessIndexForGate(
  providers: Provider[],
  meetups: MeetupGroup[],
  fingerprints: Parameters<typeof buildCatalogImageUniquenessIndex>[0]["fingerprints"],
) {
  return buildCatalogImageUniquenessIndex({ providers, meetups, fingerprints });
}
