const WEEKDAY_DAYS = new Set(["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"]);
const WEEKEND_DAYS = new Set(["Saturday", "Sunday"]);
const FAMILY_FIT_REGEX = /\b(family|families|parent|parents|parenting|caregiver|caregivers|child|children|kid|kids|youth|student|school|playdate|toddler|baby|infant|guardian)\b/i;
const NEIGHBORHOOD_COMMUNITY_REGEX = /\b(neighborhood|community|resident|residents|local)\b/i;

function parseClockTimes(timeText) {
  const matches = [...String(timeText || "").matchAll(/(\d{1,2})(?::(\d{2}))?\s*(a\.?m\.?|p\.?m\.?)/gi)];
  return matches.map((m) => {
    let hour = Number(m[1]);
    const min = Number(m[2] || "0");
    const raw = String(m[3] || "").toLowerCase();
    const pm = raw.startsWith("p");
    if (hour === 12) hour = pm ? 12 : 0;
    else if (pm) hour += 12;
    return hour + min / 60;
  });
}

function deriveTagsFromRecurringPrograms(programs) {
  const tags = new Set();
  for (const program of programs || []) {
    const days = Array.isArray(program.daysOfWeek) ? program.daysOfWeek : [];
    if (days.some((d) => WEEKDAY_DAYS.has(d))) tags.add("Weekday");
    if (days.some((d) => WEEKEND_DAYS.has(d))) tags.add("Weekend");

    const times = parseClockTimes(program.timeText);
    for (const t of times) {
      if (t < 12) tags.add("Morning");
      else if (t < 17) tags.add("Afternoon");
      else tags.add("Evening");
    }
    if (days.some((d) => WEEKDAY_DAYS.has(d)) && times.some((t) => t >= 15 && t < 18.5)) {
      tags.add("After-school");
    }
  }
  return tags;
}

function describeIssues(prefix, issues) {
  return issues.map((issue) => `${prefix}\t${issue}`);
}

function checkProviderDocument(doc) {
  const issues = [];
  const tags = new Set(doc.dayTimeTags || []);
  const badges = new Set(doc.badges || []);

  if (!String(doc.image || "").trim()) {
    issues.push("provider image is empty; curated production payloads must store an official ImgBB image");
  }

  if (badges.has("Weekend Friendly") && !tags.has("Weekend")) {
    issues.push("Weekend Friendly badge without Weekend tag");
  }

  const recurringPrograms = Array.isArray(doc.recurringPrograms) ? doc.recurringPrograms : [];
  if (recurringPrograms.length > 0) {
    const required = deriveTagsFromRecurringPrograms(recurringPrograms);
    for (const tag of required) {
      if (!tags.has(tag)) issues.push(`missing top-level dayTimeTag "${tag}" implied by recurringPrograms`);
    }
    for (const tag of ["Weekday", "Weekend", "Morning", "Afternoon", "Evening", "After-school"]) {
      if (!required.has(tag) && tags.has(tag)) {
        issues.push(`top-level dayTimeTag "${tag}" is not supported by recurringPrograms`);
      }
    }

    const ids = new Set();
    for (const program of recurringPrograms) {
      if (ids.has(program.id)) issues.push(`duplicate recurringProgram id "${program.id}"`);
      ids.add(program.id);
    }
  }

  return issues;
}

function checkMeetupDocument(doc) {
  const issues = [];
  if (!String(doc.coverImageUrl || "").trim()) {
    issues.push("meetup coverImageUrl is empty; curated production payloads must store an official ImgBB image");
  }

  const description = String(doc.description || "");
  if (!FAMILY_FIT_REGEX.test(description)) {
    const relaxedNeighborhoodFit =
      doc.groupType === "Neighborhood Families" && NEIGHBORHOOD_COMMUNITY_REGEX.test(description);
    if (!relaxedNeighborhoodFit) {
      issues.push("meetup description does not clearly support family / parent / child relevance");
    }
  }

  if (doc.cadence === "Weekend" && !/\b(weekend|saturday|sunday)\b/i.test(description)) {
    issues.push('meetup cadence is "Weekend" but the description does not mention Saturday, Sunday, or weekend timing');
  }

  return issues;
}

function checkPayloadQuality(payload, options = {}) {
  const label = options.label || "(payload)";
  const operations = Array.isArray(payload.operations) ? payload.operations : [payload];
  const issues = [];

  operations.forEach((op, index) => {
    if (!op || typeof op !== "object" || op.action !== "upsert" || !op.document) return;
    const prefix = `${label}\t${op.document.id || `op-${index}`}`;
    if (op.resource === "provider") {
      issues.push(...describeIssues(prefix, checkProviderDocument(op.document)));
    }
    if (op.resource === "meetupGroup") {
      issues.push(...describeIssues(prefix, checkMeetupDocument(op.document)));
    }
  });

  return issues;
}

module.exports = {
  checkPayloadQuality,
  deriveTagsFromRecurringPrograms,
  parseClockTimes,
};
