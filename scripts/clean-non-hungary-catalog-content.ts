import { getDb, COL, buildCatalogScopeFilter } from "@/lib/mongodb";

const BLOCKED_NEIGHBORHOOD_TOKENS = ["black forest", "brittany", "andalusia", "view all", "budapest hills"];

function containsBlockedToken(value: unknown) {
  const text = String(value || "").toLowerCase();
  return BLOCKED_NEIGHBORHOOD_TOKENS.some((token) => text.includes(token));
}

async function main() {
  const db = await getDb();
  if (!db) {
    throw new Error("Database not configured (MONGODB_URI)");
  }

  const scopeFilter = buildCatalogScopeFilter({});
  const nonHungaryFilter = {
    ...scopeFilter,
    borough: { $ne: "Hungary" },
  };

  const [providers, meetups, locations, hungaryProvidersByFakeNeighborhood, hungaryMeetupsByFakeNeighborhood] = await Promise.all([
    db.collection(COL.providers).deleteMany(nonHungaryFilter),
    db.collection(COL.meetupGroups).deleteMany(nonHungaryFilter),
    db.collection(COL.locations).deleteMany(nonHungaryFilter),
    db.collection(COL.providers).deleteMany({
      ...scopeFilter,
      borough: "Hungary",
      $or: [
        { neighborhood: { $regex: /black forest|brittany|andalusia|view all|budapest hills/i } },
        { address: { $regex: /black forest|brittany|andalusia/i } },
      ],
    }),
    db.collection(COL.meetupGroups).deleteMany({
      ...scopeFilter,
      borough: "Hungary",
      $or: [
        { neighborhood: { $regex: /black forest|brittany|andalusia|view all|budapest hills/i } },
        { description: { $regex: /black forest|brittany|andalusia/i } },
      ],
    }),
  ]);

  const hungaryLocationRows = await db.collection(COL.locations).find({ ...scopeFilter, borough: "Hungary" }).toArray();
  const allowedNeighborhoods = ["Budapest", "Pest", "Bács-Kiskun", "Heves", "Borsod-Abaúj-Zemplén", "Zala"];
  const cleanedNeighborhoods = [...new Set(
    hungaryLocationRows
      .flatMap((row) => (Array.isArray((row as { neighborhoods?: unknown[] }).neighborhoods) ? (row as { neighborhoods?: unknown[] }).neighborhoods! : []))
      .map((value) => String(value || "").trim())
      .filter(Boolean)
      .filter((value) => !containsBlockedToken(value))
      .filter((value) => allowedNeighborhoods.includes(value)),
  )];
  const finalNeighborhoods = cleanedNeighborhoods.length > 0 ? cleanedNeighborhoods : allowedNeighborhoods;

  await db.collection(COL.locations).deleteMany({ ...scopeFilter, borough: "Hungary" });
  await db.collection(COL.locations).insertOne({
    borough: "Hungary",
    neighborhoods: finalNeighborhoods,
  });

  console.log(
    JSON.stringify(
      {
        ok: true,
        deleted: {
          providers: providers.deletedCount ?? 0,
          meetupGroups: meetups.deletedCount ?? 0,
          locations: locations.deletedCount ?? 0,
          hungaryProvidersWithPlaceholderNeighborhood: hungaryProvidersByFakeNeighborhood.deletedCount ?? 0,
          hungaryMeetupsWithPlaceholderNeighborhood: hungaryMeetupsByFakeNeighborhood.deletedCount ?? 0,
        },
        normalizedHungaryNeighborhoods: finalNeighborhoods,
      },
      null,
      2,
    ),
  );
}

main().catch((error) => {
  console.error("[clean-non-hungary-catalog-content] failed:", error);
  process.exit(1);
});
