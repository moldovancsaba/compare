import { describe, expect, it } from "vitest";
import { prepareRangeScoutReviewPacket } from "@/lib/contentIntelligence/prepareReviewPacket";
import type { MeetupGroup } from "@/types/meetup";
import type { Provider } from "@/types/provider";

const providers: Provider[] = [];
const meetups: MeetupGroup[] = [];

describe("prepareRangeScoutReviewPacket", () => {
  it("submits a review packet when the draft passes gate and workflow metadata is complete", async () => {
    let packetDraftId = "";

    const result = await prepareRangeScoutReviewPacket(
      {
        draftId: "draft-1",
        normalizedListing: {
          title: "Neighborhood Art Club",
          listingKindHint: "provider",
          categoryHint: "Classes",
          boroughRaw: "Brooklyn",
          neighborhoodRaw: "Park Slope",
          addressRaw: "123 Example St, Brooklyn, NY",
          activityTypesRaw: ["Art"],
          ageRangesRaw: ["3–5"],
          scheduleBlocks: [
            {
              daysOfWeek: ["Saturday"],
              timeText: "10:00 AM - 11:00 AM",
            },
          ],
          descriptionFacts: ["Weekend art classes for children in Park Slope."],
          contactFacts: {
            website: "https://example.com/art-club",
          },
          imageCandidates: [{ uploadedUrl: "https://i.ibb.co/example-upload.jpg" }],
        },
        evidenceSummary: {
          sources: ["https://example.com/art-club"],
        },
        workflowMetadata: {
          checklistCompanyId: "company-1",
          workflowRunId: "run-1",
          candidateId: "candidate-1",
          bridgeVersion: "v1",
        },
      },
      {
        providers,
        meetups,
        uploadImage: async () => ({ url: "https://i.ibb.co/example-upload.jpg" }),
        sendReviewPacket: async (payload) => {
          packetDraftId = payload.draftId;
          return { ok: true, skipped: false, status: 200, data: { packet: { id: "packet-1" } } };
        },
      },
    );

    expect(result.status).toBe("review_submitted");
    expect(packetDraftId).toBe("draft-1");
    expect(result.gateResult.approved).toBe(true);
  });

  it("returns blocked when required taxonomy or media constraints are missing", async () => {
    const result = await prepareRangeScoutReviewPacket(
      {
        draftId: "draft-2",
        normalizedListing: {
          title: "Unmapped Listing",
          listingKindHint: "provider",
          categoryHint: "Classes",
          boroughRaw: "Atlantis",
          neighborhoodRaw: "Unknown",
          descriptionFacts: ["Missing canonical location and image."],
        },
        evidenceSummary: {},
        workflowMetadata: {},
      },
      {
        providers,
        meetups,
        uploadImage: async () => ({ url: "https://i.ibb.co/example-upload.jpg" }),
      },
    );

    expect(result.status).toBe("blocked");
    expect(result.gateResult.approved).toBe(false);
    expect(result.diagnostics.some((item) => item.includes("unsupported_borough"))).toBe(true);
  });
});
