"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { LayoutDashboard, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/shared/empty-state";
import { ErrorState } from "@/components/shared/error-state";
import { PageHeader } from "@/components/shared/page-header";
import { PageNameDialog } from "@/features/dashboard-pages/components/page-name-dialog";
import { VisibilityBadge } from "@/features/dashboard-pages/components/visibility-badge";
import {
  useCreateDashboardPageMutation,
  useDashboardPagesQuery,
} from "@/features/dashboard-pages/hooks/use-dashboard-pages";
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
          <Button onClick={() => setCreating(true)}>
            <Plus /> Nova página
          </Button>
        }
      />

      {pagesQuery.isLoading ? (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-28 w-full" />
          ))}
        </div>
      ) : pagesQuery.isError ? (
        <ErrorState error={pagesQuery.error} onRetry={() => pagesQuery.refetch()} />
      ) : pages.length === 0 ? (
        <EmptyState
          icon={<LayoutDashboard className="size-6" />}
          title="Nenhuma página ainda"
          description="Crie uma página e adicione gráficos das tarefas e projetos deste workspace."
          action={
            <Button onClick={() => setCreating(true)}>
              <Plus /> Nova página
            </Button>
          }
        />
      ) : (
        <ul className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {pages.map((page) => (
            <li key={page.id}>
              <Card className="relative h-full gap-3 px-4 transition-colors hover:bg-muted/40">
                <Link
                  href={pagesHref(workspaceId, page.id)}
                  className="rounded-sm after:absolute after:inset-0 after:rounded-xl focus-visible:outline-none focus-visible:after:ring-[3px] focus-visible:after:ring-ring/50"
                >
                  <h2 className="truncate text-base font-semibold text-foreground">{page.name}</h2>
                </Link>
                <div className="flex flex-wrap items-center gap-2">
                  <VisibilityBadge visibility={page.visibility} />
                </div>
                <p className="mt-auto text-xs text-muted-foreground">
                  {creatorLabel(page)} · atualizada {formatRelativeTime(page.updatedAt)}
                </p>
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
