import fs from "node:fs";
import path from "node:path";
import {
  collectCompetitionLeads,
  collectEventLeads,
  collectArtifactsFromClassifiedSources,
} from "@/lib/shootingIngestion/sourceCollector";
import { buildShootingSourceInventory } from "@/lib/shootingIngestion/sourceInventory";
import { getShootingSourceSeeds } from "@/lib/shootingIngestion/sourceSeeds";
import { classifyShootingSource } from "@/lib/shootingIngestion/sourceClassifier";

function getWriteDir() {
  const idx = process.argv.indexOf("--write-dir");
  if (idx === -1) return "docs/reports";
  return process.argv[idx + 1] ?? "docs/reports";
}

function getMaxRecords() {
  const idx = process.argv.indexOf("--max-records");
  if (idx === -1) return undefined;
  const raw = Number(process.argv[idx + 1]);
  return Number.isFinite(raw) && raw > 0 ? raw : undefined;
}

async function main() {
  const writeDir = getWriteDir();
  const maxRecords = getMaxRecords();
  const startedAt = new Date().toISOString();

  const inventory = await buildShootingSourceInventory({ seeds: getShootingSourceSeeds() });
  const classified = inventory.rows.map((source) => classifyShootingSource({ seed: source }));
  const nowIso = new Date().toISOString();

  const [competitionReport, eventReport] = await Promise.all([
    collectCompetitionLeads({ sources: classified, nowIso, maxRecordsPerSource: maxRecords }),
    collectEventLeads({ sources: classified, nowIso, maxRecordsPerSource: maxRecords }),
  ]);
  const fullReport = await collectArtifactsFromClassifiedSources(classified, nowIso, "Europe/Budapest");
  const completedAt = new Date().toISOString();
  const pipeline = {
    runId: nowIso,
    startedAt,
    completedAt,
    workflow: "shooting-collect-v1",
    tasks: {
      sourceInventory: {
        task: "shooting-source-inventory-refresh",
        sourceCount: inventory.totalRows,
        active: inventory.activeRows,
        blocked: inventory.blockedRows,
        timeout: inventory.timeoutRows,
      },
      leadCollection: {
        competitionCandidates: competitionReport.totalCandidates,
        eventCandidates: eventReport.totalCandidates,
        entityCandidates: fullReport.entityLeads.totalCandidates,
      },
    },
    outputs: {
      competitionReport: "shooting-competition-leads-latest.json",
      eventReport: "shooting-event-leads-latest.json",
      entityLeadReport: "shooting-entity-leads-latest.json",
      summaryReport: "shooting-leads-summary-latest.md",
    },
  };

  const markdown =
    `# Shooting Lead Export (${nowIso})\n` +
    `\n- Competition candidates: ${competitionReport.totalCandidates}\n` +
    `- Event candidates: ${eventReport.totalCandidates}\n` +
    `- Entity candidates: ${fullReport.entityLeads.totalCandidates}\n` +
    `- Entity high confidence: ${fullReport.entityLeads.highConfidenceCount}\n` +
    `- Entity medium confidence: ${fullReport.entityLeads.mediumConfidenceCount}\n` +
    `- Entity low confidence: ${fullReport.entityLeads.lowConfidenceCount}\n` +
    `- Competition confidence: h:${competitionReport.highConfidenceCount} m:${competitionReport.mediumConfidenceCount} l:${competitionReport.lowConfidenceCount}\n` +
    `- Event confidence: h:${eventReport.highConfidenceCount} m:${eventReport.mediumConfidenceCount} l:${eventReport.lowConfidenceCount}\n`;

  fs.mkdirSync(writeDir, { recursive: true });
  fs.writeFileSync(path.join(writeDir, "shooting-competition-leads-latest.json"), JSON.stringify(competitionReport, null, 2), "utf8");
  fs.writeFileSync(path.join(writeDir, "shooting-event-leads-latest.json"), JSON.stringify(eventReport, null, 2), "utf8");
  fs.writeFileSync(path.join(writeDir, "shooting-entity-leads-latest.json"), JSON.stringify(fullReport.entityLeads, null, 2), "utf8");
  fs.writeFileSync(path.join(writeDir, "shooting-lead-pipeline-latest.json"), JSON.stringify(pipeline, null, 2), "utf8");
  fs.writeFileSync(path.join(writeDir, "shooting-competition-leads-latest.ndjson"), `${competitionReport.rows.map((row) => JSON.stringify(row)).join("\n")}\n`, "utf8");
  fs.writeFileSync(path.join(writeDir, "shooting-event-leads-latest.ndjson"), `${eventReport.events.map((row) => JSON.stringify(row)).join("\n")}\n`, "utf8");
  fs.writeFileSync(path.join(writeDir, "shooting-entity-leads-latest.ndjson"), `${fullReport.entityLeads.rows.map((row) => JSON.stringify(row)).join("\n")}\n`, "utf8");
  fs.writeFileSync(path.join(writeDir, "shooting-leads-summary-latest.md"), markdown, "utf8");

  process.stdout.write(markdown);
}

main().catch((error) => {
  console.error("[collect-shooting-leads] failed:", error);
  process.exit(1);
});
