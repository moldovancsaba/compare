import { NextResponse } from "next/server";
import { COL, getDb } from "@/lib/mongodb";
import { requireAdmin } from "@/lib/requireAdmin";
import { buildCatalogSnapshot } from "@/lib/catalogIntelligence";
import type { MeetupGroup } from "@/types/meetup";
import type { Provider } from "@/types/provider";

export async function GET(request: Request) {
  const denied = await requireAdmin();
  if (denied) return denied;

  const db = await getDb();
  if (!db) return NextResponse.json({ error: "No database" }, { status: 503 });

  const url = new URL(request.url);
  const origin = url.origin;

  const [privateProviders, privateMeetups, publicProvidersResponse, publicMeetupsResponse] = await Promise.all([
    db.collection(COL.providers).find({}).toArray() as unknown as Promise<Provider[]>,
    db.collection(COL.meetupGroups).find({}).toArray() as unknown as Promise<MeetupGroup[]>,
    fetch(`${origin}/api/public/providers`, { cache: "no-store" }),
    fetch(`${origin}/api/public/meetup-groups`, { cache: "no-store" }),
  ]);

  if (!publicProvidersResponse.ok || !publicMeetupsResponse.ok) {
    return NextResponse.json({ error: "Failed to load public catalog data" }, { status: 502 });
  }

  const [publicProviders, publicMeetups] = (await Promise.all([
    publicProvidersResponse.json(),
    publicMeetupsResponse.json(),
  ])) as [Provider[], MeetupGroup[]];

  return NextResponse.json(buildCatalogSnapshot(privateProviders, publicProviders, privateMeetups, publicMeetups));
}
