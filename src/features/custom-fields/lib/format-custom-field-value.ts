import { formatDate } from "@/lib/format";
import type { CustomFieldType } from "@/types/custom-field";

// A date-only value ("2026-10-01") or one saved at UTC midnight (what the
// date input produces) names a calendar day, not an instant — formatting it
// in the local timezone would show the day before anywhere west of UTC.
function formatCalendarDate(value: string) {
  const match = /^(\d{4}-\d{2}-\d{2})(?:T00:00(?::00(?:\.0+)?)?Z)?$/.exec(value);
  return formatDate(match ? `${match[1]}T00:00:00` : value);
}

/**
 * Read-only text for a custom field value. `type` is optional because some
 * callers (the activity feed) only have the raw value; with it, dates are
 * formatted instead of shown as ISO strings.
 */
export function formatCustomFieldValue(value: unknown, type?: CustomFieldType): string {
  if (value === null || value === undefined || value === "") return "vazio";
  if (Array.isArray(value)) return value.length ? value.join(", ") : "vazio";
  if (typeof value === "boolean") return value ? "sim" : "não";
  if (type === "DATE" && typeof value === "string") return formatCalendarDate(value);
  if (type === "NUMBER" && typeof value === "number") return value.toLocaleString("pt-BR");
  return String(value);
}
