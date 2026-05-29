import type { CatalogDedupeSupportIndex } from "@/lib/catalogIntelligence";
import type { Db } from "mongodb";
import {
  buildCatalogMediaFingerprintFromResult,
  buildCatalogImageUniquenessIndex,
  enqueueCatalogImageRemediation,
  type CatalogMediaFingerprint,
} from "@/lib/contentIntelligence/catalogImageUniqueness";
import {
  sendChecklistReviewPacket,
  type ChecklistDestinationReviewPacketPayload,
} from "@/lib/contentIntelligence/checklistBridge";
import {
  processOfficialImage,
  type ImageProcessingRequest,
  type UploadedImageResult,
} from "@/lib/contentIntelligence/mediaPipeline";
import {
  buildDedupeIndexForGate,
  buildImageUniquenessIndexForGate,
  runRangeScoutPublishGate,
  type PublishGateResult,
} from "@/lib/contentIntelligence/publishGate";
import { findAlternateOfficialImage } from "@/lib/contentIntelligence/imageReselection";
import {
  resolveRangeScoutDraft,
  type NormalizedListingInput,
  type ResolvedDraftResult,
} from "@/lib/contentIntelligence/rangeScoutAdapter";
import type { MeetupGroup } from "@/types/meetup";
import type { Provider } from "@/types/provider";
import {
  CHECKLIST_BRIDGE_VERSION,
  CHECKLIST_DEFAULT_COMPANY_ID,
  CHECKLIST_DESTINATION_KEY,
  CHECKLIST_INTELLIGENCE_UNIT_KEY,
  CHECKLIST_MISSION_KEY,
  PRODUCT_NAME,
} from "@/lib/workflow/projectConfig";

export interface PrepareReviewPacketInput {
  normalizedListing: NormalizedListingInput;
  draftId: string;
  evidenceSummary: Record<string, unknown>;
  workflowMetadata: Record<string, unknown>;
  mediaRequest?: ImageProcessingRequest | null;
  metadata?: Record<string, unknown> | null;
}

export interface PrepareReviewPacketResult {
  status: "review_submitted" | "ready_without_review" | "blocked";
  entityKind: "provider" | "meetupGroup";
  resolvedDraft: ResolvedDraftResult;
  gateResult: PublishGateResult;
  mediaResult: UploadedImageResult | null;
  reviewPacketResult?: {
    ok: boolean;
    skipped: boolean;
    status?: number;
    data?: Record<string, unknown>;
  };
  diagnostics: string[];
}

function hasUploadedImage(input: NormalizedListingInput) {
  return (input.imageCandidates ?? []).some((candidate) => Boolean(candidate.uploadedUrl));
}

function appendUploadedImage(
  input: NormalizedListingInput,
  mediaResult: UploadedImageResult | null,
): NormalizedListingInput {
  if (!mediaResult?.uploadedUrl) return input;
  const existing = (input.imageCandidates ?? []).filter((candidate) => candidate.uploadedUrl !== mediaResult.uploadedUrl);
  return {
    ...input,
    imageCandidates: [{ uploadedUrl: mediaResult.uploadedUrl }, ...existing],
  };
}

function collectDiagnostics(
  resolvedDraft: ResolvedDraftResult,
  gateResult: PublishGateResult,
  mediaResult: UploadedImageResult | null,
) {
  return [
    ...resolvedDraft.diagnostics.map((issue) => `${issue.severity}:${issue.code}:${issue.message}`),
    ...gateResult.errors.map((issue) => `error:${issue.code}:${issue.message}`),
    ...gateResult.warnings.map((issue) => `warning:${issue.code}:${issue.message}`),
    ...(mediaResult?.diagnostics ?? []).map((issue) => `${issue.severity}:${issue.code}:${issue.message}`),
  ];
}

function asReviewDiagnostics(
  resolvedDraft: ResolvedDraftResult,
  gateResult: PublishGateResult,
  mediaResult: UploadedImageResult | null,
) {
  return {
    resolutionDiagnostics: resolvedDraft.diagnostics,
    gateErrors: gateResult.errors,
    gateWarnings: gateResult.warnings,
    duplicateRisk: gateResult.duplicateRisk,
    mediaDiagnostics: mediaResult?.diagnostics ?? [],
  };
}

export async function prepareRangeScoutReviewPacket(
  input: PrepareReviewPacketInput,
  deps: {
    providers: Provider[];
    meetups: MeetupGroup[];
    uploadImage: (file: Blob) => Promise<{ url: string }>;
    fetchImpl?: typeof fetch;
    hashBuffer?: (buffer: ArrayBuffer) => Promise<string> | string;
    fingerprintRows?: CatalogMediaFingerprint[];
    db?: Db;
    sendReviewPacket?: (
      payload: ChecklistDestinationReviewPacketPayload,
    ) => Promise<{ ok: boolean; skipped: boolean; status?: number; data?: Record<string, unknown> }>;
  },
): Promise<PrepareReviewPacketResult> {
  let mediaResult: UploadedImageResult | null = null;
  if (!hasUploadedImage(input.normalizedListing) && input.mediaRequest) {
    mediaResult = await processOfficialImage(input.mediaRequest, {
      fetchImpl: deps.fetchImpl,
      uploadImage: deps.uploadImage,
      hashBuffer: deps.hashBuffer,
    });
  }

  let listingWithMedia = appendUploadedImage(input.normalizedListing, mediaResult);
  let resolvedDraft = resolveRangeScoutDraft(listingWithMedia);
  const dedupeIndex: CatalogDedupeSupportIndex = buildDedupeIndexForGate(deps.providers, deps.meetups);
  const imageUniquenessIndex = buildImageUniquenessIndexForGate(deps.providers, deps.meetups, deps.fingerprintRows ?? []);
  let draftPayload =
    resolvedDraft.entityKind === "provider"
      ? (resolvedDraft.draft as Provider)
      : (resolvedDraft.draft as MeetupGroup);
  let gateResult = await runRangeScoutPublishGate({
    entityKind: resolvedDraft.entityKind,
    draftPayload,
    adapterVersion: resolvedDraft.adapterVersion,
    mediaResult,
    dedupeIndex,
    imageUniquenessIndex,
  });

  if (
    !gateResult.approved &&
    input.mediaRequest &&
    mediaResult?.status === "ready" &&
    gateResult.errors.some((issue) => issue.code === "duplicate_image_exact" || issue.code === "duplicate_image_near")
  ) {
    const reselection = await findAlternateOfficialImage({
      request: input.mediaRequest,
      entityId: draftPayload.id,
      index: imageUniquenessIndex,
      fetchImpl: deps.fetchImpl,
      uploadImage: deps.uploadImage,
      hashBuffer: deps.hashBuffer,
    });

    if (reselection.status === "resolved") {
      mediaResult = reselection.mediaResult;
      listingWithMedia = appendUploadedImage(input.normalizedListing, mediaResult);
      resolvedDraft = resolveRangeScoutDraft(listingWithMedia);
      draftPayload =
        resolvedDraft.entityKind === "provider"
          ? (resolvedDraft.draft as Provider)
          : (resolvedDraft.draft as MeetupGroup);
      gateResult = await runRangeScoutPublishGate({
        entityKind: resolvedDraft.entityKind,
        draftPayload,
        adapterVersion: resolvedDraft.adapterVersion,
        mediaResult,
        dedupeIndex,
        imageUniquenessIndex: buildCatalogImageUniquenessIndex({
          providers: deps.providers,
          meetups: deps.meetups,
          fingerprints: [
            ...(deps.fingerprintRows ?? []),
            buildCatalogMediaFingerprintFromResult({
              entityKind: resolvedDraft.entityKind,
              entityId: draftPayload.id,
              imageField: resolvedDraft.entityKind === "provider" ? "image" : "coverImageUrl",
              mediaResult,
              publishedAt: resolvedDraft.entityKind === "provider" ? (draftPayload as Provider).publishedAt : undefined,
              updatedAt: resolvedDraft.entityKind === "provider" ? (draftPayload as Provider).updatedAt : undefined,
            }),
          ],
        }),
      });
    } else if (deps.db) {
      const incumbentError = gateResult.errors.find(
        (issue) => issue.code === "duplicate_image_exact" || issue.code === "duplicate_image_near",
      );
      await enqueueCatalogImageRemediation(deps.db, {
        entityKind: resolvedDraft.entityKind,
        entityId: draftPayload.id,
        incumbentEntityKind: gateResult.duplicateImage?.incumbent?.entityKind ?? resolvedDraft.entityKind,
        incumbentEntityId: gateResult.duplicateImage?.incumbent?.entityId ?? "unknown",
        imageField: resolvedDraft.entityKind === "provider" ? "image" : "coverImageUrl",
        duplicateKind: incumbentError?.code === "duplicate_image_near" ? "near" : "exact",
        duplicateReason: incumbentError?.message || "Duplicate image gate rejection",
        uploadedUrl: mediaResult.uploadedUrl,
        sourceImageUrl: mediaResult.originalUrl,
        sourceDocumentUrl: mediaResult.sourceDocumentUrl,
        status: "blocked_no_unique_candidate",
        resolutionNotes: reselection.reason,
      });
    }
  }

  const diagnostics = collectDiagnostics(resolvedDraft, gateResult, mediaResult);

  if (!gateResult.approved) {
    return {
      status: "blocked",
      entityKind: resolvedDraft.entityKind,
      resolvedDraft,
      gateResult,
      mediaResult,
      diagnostics,
    };
  }

  const checklistCompanyId =
    typeof input.workflowMetadata.checklistCompanyId === "string"
      ? input.workflowMetadata.checklistCompanyId
      : typeof input.workflowMetadata.companyId === "string"
        ? input.workflowMetadata.companyId
        : CHECKLIST_DEFAULT_COMPANY_ID;
  const workflowRunId =
    typeof input.workflowMetadata.workflowRunId === "string" ? input.workflowMetadata.workflowRunId : null;
  const candidateId =
    typeof input.workflowMetadata.candidateId === "string" ? input.workflowMetadata.candidateId : null;

  if (!checklistCompanyId || !workflowRunId || !candidateId) {
    return {
      status: "ready_without_review",
      entityKind: resolvedDraft.entityKind,
      resolvedDraft,
      gateResult,
      mediaResult,
      diagnostics,
    };
  }

  const sendReviewPacket = deps.sendReviewPacket ?? sendChecklistReviewPacket;
  const reviewPacketResult = await sendReviewPacket({
    companyId: checklistCompanyId,
    destinationKey: CHECKLIST_DESTINATION_KEY,
    workflowRunId,
    candidateId,
    draftId: input.draftId,
    bridgeVersion:
      typeof input.workflowMetadata.bridgeVersion === "string" ? input.workflowMetadata.bridgeVersion : CHECKLIST_BRIDGE_VERSION,
    draftPayload: resolvedDraft.draft as Record<string, unknown>,
    evidenceSummary: input.evidenceSummary,
    diagnostics: asReviewDiagnostics(resolvedDraft, gateResult, mediaResult),
    mediaSummary: mediaResult
      ? {
          uploadedUrl: mediaResult.uploadedUrl,
          originalUrl: mediaResult.originalUrl,
          status: mediaResult.status,
          mimeType: mediaResult.mimeType,
        }
      : null,
    metadata: {
      source: "compare-prepare-review-packet",
      entityKind: resolvedDraft.entityKind,
      adapterVersion: resolvedDraft.adapterVersion,
      projectKey: CHECKLIST_DESTINATION_KEY,
      missionKey: CHECKLIST_MISSION_KEY,
      intelligenceUnitKey: CHECKLIST_INTELLIGENCE_UNIT_KEY,
      productName: PRODUCT_NAME,
      ...(input.metadata ?? {}),
    },
  });

  return {
    status: reviewPacketResult.ok ? "review_submitted" : "ready_without_review",
    entityKind: resolvedDraft.entityKind,
    resolvedDraft,
    gateResult,
    mediaResult,
    reviewPacketResult,
    diagnostics,
  };
}
