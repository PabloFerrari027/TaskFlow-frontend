import type { FolderTemplateLevel, TemplateInstantiationStatus } from "@/types/folder-template";

// Fixed list (API.md § 26.10).
export const WORKSPACE_BLUEPRINT_AUDIENCES = [
  "PERSONAL",
  "FREELANCE",
  "SMALL_BUSINESS",
  "SERVICES",
  "COMPANY",
  "EDUCATION",
  "COMMUNITY",
  "AGRO",
] as const;

export type WorkspaceBlueprintAudience = (typeof WORKSPACE_BLUEPRINT_AUDIENCES)[number];

export interface WorkspaceBlueprintFilters {
  audience?: WorkspaceBlueprintAudience;
  level?: FolderTemplateLevel;
  search?: string;
}

export interface WorkspaceBlueprintFolderSummary {
  key: string;
  /** With the variables' default values filled in. */
  name: string;
  purpose: string;
  optional: boolean;
}

export interface WorkspaceBlueprintSummary {
  key: string;
  name: string;
  tagline: string;
  audience: WorkspaceBlueprintAudience;
  level: FolderTemplateLevel;
  tags: string[];
  folders: WorkspaceBlueprintFolderSummary[];
  /** Automations, dashboards and routines that tie the folders together. */
  connectionCount: number;
  /** `false` = a folder template it uses is gone right now (apply answers 409). */
  available: boolean;
}

export interface WorkspaceBlueprintVariable {
  key: string;
  label: string;
  description?: string;
  defaultValue?: string;
  required: boolean;
}

export interface WorkspaceBlueprintLabeledKey {
  key: string;
  label: string;
  description?: string;
}

export interface WorkspaceBlueprintModule extends WorkspaceBlueprintLabeledKey {
  enabled: boolean;
}

export interface WorkspaceBlueprintFolderContent {
  sections: number;
  items: number;
  customFields: number;
  automations: number;
  recurrences: number;
  dashboards: number;
  intakeForms: number;
  savedViews: number;
  subfolders: number;
}

export interface WorkspaceBlueprintFolder extends WorkspaceBlueprintFolderSummary {
  /** `null` = the folder template is unavailable. */
  templateName: string | null;
  templateDescription: string | null;
  modules: WorkspaceBlueprintModule[];
  /** Key of the `anchors` entry that sets this folder's due dates. */
  anchor: string | null;
  content: WorkspaceBlueprintFolderContent | null;
}

export interface WorkspaceBlueprintConnection {
  kind: "AUTOMATION" | "DASHBOARD" | "RECURRENCE";
  name: string;
  /** Folder keys. */
  folders: string[];
}

export interface WorkspaceBlueprintPlacementHint {
  folder: string;
  section: string;
  terms: string[];
}

export interface WorkspaceBlueprint extends Omit<WorkspaceBlueprintSummary, "folders"> {
  description: string;
  guideTitle: string;
  variables: WorkspaceBlueprintVariable[];
  roles: WorkspaceBlueprintLabeledKey[];
  anchors: WorkspaceBlueprintLabeledKey[];
  folders: WorkspaceBlueprintFolder[];
  connections: WorkspaceBlueprintConnection[];
  placementHints: WorkspaceBlueprintPlacementHint[];
}

// Everything optional; a `required` variable needs a value.
export interface ApplyWorkspaceBlueprintRequest {
  variables?: Record<string, string>;
  /** Role key → userId of a workspace member. */
  roleAssignments?: Record<string, string>;
  /** Only `optional` folders. */
  skipFolders?: string[];
  /** Folder key → optional modules turned on (replaces the blueprint's default). */
  modules?: Record<string, string[]>;
  /** Anchor key → `YYYY-MM-DD`. */
  anchorDates?: Record<string, string>;
  timezone?: string;
  async?: boolean;
}

export interface BlueprintApplicationResult {
  folders: { key: string; folderId: string; name: string }[];
  dashboardPageIds: string[];
  automationIds: string[];
  recurrenceIds: string[];
}

export interface BlueprintApplication {
  id: string;
  blueprintKey: string;
  workspaceId: string;
  status: TemplateInstantiationStatus;
  progressDone: number;
  progressTotal: number;
  /** `null` until it succeeds; a failure undoes everything. */
  result: BlueprintApplicationResult | null;
  errorCode: string | null;
  errorMessage: string | null;
  createdAt: string;
  finishedAt: string | null;
}
