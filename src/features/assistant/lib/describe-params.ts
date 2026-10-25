import {
  ITEM_PRIORITY_LABEL,
  ITEM_STATUS_LABEL,
  WORKSPACE_ROLE_LABEL,
} from "@/components/shared/status-badge";
import { formatDate, formatDateTime, shortenId } from "@/lib/format";
import type { ItemPriority, ItemStatus } from "@/types/item";
import type { WorkspaceRole } from "@/types/workspace";

/** Which kind of entity an id-valued param points at, to look its name up. */
export type EntityKind = "folder" | "item" | "section" | "status" | "person";

/** Returns the display name of an entity this client has cached, or null. */
export type EntityNameLookup = (kind: EntityKind, id: string) => string | null;

// Every param key the backend's action catalogs accept, plus the fields a
// `diff` reports. Unknown keys still render (with the key itself as label):
// the card must never drop a param.
const FIELD_LABEL: Record<string, string> = {
  itemId: "Item",
  itemIds: "Itens",
  folderId: "Pasta",
  folderName: "Pasta",
  sectionId: "Coluna",
  statusId: "Etapa",
  status: "Status",
  title: "Título",
  name: "Nome",
  description: "Descrição",
  content: "Conteúdo",
  note: "Observação",
  priority: "Prioridade",
  dueDate: "Prazo",
  position: "Posição na coluna",
  assigneeId: "Responsável",
  userId: "Pessoa",
  approverId: "Quem aprova",
  email: "E-mail",
  role: "Papel",
  sessionId: "Sessão",
  fileIds: "Arquivos",
  newItem: "Criar um item novo",
  createIfMissing: "Criar se não existir",
  type: "Tipo",
  keywords: "Assunto",
  schedule: "Repete",
  steps: "Etapas",
  titles: "Etapas",
  query: "Busca",
  destination: "Destino",
  captureId: "Informação guardada",
};

const ID_FIELD_KIND: Record<string, EntityKind> = {
  itemId: "item",
  itemIds: "item",
  folderId: "folder",
  sectionId: "section",
  statusId: "status",
  assigneeId: "person",
  userId: "person",
  approverId: "person",
};

// The capture tool's `type` (backend `CAPTURE_TYPES`).
const CAPTURE_TYPE_LABEL: Record<string, string> = {
  note: "Anotação",
  todo: "Item a fazer",
  reminder: "Lembrete",
};

export function fieldLabel(field: string): string {
  return FIELD_LABEL[field] ?? field;
}

const WEEKDAY_NAMES = ["domingo", "segunda", "terça", "quarta", "quinta", "sexta", "sábado"];

function joinWords(words: string[]): string {
  return words.length <= 1 ? (words[0] ?? "") : `${words.slice(0, -1).join(", ")} e ${words.at(-1)}`;
}

// A recurring reminder's `schedule` (backend `create_recurring_reminder`) in
// plain words — the raw object showed as JSON on the card.
function formatSchedule(value: Record<string, unknown>): string {
  const every = typeof value.interval === "number" && value.interval > 1 ? value.interval : 1;
  const time = typeof value.time === "string" ? ` às ${value.time}` : "";
  let when: string;
  switch (value.frequency) {
    case "DAILY":
      when = every > 1 ? `a cada ${every} dias` : "todo dia";
      break;
    case "WEEKLY": {
      const days = Array.isArray(value.daysOfWeek) ? value.daysOfWeek.map((day) => WEEKDAY_NAMES[Number(day)] ?? String(day)) : [];
      when = `${every > 1 ? `a cada ${every} semanas, ` : ""}${days.length > 0 ? `toda ${joinWords(days)}` : "toda semana"}`;
      break;
    }
    case "MONTHLY":
      when = `${every > 1 ? `a cada ${every} meses` : "todo mês"}${typeof value.dayOfMonth === "number" ? `, no dia ${value.dayOfMonth}` : ""}`;
      break;
    case "YEARLY":
      when = `todo ano${typeof value.dayOfMonth === "number" && typeof value.month === "number" ? `, em ${value.dayOfMonth}/${value.month}` : ""}`;
      break;
    default:
      when = "repete";
  }
  const until = typeof value.endDate === "string" ? `, até ${formatDate(`${value.endDate}T12:00:00Z`)}` : "";
  return `${when}${time}${until}`;
}

// A deadline with a real time ("19h") shows it; a day picked without a time
// (saved at noon/midnight UTC) shows only the day.
function formatDeadline(value: string): string {
  return /T(00|12):00:00(\.000)?Z$/.test(value) || !value.includes("T") ? formatDate(value) : formatDateTime(value);
}

function formatId(kind: EntityKind, id: string, lookup: EntityNameLookup): string {
  // An id this client hasn't loaded still shows (shortened) — hiding it
  // would defeat the point of showing the params at all.
  return lookup(kind, id) ?? shortenId(id);
}

export function formatParamValue(field: string, value: unknown, lookup: EntityNameLookup): string {
  if (value === null || value === undefined || value === "") return "—";
  if (typeof value === "boolean") return value ? "Sim" : "Não";

  const kind = ID_FIELD_KIND[field];
  if (kind && typeof value === "string") return formatId(kind, value, lookup);
  if (kind && Array.isArray(value)) {
    return value.map((id) => formatId(kind, String(id), lookup)).join(", ");
  }

  if (field === "fileIds" && Array.isArray(value)) {
    return value.length === 1 ? "1 arquivo" : `${value.length} arquivos`;
  }
  if (field === "status" && typeof value === "string") {
    return ITEM_STATUS_LABEL[value as ItemStatus] ?? value;
  }
  if (field === "priority" && typeof value === "string") {
    return ITEM_PRIORITY_LABEL[value as ItemPriority] ?? value;
  }
  if (field === "role" && typeof value === "string") {
    return WORKSPACE_ROLE_LABEL[value as WorkspaceRole] ?? value;
  }
  if (field === "type" && typeof value === "string") {
    return CAPTURE_TYPE_LABEL[value] ?? value;
  }
  if (field === "dueDate" && typeof value === "string") return formatDeadline(value);
  if (field === "schedule" && value && typeof value === "object" && !Array.isArray(value)) {
    return formatSchedule(value as Record<string, unknown>);
  }
  if (field === "position" && typeof value === "number") return String(value + 1);
  if (field === "sessionId" && typeof value === "string") return shortenId(value);

  if (Array.isArray(value)) return value.map(String).join(", ");
  if (typeof value === "object") return JSON.stringify(value);
  return String(value);
}
