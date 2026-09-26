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

// The API rejects wider ranges with AI_USAGE_INVALID_RANGE (API.md § 24).
export const AI_USAGE_MAX_RANGE_DAYS = 90;

// Both usage endpoints are throttled to 30 req/60s and aggregate the whole
// range on every call (API.md § 1.4) — keep results around and don't refetch
// just because the tab regained focus.
export const AI_USAGE_QUERY_CACHE = {
  staleTime: 2 * 60 * 1000,
  refetchOnWindowFocus: false,
} as const;

// Shared by the "me" and admin usage hooks: turns a "last N days" preset into
// an ISO from/to pair ending now. Keeping this in the queryFn (not the query
// key) means the key stays keyed on `days`, so it doesn't change every render.
// `days` is clamped to 1..90 so the request is valid before it's sent (`from`
// ≤ `to`, span < 90 days); AI_USAGE_INVALID_RANGE stays only as a safety net.
export function buildAiUsageDateRange(days: number): { from: string; to: string } {
  const DAY_MS = 24 * 60 * 60 * 1000;
  const span = Math.min(Math.max(Math.trunc(days) || 1, 1), AI_USAGE_MAX_RANGE_DAYS);
  const to = new Date();
  const from = new Date(to.getTime() - (span - 1) * DAY_MS);
  from.setHours(0, 0, 0, 0);
  return { from: from.toISOString(), to: to.toISOString() };
}
