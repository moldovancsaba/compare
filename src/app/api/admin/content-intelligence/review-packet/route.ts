import { NextResponse } from "next/server";
import { sendChecklistReviewPacket } from "@/lib/contentIntelligence/checklistBridge";
import { requireAdmin } from "@/lib/requireAdmin";
import {
  CHECKLIST_BRIDGE_VERSION,
  CHECKLIST_DEFAULT_COMPANY_ID,
  CHECKLIST_DESTINATION_KEY,
  CHECKLIST_INTELLIGENCE_UNIT_KEY,
  CHECKLIST_MISSION_KEY,
  PRODUCT_NAME,
} from "@/lib/workflow/projectConfig";

function asRecord(value: unknown) {
  return value && typeof value === "object" && !Array.isArray(value) ? (value as Record<string, unknown>) : null;
}

export async function POST(request: Request) {
  const denied = await requireAdmin();
  if (denied) return denied;

  try {
    const body = await request.json();
    const workflowMetadata = asRecord(body.workflowMetadata);
    const checklistCompanyId =
      typeof workflowMetadata?.checklistCompanyId === "string"
        ? workflowMetadata.checklistCompanyId
        : typeof workflowMetadata?.companyId === "string"
          ? workflowMetadata.companyId
          : CHECKLIST_DEFAULT_COMPANY_ID;
    const workflowRunId = typeof workflowMetadata?.workflowRunId === "string" ? workflowMetadata.workflowRunId : null;
    const candidateId =
      typeof workflowMetadata?.candidateId === "string"
        ? workflowMetadata.candidateId
        : typeof body.candidateId === "string"
          ? body.candidateId
          : null;

    if (!checklistCompanyId || !workflowRunId || !candidateId || typeof body.draftId !== "string") {
      return NextResponse.json(
        {
          error:
            "workflowMetadata.checklistCompanyId/companyId, workflowMetadata.workflowRunId, candidateId, and draftId are required",
        },
        { status: 400 },
      );
    }

    const packetPayload = {
      companyId: checklistCompanyId,
      destinationKey: CHECKLIST_DESTINATION_KEY,
      workflowRunId,
      candidateId,
      draftId: body.draftId,
      bridgeVersion: typeof workflowMetadata?.bridgeVersion === "string" ? workflowMetadata.bridgeVersion : CHECKLIST_BRIDGE_VERSION,
      draftPayload: asRecord(body.draftPayload) ?? {},
      evidenceSummary: asRecord(body.evidenceSummary) ?? {},
      diagnostics: asRecord(body.diagnostics) ?? {},
      mediaSummary: asRecord(body.mediaSummary),
      metadata: {
        entityKind: typeof body.entityKind === "string" ? body.entityKind : "provider",
        adapterVersion: typeof body.adapterVersion === "string" ? body.adapterVersion : undefined,
        gateApproved: typeof body.gateApproved === "boolean" ? body.gateApproved : undefined,
        source: "compare-admin-review-packet",
        projectKey: CHECKLIST_DESTINATION_KEY,
        missionKey: CHECKLIST_MISSION_KEY,
        intelligenceUnitKey: CHECKLIST_INTELLIGENCE_UNIT_KEY,
        productName: PRODUCT_NAME,
        ...(asRecord(body.metadata) ?? {}),
      },
    };

    const result = await sendChecklistReviewPacket(packetPayload);
    return NextResponse.json(result, { status: result.ok ? 200 : result.status ?? 502 });
  } catch (error) {
    console.error("[API:ContentIntelligence:ReviewPacket] failure:", error);
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}
