export type DataJobKind = "EXPORT" | "IMPORT";
export type DataJobStatus = "PENDING" | "RUNNING" | "DONE" | "FAILED";
export type DataJobFormat = "CSV" | "JSON";

/** Imports and exports run in the background; poll `GET /data-jobs/:id` until DONE/FAILED. */
export interface DataJob {
  id: string;
  kind: DataJobKind;
  status: DataJobStatus;
  projectId: string;
  format: DataJobFormat;
  fileName: string | null;
  /** Import: counts and per-line errors (`ImportJobResult`). Export: counts. */
  result: Record<string, unknown> | null;
  error: string | null;
  /** Ready export: authenticated download route. */
  downloadUrl: string | null;
  expiresAt: string | null;
  createdAt: string;
  completedAt: string | null;
}

export interface ImportRowError {
  /** Line in the file (1 = header). */
  line: number;
  messages: string[];
}

export interface ImportJobResult {
  created: number;
  skipped: number;
  createdSections: string[];
  errors: ImportRowError[];
  errorsTruncated: boolean;
}

/** The task fields a column can fill. */
export const IMPORT_FIELDS = [
  "title",
  "description",
  "status",
  "priority",
  "dueDate",
  "startDate",
  "assigneeEmail",
  "section",
  "isMilestone",
] as const;

export type ImportField = (typeof IMPORT_FIELDS)[number];

/** Field → column name. */
export type ImportMapping = Partial<Record<ImportField, string>>;

export interface ImportPreview {
  headers: string[];
  mapping: ImportMapping;
  totalRows: number;
  validRows: number;
  invalidRows: number;
  newSections: string[];
  ignoredColumns: string[];
  errors: ImportRowError[];
  sample: Record<string, unknown>[];
}
