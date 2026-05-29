import { describe, expect, it } from "vitest";
import {
  sendChecklistDestinationOutcome,
  sendChecklistReviewPacket,
} from "@/lib/contentIntelligence/checklistBridge";

describe("checklist bridge", () => {
  it("skips when checklist bridge is not configured", async () => {
    const result = await sendChecklistDestinationOutcome(
      {
        companyId: "company-1",
        destinationKey: "compare",
        bridgeVersion: "v1",
        eventType: "publish_completed",
        actorType: "SYSTEM",
      },
      {
        baseUrl: "",
        ingestSecret: "",
      },
    );

    expect(result.skipped).toBe(true);
    expect(result.ok).toBe(false);
  });

  it("posts review packets to the checklist review endpoint", async () => {
    let requestedUrl = "";
    const result = await sendChecklistReviewPacket(
      {
        companyId: "company-1",
        destinationKey: "compare",
        workflowRunId: "run-1",
        candidateId: "candidate-1",
        draftId: "draft-1",
        bridgeVersion: "v1",
        draftPayload: { id: "prov-1" },
        evidenceSummary: { sourceCount: 2 },
        diagnostics: { blockingCount: 0 },
      },
      {
        baseUrl: "https://checklist.example.com/",
        ingestSecret: "secret",
        fetchImpl: async (url, init) => {
          requestedUrl = String(url);
          expect(init?.method).toBe("POST");
          expect((init?.headers as Record<string, string>).Authorization).toBe("Bearer secret");
          return new Response(JSON.stringify({ ok: true, packet: { id: "packet-1" } }), { status: 200 });
        },
      },
    );

    expect(requestedUrl).toBe("https://checklist.example.com/api/destination-review/packets");
    expect(result.ok).toBe(true);
    expect(result.skipped).toBe(false);
  });
});
