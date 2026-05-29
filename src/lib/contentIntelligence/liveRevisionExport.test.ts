import { describe, expect, it } from "vitest";
import { buildMeetupLiveRevisionPayload, buildProviderLiveRevisionPayload } from "@/lib/contentIntelligence/liveRevisionExport";
import type { MeetupGroup } from "@/types/meetup";
import type { Provider } from "@/types/provider";

const provider: Provider = {
  id: "prov-test",
  name: "Test Art Studio",
  category: "Classes",
  borough: "Brooklyn",
  neighborhood: "Park Slope",
  address: "123 Test St, Brooklyn, NY",
  activityTypes: ["Art"],
  ageRanges: ["3–5"],
  dayTimeTags: ["Weekend", "Morning"],
  pricePerClass: 40,
  shortDescription: "Short description",
  longDescription: "Long description",
  rating: 4.8,
  reviewCount: 42,
  badges: ["Popular"],
  image: "https://i.ibb.co/example-provider.jpg",
  email: "hello@example.com",
  website: "https://example.com/provider",
  phone: "555-000-0000",
  recurringPrograms: [
    {
      id: "program-1",
      title: "Saturday Art",
      cadence: "Weekly",
      daysOfWeek: ["Saturday"],
      timeText: "10:00 AM - 11:00 AM",
    },
  ],
};

const meetup: MeetupGroup = {
  id: "meetup-test",
  name: "Astoria Families",
  borough: "Queens",
  neighborhood: "Astoria",
  groupType: "Neighborhood Families",
  ageRange: "All ages",
  cadence: "Weekly",
  instagram: "https://instagram.com/astoriafamilies",
  website: "https://example.com/meetup",
  description: "Neighborhood meetup for local families.",
  initials: "AF",
  icon: "community",
  palette: "teal",
  coverImageUrl: "https://i.ibb.co/example-meetup.jpg",
};

describe("live revision export", () => {
  it("builds a provider live revision intake payload", () => {
    const payload = buildProviderLiveRevisionPayload({
      provider,
      companyId: "company-1",
      origin: "https://compare.test",
    });

    expect(payload.liveListing.id).toBe(provider.id);
    expect(payload.liveListing.type).toBe("provider");
    expect(payload.factsJson.title).toBe(provider.name);
    expect(payload.mediaSummary).toEqual({
      source: "live-compare-provider",
      imageUrl: provider.image,
    });
  });

  it("builds a meetup live revision intake payload", () => {
    const payload = buildMeetupLiveRevisionPayload({
      meetupGroup: meetup,
      companyId: "company-1",
      origin: "https://compare.test",
    });

    expect(payload.liveListing.id).toBe(meetup.id);
    expect(payload.liveListing.type).toBe("meetupGroup");
    expect(payload.factsJson.title).toBe(meetup.name);
    expect(payload.mediaSummary).toEqual({
      source: "live-compare-meetup",
      imageUrl: meetup.coverImageUrl,
    });
  });
});
