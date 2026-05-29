import { buildCatalogOpsMissionSpec } from "@/lib/catalogOps/contracts";

function readArg(flag: string) {
  const direct = process.argv.find((arg) => arg.startsWith(`${flag}=`));
  return direct ? direct.slice(flag.length + 1) : null;
}

async function main() {
  const dryRun = process.argv.includes("--dry-run");
  const baseUrl = readArg("--base-url") ?? process.env.CHECKLIST_BASE_URL ?? "";
  const ingestSecret = readArg("--secret") ?? process.env.CHECKLIST_INGEST_SECRET ?? "";
  const missionSyncPath =
    readArg("--path") ?? process.env.CHECKLIST_MISSION_SYNC_PATH ?? "";

  const mission = buildCatalogOpsMissionSpec();
  const payload = {
    source: "compare-checklist-mission-sync",
    projectKey: mission.projectKey,
    productName: mission.productName,
    missionKey: mission.missionKey,
    destinationKey: mission.destinationKey,
    intelligenceUnitKey: mission.intelligenceUnitKey,
    companyId: mission.checklistCompanyId,
    generatedAt: mission.generatedAt,
    mission,
  };

  if (dryRun) {
    console.log(JSON.stringify(payload, null, 2));
    return;
  }

  if (!baseUrl || !ingestSecret || !missionSyncPath) {
    throw new Error(
      "CHECKLIST_BASE_URL, CHECKLIST_INGEST_SECRET, and CHECKLIST_MISSION_SYNC_PATH are required unless --dry-run is used.",
    );
  }

  const response = await fetch(`${baseUrl.replace(/\/$/, "")}${missionSyncPath}`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${ingestSecret}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  const json = (await response.json().catch(() => ({}))) as Record<string, unknown>;
  if (!response.ok) {
    throw new Error(`Checklist mission sync failed (${response.status}): ${JSON.stringify(json)}`);
  }

  console.log(
    JSON.stringify(
      {
        ok: true,
        status: response.status,
        path: missionSyncPath,
        response: json,
      },
      null,
      2,
    ),
  );
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
