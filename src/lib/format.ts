import { format, formatDistanceToNow } from "date-fns";
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

export function getInitialsFromId(id: string) {
  return id.replace(/-/g, "").slice(0, 2).toUpperCase();
}

export function shortenId(id: string, length = 8) {
  return id.slice(0, length);
}
