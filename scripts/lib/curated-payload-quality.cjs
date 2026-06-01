const WEEKDAY_DAYS = new Set(["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"]);
const WEEKEND_DAYS = new Set(["Saturday", "Sunday"]);
const SHOOTING_FIT_REGEX = /\b(shooting|sport shooting|range|rifle|pistol|shotgun|clay|ipsc|idpa|hunter|hunting|competition|federation|club|academy|firearm|lőtér|lövész|vadász|verseny|fegyver)\b/i;
const FAMILY_KEYWORDS = [
  "baby",
  "babies",
  "birthday",
  "child",
  "children",
  "daycare",
  "family",
  "families",
  "kid",
  "kids",
  "parent",
  "party",
  "playdate",
  "playground",
  "preschool",
  "school",
  "toddler",
];
const LEGACY_CHILD_CATEGORIES = new Set(["Birthday Parties"]);
const LEGACY_CHILD_MEETUP_TYPES = new Set([
  "Parent Meetup",
  "Mom Group",
  "Playdate Group",
  "New Parents",
  "Neighborhood Families",
]);

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

function normalizeText(value) {
  return String(value || "")
    .replace(/[^a-z0-9\s-]/gi, " ")
    .replace(/\s+/g, " ")
    .trim()
    .toLowerCase();
}

function hasWord(value, token) {
  return new RegExp(`\\b${token.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\b`, "i").test(value);
}

function hasFamilyKeyword(text) {
  return FAMILY_KEYWORDS.some((keyword) => hasWord(text, keyword));
}

function hasShootingKeyword(text) {
  return SHOOTING_FIT_REGEX.test(text);
}

function isObsoleteFamilyProvider(doc) {
  const text = normalizeText([
    doc.name,
    doc.shortDescription,
    doc.longDescription,
    doc.category,
    ...(Array.isArray(doc.activityTypes) ? doc.activityTypes : []),
  ].join(" "));
  return LEGACY_CHILD_CATEGORIES.has(doc.category) || (hasFamilyKeyword(text) && !hasShootingKeyword(text));
}

function isObsoleteFamilyMeetup(doc) {
  const text = normalizeText(`${doc.name || ""} ${doc.description || ""} ${doc.groupType || ""} ${doc.ageRange || ""}`);
  return LEGACY_CHILD_MEETUP_TYPES.has(doc.groupType) || (hasFamilyKeyword(text) && !hasShootingKeyword(text));
}

function checkProviderDocument(doc) {
  const issues = [];
  const tags = new Set(doc.dayTimeTags || []);
  const badges = new Set(doc.badges || []);

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
  const description = String(doc.description || "");
  if (!SHOOTING_FIT_REGEX.test(description)) {
    issues.push("meetup description does not clearly support sport shooting, hunting, club, or competition relevance");
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
    if (options.skipObsoleteFamilyContent) {
      if (op.resource === "provider" && isObsoleteFamilyProvider(op.document)) return;
      if (op.resource === "meetupGroup" && isObsoleteFamilyMeetup(op.document)) return;
    }
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
  isObsoleteFamilyMeetup,
  isObsoleteFamilyProvider,
  parseClockTimes,
};
