import { CHECKLIST_DESTINATION_KEY } from "@/lib/workflow/projectConfig";

export interface ChecklistDestinationOutcomePayload {
  companyId: string;
  destinationKey: string;
  workflowRunId?: string;
  candidateId?: string;
  draftId?: string;
  reviewPacketId?: string;
  bridgeVersion: string;
  eventType: string;
  reasonCode?: string;
  notes?: string;
  actorType: "SYSTEM" | "HUMAN";
  actorId?: string;
  payload?: Record<string, unknown>;
}

export interface ChecklistDestinationReviewPacketPayload {
  companyId: string;
  destinationKey: string;
  workflowRunId: string;
  candidateId: string;
  draftId: string;
  bridgeVersion: string;
  draftPayload: Record<string, unknown>;
  evidenceSummary: Record<string, unknown>;
  diagnostics: Record<string, unknown>;
  mediaSummary?: Record<string, unknown> | null;
  metadata?: Record<string, unknown> | null;
}

export interface ChecklistLiveRevisionIntakePayload {
  companyId: string;
  destinationKey: string;
  bridgeVersion: string;
  adapterVersion: string;
  liveListing: Record<string, unknown>;
  factsJson: Record<string, unknown>;
  provenanceJson?: Record<string, unknown> | null;
  draftPayload: Record<string, unknown>;
  evidenceSummary?: Record<string, unknown> | null;
  diagnostics?: Record<string, unknown> | null;
  mediaSummary?: Record<string, unknown> | null;
  metadata?: Record<string, unknown> | null;
}

async function postToChecklist<TPayload>(
  path: string,
  payload: TPayload,
  options: {
    baseUrl?: string;
    ingestSecret?: string;
    fetchImpl?: typeof fetch;
  } = {},
) {
  const baseUrl = options.baseUrl ?? process.env.CHECKLIST_BASE_URL;
  const ingestSecret = options.ingestSecret ?? process.env.CHECKLIST_INGEST_SECRET;
  if (!baseUrl || !ingestSecret) {
    return { ok: false, skipped: true, reason: "Checklist bridge not configured" as const };
  }

  const fetchImpl = options.fetchImpl ?? fetch;
  const response = await fetchImpl(`${baseUrl.replace(/\/$/, "")}${path}`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${ingestSecret}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  const json = (await response.json().catch(() => ({}))) as Record<string, unknown>;
  return {
    ok: response.ok,
    skipped: false,
    status: response.status,
    data: json,
  };
}

export async function sendChecklistDestinationOutcome(
  payload: ChecklistDestinationOutcomePayload,
  options: {
    baseUrl?: string;
    ingestSecret?: string;
    fetchImpl?: typeof fetch;
  } = {},
) {
  return postToChecklist("/api/destination-review/outcomes", payload, options);
}

export async function sendChecklistReviewPacket(
  payload: ChecklistDestinationReviewPacketPayload,
  options: {
    baseUrl?: string;
    ingestSecret?: string;
    fetchImpl?: typeof fetch;
  } = {},
) {
  return postToChecklist("/api/destination-review/packets", payload, options);
}

export async function sendChecklistLiveRevisionIntake(
  payload: ChecklistLiveRevisionIntakePayload,
  options: {
    baseUrl?: string;
    ingestSecret?: string;
    fetchImpl?: typeof fetch;
  } = {},
) {
  return postToChecklist("/api/destination-workflows/live-revisions/intake", payload, options);
}

export async function fetchChecklistLiveRevisionStatus(
  payload: {
    companyId: string;
    destinationKey: string;
    listingId: string;
    listingType: "provider" | "meetupGroup";
  },
  options: {
    baseUrl?: string;
    ingestSecret?: string;
    fetchImpl?: typeof fetch;
  } = {},
) {
  return postToChecklist(
    "/api/destination-review/live-listing-status",
    {
      destinationKey: payload.destinationKey || CHECKLIST_DESTINATION_KEY,
      ...payload,
    },
    options,
  );
}
