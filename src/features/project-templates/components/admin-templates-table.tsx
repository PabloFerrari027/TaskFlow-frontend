"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import axios from "axios";
import { LayoutTemplate, SearchX, Trash2 } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/shared/empty-state";
import { ErrorState } from "@/components/shared/error-state";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { Pager } from "@/components/shared/pager";
import { formatDate } from "@/lib/format";
import { getCategoryInfo } from "@/features/project-templates/lib/categories";
import { TemplateFilters } from "@/features/project-templates/components/template-filters";
import { useTemplateUrlFilters } from "@/features/project-templates/hooks/use-template-url-filters";
import {
  useAdminDeleteProjectTemplateMutation,
  useAdminProjectTemplatesQuery,
  useProjectTemplateCategoriesQuery,
} from "@/features/project-templates/hooks/use-project-templates";
import type { ProjectTemplateSummary } from "@/types/project-template";

const PAGE_SIZE = 20;
type PendingAction = { kind: "delete"; template: ProjectTemplateSummary } | null;

// The system catalog only — the service pins every admin listing to it.
export function AdminTemplatesTable() {
  const router = useRouter();
  const { filters, setFilters, clearFilters, hasActiveFilters } = useTemplateUrlFilters();
  const categoriesQuery = useProjectTemplateCategoriesQuery();
  const templatesQuery = useAdminProjectTemplatesQuery({
    page: filters.page,
    limit: PAGE_SIZE,
    category: filters.category,
    search: filters.search,
  });
  const deleteMutation = useAdminDeleteProjectTemplateMutation();
  const [pending, setPending] = React.useState<PendingAction>(null);

  // `GET /admin/project-templates` is itself SUPER_ADMIN-only — a non-admin
  // gets a 403, same inference `PlansTable` relies on.
  React.useEffect(() => {
    if (
      templatesQuery.isError &&
      axios.isAxiosError(templatesQuery.error) &&
      templatesQuery.error.response?.status === 403
    ) {
      router.replace("/403");
    }
  }, [templatesQuery.isError, templatesQuery.error, router]);

  const close = () => setPending(null);
  const result = templatesQuery.data;

  return (
    <div className="space-y-5">
      <TemplateFilters
        filters={filters}
        setFilters={setFilters}
        categories={categoriesQuery.data}
      />

      {templatesQuery.isLoading ? (
        <div className="space-y-2">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-10 w-full" />
          ))}
        </div>
      ) : templatesQuery.isError && !result ? (
        <ErrorState error={templatesQuery.error} onRetry={() => templatesQuery.refetch()} />
      ) : !result || result.data.length === 0 ? (
        hasActiveFilters ? (
          <EmptyState
            icon={<SearchX className="size-6" />}
            title="Nenhum modelo com esses filtros"
            action={
              <Button variant="outline" onClick={clearFilters}>
                Limpar filtros
              </Button>
            }
          />
        ) : (
          <EmptyState icon={<LayoutTemplate className="size-6" />} title="Nenhum modelo do sistema" />
        )
      ) : (
        <div className={templatesQuery.isPlaceholderData ? "space-y-3 opacity-60" : "space-y-3"}>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nome</TableHead>
                <TableHead>Categoria</TableHead>
                <TableHead>Atualizado</TableHead>
                <TableHead className="w-16" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {result.data.map((template) => {
                const category = getCategoryInfo(template.category, categoriesQuery.data);
                return (
                  <TableRow key={template.id}>
                    <TableCell className="max-w-64 truncate font-medium text-foreground">
                      {template.name}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      <span aria-hidden>{category.icon}</span> {category.label}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {formatDate(template.updatedAt)}
                    </TableCell>
                    <TableCell>
                      <div className="flex justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="icon-sm"
                          aria-label="Excluir"
                          title="Excluir"
                          className="text-destructive hover:text-destructive"
                          onClick={() => setPending({ kind: "delete", template })}
                        >
                          <Trash2 />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
          <Pager
            meta={result.meta}
            isLoading={templatesQuery.isFetching}
            onPageChange={(page) => setFilters({ page })}
          />
        </div>
      )}

      <ConfirmDialog
        open={pending?.kind === "delete"}
        onOpenChange={(open) => !open && close()}
        trigger={<span className="hidden" />}
        title={`Excluir “${pending?.template.name ?? ""}”?`}
        description="A exclusão é definitiva. Projetos já criados com este modelo não mudam."
        confirmLabel="Excluir modelo"
        isLoading={deleteMutation.isPending}
        onConfirm={() => {
          if (!pending) return;
          deleteMutation.mutate(pending.template.id, { onSettled: close });
        }}
      />
    </div>
  );
}
