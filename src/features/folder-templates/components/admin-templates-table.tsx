"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import axios from "axios";
import { Image as ImageIcon, LayoutTemplate, SearchX, Trash2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { TemplateMediaManager } from "@/features/folder-templates/components/template-media-manager";
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
import { getCategoryInfo } from "@/features/folder-templates/lib/categories";
import { TemplateFilters } from "@/features/folder-templates/components/template-filters";
import { useTemplateUrlFilters } from "@/features/folder-templates/hooks/use-template-url-filters";
import {
  useAdminDeleteFolderTemplateMutation,
  useAdminFolderTemplatesQuery,
  useFolderTemplateCategoriesQuery,
} from "@/features/folder-templates/hooks/use-folder-templates";
import type { FolderTemplateSummary } from "@/types/folder-template";

const PAGE_SIZE = 20;
type PendingAction =
  | { kind: "delete"; template: FolderTemplateSummary }
  // By id: the row is refetched after each upload and the dialog follows it.
  | { kind: "media"; templateId: string }
  | null;

// The system catalog only — the service pins every admin listing to it.
export function AdminTemplatesTable() {
  const router = useRouter();
  const { filters, setFilters, clearFilters, hasActiveFilters } = useTemplateUrlFilters();
  const categoriesQuery = useFolderTemplateCategoriesQuery();
  const templatesQuery = useAdminFolderTemplatesQuery({
    page: filters.page,
    limit: PAGE_SIZE,
    category: filters.category,
    search: filters.search,
    level: filters.level,
    sort: filters.sort,
  });
  const deleteMutation = useAdminDeleteFolderTemplateMutation();
  const [pending, setPending] = React.useState<PendingAction>(null);

  // `GET /admin/folder-templates` is itself SUPER_ADMIN-only — a non-admin
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
  const mediaTemplate =
    pending?.kind === "media"
      ? result?.data.find((template) => template.id === pending.templateId)
      : undefined;

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
                <TableHead>Versão</TableHead>
                <TableHead>Usos</TableHead>
                <TableHead>Atualizado</TableHead>
                <TableHead className="w-24" />
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
                    <TableCell className="text-muted-foreground">v{template.version}</TableCell>
                    <TableCell className="text-muted-foreground">
                      {template.stats?.instantiationCount ?? 0}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {formatDate(template.updatedAt)}
                    </TableCell>
                    <TableCell>
                      <div className="flex justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="icon-sm"
                          aria-label="Capa e imagens"
                          title="Capa e imagens"
                          onClick={() => setPending({ kind: "media", templateId: template.id })}
                        >
                          <ImageIcon />
                        </Button>
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

      <Dialog open={pending?.kind === "media"} onOpenChange={(open) => !open && close()}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-xl">
          <DialogHeader>
            <DialogTitle>Capa e imagens</DialogTitle>
            <DialogDescription>{mediaTemplate?.name}</DialogDescription>
          </DialogHeader>
          {mediaTemplate ? <TemplateMediaManager template={mediaTemplate} admin /> : null}
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={pending?.kind === "delete"}
        onOpenChange={(open) => !open && close()}
        trigger={<span className="hidden" />}
        title={`Excluir “${pending?.kind === "delete" ? pending.template.name : ""}”?`}
        description="A exclusão é definitiva. Pastas já criadas com este modelo não mudam."
        confirmLabel="Excluir modelo"
        isLoading={deleteMutation.isPending}
        onConfirm={() => {
          if (pending?.kind !== "delete") return;
          deleteMutation.mutate(pending.template.id, { onSettled: close });
        }}
      />
    </div>
  );
}
