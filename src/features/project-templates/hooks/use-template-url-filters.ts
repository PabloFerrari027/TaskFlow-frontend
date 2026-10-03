"use client";

import * as React from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import {
  PROJECT_TEMPLATE_CATEGORIES,
  PROJECT_TEMPLATE_LEVELS,
  type ProjectTemplateCategory,
  type ProjectTemplateLevel,
  type ProjectTemplateSort,
} from "@/types/project-template";

// `relevance` is the API's own default while searching, so it is never picked here.
export const TEMPLATE_SORTS: readonly ProjectTemplateSort[] = ["featured", "popular", "newest"];

export interface TemplateUrlFilters {
  page: number;
  category?: ProjectTemplateCategory;
  search?: string;
  level?: ProjectTemplateLevel;
  sort?: ProjectTemplateSort;
  /** Came from "Aplicar um modelo" in this project: kept while browsing. */
  applyTo?: string;
}

function pick<T extends string>(value: string | null, allowed: readonly T[]): T | undefined {
  return allowed.includes(value as T) ? (value as T) : undefined;
}

function parse(params: URLSearchParams): TemplateUrlFilters {
  const page = Number(params.get("page"));
  return {
    page: Number.isInteger(page) && page > 0 ? page : 1,
    category: pick(params.get("category"), PROJECT_TEMPLATE_CATEGORIES),
    // The API caps `search` at 100 characters.
    search: params.get("search")?.trim().slice(0, 100) || undefined,
    level: pick(params.get("level"), PROJECT_TEMPLATE_LEVELS),
    sort: pick(params.get("sort"), TEMPLATE_SORTS),
    applyTo: params.get("applyTo") || undefined,
  };
}

/**
 * Filters and page live in the query string — not in state — so a filtered
 * link can be shared and the back button walks through filter changes.
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
      if (next.level) params.set("level", next.level);
      if (next.sort) params.set("sort", next.sort);
      if (next.page > 1) params.set("page", String(next.page));
      if (next.applyTo) params.set("applyTo", next.applyTo);
      const query = params.toString();
      const url = query ? `${pathname}?${query}` : pathname;
      if (options.replace) router.replace(url, { scroll: false });
      else router.push(url, { scroll: false });
    },
    [filters, pathname, router]
  );

  const hasActiveFilters = Boolean(filters.search || filters.category || filters.level);

  const clearFilters = React.useCallback(
    () => setFilters({ search: undefined, category: undefined, level: undefined }),
    [setFilters]
  );

  return { filters, setFilters, clearFilters, hasActiveFilters };
}
