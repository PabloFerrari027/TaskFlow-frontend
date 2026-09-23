import type { PaginationMeta, PaginationParams } from "@/types/common";

// Mirrors API.md § 24. Note the paginated list is `items` (not `data` like
// PaginatedResult) because the response also carries `summary`/`byFeature`.

export const AI_USAGE_FEATURES = ["assistant-chat", "content-safety", "analytics-query"] as const;
export type AiUsageFeature = (typeof AI_USAGE_FEATURES)[number];

export type AiUsageOperation = "converse" | "generateStructured";

// `cachedTokens` is already contained in `promptTokens`; `thoughtsTokens` is
// NOT contained in `outputTokens`. `totalTokens` is the provider's own total.
export interface AiUsageTokens {
  totalTokens: number;
  promptTokens: number;
  cachedTokens: number;
  outputTokens: number;
  thoughtsTokens: number;
}

export interface AiUsageSummary extends AiUsageTokens {
  calls: number;
}

export interface AiUsageByFeature extends AiUsageSummary {
  feature: AiUsageFeature;
}

export interface AiUsageItem extends AiUsageTokens {
  id: string;
  feature: AiUsageFeature;
  operation: AiUsageOperation;
  model: string;
  workspaceId: string | null;
  createdAt: string;
}

export interface AiUsageResponse {
  summary: AiUsageSummary;
  byFeature: AiUsageByFeature[];
  items: AiUsageItem[];
  meta: PaginationMeta;
}

export interface AiUsageQuery extends PaginationParams {
  // ISO 8601, inclusive. The range can't exceed 90 days.
  from?: string;
  to?: string;
  feature?: AiUsageFeature;
}

// Shared by the "me" and admin usage hooks: turns a "last N days" preset into
// an ISO from/to pair ending now. Keeping this in the queryFn (not the query
// key) means the key stays keyed on `days`, so it doesn't change every render.
export function buildAiUsageDateRange(days: number): { from: string; to: string } {
  const DAY_MS = 24 * 60 * 60 * 1000;
  const to = new Date();
  const from = new Date(to.getTime() - (days - 1) * DAY_MS);
  from.setHours(0, 0, 0, 0);
  return { from: from.toISOString(), to: to.toISOString() };
}
