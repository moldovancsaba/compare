import type { MeetupGroup } from "@/types/meetup";
import type { Provider, RecurringProgram } from "@/types/provider";
import {
  CHECKLIST_BRIDGE_VERSION,
  CHECKLIST_DESTINATION_KEY,
} from "@/lib/workflow/projectConfig";

export type LiveRevisionEntityKind = "provider" | "meetupGroup";

export interface RangeScoutLiveRevisionIntakePayload {
  companyId: string;
  destinationKey: string;
  bridgeVersion: string;
  adapterVersion: string;
  liveListing: {
    id: string;
    type: LiveRevisionEntityKind;
    title: string;
    canonicalSourceUrl: string;
    websiteUrl?: string | null;
    publicUrl?: string | null;
    adminUrl?: string | null;
    borough?: string | null;
    neighborhood?: string | null;
    publishedAt?: string | null;
    updatedAt?: string | null;
    imageUrl?: string | null;
  };
  factsJson: Record<string, unknown>;
  provenanceJson: Record<string, unknown>;
  draftPayload: Record<string, unknown>;
  evidenceSummary: Record<string, unknown>;
  diagnostics: Record<string, unknown>;
  mediaSummary: Record<string, unknown> | null;
  metadata: Record<string, unknown>;
}

function buildProviderScheduleBlocks(programs: RecurringProgram[] | undefined) {
  return (programs ?? []).map((program) => ({
    title: program.title,
    daysOfWeek: program.daysOfWeek,
    timeText: program.timeText,
    registrationUrl: program.registrationUrl,
    priceText: program.priceText,
    summary: program.summary,
  }));
}

export function buildProviderLiveRevisionPayload(args: {
  provider: Provider;
  companyId: string;
  origin: string;
  bridgeVersion?: string;
}): RangeScoutLiveRevisionIntakePayload {
  const { provider, companyId, origin } = args;
  const { _id: _providerId, ...providerDraft } = provider as Provider & { _id?: unknown };
  const canonicalSourceUrl = provider.website?.trim() || `${origin}/api/public/providers`;
  return {
    companyId,
    destinationKey: CHECKLIST_DESTINATION_KEY,
    bridgeVersion: args.bridgeVersion ?? CHECKLIST_BRIDGE_VERSION,
    adapterVersion: "compare-live-revision@v1",
    liveListing: {
      id: provider.id,
      type: "provider",
      title: provider.name,
      canonicalSourceUrl,
      websiteUrl: provider.website || null,
      publicUrl: canonicalSourceUrl,
      adminUrl: `${origin}/admin`,
      borough: provider.borough,
      neighborhood: provider.neighborhood,
      publishedAt: provider.publishedAt ?? null,
      updatedAt: provider.updatedAt ?? null,
      imageUrl: provider.image || null,
    },
    factsJson: {
      title: provider.name,
      listingKindHint: "provider",
      categoryHint: provider.category,
      boroughRaw: provider.borough,
      neighborhoodRaw: provider.neighborhood,
      addressRaw: provider.address,
      activityTypesRaw: provider.activityTypes,
      ageRangesRaw: provider.ageRanges,
      scheduleBlocks: buildProviderScheduleBlocks(provider.recurringPrograms),
      descriptionFacts: [provider.shortDescription, provider.longDescription].filter(Boolean),
      contactFacts: {
        website: provider.website,
        email: provider.email,
        phone: provider.phone,
      },
      imageCandidates: provider.image ? [{ uploadedUrl: provider.image }] : [],
      sourceUrls: {
        canonical: canonicalSourceUrl,
      },
    },
    provenanceJson: {
      source: "compare-live-provider",
      listingId: provider.id,
      listingType: "provider",
      exportedAt: new Date().toISOString(),
    },
    draftPayload: providerDraft as unknown as Record<string, unknown>,
    evidenceSummary: {
      source: "live-compare-provider",
      listingId: provider.id,
      listingType: "provider",
      borough: provider.borough,
      neighborhood: provider.neighborhood,
      website: provider.website,
      publicUrl: canonicalSourceUrl,
    },
    diagnostics: {
      source: "live-compare-provider",
      notes: [],
    },
    mediaSummary: provider.image
      ? {
          source: "live-compare-provider",
          imageUrl: provider.image,
        }
      : null,
    metadata: {
      liveListing: {
        id: provider.id,
        type: "provider",
        title: provider.name,
        borough: provider.borough,
        neighborhood: provider.neighborhood,
        publicUrl: canonicalSourceUrl,
        adminUrl: `${origin}/admin`,
      },
    },
  };
}

export function buildMeetupLiveRevisionPayload(args: {
  meetupGroup: MeetupGroup;
  companyId: string;
  origin: string;
  bridgeVersion?: string;
}): RangeScoutLiveRevisionIntakePayload {
  const { meetupGroup, companyId, origin } = args;
  const { _id: _meetupId, ...meetupDraft } = meetupGroup as MeetupGroup & { _id?: unknown };
  const canonicalSourceUrl = meetupGroup.website?.trim() || `${origin}/api/public/meetup-groups`;
  return {
    companyId,
    destinationKey: CHECKLIST_DESTINATION_KEY,
    bridgeVersion: args.bridgeVersion ?? CHECKLIST_BRIDGE_VERSION,
    adapterVersion: "compare-live-revision@v1",
    liveListing: {
      id: meetupGroup.id,
      type: "meetupGroup",
      title: meetupGroup.name,
      canonicalSourceUrl,
      websiteUrl: meetupGroup.website || null,
      publicUrl: canonicalSourceUrl,
      adminUrl: `${origin}/admin`,
      borough: meetupGroup.borough,
      neighborhood: meetupGroup.neighborhood,
      imageUrl: meetupGroup.coverImageUrl || null,
    },
    factsJson: {
      title: meetupGroup.name,
      listingKindHint: "meetupGroup",
      boroughRaw: meetupGroup.borough,
      neighborhoodRaw: meetupGroup.neighborhood,
      descriptionFacts: [meetupGroup.description],
      contactFacts: {
        website: meetupGroup.website,
        instagram: meetupGroup.instagram,
      },
      imageCandidates: meetupGroup.coverImageUrl ? [{ uploadedUrl: meetupGroup.coverImageUrl }] : [],
      sourceUrls: {
        canonical: canonicalSourceUrl,
      },
    },
    provenanceJson: {
      source: "compare-live-meetup",
      listingId: meetupGroup.id,
      listingType: "meetupGroup",
      exportedAt: new Date().toISOString(),
    },
    draftPayload: meetupDraft as unknown as Record<string, unknown>,
    evidenceSummary: {
      source: "live-compare-meetup",
      listingId: meetupGroup.id,
      listingType: "meetupGroup",
      borough: meetupGroup.borough,
      neighborhood: meetupGroup.neighborhood,
      website: meetupGroup.website,
      publicUrl: canonicalSourceUrl,
    },
    diagnostics: {
      source: "live-compare-meetup",
      notes: [],
    },
    mediaSummary: meetupGroup.coverImageUrl
      ? {
          source: "live-compare-meetup",
          imageUrl: meetupGroup.coverImageUrl,
        }
      : null,
    metadata: {
      liveListing: {
        id: meetupGroup.id,
        type: "meetupGroup",
        title: meetupGroup.name,
        borough: meetupGroup.borough,
        neighborhood: meetupGroup.neighborhood,
        publicUrl: canonicalSourceUrl,
        adminUrl: `${origin}/admin`,
      },
    },
  };
}
