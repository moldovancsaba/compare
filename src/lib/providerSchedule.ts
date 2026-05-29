import type {
  Provider,
  RecurringProgram,
  RecurringProgramDay,
  ScheduledInstance,
  UpcomingOccurrence,
} from "@/types/provider";

const DISCOVERY_TIME_ZONE = "Europe/Berlin";
const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;
const TIME_RE = /\b(\d{1,2})(?::(\d{2}))?\s*(AM|PM)\b/gi;

function isDateString(value?: string | null): value is string {
  return Boolean(value && DATE_RE.test(value));
}

function normalizeDateForMath(date: string) {
  return new Date(`${date}T12:00:00Z`);
}

function addDays(date: string, offset: number) {
  const next = normalizeDateForMath(date);
  next.setUTCDate(next.getUTCDate() + offset);
  return next.toISOString().slice(0, 10);
}

function compareDates(left?: string, right?: string) {
  if (!left && !right) return 0;
  if (!left) return 1;
  if (!right) return -1;
  return left.localeCompare(right);
}

function getLocalDateParts(date: Date) {
  const formatter = new Intl.DateTimeFormat("en-US", {
    timeZone: DISCOVERY_TIME_ZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    weekday: "long",
  });
  const parts = formatter.formatToParts(date);
  const year = parts.find((part) => part.type === "year")?.value ?? "1970";
  const month = parts.find((part) => part.type === "month")?.value ?? "01";
  const day = parts.find((part) => part.type === "day")?.value ?? "01";
  const weekday = (parts.find((part) => part.type === "weekday")?.value ?? "Monday") as RecurringProgramDay;
  return {
    date: `${year}-${month}-${day}`,
    weekday,
  };
}

function parseTimeText(timeText?: string) {
  if (!timeText?.trim()) return { startTime: undefined, endTime: undefined, startMinutes: undefined };
  const matches = Array.from(timeText.matchAll(TIME_RE));
  const times = matches.map((match) => {
    const hour = Number(match[1]);
    const minute = Number(match[2] ?? "0");
    const meridiem = match[3]?.toUpperCase();
    const normalizedHour = meridiem === "PM" && hour !== 12 ? hour + 12 : meridiem === "AM" && hour === 12 ? 0 : hour;
    const hh = normalizedHour.toString().padStart(2, "0");
    const mm = minute.toString().padStart(2, "0");
    return {
      value: `${hh}:${mm}`,
      minutes: normalizedHour * 60 + minute,
    };
  });
  return {
    startTime: times[0]?.value,
    endTime: times[1]?.value,
    startMinutes: times[0]?.minutes,
  };
}

function occursWithinBounds(date: string, startDate?: string, endDate?: string) {
  if (isDateString(startDate) && compareDates(date, startDate) < 0) return false;
  if (isDateString(endDate) && compareDates(date, endDate) > 0) return false;
  return true;
}

function toOccurrence(
  source: UpcomingOccurrence["source"],
  id: string,
  title: string,
  date: string,
  weekday: RecurringProgramDay,
  details: {
    endDate?: string;
    startTime?: string;
    endTime?: string;
    timeText?: string;
    locationNote?: string;
    ageRanges?: UpcomingOccurrence["ageRanges"];
    activityTypes?: UpcomingOccurrence["activityTypes"];
    summary?: string;
    priceText?: string;
    registrationUrl?: string;
    isDropIn?: boolean;
  },
): UpcomingOccurrence {
  return {
    id,
    source,
    title,
    startDate: date,
    weekday,
    ...details,
  };
}

function deriveFromScheduledInstance(instance: ScheduledInstance): UpcomingOccurrence | null {
  if (!isDateString(instance.startDate)) return null;
  const { date, weekday } = getLocalDateParts(new Date(`${instance.startDate}T12:00:00Z`));
  const parsed = parseTimeText(instance.timeText);
  return toOccurrence("scheduled-instance", instance.id, instance.title, date, weekday, {
    endDate: instance.endDate,
    startTime: instance.startTime ?? parsed.startTime,
    endTime: instance.endTime ?? parsed.endTime,
    timeText: instance.timeText,
    locationNote: instance.locationNote,
    ageRanges: instance.ageRanges,
    activityTypes: instance.activityTypes,
    summary: instance.summary,
    priceText: instance.priceText,
    registrationUrl: instance.registrationUrl,
    isDropIn: instance.isDropIn,
  });
}

function deriveFromRecurringProgram(
  program: RecurringProgram,
  windowStartDate: string,
  days: number,
): UpcomingOccurrence[] {
  const occurrences: UpcomingOccurrence[] = [];
  const parsed = parseTimeText(program.timeText);
  for (let offset = 0; offset < days; offset += 1) {
    const date = addDays(windowStartDate, offset);
    const { weekday } = getLocalDateParts(new Date(`${date}T12:00:00Z`));
    if (!program.daysOfWeek.includes(weekday)) continue;
    if (!occursWithinBounds(date, program.startDate, program.endDate)) continue;
    occurrences.push(
      toOccurrence("recurring-program", program.id, program.title, date, weekday, {
        endDate: program.endDate,
        startTime: parsed.startTime,
        endTime: parsed.endTime,
        timeText: program.timeText,
        locationNote: program.locationNote,
        ageRanges: program.ageRanges,
        activityTypes: program.activityTypes,
        summary: program.summary,
        priceText: program.priceText,
        registrationUrl: program.registrationUrl,
        isDropIn: program.isDropIn,
      }),
    );
  }
  return occurrences;
}

export function compareOccurrences(left: UpcomingOccurrence, right: UpcomingOccurrence) {
  const dateCmp = left.startDate.localeCompare(right.startDate);
  if (dateCmp !== 0) return dateCmp;
  const leftMinutes = parseTimeText(left.timeText).startMinutes ?? (left.startTime ? Number(left.startTime.slice(0, 2)) * 60 + Number(left.startTime.slice(3, 5)) : 24 * 60);
  const rightMinutes = parseTimeText(right.timeText).startMinutes ?? (right.startTime ? Number(right.startTime.slice(0, 2)) * 60 + Number(right.startTime.slice(3, 5)) : 24 * 60);
  if (leftMinutes !== rightMinutes) return leftMinutes - rightMinutes;
  return left.title.localeCompare(right.title);
}

export function deriveUpcomingOccurrences(
  provider: Pick<Provider, "scheduledInstances" | "recurringPrograms">,
  now = new Date(),
  days = 7,
): UpcomingOccurrence[] {
  const windowStartDate = getLocalDateParts(now).date;
  const explicit = (provider.scheduledInstances ?? [])
    .map(deriveFromScheduledInstance)
    .filter((occurrence): occurrence is UpcomingOccurrence => Boolean(occurrence))
    .filter((occurrence) => occursWithinBounds(occurrence.startDate, windowStartDate, addDays(windowStartDate, days - 1)));
  const recurring = (provider.recurringPrograms ?? []).flatMap((program) => deriveFromRecurringProgram(program, windowStartDate, days));
  return [...explicit, ...recurring].sort(compareOccurrences);
}

export function deriveNextOccurrence(provider: Pick<Provider, "scheduledInstances" | "recurringPrograms">, now = new Date()) {
  return deriveUpcomingOccurrences(provider, now, 14)[0] ?? null;
}

export function providerHasOccurrenceThisWeek(provider: Pick<Provider, "scheduledInstances" | "recurringPrograms">, now = new Date()) {
  return deriveUpcomingOccurrences(provider, now, 7).length > 0;
}

export function formatUpcomingOccurrenceLabel(occurrence: UpcomingOccurrence | null | undefined) {
  if (!occurrence) return null;
  const dateFormatter = new Intl.DateTimeFormat("en-US", {
    timeZone: DISCOVERY_TIME_ZONE,
    weekday: "short",
    month: "short",
    day: "numeric",
  });
  const dateLabel = dateFormatter.format(new Date(`${occurrence.startDate}T12:00:00Z`));
  const timeLabel = occurrence.timeText?.trim() || occurrence.startTime;
  return timeLabel ? `${dateLabel} · ${timeLabel}` : dateLabel;
}
