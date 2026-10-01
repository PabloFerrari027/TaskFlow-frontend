import type { CustomFieldType } from "@/types/custom-field";
import type { TaskPriority } from "@/types/task";
import type { PaginationParams } from "@/types/common";

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
] as const;

export type ProjectTemplateCategory = (typeof PROJECT_TEMPLATE_CATEGORIES)[number];

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
  sectionCount: number;
  customFieldCount: number;
  taskCount: number;
  createdAt: string;
  updatedAt: string;
}

// The skeleton uses relative indexes, never ids: `parentIndex`/`sectionIndex`
// point into `sections`, `parentTaskIndex` into an EARLIER entry of `tasks`.
export interface ProjectTemplateSkeletonSection {
  name: string;
  parentIndex: number | null;
  // Orders sibling sections (same `parentIndex`).
  position: number;
}

export interface ProjectTemplateSkeletonCustomField {
  name: string;
  type: CustomFieldType;
  options?: string[];
}

export interface ProjectTemplateSkeletonTask {
  title: string;
  description?: string;
  sectionIndex: number;
  parentTaskIndex?: number;
  priority?: TaskPriority;
  // Due date = "instantiation day + N" (0–730).
  dueInDays?: number;
  // Keyed by custom field NAME (unique within a template).
  customFieldValues?: Record<string, unknown>;
}

// Params may hold symbolic refs (`$section:N`, `$field:Nome`, `$role:chave`)
// resolved on instantiation (API.md § 26.1).
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

export interface ProjectTemplateSkeleton {
  sections: ProjectTemplateSkeletonSection[];
  customFields: ProjectTemplateSkeletonCustomField[];
  tasks: ProjectTemplateSkeletonTask[];
  // Absent on `schemaVersion: 1` skeletons.
  automations?: ProjectTemplateSkeletonAutomation[];
}

// Only answered for templates the requester may see (404 otherwise), and
// never cached by the API — so never derive it from the (shared, cached) list.
export interface ProjectTemplateDetail extends ProjectTemplateSummary {
  skeleton: ProjectTemplateSkeleton;
}

// Admin responses (API.md § 26.7).
export interface ProjectTemplate extends ProjectTemplateSummary {
  sourceProjectId: string | null;
  skeleton: ProjectTemplateSkeleton;
}

export interface ProjectTemplateCategoryInfo {
  slug: ProjectTemplateCategory;
  label: string;
  icon: string;
}

export interface ProjectTemplateFilters extends PaginationParams {
  category?: ProjectTemplateCategory;
  search?: string;
}

export type AdminProjectTemplateFilters = ProjectTemplateFilters;

export interface InstantiateProjectTemplateRequest {
  name: string;
}

export interface InstantiateProjectTemplateResponse {
  projectId: string;
}

export interface SaveProjectAsTemplateRequest {
  name: string;
  description?: string;
  category: ProjectTemplateCategory;
}

export interface UpdateProjectTemplateListingRequest {
  name?: string;
  description?: string | null; // null clears it
  category?: ProjectTemplateCategory;
}

export interface CreateProjectTemplateRequest {
  name: string;
  description?: string;
  category: ProjectTemplateCategory;
  skeleton: ProjectTemplateSkeleton;
}

export interface UpdateProjectTemplateRequest {
  name?: string;
  description?: string;
  category?: ProjectTemplateCategory;
  // Replaces the whole skeleton (system templates only).
  skeleton?: ProjectTemplateSkeleton;
}
