"use client";

import * as React from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import {
  PROJECT_TEMPLATE_CATEGORIES,
  type ProjectTemplateCategory,
  type ProjectTemplateOrigin,
  type ProjectTemplatePricing,
  type ProjectTemplateStatus,
} from "@/types/project-template";

export interface TemplateUrlFilters {
  page: number;
  category?: ProjectTemplateCategory;
  pricing?: ProjectTemplatePricing;
  origin?: ProjectTemplateOrigin;
  search?: string;
  status?: ProjectTemplateStatus;
}

function pick<T extends string>(value: string | null, allowed: readonly T[]): T | undefined {
  return allowed.includes(value as T) ? (value as T) : undefined;
}

function parse(params: URLSearchParams): TemplateUrlFilters {
  const page = Number(params.get("page"));
  return {
    page: Number.isInteger(page) && page > 0 ? page : 1,
    category: pick(params.get("category"), PROJECT_TEMPLATE_CATEGORIES),
    pricing: pick(params.get("pricing"), ["free", "paid"] as const),
    origin: pick(params.get("origin"), ["system", "community"] as const),
    // The API caps `search` at 100 characters.
    search: params.get("search")?.trim().slice(0, 100) || undefined,
    status: pick(params.get("status"), ["PUBLISHED", "UNPUBLISHED", "REMOVED"] as const),
  };
}

/**
 * Filters and page live in the query string — not in state — so a filtered
 * hub link can be shared and the back button walks through filter changes.
 * Unknown values in a hand-edited URL are simply ignored.
 */
export function useTemplateUrlFilters() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();

  const filters = React.useMemo(() => parse(searchParams), [searchParams]);

  const setFilters = React.useCallback(
    (patch: Partial<TemplateUrlFilters>, options: { replace?: boolean } = {}) => {
      // Any filter change goes back to page 1, unless the patch is the page.
      const next: TemplateUrlFilters = { ...filters, page: 1, ...patch };
      const params = new URLSearchParams();
      if (next.search) params.set("search", next.search);
      if (next.category) params.set("category", next.category);
      if (next.pricing) params.set("pricing", next.pricing);
      if (next.origin) params.set("origin", next.origin);
      if (next.status) params.set("status", next.status);
      if (next.page > 1) params.set("page", String(next.page));
      const query = params.toString();
      const url = query ? `${pathname}?${query}` : pathname;
      if (options.replace) router.replace(url, { scroll: false });
      else router.push(url, { scroll: false });
    },
    [filters, pathname, router]
  );

  const hasActiveFilters = Boolean(
    filters.search || filters.category || filters.pricing || filters.origin || filters.status
  );

  const clearFilters = React.useCallback(
    () =>
      setFilters({
        search: undefined,
        category: undefined,
        pricing: undefined,
        origin: undefined,
        status: undefined,
      }),
    [setFilters]
  );

  return { filters, setFilters, clearFilters, hasActiveFilters };
}
