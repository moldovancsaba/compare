/**
 * Remove legacy family / kid-oriented entries from the active catalog scope.
 * Safe to run repeatedly. Use with --dry-run to preview only.
 */
import { config as loadEnv } from "dotenv";
import path from "node:path";
import { MongoClient } from "mongodb";
import type { Provider } from "../src/types/provider";
import type { MeetupGroup } from "../src/types/meetup";
import { buildCatalogScopeFilter, getCatalogScope, getMongoDbName } from "../src/lib/mongodb";
import { isObsoleteFamilyMeetup, isObsoleteFamilyProvider } from "../src/lib/catalogContentPolicy";

loadEnv({ path: path.join(process.cwd(), ".env") });
loadEnv({ path: path.join(process.cwd(), ".env.local"), override: true });

const uri = process.env.MONGODB_URI;
if (!uri) {
  console.error("Missing MONGODB_URI");
  process.exit(1);
}

const args = new Set(process.argv.slice(2));
const dryRun = args.has("--dry-run") || args.has("--dryrun");
const catalogScope = getCatalogScope();

function summarize(ids: string[]) {
  return ids.slice(0, 20).join(", ") + (ids.length > 20 ? `, ... +${ids.length - 20}` : "");
}

async function purgeObsoleteCatalogContent() {
  const dbName = getMongoDbName();
  const client = new MongoClient(uri!);
  await client.connect();
  const db = client.db(dbName);

  const scopedFilter = buildCatalogScopeFilter({});
  const providers = (await db.collection("providers").find(scopedFilter).toArray()) as unknown as Provider[];
  const meetups = (await db.collection("meetupGroups").find(scopedFilter).toArray()) as unknown as MeetupGroup[];

  const obsoleteProviderIds = providers.filter(isObsoleteFamilyProvider).map((provider) => provider.id);
  const obsoleteMeetupIds = meetups.filter(isObsoleteFamilyMeetup).map((meetup) => meetup.id);

  if (dryRun) {
    console.log("[DRY RUN] candidate deletes: ", {
      scope: catalogScope,
      providers: {
        total: providers.length,
        blocked: obsoleteProviderIds.length,
        sample: summarize(obsoleteProviderIds),
      },
      meetups: {
        total: meetups.length,
        blocked: obsoleteMeetupIds.length,
        sample: summarize(obsoleteMeetupIds),
      },
    });
  } else {
    const providerFilter = obsoleteProviderIds.length ? { id: { $in: obsoleteProviderIds } } : null;
    const meetupFilter = obsoleteMeetupIds.length ? { id: { $in: obsoleteMeetupIds } } : null;

    const [providerDelete, meetupDelete, providerFingerprintDelete, meetupFingerprintDelete] = await Promise.all([
      providerFilter ? db.collection("providers").deleteMany({ ...scopedFilter, ...providerFilter }) : { deletedCount: 0 },
      meetupFilter ? db.collection("meetupGroups").deleteMany({ ...scopedFilter, ...meetupFilter }) : { deletedCount: 0 },
      providerFilter
        ? db.collection("catalogMediaFingerprints").deleteMany({
            ...scopedFilter,
            ...providerFilter,
            entityKind: "provider",
          })
        : { deletedCount: 0 },
      meetupFilter
        ? db.collection("catalogMediaFingerprints").deleteMany({
            ...scopedFilter,
            ...meetupFilter,
            entityKind: "meetupGroup",
          })
        : { deletedCount: 0 },
    ]);

    console.log("Cleaned catalog content in", dbName, "scope", catalogScope.join(","));
    console.log(
      `Deleted providers: ${providerDelete.deletedCount} of ${obsoleteProviderIds.length}, meetups: ${meetupDelete.deletedCount} of ${obsoleteMeetupIds.length}`,
    );
    console.log(
      `Deleted provider fingerprints: ${providerFingerprintDelete.deletedCount}, meetup fingerprints: ${meetupFingerprintDelete.deletedCount}`,
    );
  }

  await client.close();
}

purgeObsoleteCatalogContent().catch((error) => {
  console.error(error);
  process.exit(1);
});
