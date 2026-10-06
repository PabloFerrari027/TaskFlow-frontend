import type { CustomFieldType } from "@/types/custom-field";
import type { ItemPriority, ItemStatus } from "@/types/item";
import type { PaginationParams } from "@/types/common";
import type { RecurrenceFrequency } from "@/types/recurrence";
import type { SavedViewType } from "@/types/saved-view";

// Fixed list (API.md § 26.1), in the order `GET /folder-templates/categories`
// returns them.
export const FOLDER_TEMPLATE_CATEGORIES = [
  "PERSONAL_FINANCE",
  "INVESTMENTS",
  "HEALTH_WELLNESS",
  "BUSINESS_MANAGEMENT",
  "SALES_SUPPORT",
  "HR_PEOPLE",
  "MARKETING_CONTENT",
  "TECH_PRODUCT",
  "EDUCATION",
  "HOME_PERSONAL",
  "CAREER_FREELANCE",
  "INDUSTRY_SPECIFIC",
  "AGRIBUSINESS",
] as const;

export type FolderTemplateCategory = (typeof FOLDER_TEMPLATE_CATEGORIES)[number];

export const FOLDER_TEMPLATE_LEVELS = ["BEGINNER", "INTERMEDIATE", "ADVANCED"] as const;
export type FolderTemplateLevel = (typeof FOLDER_TEMPLATE_LEVELS)[number];

export const FOLDER_TEMPLATE_LANGUAGES = ["pt-BR", "en", "es"] as const;
export type FolderTemplateLanguage = (typeof FOLDER_TEMPLATE_LANGUAGES)[number];

export type FolderTemplateSort = "featured" | "popular" | "newest" | "relevance";

export interface FolderTemplateAuthor {
  id: string;
  name: string | null;
}

export interface FolderTemplateSummary {
  id: string;
  name: string;
  description: string | null;
  category: FolderTemplateCategory;
  isSystemDefault: boolean;
  // Set on workspace templates, `null` on system ones.
  workspaceId?: string | null;
  // Who saved it; `null` on system templates.
  author: FolderTemplateAuthor | null;
  /** Current skeleton version. */
  version: number;
  tags: string[];
  level: FolderTemplateLevel | null;
  language: FolderTemplateLanguage;
  estimatedDurationDays: number | null;
  /** `GET /folder-templates/:id/cover`. */
  hasCover: boolean;
  /** `GET /folder-templates/:id/screenshots/:index`, 0-based. */
  screenshotCount: number;
  stats: { instantiationCount: number };
  sectionCount: number;
  customFieldCount: number;
  /** Root folder and subfolders. */
  itemCount: number;
  subfolderCount: number;
  automationCount: number;
  /** Recurring items the template creates (API.md § 26.1). */
  recurrenceCount: number;
  dashboardCount: number;
  hasGuide: boolean;
  createdAt: string;
  updatedAt: string;
}

// The skeleton uses relative indexes, never ids: `parentIndex`/`sectionIndex`
// point into `sections`, `parentItemIndex` into an EARLIER entry of `items`.
// Everything past `sections`/`customFields`/`items` is optional (a
// `schemaVersion: 1` skeleton has only those three).
export interface FolderTemplateSkeletonSection {
  name: string;
  parentIndex: number | null;
  // Orders sibling sections (same `parentIndex`).
  position: number;
  /** Only created when this optional module is on. */
  moduleKey?: string;
}

export interface FolderTemplateSkeletonCustomField {
  name: string;
  type: CustomFieldType;
  options?: string[];
  description?: string;
  /** Every new item of the folder gets it (never on PEOPLE). */
  defaultValue?: unknown;
  /** `#RRGGBB` per SELECT option. */
  optionColors?: Record<string, string>;
}

export interface FolderTemplateSkeletonItem {
  title: string;
  description?: string;
  sectionIndex: number;
  parentItemIndex?: number;
  priority?: ItemPriority;
  // Due date = "anchor date (or instantiation day) + N" (−730–730; negative
  // only with an `anchor`).
  dueInDays?: number;
  /** Same base and range as `dueInDays`, never after it. */
  startInDays?: number;
  isMilestone?: boolean;
  estimateMinutes?: number;
  storyPoints?: number;
  /** Indexes of other items of the same folder that must finish first. */
  dependsOn?: number[];
  // Keyed by custom field NAME (unique within a template).
  customFieldValues?: Record<string, unknown>;
  status?: ItemStatus;
  /** A `statuses` entry of the same category. */
  statusName?: string;
  /** Key of a `roles` entry: the member chosen for it is the assignee. */
  assigneeRole?: string;
  /** PEOPLE field name → role keys. */
  peopleRoles?: Record<string, string[]>;
  moduleKey?: string;
}

// Params may hold symbolic refs (`$section:N`, `$field:Nome`, `$role:chave`,
// `$status:Nome`) resolved on instantiation (API.md § 26.1).
export interface FolderTemplateSkeletonAutomation {
  name: string;
  // `null` = root folder, number = index into `subfolders`.
  folderRef?: number | null;
  trigger: {
    entityType: string;
    eventType: string;
    conditions?: { field: string; operator: string; value: unknown }[];
  };
  action: { tool: string; params: Record<string, unknown> };
  moduleKey?: string;
}

// A recurring item the template creates (API.md § 26.1): no timezone or dates —
// those come from the instantiation.
export interface FolderTemplateSkeletonRecurrence {
  title: string;
  description?: string;
  folderRef?: number | null;
  sectionIndex?: number;
  assigneeRole?: string;
  dueInDays?: number;
  customFieldValues?: Record<string, unknown>;
  schedule: {
    frequency: RecurrenceFrequency;
    interval?: number;
    daysOfWeek?: number[];
    dayOfMonth?: number;
    month?: number;
    time: string;
  };
  moduleKey?: string;
}

export interface FolderTemplateSkeletonStatus {
  name: string;
  category: ItemStatus;
  color?: string;
}

export interface FolderTemplateSkeletonIntakeForm {
  name: string;
  description?: string;
  targetSectionIndex?: number;
  defaultAssigneeRole?: string;
  fields: { key: string; label: string; type: string; required?: boolean; mapsTo?: string }[];
  moduleKey?: string;
}

export interface FolderTemplateSkeletonSavedView {
  name: string;
  viewType: SavedViewType;
  config: Record<string, unknown>;
  moduleKey?: string;
}

export interface FolderTemplateSkeletonDashboard {
  name: string;
  charts: { name: string; chartType: string; folderRef?: number | null }[];
  moduleKey?: string;
}

export interface FolderTemplateVariable {
  key: string;
  label: string;
  defaultValue?: string;
  required?: boolean;
}

export interface FolderTemplateRole {
  key: string;
  label: string;
  description?: string;
}

export interface FolderTemplateModule {
  key: string;
  label: string;
  description?: string;
  enabledByDefault: boolean;
}

export interface FolderTemplateAnchor {
  label: string;
  description?: string;
}

/** What a folder (root or subfolder) holds. */
export interface FolderTemplateFolderBody {
  sections: FolderTemplateSkeletonSection[];
  customFields: FolderTemplateSkeletonCustomField[];
  items: FolderTemplateSkeletonItem[];
  /** Absent/empty = the 3 default statuses. */
  statuses?: FolderTemplateSkeletonStatus[];
  blockedItemCompletion?: "WARN" | "BLOCK";
  intakeForms?: FolderTemplateSkeletonIntakeForm[];
  savedViews?: FolderTemplateSkeletonSavedView[];
}

export interface FolderTemplateSkeletonSubfolder extends FolderTemplateFolderBody {
  name: string;
  description?: string;
  moduleKey?: string;
}

export interface FolderTemplateSkeleton extends FolderTemplateFolderBody {
  schemaVersion?: number;
  /** Markdown; becomes the first item of the first section. */
  guide?: string;
  guideTitle?: string;
  anchor?: FolderTemplateAnchor;
  variables?: FolderTemplateVariable[];
  roles?: FolderTemplateRole[];
  modules?: FolderTemplateModule[];
  automations?: FolderTemplateSkeletonAutomation[];
  dashboards?: FolderTemplateSkeletonDashboard[];
  recurrences?: FolderTemplateSkeletonRecurrence[];
  subfolders?: FolderTemplateSkeletonSubfolder[];
}

interface FolderTemplatePreviewBody {
  sections: { name: string; depth: number; itemCount: number }[];
  customFields: { name: string; type: CustomFieldType }[];
  itemCount: number;
  /** Workflow status names (empty = the 3 defaults). */
  statuses: string[];
  milestoneCount: number;
  intakeForms: string[];
  savedViews: string[];
}

/** The template's shape — never item titles nor the guide. */
export interface FolderTemplatePreview extends FolderTemplatePreviewBody {
  subfolders: ({ name: string } & FolderTemplatePreviewBody)[];
  automations: string[];
  dashboards: { name: string; chartCount: number }[];
  recurrences: { title: string; frequency: RecurrenceFrequency }[];
  hasGuide: boolean;
  // What instantiating asks for.
  anchor: FolderTemplateAnchor | null;
  variables: FolderTemplateVariable[];
  roles: FolderTemplateRole[];
  modules: FolderTemplateModule[];
}

// Only answered for templates the requester may see (404 otherwise), and
// never cached by the API — so never derive it from the (shared, cached) list.
export interface FolderTemplateDetail extends FolderTemplateSummary {
  skeleton: FolderTemplateSkeleton;
  preview: FolderTemplatePreview;
  /** Version this user last instantiated (`null` = never). */
  myLastInstantiatedVersion: number | null;
  /** This user used an older version than the current one. */
  updateAvailable: boolean;
}

// Admin responses (API.md § 26.8).
export interface FolderTemplate extends FolderTemplateSummary {
  sourceFolderId: string | null;
  skeleton: FolderTemplateSkeleton;
}

export interface FolderTemplateCategoryInfo {
  slug: FolderTemplateCategory;
  label: string;
  icon: string;
  templateCount?: number;
}

export interface FolderTemplateVersion {
  version: number;
  changelog: string | null;
  createdAt: string;
  isCurrent: boolean;
}

export interface FolderTemplateFilters extends PaginationParams {
  category?: FolderTemplateCategory;
  search?: string;
  level?: FolderTemplateLevel;
  language?: FolderTemplateLanguage;
  sort?: FolderTemplateSort;
}

export type AdminFolderTemplateFilters = FolderTemplateFilters;

/** What the person instantiating chooses (API.md § 26.3) — all optional. */
export interface TemplateInstantiationChoices {
  variables?: Record<string, string>;
  /** Absent = the template's `enabledByDefault` modules. */
  enabledModules?: string[];
  /** `YYYY-MM-DD`. */
  anchorDate?: string;
  /** Role key → workspace member userId. */
  roleAssignments?: Record<string, string>;
  /** IANA timezone for the template's recurring items — the browser's. */
  timezone?: string;
  /** Queue it: answers 202 with an id to follow (§ 26.5). */
  async?: boolean;
}

export interface InstantiateFolderTemplateRequest extends TemplateInstantiationChoices {
  name: string;
  /** Creates it as a subfolder of this one. */
  parentFolderId?: string;
}

export type ApplyFolderTemplateRequest = TemplateInstantiationChoices;

export interface InstantiateDraftRequest extends InstantiateFolderTemplateRequest {
  description?: string;
  skeleton: FolderTemplateSkeleton;
}

export type TemplateInstantiationStatus = "PENDING" | "RUNNING" | "SUCCEEDED" | "FAILED";

export interface InstantiateFolderTemplateResponse {
  /** `null` while a queued instantiation hasn't finished. */
  folderId: string | null;
  instantiationId: string;
  status: TemplateInstantiationStatus;
}

export interface TemplateInstantiation {
  id: string;
  templateId: string | null;
  templateVersion: number | null;
  workspaceId: string;
  mode: "NEW_FOLDER" | "APPLY_TO_FOLDER";
  folderId: string | null;
  status: TemplateInstantiationStatus;
  progressDone: number;
  progressTotal: number;
  errorCode: string | null;
  errorMessage: string | null;
  createdAt: string;
  finishedAt: string | null;
}

/** What to read from the source folder (save as template / new version). */
export interface TemplateSnapshotOptions {
  /** Items (no assignee, comments, attachments, PEOPLE/DATE values). Off by default. */
  includeItems?: boolean;
  /** Keep the items' status (otherwise they all go back to TODO). */
  keepItemStatus?: boolean;
  /** Direct subfolders. */
  includeSubfolders?: boolean;
  /** The workspace's automations scoped to this folder. */
  includeAutomations?: boolean;
  /** The folder's enabled recurring items (no assignee; timezone chosen again on use). */
  includeRecurrences?: boolean;
  /** Dashboard pages whose item charts go along (max 5). */
  dashboardPageIds?: string[];
  /** What can't be read from the folder. */
  extras?: {
    guide?: string;
    guideTitle?: string;
    anchor?: FolderTemplateAnchor;
    variables?: FolderTemplateVariable[];
    roles?: FolderTemplateRole[];
    modules?: FolderTemplateModule[];
  };
}

export interface SaveFolderAsTemplateRequest extends TemplateSnapshotOptions {
  name: string;
  description?: string;
  category: FolderTemplateCategory;
}

export interface PublishTemplateVersionRequest extends TemplateSnapshotOptions {
  changelog?: string;
}

export interface TemplateListingFields {
  tags?: string[];
  level?: FolderTemplateLevel | null;
  language?: FolderTemplateLanguage;
  estimatedDurationDays?: number | null;
}

export interface UpdateFolderTemplateListingRequest extends TemplateListingFields {
  name?: string;
  description?: string | null; // null clears it
  category?: FolderTemplateCategory;
}

export interface CreateFolderTemplateRequest extends TemplateListingFields {
  name: string;
  description?: string;
  category: FolderTemplateCategory;
  skeleton: FolderTemplateSkeleton;
}

export interface UpdateFolderTemplateRequest extends TemplateListingFields {
  name?: string;
  description?: string;
  category?: FolderTemplateCategory;
  // Replaces the whole skeleton (system templates only) as a new version.
  skeleton?: FolderTemplateSkeleton;
  changelog?: string;
}

/** AI output (API.md § 26.7): already validated, nothing saved. */
export interface FolderTemplateDraft {
  name: string;
  description: string | null;
  category: FolderTemplateCategory;
  skeleton: FolderTemplateSkeleton;
}
