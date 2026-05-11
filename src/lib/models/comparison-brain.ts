import { Schema, model, models } from "mongoose";

const compareJobSchema = new Schema(
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
    decisionProfile: { type: Schema.Types.Mixed, default: null },
    requestedBy: { type: String, default: null },
    deterministicResult: { type: Schema.Types.Mixed, required: true },
    error: { type: String, default: null },
    claimedAt: { type: Date, default: null },
    completedAt: { type: Date, default: null }
  },
  {
    collection: "compare_jobs",
    timestamps: true
  }
);

const comparisonTraceSchema = new Schema(
  {
    comparisonRef: { type: String, required: true, index: true },
    jobId: { type: Schema.Types.ObjectId, ref: "CompareJob", default: null, index: true },
    brainProvider: { type: String, required: true },
    brainVersion: { type: String, required: true },
    promptVersion: { type: String, default: null },
    modelName: { type: String, default: null },
    inputHash: { type: String, required: true, index: true },
    sourceRefs: { type: [String], default: [] },
    confidence: { type: Schema.Types.Mixed, default: null },
    minorityReport: { type: Schema.Types.Mixed, default: null },
    tracePayload: { type: Schema.Types.Mixed, default: null },
    rawTracePath: { type: String, default: null }
  },
  {
    collection: "comparison_traces",
    timestamps: true
  }
);

const savedComparisonSchema = new Schema(
  {
    comparisonRef: { type: String, required: true, unique: true },
    leftWatchId: { type: String, required: true, index: true },
    rightWatchId: { type: String, required: true, index: true },
    deterministicResult: { type: Schema.Types.Mixed, required: true },
    brainResult: { type: Schema.Types.Mixed, default: null },
    selectedRecommendation: { type: Schema.Types.Mixed, default: null },
    traceRef: { type: String, default: null }
  },
  {
    collection: "saved_comparisons",
    timestamps: true
  }
);

const comparisonFeedbackSchema = new Schema(
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
    processedAt: { type: Date, default: null }
  },
  {
    collection: "comparison_feedback",
    timestamps: true
  }
);

export const CompareJobModel = models.CompareJob || model("CompareJob", compareJobSchema);
export const ComparisonTraceModel = models.ComparisonTrace || model("ComparisonTrace", comparisonTraceSchema);
export const SavedComparisonModel = models.SavedComparison || model("SavedComparison", savedComparisonSchema);
export const ComparisonFeedbackModel =
  models.ComparisonFeedback || model("ComparisonFeedback", comparisonFeedbackSchema);
