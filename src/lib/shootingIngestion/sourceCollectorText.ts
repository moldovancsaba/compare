const YEAR_MONTH_DAY = /\b(20\d{2})-(0?[1-9]|1[0-2])-(0?[1-9]|[12]\d|3[01])\b/;
const HUNGARIAN_DATE = /\b(20\d{2})\.([0-1]?\d)\.([0-3]?\d)\b/;
const HUNGARIAN_TIME = /\b([01]?\d|2[0-3]):([0-5]\d)\b/;

export function normalizeDateFromText(value: string) {
  const directMatch = value.match(YEAR_MONTH_DAY);
  if (directMatch) return `${directMatch[1]}-${String(directMatch[2]).padStart(2, "0")}-${String(directMatch[3]).padStart(2, "0")}`;

  const localMatch = value.match(HUNGARIAN_DATE);
  if (localMatch) return `${localMatch[1]}-${String(localMatch[2]).padStart(2, "0")}-${String(localMatch[3]).padStart(2, "0")}`;
  return undefined;
}

export function normalizeTimeFromText(value: string) {
  const match = value.match(HUNGARIAN_TIME);
  if (match) return `${match[1].padStart(2, "0")}:${match[2]}:00`;
  return undefined;
}
