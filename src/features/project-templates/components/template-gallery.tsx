"use client";

import * as React from "react";
import { LayoutTemplate, SearchX } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/shared/empty-state";
import { ErrorState } from "@/components/shared/error-state";
import { Pager } from "@/components/shared/pager";
import { TemplateCard } from "@/features/project-templates/components/template-card";
import { TemplateFilters } from "@/features/project-templates/components/template-filters";
import { useTemplateUrlFilters } from "@/features/project-templates/hooks/use-template-url-filters";
import {
  useProjectTemplateCategoriesQuery,
  useProjectTemplatesQuery,
} from "@/features/project-templates/hooks/use-project-templates";

// A multiple of the 2- and 3-column grids, so every full page fills its rows.
const PAGE_SIZE = 24;

export function TemplateGrid({ children }: { children: React.ReactNode }) {
  return <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">{children}</div>;
}

export function TemplateGridSkeleton({ count = 6 }: { count?: number }) {
  return (
    <TemplateGrid>
      {Array.from({ length: count }).map((_, i) => (
        <Skeleton key={i} className="h-40 w-full rounded-xl" />
      ))}
    </TemplateGrid>
  );
}

// The system catalog: the templates TaskFlow itself provides.
export function TemplateGallery() {
  const { filters, setFilters, clearFilters, hasActiveFilters } = useTemplateUrlFilters();
  const categoriesQuery = useProjectTemplateCategoriesQuery();
  const templatesQuery = useProjectTemplatesQuery({
    page: filters.page,
    limit: PAGE_SIZE,
    category: filters.category,
    search: filters.search,
  });

  const result = templatesQuery.data;
  const topRef = React.useRef<HTMLDivElement>(null);

  return (
    <div ref={topRef} className="space-y-5 scroll-mt-4">
      <TemplateFilters
        filters={filters}
        setFilters={setFilters}
        categories={categoriesQuery.data}
      />

      {templatesQuery.isLoading ? (
        <TemplateGridSkeleton />
      ) : templatesQuery.isError && !result ? (
        <ErrorState error={templatesQuery.error} onRetry={() => templatesQuery.refetch()} />
      ) : !result || result.data.length === 0 ? (
        hasActiveFilters ? (
          <EmptyState
            icon={<SearchX className="size-6" />}
            title="Nenhum modelo com esses filtros"
            description="Tente outra palavra ou outra categoria."
            action={
              <Button variant="outline" onClick={clearFilters}>
                Limpar filtros
              </Button>
            }
          />
        ) : (
          <EmptyState
            icon={<LayoutTemplate className="size-6" />}
            title="Nenhum modelo disponível ainda"
          />
        )
      ) : (
        <div
          className={templatesQuery.isPlaceholderData ? "space-y-4 opacity-60 transition-opacity" : "space-y-4"}
          aria-busy={templatesQuery.isFetching}
        >
          <TemplateGrid>
            {result.data.map((template) => (
              <TemplateCard
                key={template.id}
                template={template}
                categories={categoriesQuery.data}
              />
            ))}
          </TemplateGrid>
          <Pager
            meta={result.meta}
            isLoading={templatesQuery.isFetching}
            onPageChange={(page) => {
              setFilters({ page });
              topRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
            }}
          />
        </div>
      )}
    </div>
  );
}
