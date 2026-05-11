#!/usr/bin/env node

import { execFile } from "node:child_process";
import crypto from "node:crypto";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";

import mongoose from "mongoose";

import { applyFeedbackSignal } from "./trinity-feedback-summary.mjs";

const DEFAULT_TRINITY_REPO = "/Users/Shared/Projects/trinity";
const DEFAULT_DB_NAME = "compare";
const DEFAULT_POLL_INTERVAL_MS = 30_000;
const DEFAULT_TRINITY_TIMEOUT_MS = 120_000;
const BRAIN_VERSION = "trinity-compare-adapter@v1alpha1";
const PROMPT_VERSION = "deterministic-compare@v1alpha1";

loadEnvFile(path.join(process.cwd(), ".env"));
loadEnvFile(path.join(process.cwd(), ".env.local"));

const args = new Set(process.argv.slice(2));
const runOnce = args.has("--once");

const compareJobSchema = new mongoose.Schema(
  {
    comparisonRef: { type: String, required: true, index: true },
    requestHash: { type: String, required: true, unique: true },
    status: {
      type: String,
      enum: ["queued", "running", "completed", "failed"],
      default: "queued",
      index: true
    },
    leftWatchId: { type: String, required: true, index: true },
    rightWatchId: { type: String, required: true, index: true },
    decisionProfile: { type: mongoose.Schema.Types.Mixed, default: null },
    requestedBy: { type: String, default: null },
    deterministicResult: { type: mongoose.Schema.Types.Mixed, required: true },
    error: { type: String, default: null },
    claimedAt: { type: Date, default: null },
    completedAt: { type: Date, default: null }
  },
  {
    collection: "compare_jobs",
    timestamps: true
  }
);

const comparisonTraceSchema = new mongoose.Schema(
  {
    comparisonRef: { type: String, required: true, index: true },
    jobId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "CompareJob",
      default: null,
      index: true
    },
    brainProvider: { type: String, required: true },
    brainVersion: { type: String, required: true },
    promptVersion: { type: String, default: null },
    modelName: { type: String, default: null },
    inputHash: { type: String, required: true, index: true },
    sourceRefs: { type: [String], default: [] },
    confidence: { type: mongoose.Schema.Types.Mixed, default: null },
    minorityReport: { type: mongoose.Schema.Types.Mixed, default: null },
    tracePayload: { type: mongoose.Schema.Types.Mixed, default: null },
    rawTracePath: { type: String, default: null }
  },
  {
    collection: "comparison_traces",
    timestamps: true
  }
);

const savedComparisonSchema = new mongoose.Schema(
  {
    comparisonRef: { type: String, required: true, unique: true },
    leftWatchId: { type: String, required: true, index: true },
    rightWatchId: { type: String, required: true, index: true },
    deterministicResult: { type: mongoose.Schema.Types.Mixed, required: true },
    brainResult: { type: mongoose.Schema.Types.Mixed, default: null },
    selectedRecommendation: { type: mongoose.Schema.Types.Mixed, default: null },
    traceRef: { type: String, default: null },
    feedbackSummary: { type: mongoose.Schema.Types.Mixed, default: null },
    lastFeedbackAt: { type: Date, default: null }
  },
  {
    collection: "saved_comparisons",
    timestamps: true
  }
);

const comparisonFeedbackSchema = new mongoose.Schema(
  {
    comparisonRef: { type: String, required: true, index: true },
    leftWatchId: { type: String, required: true, index: true },
    rightWatchId: { type: String, required: true, index: true },
    traceRef: { type: String, default: null, index: true },
    signal: {
      type: String,
      enum: [
        "helpful",
        "not_helpful",
        "chose_left",
        "chose_right",
        "opposite_preferred",
        "bad_recommendation",
        "missing_context",
        "wrong_spec"
      ],
      required: true,
      index: true
    },
    note: { type: String, default: null },
    source: { type: String, default: "comparison_result" },
    processedByTrinity: { type: Boolean, default: false, index: true },
    processingStatus: {
      type: String,
      enum: ["pending", "processed", "skipped"],
      default: "pending",
      index: true
    },
    processedAt: { type: Date, default: null },
    processingError: { type: String, default: null }
  },
  {
    collection: "comparison_feedback",
    timestamps: true
  }
);

const CompareJob = mongoose.models.CompareJob || mongoose.model("CompareJob", compareJobSchema);
const ComparisonTrace =
  mongoose.models.ComparisonTrace || mongoose.model("ComparisonTrace", comparisonTraceSchema);
const SavedComparison =
  mongoose.models.SavedComparison || mongoose.model("SavedComparison", savedComparisonSchema);
const ComparisonFeedback =
  mongoose.models.ComparisonFeedback || mongoose.model("ComparisonFeedback", comparisonFeedbackSchema);

main().catch(async (error) => {
  log("error", error.stack || error.message || String(error));
  await disconnect();
  process.exitCode = 1;
});

async function main() {
  const mongoUri = process.env.MONGODB_URI;
  if (!mongoUri) {
    throw new Error("MONGODB_URI is required to run the Trinity compare worker.");
  }

  await mongoose.connect(mongoUri, {
    dbName: process.env.MONGODB_DB_NAME || DEFAULT_DB_NAME
  });
  log("info", `Connected to MongoDB database ${process.env.MONGODB_DB_NAME || DEFAULT_DB_NAME}.`);

  if (runOnce) {
    const processedJob = await processNextJob();
    const processedFeedback = await processFeedbackBatch();
    log(
      "info",
      [
        processedJob ? "Processed one compare job." : "No queued compare jobs found.",
        `Processed ${processedFeedback.processed} feedback record(s); skipped ${processedFeedback.skipped}.`
      ].join(" ")
    );
    await disconnect();
    return;
  }

  log("info", "Trinity compare worker started. Use Ctrl+C to stop.");
  process.on("SIGINT", shutdown);
  process.on("SIGTERM", shutdown);

  while (true) {
    await processNextJob();
    await processFeedbackBatch();
    await sleep(numberEnv("COMPARE_BRAIN_WORKER_POLL_MS", DEFAULT_POLL_INTERVAL_MS));
  }
}

async function processNextJob() {
  const now = new Date();
  const job = await CompareJob.findOneAndUpdate(
    { status: "queued" },
    {
      $set: {
        status: "running",
        claimedAt: now,
        error: null
      }
    },
    {
      returnDocument: "after",
      sort: { createdAt: 1 }
    }
  );

  if (!job) {
    return false;
  }

  log("info", `Claimed ${job.comparisonRef} (${job._id}).`);

  try {
    const requestPayload = buildTrinityPayload(job);
    const trinityResult = await runTrinityCompare(requestPayload);
    const trace = await persistTrace(job, trinityResult, requestPayload);

    await Promise.all([
      CompareJob.updateOne(
        { _id: job._id },
        {
          $set: {
            status: "completed",
            completedAt: new Date(),
            error: null
          }
        }
      ),
      SavedComparison.findOneAndUpdate(
        { comparisonRef: job.comparisonRef },
        {
          $set: {
            leftWatchId: job.leftWatchId,
            rightWatchId: job.rightWatchId,
            deterministicResult: job.deterministicResult,
            brainResult: trinityResult,
            traceRef: String(trace._id)
          }
        },
        { returnDocument: "after", upsert: true }
      )
    ]);

    log("info", `Completed ${job.comparisonRef}.`);
    return true;
  } catch (error) {
    const message = error.stack || error.message || String(error);
    await CompareJob.updateOne(
      { _id: job._id },
      {
        $set: {
          status: "failed",
          completedAt: new Date(),
          error: message.slice(0, 4000)
        }
      }
    );
    log("error", `Failed ${job.comparisonRef}: ${message}`);
    return true;
  }
}

async function processFeedbackBatch() {
  const feedbackRecords = await ComparisonFeedback.find({
    processedByTrinity: false,
    processingStatus: { $ne: "skipped" }
  })
    .sort({ createdAt: 1 })
    .limit(numberEnv("COMPARE_BRAIN_FEEDBACK_BATCH_SIZE", 25));

  const result = {
    processed: 0,
    skipped: 0
  };

  for (const feedback of feedbackRecords) {
    const savedComparison = await SavedComparison.findOne({ comparisonRef: feedback.comparisonRef });
    if (!savedComparison) {
      await ComparisonFeedback.updateOne(
        { _id: feedback._id },
        {
          $set: {
            processingStatus: "skipped",
            processedAt: new Date(),
            processingError: "No saved comparison found for feedback comparisonRef."
          }
        }
      );
      result.skipped += 1;
      continue;
    }

    const feedbackSummary = applyFeedbackSignal(savedComparison.feedbackSummary, feedback);
    await Promise.all([
      SavedComparison.updateOne(
        { _id: savedComparison._id },
        {
          $set: {
            feedbackSummary,
            lastFeedbackAt: feedback.createdAt || new Date()
          }
        }
      ),
      ComparisonFeedback.updateOne(
        { _id: feedback._id },
        {
          $set: {
            processedByTrinity: true,
            processingStatus: "processed",
            processedAt: new Date(),
            processingError: null
          }
        }
      )
    ]);
    result.processed += 1;
  }

  if (result.processed || result.skipped) {
    log("info", `Feedback batch processed=${result.processed} skipped=${result.skipped}.`);
  }

  return result;
}


function buildTrinityPayload(job) {
  const result = job.deterministicResult || {};
  const left = result.left || {};
  const right = result.right || {};
  return {
    contract_version: "trinity.compare.v1alpha1",
    project_id: "compare",
    comparison_ref: job.comparisonRef,
    requested_at: new Date().toISOString(),
    left: watchPayload(left, job.leftWatchId),
    right: watchPayload(right, job.rightWatchId),
    decision_profile: job.decisionProfile || {},
    catalog_evidence: [
      {
        kind: "deterministic_comparison",
        request_hash: job.requestHash,
        sections: Object.keys(result).filter((key) => Array.isArray(result[key]))
      }
    ],
    source_refs: sourceRefs(left, right)
  };
}

function watchPayload(watch, fallbackId) {
  return {
    id: String(watch.id || fallbackId),
    brand: String(watch.brand || ""),
    model: String(watch.model || ""),
    reference: String(watch.reference || ""),
    productUrl: watch.productUrl || null,
    specs: {
      msrpUsd: watch.msrpUsd,
      caseDiameterMm: watch.caseDiameterMm,
      caseThicknessMm: watch.caseThicknessMm,
      lugToLugMm: watch.lugToLugMm,
      lugWidthMm: watch.lugWidthMm,
      waterResistanceM: watch.waterResistanceM,
      movement: watch.movement,
      powerReserveHours: watch.powerReserveHours,
      frequencyVph: watch.frequencyVph,
      bracelet: watch.bracelet,
      microAdjust: watch.microAdjust,
      dateWindow: watch.dateWindow,
      lumeProfile: watch.lumeProfile,
      antiMagneticGauss: watch.antiMagneticGauss,
      style: watch.style,
      weightFeel: watch.weightFeel,
      notes: watch.notes,
      marketingClaims: watch.marketingClaims
    }
  };
}

function sourceRefs(left, right) {
  return [left.productUrl, right.productUrl, "catalog:watch-catalog"].filter(Boolean).map(String);
}

async function runTrinityCompare(payload) {
  const trinityRepo = process.env.TRINITY_REPO || DEFAULT_TRINITY_REPO;
  const inputPath = path.join(os.tmpdir(), `compare-trinity-${crypto.randomUUID()}.json`);
  await fs.promises.writeFile(inputPath, JSON.stringify(payload, null, 2), "utf8");

  try {
    const stdout = await execFileAsync(
      "uv",
      [
        "run",
        "python",
        "-m",
        "trinity_core.cli",
        "reason-compare",
        "--adapter",
        "compare",
        "--input-file",
        inputPath
      ],
      {
        cwd: trinityRepo,
        env: {
          ...process.env,
          PYTHONPATH: path.join(trinityRepo, "core")
        },
        timeout: numberEnv("COMPARE_BRAIN_TRINITY_TIMEOUT_MS", DEFAULT_TRINITY_TIMEOUT_MS)
      }
    );
    return JSON.parse(stdout);
  } finally {
    await fs.promises.rm(inputPath, { force: true });
  }
}

async function persistTrace(job, trinityResult, requestPayload) {
  const inputHash = crypto
    .createHash("sha256")
    .update(JSON.stringify(requestPayload))
    .digest("hex");
  return ComparisonTrace.create({
    comparisonRef: job.comparisonRef,
    jobId: job._id,
    brainProvider: "trinity",
    brainVersion: BRAIN_VERSION,
    promptVersion: PROMPT_VERSION,
    modelName: "deterministic",
    inputHash,
    sourceRefs: requestPayload.source_refs,
    confidence: trinityResult.confidence_bundle || null,
    minorityReport: trinityResult.minority_report || null,
    tracePayload: trinityResult,
    rawTracePath: trinityResult.trace_ref || null
  });
}

function execFileAsync(command, commandArgs, options) {
  return new Promise((resolve, reject) => {
    execFile(command, commandArgs, options, (error, stdout, stderr) => {
      if (error) {
        const detail = stderr ? `${error.message}\n${stderr}` : error.message;
        reject(new Error(detail));
        return;
      }
      resolve(stdout);
    });
  });
}

function loadEnvFile(filePath) {
  if (!fs.existsSync(filePath)) {
    return;
  }

  const lines = fs.readFileSync(filePath, "utf8").split(/\r?\n/);
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) {
      continue;
    }
    const equalsIndex = trimmed.indexOf("=");
    if (equalsIndex === -1) {
      continue;
    }
    const key = trimmed.slice(0, equalsIndex).trim();
    const rawValue = trimmed.slice(equalsIndex + 1).trim();
    if (!key || process.env[key] !== undefined) {
      continue;
    }
    process.env[key] = rawValue.replace(/^['"]|['"]$/g, "");
  }
}

function numberEnv(key, fallback) {
  const value = Number(process.env[key]);
  return Number.isFinite(value) && value > 0 ? value : fallback;
}

function sleep(ms) {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

async function shutdown() {
  log("info", "Stopping Trinity compare worker.");
  await disconnect();
  process.exit(0);
}

async function disconnect() {
  if (mongoose.connection.readyState !== 0) {
    await mongoose.disconnect();
  }
}

function log(level, message) {
  process.stdout.write(`[${new Date().toISOString()}] [${level}] ${message}\n`);
}
