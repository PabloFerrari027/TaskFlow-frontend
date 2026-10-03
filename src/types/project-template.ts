import type { CustomFieldType } from "@/types/custom-field";
import type { TaskPriority, TaskStatus } from "@/types/task";
import type { PaginationParams } from "@/types/common";
import type { RecurrenceFrequency } from "@/types/recurrence";
import type { SavedViewType } from "@/types/saved-view";

// Fixed list (API.md § 26.1), in the order `GET /project-templates/categories`
// returns them.
export const PROJECT_TEMPLATE_CATEGORIES = [
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

export type ProjectTemplateCategory = (typeof PROJECT_TEMPLATE_CATEGORIES)[number];

export const PROJECT_TEMPLATE_LEVELS = ["BEGINNER", "INTERMEDIATE", "ADVANCED"] as const;
export type ProjectTemplateLevel = (typeof PROJECT_TEMPLATE_LEVELS)[number];

export const PROJECT_TEMPLATE_LANGUAGES = ["pt-BR", "en", "es"] as const;
export type ProjectTemplateLanguage = (typeof PROJECT_TEMPLATE_LANGUAGES)[number];

export type ProjectTemplateSort = "featured" | "popular" | "newest" | "relevance";

export interface ProjectTemplateAuthor {
  id: string;
  name: string | null;
}

export interface ProjectTemplateSummary {
  id: string;
  name: string;
  description: string | null;
  category: ProjectTemplateCategory;
  isSystemDefault: boolean;
  // Set on workspace templates, `null` on system ones.
  workspaceId?: string | null;
  // Who saved it; `null` on system templates.
  author: ProjectTemplateAuthor | null;
  /** Current skeleton version. */
  version: number;
  tags: string[];
  level: ProjectTemplateLevel | null;
  language: ProjectTemplateLanguage;
  estimatedDurationDays: number | null;
  /** `GET /project-templates/:id/cover`. */
  hasCover: boolean;
  /** `GET /project-templates/:id/screenshots/:index`, 0-based. */
  screenshotCount: number;
  stats: { instantiationCount: number };
  sectionCount: number;
  customFieldCount: number;
  /** Root project and subprojects. */
  taskCount: number;
  subprojectCount: number;
  automationCount: number;
  /** Recurring tasks the template creates (API.md § 26.1). */
  recurrenceCount: number;
  dashboardCount: number;
  hasGuide: boolean;
  createdAt: string;
  updatedAt: string;
}

// The skeleton uses relative indexes, never ids: `parentIndex`/`sectionIndex`
// point into `sections`, `parentTaskIndex` into an EARLIER entry of `tasks`.
// Everything past `sections`/`customFields`/`tasks` is optional (a
// `schemaVersion: 1` skeleton has only those three).
export interface ProjectTemplateSkeletonSection {
  name: string;
  parentIndex: number | null;
  // Orders sibling sections (same `parentIndex`).
  position: number;
  /** Only created when this optional module is on. */
  moduleKey?: string;
}

export interface ProjectTemplateSkeletonCustomField {
  name: string;
  type: CustomFieldType;
  options?: string[];
  description?: string;
  /** Every new task of the project gets it (never on PEOPLE). */
  defaultValue?: unknown;
  /** `#RRGGBB` per SELECT option. */
  optionColors?: Record<string, string>;
}

export interface ProjectTemplateSkeletonTask {
  title: string;
  description?: string;
  sectionIndex: number;
  parentTaskIndex?: number;
  priority?: TaskPriority;
  // Due date = "anchor date (or instantiation day) + N" (−730–730; negative
  // only with an `anchor`).
  dueInDays?: number;
  /** Same base and range as `dueInDays`, never after it. */
  startInDays?: number;
  isMilestone?: boolean;
  estimateMinutes?: number;
  storyPoints?: number;
  /** Indexes of other tasks of the same project that must finish first. */
  dependsOn?: number[];
  // Keyed by custom field NAME (unique within a template).
  customFieldValues?: Record<string, unknown>;
  status?: TaskStatus;
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
export interface ProjectTemplateSkeletonAutomation {
  name: string;
  // `null` = root project, number = index into `subprojects`.
  projectRef?: number | null;
  trigger: {
    entityType: string;
    eventType: string;
    conditions?: { field: string; operator: string; value: unknown }[];
  };
  action: { tool: string; params: Record<string, unknown> };
  moduleKey?: string;
}

// A recurring task the template creates (API.md § 26.1): no timezone or dates —
// those come from the instantiation.
export interface ProjectTemplateSkeletonRecurrence {
  title: string;
  description?: string;
  projectRef?: number | null;
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

export interface ProjectTemplateSkeletonStatus {
  name: string;
  category: TaskStatus;
  color?: string;
}

export interface ProjectTemplateSkeletonIntakeForm {
  name: string;
  description?: string;
  targetSectionIndex?: number;
  defaultAssigneeRole?: string;
  fields: { key: string; label: string; type: string; required?: boolean; mapsTo?: string }[];
  moduleKey?: string;
}

export interface ProjectTemplateSkeletonSavedView {
  name: string;
  viewType: SavedViewType;
  config: Record<string, unknown>;
  moduleKey?: string;
}

export interface ProjectTemplateSkeletonDashboard {
  name: string;
  charts: { name: string; chartType: string; projectRef?: number | null }[];
  moduleKey?: string;
}

export interface ProjectTemplateVariable {
  key: string;
  label: string;
  defaultValue?: string;
  required?: boolean;
}

export interface ProjectTemplateRole {
  key: string;
  label: string;
  description?: string;
}

export interface ProjectTemplateModule {
  key: string;
  label: string;
  description?: string;
  enabledByDefault: boolean;
}

export interface ProjectTemplateAnchor {
  label: string;
  description?: string;
}

/** What a project (root or subproject) holds. */
export interface ProjectTemplateProjectBody {
  sections: ProjectTemplateSkeletonSection[];
  customFields: ProjectTemplateSkeletonCustomField[];
  tasks: ProjectTemplateSkeletonTask[];
  /** Absent/empty = the 3 default statuses. */
  statuses?: ProjectTemplateSkeletonStatus[];
  blockedTaskCompletion?: "WARN" | "BLOCK";
  intakeForms?: ProjectTemplateSkeletonIntakeForm[];
  savedViews?: ProjectTemplateSkeletonSavedView[];
}

export interface ProjectTemplateSkeletonSubproject extends ProjectTemplateProjectBody {
  name: string;
  description?: string;
  moduleKey?: string;
}

export interface ProjectTemplateSkeleton extends ProjectTemplateProjectBody {
  schemaVersion?: number;
  /** Markdown; becomes the first task of the first section. */
  guide?: string;
  guideTitle?: string;
  anchor?: ProjectTemplateAnchor;
  variables?: ProjectTemplateVariable[];
  roles?: ProjectTemplateRole[];
  modules?: ProjectTemplateModule[];
  automations?: ProjectTemplateSkeletonAutomation[];
  dashboards?: ProjectTemplateSkeletonDashboard[];
  recurrences?: ProjectTemplateSkeletonRecurrence[];
  subprojects?: ProjectTemplateSkeletonSubproject[];
}

interface ProjectTemplatePreviewBody {
  sections: { name: string; depth: number; taskCount: number }[];
  customFields: { name: string; type: CustomFieldType }[];
  taskCount: number;
  /** Workflow status names (empty = the 3 defaults). */
  statuses: string[];
  milestoneCount: number;
  intakeForms: string[];
  savedViews: string[];
}

/** The template's shape — never task titles nor the guide. */
export interface ProjectTemplatePreview extends ProjectTemplatePreviewBody {
  subprojects: ({ name: string } & ProjectTemplatePreviewBody)[];
  automations: string[];
  dashboards: { name: string; chartCount: number }[];
  recurrences: { title: string; frequency: RecurrenceFrequency }[];
  hasGuide: boolean;
  // What instantiating asks for.
  anchor: ProjectTemplateAnchor | null;
  variables: ProjectTemplateVariable[];
  roles: ProjectTemplateRole[];
  modules: ProjectTemplateModule[];
}

// Only answered for templates the requester may see (404 otherwise), and
// never cached by the API — so never derive it from the (shared, cached) list.
export interface ProjectTemplateDetail extends ProjectTemplateSummary {
  skeleton: ProjectTemplateSkeleton;
  preview: ProjectTemplatePreview;
  /** Version this user last instantiated (`null` = never). */
  myLastInstantiatedVersion: number | null;
  /** This user used an older version than the current one. */
  updateAvailable: boolean;
}

// Admin responses (API.md § 26.8).
export interface ProjectTemplate extends ProjectTemplateSummary {
  sourceProjectId: string | null;
  skeleton: ProjectTemplateSkeleton;
}

export interface ProjectTemplateCategoryInfo {
  slug: ProjectTemplateCategory;
  label: string;
  icon: string;
  templateCount?: number;
}

export interface ProjectTemplateVersion {
  version: number;
  changelog: string | null;
  createdAt: string;
  isCurrent: boolean;
}

export interface ProjectTemplateFilters extends PaginationParams {
  category?: ProjectTemplateCategory;
  search?: string;
  level?: ProjectTemplateLevel;
  language?: ProjectTemplateLanguage;
  sort?: ProjectTemplateSort;
}

export type AdminProjectTemplateFilters = ProjectTemplateFilters;

/** What the person instantiating chooses (API.md § 26.3) — all optional. */
export interface TemplateInstantiationChoices {
  variables?: Record<string, string>;
  /** Absent = the template's `enabledByDefault` modules. */
  enabledModules?: string[];
  /** `YYYY-MM-DD`. */
  anchorDate?: string;
  /** Role key → workspace member userId. */
  roleAssignments?: Record<string, string>;
  /** IANA timezone for the template's recurring tasks — the browser's. */
  timezone?: string;
  /** Queue it: answers 202 with an id to follow (§ 26.5). */
  async?: boolean;
}

export interface InstantiateProjectTemplateRequest extends TemplateInstantiationChoices {
  name: string;
  /** Creates it as a subproject of this one. */
  parentProjectId?: string;
}

export type ApplyProjectTemplateRequest = TemplateInstantiationChoices;

export interface InstantiateDraftRequest extends InstantiateProjectTemplateRequest {
  description?: string;
  skeleton: ProjectTemplateSkeleton;
}

export type TemplateInstantiationStatus = "PENDING" | "RUNNING" | "SUCCEEDED" | "FAILED";

export interface InstantiateProjectTemplateResponse {
  /** `null` while a queued instantiation hasn't finished. */
  projectId: string | null;
  instantiationId: string;
  status: TemplateInstantiationStatus;
}

export interface TemplateInstantiation {
  id: string;
  templateId: string | null;
  templateVersion: number | null;
  workspaceId: string;
  mode: "NEW_PROJECT" | "APPLY_TO_PROJECT";
  projectId: string | null;
  status: TemplateInstantiationStatus;
  progressDone: number;
  progressTotal: number;
  errorCode: string | null;
  errorMessage: string | null;
  createdAt: string;
  finishedAt: string | null;
}

/** What to read from the source project (save as template / new version). */
export interface TemplateSnapshotOptions {
  /** Tasks (no assignee, comments, attachments, PEOPLE/DATE values). Off by default. */
  includeTasks?: boolean;
  /** Keep the tasks' status (otherwise they all go back to TODO). */
  keepTaskStatus?: boolean;
  /** Direct subprojects. */
  includeSubprojects?: boolean;
  /** The workspace's automations scoped to this project. */
  includeAutomations?: boolean;
  /** The project's enabled recurring tasks (no assignee; timezone chosen again on use). */
  includeRecurrences?: boolean;
  /** Dashboard pages whose task charts go along (max 5). */
  dashboardPageIds?: string[];
  /** What can't be read from the project. */
  extras?: {
    guide?: string;
    guideTitle?: string;
    anchor?: ProjectTemplateAnchor;
    variables?: ProjectTemplateVariable[];
    roles?: ProjectTemplateRole[];
    modules?: ProjectTemplateModule[];
  };
}

export interface SaveProjectAsTemplateRequest extends TemplateSnapshotOptions {
  name: string;
  description?: string;
  category: ProjectTemplateCategory;
}

export interface PublishTemplateVersionRequest extends TemplateSnapshotOptions {
  changelog?: string;
}

export interface TemplateListingFields {
  tags?: string[];
  level?: ProjectTemplateLevel | null;
  language?: ProjectTemplateLanguage;
  estimatedDurationDays?: number | null;
}

export interface UpdateProjectTemplateListingRequest extends TemplateListingFields {
  name?: string;
  description?: string | null; // null clears it
  category?: ProjectTemplateCategory;
}

export interface CreateProjectTemplateRequest extends TemplateListingFields {
  name: string;
  description?: string;
  category: ProjectTemplateCategory;
  skeleton: ProjectTemplateSkeleton;
}

export interface UpdateProjectTemplateRequest extends TemplateListingFields {
  name?: string;
  description?: string;
  category?: ProjectTemplateCategory;
  // Replaces the whole skeleton (system templates only) as a new version.
  skeleton?: ProjectTemplateSkeleton;
  changelog?: string;
}

/** AI output (API.md § 26.7): already validated, nothing saved. */
export interface ProjectTemplateDraft {
  name: string;
  description: string | null;
  category: ProjectTemplateCategory;
  skeleton: ProjectTemplateSkeleton;
}
