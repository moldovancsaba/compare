import { describe, expect, it } from "vitest";
import { buildCatalogAuditReport, renderCatalogAuditMarkdown } from "@/lib/catalogAudit";
import type { MeetupGroup } from "@/types/meetup";
import type { Provider } from "@/types/provider";

describe("catalog audit", () => {
  it("flags schedule drift, stale text, and payload drift deterministically", () => {
    const providers: Provider[] = [
      {
        id: "prov-1",
        name: "Provider One",
        category: "Classes",
        borough: "Bronx",
        neighborhood: "Riverdale",
        address: "1 Example St",
        activityTypes: ["Art"],
        ageRanges: ["3–5"],
        dayTimeTags: ["Weekday"],
        pricePerClass: 10,
        shortDescription: "Provider one",
        longDescription: "The 2024 class schedule is listed here.",
        rating: 0,
        reviewCount: 0,
        badges: ["Weekend Friendly"],
        image: "",
        email: "",
        website: "https://example.org/provider",
        phone: "",
        recurringPrograms: [
          {
            id: "rp-1",
            title: "Saturday Class",
            cadence: "Weekly",
            daysOfWeek: ["Saturday"],
            timeText: "10:00 AM - 11:00 AM",
            endDate: "2026-01-01",
          },
        ],
      },
    ];

    const meetups: MeetupGroup[] = [
      {
        id: "meetup-1",
        name: "Meetup One",
        borough: "Bronx",
        neighborhood: "Riverdale",
        groupType: "Parent Meetup",
        ageRange: "All ages",
        cadence: "Monthly",
        instagram: "",
        website: "https://example.org/meetup",
        description: "A 2023 family meetup program.",
        initials: "MO",
        icon: "community",
        palette: "teal",
      },
    ];

    const report = buildCatalogAuditReport({
      providers,
      meetups,
      curatedEntries: [{ resource: "provider", id: "prov-missing", file: "catalog/example.json", document: {} }],
      generatedAt: "2026-05-20T00:00:00.000Z",
      currentYear: 2026,
      today: "2026-05-20",
    });

    expect(report.findings).toEqual(
      expect.arrayContaining([
        "- [provider] prov-1: missing live image",
        "- [provider] prov-1: Weekend Friendly badge without Weekend tag",
        "- [provider] prov-1: recurringPrograms imply missing tag Weekend",
        "- [provider] prov-1: recurring program rp-1 ended on 2026-01-01",
        "- [meetup] meetup-1: missing live cover image",
        "- [payload drift] prov-missing: curated provider payload exists in catalog/example.json but no live row is present",
      ]),
    );
  });

  it("renders a clean report when there are no findings", () => {
    const markdown = renderCatalogAuditMarkdown({
      generatedAt: "2026-05-20T00:00:00.000Z",
      providersCount: 1,
      meetupCount: 1,
      findings: [],
    });

    expect(markdown).toContain("No findings.");
  });
});
