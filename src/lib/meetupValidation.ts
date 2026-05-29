import type { MeetupGroup } from "@/types/meetup";
import { curatedMeetupSchema } from "@/lib/meetupSchema";

export function validateMeetupDocument(doc: MeetupGroup | Partial<MeetupGroup>): string | null {
  const parsed = curatedMeetupSchema.safeParse(doc);
  if (parsed.success) return null;
  return parsed.error.issues[0]?.message ?? "Invalid meetup document";
}
