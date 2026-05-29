import type { Db } from "mongodb";
import { COL } from "@/lib/mongodb";
import { listCatalogMediaFingerprints } from "@/lib/contentIntelligence/catalogImageUniqueness";
import { sendChecklistDestinationOutcome } from "@/lib/contentIntelligence/checklistBridge";
import type { UploadedImageResult } from "@/lib/contentIntelligence/mediaPipeline";
import { publishApprovedDraft } from "@/lib/contentIntelligence/publishExecution";
import { buildDedupeIndexForGate, buildImageUniquenessIndexForGate, runRangeScoutPublishGate } from "@/lib/contentIntelligence/publishGate";
import type { MeetupGroup } from "@/types/meetup";
import type { Provider } from "@/types/provider";
import {
  CHECKLIST_BRIDGE_VERSION,
  CHECKLIST_DEFAULT_COMPANY_ID,
  CHECKLIST_DESTINATION_KEY,
  CHECKLIST_INTELLIGENCE_UNIT_KEY,
} from "@/lib/workflow/projectConfig";

function asWorkflowMetadata(value: unknown) {
  return value && typeof value === "object" && !Array.isArray(value) ? (value as Record<string, unknown>) : null;
}

export async function runRangeScoutPublishService(
  db: Db,
  body: {
    draftId: string;
    entityKind: "provider" | "meetupGroup";
    draftPayload: Provider | MeetupGroup;
    adapterVersion: string;
    mediaResult?: UploadedImageResult | null;
    workflowMetadata?: Record<string, unknown>;
    idempotencyKey?: string;
  },
  options: { origin?: string } = {},
) {
  const [providers, meetups, fingerprints] = await Promise.all([
    db.collection(COL.providers).find({}).toArray() as unknown as Promise<Provider[]>,
    db.collection(COL.meetupGroups).find({}).toArray() as unknown as Promise<MeetupGroup[]>,
    listCatalogMediaFingerprints(db),
  ]);

  const gateResult = await runRangeScoutPublishGate({
    entityKind: body.entityKind,
    draftPayload: body.draftPayload,
    adapterVersion: body.adapterVersion,
    dedupeIndex: buildDedupeIndexForGate(providers, meetups),
    imageUniquenessIndex: buildImageUniquenessIndexForGate(providers, meetups, fingerprints),
  });

  const result = await publishApprovedDraft(
    db,
    {
      draftId: body.draftId,
      entityKind: body.entityKind,
      draftPayload: body.draftPayload,
      gateResult,
      mediaResult: body.mediaResult,
      idempotencyKey:
        body.idempotencyKey ??
        `${body.entityKind}:${body.draftId}:${typeof body.draftPayload.id === "string" ? body.draftPayload.id : "unknown"}`,
      workflowMetadata: body.workflowMetadata,
    },
    { origin: options.origin },
  );

  const workflowMetadata = asWorkflowMetadata(body.workflowMetadata);
  const checklistCompanyId =
    typeof workflowMetadata?.checklistCompanyId === "string"
      ? workflowMetadata.checklistCompanyId
      : typeof workflowMetadata?.companyId === "string"
        ? workflowMetadata.companyId
        : CHECKLIST_DEFAULT_COMPANY_ID;

  if (checklistCompanyId) {
    const callbackPayload = {
      companyId: checklistCompanyId,
      destinationKey: CHECKLIST_DESTINATION_KEY,
      workflowRunId: typeof workflowMetadata?.workflowRunId === "string" ? workflowMetadata.workflowRunId : undefined,
      candidateId: typeof workflowMetadata?.candidateId === "string" ? workflowMetadata.candidateId : undefined,
      draftId: body.draftId,
      reviewPacketId: typeof workflowMetadata?.reviewPacketId === "string" ? workflowMetadata.reviewPacketId : undefined,
      bridgeVersion: typeof workflowMetadata?.bridgeVersion === "string" ? workflowMetadata.bridgeVersion : CHECKLIST_BRIDGE_VERSION,
      eventType:
        result.status === "published"
          ? "publish_completed"
          : result.status === "partial"
            ? "publish_partial"
            : "publish_blocked",
      reasonCode: result.retryable ? "RETRYABLE" : "FINAL",
      notes: result.diagnostics.join(" | ") || undefined,
      actorType: "SYSTEM" as const,
      actorId: CHECKLIST_INTELLIGENCE_UNIT_KEY,
      payload: {
        publishedEntityId: result.publishedEntityId,
        publishedEntityType: result.publishedEntityType,
        privateVerification: result.privateVerification,
        publicVerification: result.publicVerification,
        gateResult,
        destinationProjectKey: CHECKLIST_DESTINATION_KEY,
      },
    };

    const callbackResult = await sendChecklistDestinationOutcome(callbackPayload);
    result.callbackResult = {
      ok: callbackResult.ok,
      skipped: callbackResult.skipped,
      status: callbackResult.status,
    };
  }

  return { result, gateResult };
}
