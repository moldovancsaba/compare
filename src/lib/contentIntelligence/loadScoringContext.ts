import { COL, getDb } from "@/lib/mongodb";
import { buildCatalogSnapshot } from "@/lib/catalogIntelligence";
import type { MeetupGroup } from "@/types/meetup";
import type { Provider } from "@/types/provider";

export async function loadRangeScoutScoringContext() {
  const db = await getDb();
  if (!db) throw new Error("No database");

  const [providers, meetups] = await Promise.all([
    db.collection(COL.providers).find({}).toArray() as unknown as Promise<Provider[]>,
    db.collection(COL.meetupGroups).find({}).toArray() as unknown as Promise<MeetupGroup[]>,
  ]);

  const snapshot = buildCatalogSnapshot(providers, providers, meetups, meetups);
  return { providers, meetups, snapshot };
}
