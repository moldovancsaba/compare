import { describe, expect, it } from "vitest";
import { publishApprovedDraft } from "@/lib/contentIntelligence/publishExecution";
import type { Provider } from "@/types/provider";

const provider: Provider = {
  id: "prov-publish-test",
  name: "Publish Test",
  category: "Classes",
  borough: "Queens",
  neighborhood: "Astoria",
  address: "99 Publish Ave",
  activityTypes: ["Art"],
  ageRanges: ["3–5"],
  dayTimeTags: ["Weekday"],
  pricePerClass: 0,
  shortDescription: "Art classes for children.",
  longDescription: "Art classes for children with a weekday schedule in Astoria.",
  rating: 0,
  reviewCount: 0,
  badges: [],
  image: "https://i.ibb.co/example-provider.jpg",
  email: "",
  website: "https://example.com/art",
  phone: "",
};

function createDbStub() {
  const rows = new Map<string, unknown>();
  return {
    collection(name: string) {
      return {
        async replaceOne(query: { id: string }, doc: unknown) {
          rows.set(query.id, doc);
          return { acknowledged: true };
        },
        async findOne(query: { id: string }) {
          return rows.get(query.id) ?? null;
        },
        async updateOne(query: Record<string, unknown>, update: { $set?: Record<string, unknown> }) {
          rows.set(`${name}:${JSON.stringify(query)}`, update.$set ?? {});
          return { acknowledged: true };
        },
      };
    },
  };
}

describe("publish execution", () => {
  it("blocks unapproved drafts", async () => {
    const result = await publishApprovedDraft(createDbStub() as never, {
      draftId: "draft-1",
      entityKind: "provider",
      draftPayload: provider,
      gateResult: {
        approved: false,
        errors: [{ code: "blocked", severity: "error", message: "blocked", fieldPath: "draft", source: "test", remediationHint: "fix" }],
        warnings: [],
        validatorVersion: "test",
        validatedAt: new Date().toISOString(),
        duplicateRisk: "low",
        auditMetadata: { qualityIssues: [] },
      },
      idempotencyKey: "idem-1",
    });

    expect(result.status).toBe("blocked");
  });

  it("retries public verification until the draft is visible", async () => {
    let attempts = 0;
    const result = await publishApprovedDraft(
      createDbStub() as never,
      {
        draftId: "draft-2",
        entityKind: "provider",
        draftPayload: provider,
        gateResult: {
          approved: true,
          errors: [],
          warnings: [],
          validatorVersion: "test",
          validatedAt: new Date().toISOString(),
          duplicateRisk: "low",
          auditMetadata: { qualityIssues: [] },
        },
        idempotencyKey: "idem-2",
      },
      {
        origin: "https://compare.example.com",
        publicVerificationAttempts: 3,
        publicVerificationDelayMs: 0,
        sleep: async () => undefined,
        fetchImpl: async () => {
          attempts += 1;
          const rows =
            attempts < 2
              ? []
              : [
                  {
                    id: provider.id,
                    name: provider.name,
                    borough: provider.borough,
                    neighborhood: provider.neighborhood,
                    image: provider.image,
                  },
                ];
          return new Response(JSON.stringify(rows), { status: 200 });
        },
      },
    );

    expect(result.status).toBe("published");
    expect(result.publicVerification.verified).toBe(true);
    expect(attempts).toBe(2);
    expect(result.publicVerification.candidateDomain).toBe("example.com");
    expect(result.publicVerification.attemptsUsed).toBe(2);
  });
});
