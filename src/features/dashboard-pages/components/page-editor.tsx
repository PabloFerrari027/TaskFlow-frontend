"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  BarChart3,
  Copy,
  Eye,
  MoreHorizontal,
  Pencil,
  Plus,
  Share2,
  Trash2,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Skeleton } from "@/components/ui/skeleton";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { EmptyState } from "@/components/shared/empty-state";
import { ErrorState } from "@/components/shared/error-state";
import { PageHeader } from "@/components/shared/page-header";
import { useAutomationLookups } from "@/features/automations/hooks/use-automation-lookups";
import { ChartBuilderDialog } from "@/features/dashboard-pages/components/chart-builder-dialog";
import { DashboardGrid } from "@/features/dashboard-pages/components/dashboard-grid";
import { PageNameDialog } from "@/features/dashboard-pages/components/page-name-dialog";
import { pagesHref } from "@/features/dashboard-pages/components/page-list";
import { PageSharingPanel } from "@/features/dashboard-pages/components/page-sharing-panel";
import { VisibilityBadge } from "@/features/dashboard-pages/components/visibility-badge";
import {
  useChartPositionSaver,
  useDeleteChartMutation,
} from "@/features/dashboard-pages/hooks/use-chart-definitions";
import {
  useDashboardPageQuery,
  useDeleteDashboardPageMutation,
  useDuplicateDashboardPageMutation,
  useUpdateDashboardPageMutation,
} from "@/features/dashboard-pages/hooks/use-dashboard-pages";
import type { ChartWithResult } from "@/types/dashboard-page";

type BuilderState = { open: false } | { open: true; chart?: ChartWithResult; session: number };

/**
 * One page, edited or just viewed. Everything that changes the page — add,
 * move, resize, edit or remove a chart, rename, share, delete — hangs off
 * the single `canEdit` flag the server sends; the same component with that
 * flag off is the read-only view, never a separate screen.
 */
export function PageEditor({ workspaceId, pageId }: { workspaceId: string; pageId: string }) {
  const router = useRouter();
  const pageQuery = useDashboardPageQuery(workspaceId, pageId);
  const lookups = useAutomationLookups(workspaceId);
  const savePositions = useChartPositionSaver(pageId);
  const deleteChartMutation = useDeleteChartMutation(pageId);
  const renameMutation = useUpdateDashboardPageMutation(workspaceId, pageId);
  const deletePageMutation = useDeleteDashboardPageMutation(workspaceId, pageId);
  const duplicateMutation = useDuplicateDashboardPageMutation(workspaceId);

  const [builder, setBuilder] = React.useState<BuilderState>({ open: false });
  const [removingChart, setRemovingChart] = React.useState<ChartWithResult | null>(null);
  const [sharingOpen, setSharingOpen] = React.useState(false);
  const [renaming, setRenaming] = React.useState(false);
  const [confirmDelete, setConfirmDelete] = React.useState(false);

  const openBuilder = (chart?: ChartWithResult) =>
    setBuilder({ open: true, chart, session: Date.now() });

  if (pageQuery.isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-9 w-72" />
        <div className="grid gap-4 md:grid-cols-2">
          <Skeleton className="h-64 w-full" />
          <Skeleton className="h-64 w-full" />
        </div>
      </div>
    );
  }

  if (pageQuery.isError || !pageQuery.data) {
    return (
      <div className="space-y-4">
        <BackLink workspaceId={workspaceId} />
        <ErrorState
          error={pageQuery.error}
          title="Não foi possível abrir esta página"
          onRetry={() => pageQuery.refetch()}
        />
      </div>
    );
  }

  const page = pageQuery.data;
  const { canEdit } = page;

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <BackLink workspaceId={workspaceId} />
        <PageHeader
          title={page.name}
          actions={
            <>
              {canEdit ? (
                <>
                  <Button variant="outline" onClick={() => setSharingOpen(true)}>
                    <Share2 /> Compartilhar
                  </Button>
                  <Button onClick={() => openBuilder()}>
                    <Plus /> Adicionar gráfico
                  </Button>
                </>
              ) : null}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="icon" aria-label="Mais opções da página">
                    <MoreHorizontal />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  {canEdit ? (
                    <DropdownMenuItem onSelect={() => setRenaming(true)}>
                      <Pencil /> Renomear
                    </DropdownMenuItem>
                  ) : null}
                  <DropdownMenuItem
                    disabled={duplicateMutation.isPending}
                    onSelect={() =>
                      duplicateMutation.mutate(page.id, {
                        onSuccess: (copy) => router.push(pagesHref(workspaceId, copy.id)),
                      })
                    }
                  >
                    <Copy /> Duplicar
                  </DropdownMenuItem>
                  {canEdit ? (
                    <>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem variant="destructive" onSelect={() => setConfirmDelete(true)}>
                        <Trash2 /> Excluir página
                      </DropdownMenuItem>
                    </>
                  ) : null}
                </DropdownMenuContent>
              </DropdownMenu>
            </>
          }
        />
        <div className="flex flex-wrap items-center gap-2">
          <VisibilityBadge visibility={page.visibility} />
          {!canEdit ? (
            <Badge variant="outline" className="gap-1 font-normal text-muted-foreground">
              <Eye className="size-3" /> Somente leitura
            </Badge>
          ) : null}
        </div>
      </div>

      {page.charts.length === 0 ? (
        <EmptyState
          icon={<BarChart3 className="size-6" />}
          title="Esta página ainda não tem gráficos"
          description={
            canEdit
              ? "Adicione o primeiro: escolha o tipo, o que medir e veja o resultado na hora."
              : "Quem edita esta página ainda não adicionou nenhum gráfico."
          }
          action={
            canEdit ? (
              <Button onClick={() => openBuilder()}>
                <Plus /> Adicionar gráfico
              </Button>
            ) : undefined
          }
        />
      ) : (
        <DashboardGrid
          charts={page.charts}
          editable={canEdit}
          lookups={lookups}
          onPositionsChange={canEdit ? savePositions : undefined}
          onEditChart={canEdit ? (chart) => openBuilder(chart) : undefined}
          onRemoveChart={canEdit ? setRemovingChart : undefined}
        />
      )}

      {canEdit && builder.open ? (
        <ChartBuilderDialog
          key={builder.session}
          open
          onOpenChange={(open) => !open && setBuilder({ open: false })}
          workspaceId={workspaceId}
          pageId={page.id}
          existingCharts={page.charts}
          chart={builder.chart}
          lookups={lookups}
        />
      ) : null}

      {canEdit ? (
        <PageSharingPanel
          open={sharingOpen}
          onOpenChange={setSharingOpen}
          workspaceId={workspaceId}
          page={page}
          lookups={lookups}
        />
      ) : null}

      {canEdit && renaming ? (
        <PageNameDialog
          open
          onOpenChange={setRenaming}
          title="Renomear página"
          initialName={page.name}
          submitLabel="Salvar"
          isPending={renameMutation.isPending}
          onSubmit={(name) => renameMutation.mutate({ name }, { onSuccess: () => setRenaming(false) })}
        />
      ) : null}

      <ConfirmDialog
        trigger={<span hidden />}
        open={removingChart !== null}
        onOpenChange={(open) => !open && setRemovingChart(null)}
        title="Remover gráfico?"
        description={`"${removingChart?.name ?? ""}" sai desta página para todos que a veem. Não dá para desfazer.`}
        confirmLabel="Remover"
        isLoading={deleteChartMutation.isPending}
        onConfirm={() => {
          if (!removingChart) return;
          deleteChartMutation.mutate(removingChart.id, { onSettled: () => setRemovingChart(null) });
        }}
      />

      <ConfirmDialog
        trigger={<span hidden />}
        open={confirmDelete}
        onOpenChange={setConfirmDelete}
        title="Excluir página?"
        description="A página e todos os gráficos dela deixam de existir para todos, e os links de compartilhamento param de funcionar. Não dá para desfazer."
        confirmLabel="Excluir"
        isLoading={deletePageMutation.isPending}
        onConfirm={() =>
          deletePageMutation.mutate(undefined, {
            onSuccess: () => router.push(pagesHref(workspaceId)),
          })
        }
      />
    </div>
  );
}

function BackLink({ workspaceId }: { workspaceId: string }) {
  return (
    <Link
      href={pagesHref(workspaceId)}
      className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
    >
      <ArrowLeft className="size-4" /> Páginas
    </Link>
  );
}
