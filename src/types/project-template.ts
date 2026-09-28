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

export type ProjectTemplateStatus = "PUBLISHED" | "UNPUBLISHED" | "REMOVED";

export type ProjectTemplateAccess = "FREE" | "AUTHOR" | "PURCHASED" | "PURCHASE_REQUIRED";

export type ProjectTemplatePricing = "free" | "paid";

export type ProjectTemplateOrigin = "system" | "community";

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
  // `null` on system templates.
  author: ProjectTemplateAuthor | null;
  // Cents; 0 = free. `currency` is always "BRL".
  priceCents: number;
  currency: string;
  status: ProjectTemplateStatus;
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

export interface ProjectTemplateSkeleton {
  sections: ProjectTemplateSkeletonSection[];
  customFields: ProjectTemplateSkeletonCustomField[];
  tasks: ProjectTemplateSkeletonTask[];
}

// Depends on who asks — never derive it from the (shared, cached) list.
export interface ProjectTemplateDetail extends ProjectTemplateSummary {
  access: ProjectTemplateAccess;
  canInstantiate: boolean;
  // `null` with `access: "PURCHASE_REQUIRED"`.
  skeleton: ProjectTemplateSkeleton | null;
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
  templateCount: number;
}

export interface ProjectTemplateFilters extends PaginationParams {
  category?: ProjectTemplateCategory;
  pricing?: ProjectTemplatePricing;
  origin?: ProjectTemplateOrigin;
  search?: string;
}

export interface AdminProjectTemplateFilters extends ProjectTemplateFilters {
  // PUBLISHED when omitted.
  status?: ProjectTemplateStatus;
}

export interface InstantiateProjectTemplateRequest {
  name: string;
}

export interface InstantiateProjectTemplateResponse {
  projectId: string;
}

export interface PublishProjectAsTemplateRequest {
  name: string;
  description?: string;
  category: ProjectTemplateCategory;
  // 0 (free) or 100–100000.
  priceCents?: number;
}

export interface UpdateProjectTemplateListingRequest {
  name?: string;
  description?: string | null; // null clears it
  category?: ProjectTemplateCategory;
  priceCents?: number;
}

export interface ProjectTemplateCheckoutResponse {
  purchaseId: string;
  checkoutUrl: string;
  expiresAt: string;
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

export interface ModerateProjectTemplateRequest {
  reason?: string;
}
