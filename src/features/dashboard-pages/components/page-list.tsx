"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowUpRight, LayoutDashboard, Link2, Plus } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/shared/empty-state";
import { ErrorState } from "@/components/shared/error-state";
import { PageHeader } from "@/components/shared/page-header";
import { OnlineOnly } from "@/features/dashboard-pages/components/online-only";
import { PageNameDialog } from "@/features/dashboard-pages/components/page-name-dialog";
import { VisibilityBadge } from "@/features/dashboard-pages/components/visibility-badge";
import {
  useCreateDashboardPageMutation,
  useDashboardPagesQuery,
} from "@/features/dashboard-pages/hooks/use-dashboard-pages";
import { useSync } from "@/features/sync/context/sync-context";
import { useWorkspaceQuery } from "@/features/workspaces/hooks/use-workspaces";
import { useAuth } from "@/lib/auth/auth-context";
import { formatRelativeTime, shortenId } from "@/lib/format";
import type { DashboardPageSummary } from "@/types/dashboard-page";

export function pagesHref(workspaceId: string, pageId?: string) {
  return pageId
    ? `/workspaces/${workspaceId}/pages/${pageId}`
    : `/workspaces/${workspaceId}/pages`;
}

/**
 * Every dashboard page the caller can see in this workspace (the backend
 * already filters by visibility). New pages always start PRIVATE — opening
 * one up is a choice made later, in the sharing panel, never a default.
 */
export function PageList({ workspaceId }: { workspaceId: string }) {
  const router = useRouter();
  const { userId } = useAuth();
  const pagesQuery = useDashboardPagesQuery(workspaceId);
  const { isOnline } = useSync();
  const workspaceQuery = useWorkspaceQuery(workspaceId);
  const createMutation = useCreateDashboardPageMutation(workspaceId);
  const [creating, setCreating] = React.useState(false);

  const memberNames = new Map(
    (workspaceQuery.data?.members ?? []).map((member) => [member.userId, member.name?.trim()])
  );
  const creatorLabel = (page: DashboardPageSummary) => {
    if (page.createdBy === null) return "Criada automaticamente";
    if (page.createdBy === userId) return "Criada por você";
    return `Criada por ${memberNames.get(page.createdBy) || `Usuário ${shortenId(page.createdBy)}…`}`;
  };

  const pages = [...(pagesQuery.data ?? [])].sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));

  return (
    <div className="space-y-6">
      <PageHeader
        title="Páginas de dashboard"
        description="Monte páginas com os gráficos que importam para você e compartilhe quando quiser."
        actions={
          <OnlineOnly isOnline={isOnline}>
            <Button onClick={() => setCreating(true)}>
              <Plus /> Nova página
            </Button>
          </OnlineOnly>
        }
      />

      {pagesQuery.isLoading ? (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-52 w-full rounded-xl" />
          ))}
        </div>
      ) : pagesQuery.isError ? (
        <ErrorState error={pagesQuery.error} onRetry={() => pagesQuery.refetch()} />
      ) : pages.length === 0 ? (
        <EmptyState
          icon={<LayoutDashboard className="size-6" />}
          title="Nenhuma página ainda"
          description="Crie uma página e adicione gráficos dos itens e pastas deste workspace."
          action={
            <OnlineOnly isOnline={isOnline}>
              <Button onClick={() => setCreating(true)}>
                <Plus /> Nova página
              </Button>
            </OnlineOnly>
          }
        />
      ) : (
        <ul className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {pages.map((page) => (
            <li key={page.id}>
              <Card className="group relative h-full gap-0 py-0 transition-all hover:-translate-y-0.5 hover:shadow-card-hover hover:ring-primary/25">
                <PagePreview seed={page.id} />
                <div className="flex flex-1 flex-col gap-3 p-4">
                  <div className="flex items-start gap-2">
                    <Link
                      href={pagesHref(workspaceId, page.id)}
                      className="min-w-0 flex-1 rounded-sm after:absolute after:inset-0 after:rounded-xl focus-visible:outline-none focus-visible:after:ring-[3px] focus-visible:after:ring-ring/50"
                    >
                      <h2 className="truncate text-base font-semibold text-foreground">{page.name}</h2>
                    </Link>
                    <ArrowUpRight
                      aria-hidden
                      className="size-4 shrink-0 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100"
                    />
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <VisibilityBadge visibility={page.visibility} />
                    {page.hasActivePublicLink ? (
                      <Badge variant="outline" className="gap-1 font-normal text-muted-foreground">
                        <Link2 className="size-3" /> Link ativo
                      </Badge>
                    ) : null}
                  </div>
                  <p className="mt-auto border-t pt-3 text-xs text-muted-foreground">
                    {creatorLabel(page)} · atualizada {formatRelativeTime(page.updatedAt)}
                  </p>
                </div>
              </Card>
            </li>
          ))}
        </ul>
      )}

      {creating ? (
        <PageNameDialog
          open
          onOpenChange={setCreating}
          title="Nova página"
          description="Ela começa privada: só você vê até decidir compartilhar."
          initialName=""
          submitLabel="Criar página"
          isPending={createMutation.isPending}
          onSubmit={(name) =>
            createMutation.mutate(
              { name, visibility: "PRIVATE" },
              { onSuccess: (page) => router.push(pagesHref(workspaceId, page.id)) }
            )
          }
        />
      ) : null}
    </div>
  );
}

// The list carries no chart data, so the preview is decoration only: one of
// a few chart silhouettes, picked from the page id so each card keeps its
// own look between visits.
const PREVIEW_BARS = [
  [40, 70, 55, 90, 65],
  [80, 50, 95, 35, 60],
  [30, 55, 45, 75, 100],
];

function PagePreview({ seed }: { seed: string }) {
  let hash = 0;
  for (const char of seed) hash = (hash * 31 + char.charCodeAt(0)) >>> 0;
  const variant = hash % 3;
  const bars = PREVIEW_BARS[Math.floor(hash / 3) % PREVIEW_BARS.length];

  return (
    <div
      aria-hidden
      className="relative flex h-24 items-end gap-3 overflow-hidden border-b bg-gradient-to-br from-primary/10 via-primary/5 to-transparent px-5 pt-4"
    >
      {variant === 0 ? (
        <div className="flex h-full flex-1 items-end gap-1.5">
          {bars.map((height, i) => (
            <div
              key={i}
              className="flex-1 rounded-t-sm bg-chart-1/70 transition-all group-hover:bg-chart-1"
              style={{ height: `${height}%` }}
            />
          ))}
        </div>
      ) : variant === 1 ? (
        <svg viewBox="0 0 100 40" preserveAspectRatio="none" className="h-full flex-1 pb-3">
          <polyline
            points={bars.map((h, i) => `${i * 25},${40 - h * 0.36}`).join(" ")}
            fill="none"
            stroke="var(--chart-1)"
            strokeWidth="2"
            vectorEffect="non-scaling-stroke"
            strokeLinejoin="round"
          />
        </svg>
      ) : (
        <div className="flex h-full flex-1 items-center gap-4 pb-4">
          <div
            className="size-12 shrink-0 rounded-full"
            style={{
              background:
                "conic-gradient(var(--chart-1) 0 45%, var(--chart-3) 45% 72%, var(--chart-4) 72% 100%)",
              mask: "radial-gradient(circle, transparent 42%, #000 43%)",
            }}
          />
          <div className="flex flex-1 flex-col gap-1.5">
            <div className="h-1.5 w-3/4 rounded-full bg-chart-1/60" />
            <div className="h-1.5 w-1/2 rounded-full bg-chart-3/60" />
            <div className="h-1.5 w-2/3 rounded-full bg-chart-4/60" />
          </div>
        </div>
      )}
    </div>
  );
}
