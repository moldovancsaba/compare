import { sendChecklistLiveRevisionIntake, fetchChecklistLiveRevisionStatus } from "@/lib/contentIntelligence/checklistBridge";
import {
  buildMeetupLiveRevisionPayload,
  buildProviderLiveRevisionPayload,
} from "@/lib/contentIntelligence/liveRevisionExport";
import { COL, buildCatalogScopeFilter } from "@/lib/mongodb";
import type { Db } from "mongodb";
import type { MeetupGroup } from "@/types/meetup";
import type { Provider } from "@/types/provider";
import {
  CHECKLIST_DEFAULT_COMPANY_ID,
  CHECKLIST_DESTINATION_KEY,
} from "@/lib/workflow/projectConfig";

function readCompanyId(value: unknown) {
  if (typeof value === "string" && value.trim()) return value.trim();
  return CHECKLIST_DEFAULT_COMPANY_ID;
}

export async function createLiveListingRevisionPacket(
  db: Db,
  input: {
    checklistCompanyId?: string | null;
    listingType: "provider" | "meetupGroup";
    listingId: string;
    origin: string;
  },
) {
  const companyId = readCompanyId(input.checklistCompanyId);
  if (!companyId) {
    return {
      ok: false,
      status: 400,
      error: "checklistCompanyId (or CHECKLIST_DEFAULT_COMPANY_ID) is required",
    };
  }

  const providerDoc =
    input.listingType === "provider"
      ? ((await db.collection(COL.providers).findOne(buildCatalogScopeFilter({ id: input.listingId })) as unknown) as Provider | null)
      : null;
  const meetupDoc =
    input.listingType === "meetupGroup"
      ? ((await db.collection(COL.meetupGroups).findOne(buildCatalogScopeFilter({ id: input.listingId })) as unknown) as MeetupGroup | null)
      : null;

  if ((input.listingType === "provider" && !providerDoc) || (input.listingType === "meetupGroup" && !meetupDoc)) {
    return {
      ok: false,
      status: 404,
      error: `${input.listingType} ${input.listingId} not found`,
    };
  }

  const payload =
    input.listingType === "provider"
      ? buildProviderLiveRevisionPayload({
          provider: providerDoc as Provider,
          companyId,
          origin: input.origin,
        })
      : buildMeetupLiveRevisionPayload({
          meetupGroup: meetupDoc as MeetupGroup,
          companyId,
          origin: input.origin,
        });

  const result = await sendChecklistLiveRevisionIntake(payload);
  return {
    ok: result.ok,
    skipped: result.skipped,
    status: result.status ?? (result.ok ? 200 : 502),
    data: result.data,
    payloadSummary: {
      listingId: input.listingId,
      listingType: input.listingType,
      companyId,
    },
  };
}

export async function getLiveListingRevisionStatus(input: {
  checklistCompanyId?: string | null;
  listingType: "provider" | "meetupGroup";
  listingId: string;
}) {
  const companyId = readCompanyId(input.checklistCompanyId);
  if (!companyId) {
    return {
      ok: false,
      status: 400,
      error: "checklistCompanyId (or CHECKLIST_DEFAULT_COMPANY_ID) is required",
    };
  }

  const result = await fetchChecklistLiveRevisionStatus({
    companyId,
    destinationKey: CHECKLIST_DESTINATION_KEY,
    listingId: input.listingId,
    listingType: input.listingType,
  });

  return {
    ok: result.ok,
    skipped: result.skipped,
    status: result.status ?? (result.ok ? 200 : 502),
    data: result.data,
  };
}
