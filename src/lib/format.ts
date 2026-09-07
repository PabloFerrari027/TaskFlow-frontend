import {
  differenceInCalendarDays,
  format,
  formatDistanceToNow,
  isToday,
  isTomorrow,
} from "date-fns";
import { ptBR } from "date-fns/locale";

export function formatDate(value: string, pattern = "d MMM yyyy") {
  try {
    return format(new Date(value), pattern, { locale: ptBR });
  } catch {
    return value;
  }
}

export function formatDateTime(value: string) {
  return formatDate(value, "d MMM yyyy 'às' HH:mm");
}

export function formatRelativeTime(value: string) {
  try {
    return formatDistanceToNow(new Date(value), {
      addSuffix: true,
      locale: ptBR,
    });
  } catch {
    return value;
  }
}

export function formatFileSize(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  const units = ["KB", "MB", "GB"];
  let value = bytes / 1024;
  let unitIndex = 0;
  while (value >= 1024 && unitIndex < units.length - 1) {
    value /= 1024;
    unitIndex += 1;
  }
  return `${value.toFixed(value < 10 ? 1 : 0)} ${units[unitIndex]}`;
}

export type DueDateUrgency = "overdue" | "today" | "soon" | "normal";

/**
 * Turns an ISO due date into a plain-language label ("Atrasada", "Vence hoje")
 * plus an urgency level the UI colors accordingly — a lay user shouldn't have
 * to parse an ISO timestamp to know if something needs attention today.
 */
export function formatDueDate(value: string): { label: string; urgency: DueDateUrgency } {
  try {
    const date = new Date(value);
    if (isToday(date)) return { label: "Vence hoje", urgency: "today" };
    if (isTomorrow(date)) return { label: "Vence amanhã", urgency: "soon" };

    const daysDiff = differenceInCalendarDays(date, new Date());
    if (daysDiff < 0) return { label: `Atrasada (${formatDate(value)})`, urgency: "overdue" };
    if (daysDiff <= 7) return { label: `Vence em ${daysDiff} dias`, urgency: "soon" };
    return { label: `Vence em ${formatDate(value)}`, urgency: "normal" };
  } catch {
    return { label: value, urgency: "normal" };
  }
}

// `<input type="date">` works in `yyyy-MM-dd`; the API works in ISO datetime.
export function toDateInputValue(value: string | null | undefined) {
  if (!value) return "";
  try {
    return format(new Date(value), "yyyy-MM-dd");
  } catch {
    return "";
  }
}

export function fromDateInputValue(value: string) {
  return new Date(`${value}T00:00:00.000Z`).toISOString();
}

export function getInitialsFromId(id: string) {
  return id.replace(/-/g, "").slice(0, 2).toUpperCase();
}

export function shortenId(id: string, length = 8) {
  return id.slice(0, length);
}
