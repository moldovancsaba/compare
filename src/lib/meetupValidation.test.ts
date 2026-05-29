import { describe, expect, it } from "vitest";
import { validateMeetupDocument } from "@/lib/meetupValidation";

describe("validateMeetupDocument", () => {
  it("accepts a valid meetup document", () => {
    expect(
      validateMeetupDocument({
        id: "meetup-riverdale-families",
        name: "Riverdale Families",
        borough: "Bronx",
        neighborhood: "Riverdale",
        groupType: "Neighborhood Families",
        ageRange: "All ages",
        cadence: "Monthly",
        instagram: "",
        website: "https://example.org/families",
        description: "A neighborhood families meetup for parents and children with monthly community gatherings.",
        initials: "RF",
        icon: "community",
        palette: "teal",
        coverImageUrl: "https://i.ibb.co/example/photo.jpg",
      }),
    ).toBeNull();
  });

  it("rejects unsupported group types", () => {
    expect(
      validateMeetupDocument({
        id: "meetup-riverdale-families",
        name: "Riverdale Families",
        borough: "Bronx",
        neighborhood: "Riverdale",
        groupType: "Family Club" as never,
        ageRange: "All ages",
        cadence: "Monthly",
        instagram: "",
        website: "https://example.org/families",
        description: "A neighborhood families meetup for parents and children with monthly community gatherings.",
        initials: "RF",
        icon: "community",
        palette: "teal",
      }),
    ).toMatch(/Invalid enum value/);
  });

  it("rejects non-ImgBB cover images", () => {
    expect(
      validateMeetupDocument({
        id: "meetup-riverdale-families",
        name: "Riverdale Families",
        borough: "Bronx",
        neighborhood: "Riverdale",
        groupType: "Neighborhood Families",
        ageRange: "All ages",
        cadence: "Monthly",
        instagram: "",
        website: "https://example.org/families",
        description: "A neighborhood families meetup for parents and children with monthly community gatherings.",
        initials: "RF",
        icon: "community",
        palette: "teal",
        coverImageUrl: "https://example.org/photo.jpg",
      }),
    ).toMatch(/ImgBB/);
  });
});
