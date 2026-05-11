export function applyFeedbackSignal(existingSummary, feedback) {
  const summary = normalizeFeedbackSummary(existingSummary);
  const signal = String(feedback.signal || "unknown");
  summary.total += 1;
  summary.bySignal[signal] = (summary.bySignal[signal] || 0) + 1;
  summary.latestSignal = signal;
  summary.latestSignalAt = normalizeDate(feedback.createdAt).toISOString();
  summary.latestTraceRef = feedback.traceRef || null;
  summary.latestNote = feedback.note || null;
  summary.sentimentScore += feedbackSignalScore(signal);

  if (signal === "chose_left") {
    summary.choiceCounts.left += 1;
  } else if (signal === "chose_right") {
    summary.choiceCounts.right += 1;
  }

  return summary;
}

export function normalizeFeedbackSummary(existingSummary) {
  const summary =
    existingSummary && typeof existingSummary === "object" && !Array.isArray(existingSummary)
      ? existingSummary
      : {};
  return {
    total: Number.isFinite(Number(summary.total)) ? Number(summary.total) : 0,
    bySignal:
      summary.bySignal && typeof summary.bySignal === "object" && !Array.isArray(summary.bySignal)
        ? { ...summary.bySignal }
        : {},
    choiceCounts: {
      left: Number.isFinite(Number(summary.choiceCounts?.left)) ? Number(summary.choiceCounts.left) : 0,
      right: Number.isFinite(Number(summary.choiceCounts?.right)) ? Number(summary.choiceCounts.right) : 0
    },
    sentimentScore: Number.isFinite(Number(summary.sentimentScore)) ? Number(summary.sentimentScore) : 0,
    latestSignal: typeof summary.latestSignal === "string" ? summary.latestSignal : null,
    latestSignalAt: typeof summary.latestSignalAt === "string" ? summary.latestSignalAt : null,
    latestTraceRef: typeof summary.latestTraceRef === "string" ? summary.latestTraceRef : null,
    latestNote: typeof summary.latestNote === "string" ? summary.latestNote : null
  };
}

export function feedbackSignalScore(signal) {
  switch (signal) {
    case "helpful":
    case "chose_left":
    case "chose_right":
      return 1;
    case "not_helpful":
    case "opposite_preferred":
    case "bad_recommendation":
    case "missing_context":
    case "wrong_spec":
      return -1;
    default:
      return 0;
  }
}

function normalizeDate(value) {
  const parsed = value ? new Date(value) : new Date();
  return Number.isNaN(parsed.getTime()) ? new Date() : parsed;
}
