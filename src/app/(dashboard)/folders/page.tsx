"use client";

import * as React from "react";
import Link from "next/link";
import { FolderKanban, LayoutTemplate, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PageHeader } from "@/components/shared/page-header";
import { EmptyState } from "@/components/shared/empty-state";
import { ErrorState } from "@/components/shared/error-state";
import { useCurrentWorkspace } from "@/features/workspaces/context/current-workspace-context";
import { useAuth } from "@/lib/auth/auth-context";
import { canManageWorkspace } from "@/lib/permissions";
import { useFoldersQuery } from "@/features/folders/hooks/use-folders";
import { FolderTree } from "@/features/folders/components/folder-tree";
import { FolderTable } from "@/features/folders/components/folder-table";
import { FolderViewToggle } from "@/features/folders/components/folder-view-toggle";
import { FolderGridSkeleton } from "@/features/folders/components/folder-grid-skeleton";
import { CreateFolderDialog } from "@/features/folders/components/create-folder-dialog";
import { CreateWorkspaceDialog } from "@/features/workspaces/components/create-workspace-dialog";
import {
  useFolderViewMode,
  type FolderViewMode,
} from "@/features/folders/hooks/use-folder-view-mode";
import type { Folder } from "@/types/folder";

function FolderList({
  viewMode,
  ...props
}: {
  viewMode: FolderViewMode;
  folders: Folder[];
  allFolders: Folder[];
  workspaceId: string;
  canManage: boolean;
}) {
  return viewMode === "table" ? <FolderTable {...props} /> : <FolderTree {...props} />;
}

export default function FoldersPage() {
  const { workspace, workspaceId, isLoading: workspaceLoading } = useCurrentWorkspace();
  const { userId } = useAuth();
  const { viewMode, setViewMode } = useFolderViewMode();
  const [createOpen, setCreateOpen] = React.useState(false);
  const [createWorkspaceOpen, setCreateWorkspaceOpen] = React.useState(false);
  const foldersQuery = useFoldersQuery(workspaceId);

  const folders = foldersQuery.data?.data ?? [];
  const canManage = canManageWorkspace(
    workspace?.members.find((member) => member.userId === userId)?.role
  );
  const activeFolders = folders.filter((p) => p.status === "ACTIVE");
  const archivedFolders = folders.filter((p) => p.status === "ARCHIVED");
  const isTruncated = (foldersQuery.data?.meta.totalPages ?? 0) > 1;

  if (!workspaceLoading && !workspace) {
    return (
      <>
        <PageHeader title="Pastas" />
        <EmptyState
          className="mt-6"
          icon={<FolderKanban className="size-6" />}
          title="Você ainda não tem um workspace"
          description="Crie um workspace para começar a organizar pastas e itens."
          action={
            <Button onClick={() => setCreateWorkspaceOpen(true)}>
              <Plus /> Criar workspace
            </Button>
          }
        />
        <CreateWorkspaceDialog
          open={createWorkspaceOpen}
          onOpenChange={setCreateWorkspaceOpen}
        />
      </>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Pastas"
        description={
          workspace
            ? `Todas as pastas de ${workspace.name}.`
            : "Todas as pastas deste workspace."
        }
        actions={
          workspaceId ? (
            <>
              <Button asChild variant="outline">
                <Link href="/templates">
                  <LayoutTemplate /> Começar de um modelo
                </Link>
              </Button>
              <Button data-tour="new-folder" onClick={() => setCreateOpen(true)}>
                <Plus /> Nova pasta
              </Button>
            </>
          ) : null
        }
      />

      {workspaceLoading || foldersQuery.isLoading ? (
        <FolderGridSkeleton />
      ) : foldersQuery.isError ? (
        <ErrorState error={foldersQuery.error} onRetry={() => foldersQuery.refetch()} />
      ) : folders.length === 0 ? (
        <EmptyState
          icon={<FolderKanban className="size-6" />}
          title="Nenhuma pasta neste workspace"
          description="Crie a primeira pasta do zero ou comece de um modelo já organizado."
          action={
            <div className="flex flex-wrap justify-center gap-2">
              <Button onClick={() => setCreateOpen(true)}>
                <Plus /> Nova pasta
              </Button>
              <Button asChild variant="outline">
                <Link href="/templates">
                  <LayoutTemplate /> Começar de um modelo
                </Link>
              </Button>
            </div>
          }
        />
      ) : (
        <>
        {isTruncated ? (
          <p className="text-xs text-muted-foreground">
            Mostrando os primeiros {foldersQuery.data?.meta.limit} de{" "}
            {foldersQuery.data?.meta.total} pastas.
          </p>
        ) : null}
        <Tabs defaultValue="active">
          <div
            data-tour="folder-list-controls"
            className="flex flex-wrap items-center justify-between gap-2"
          >
            <TabsList>
              <TabsTrigger value="active">Ativas ({activeFolders.length})</TabsTrigger>
              <TabsTrigger value="archived">
                Arquivadas ({archivedFolders.length})
              </TabsTrigger>
            </TabsList>
            <FolderViewToggle value={viewMode} onChange={setViewMode} />
          </div>

          <TabsContent value="active" className="pt-4">
            {activeFolders.length === 0 ? (
              <EmptyState
                icon={<FolderKanban className="size-6" />}
                title="Nenhuma pasta ativa"
              />
            ) : (
              <FolderList
                folders={activeFolders}
                allFolders={folders}
                workspaceId={workspaceId as string}
                canManage={canManage}
                viewMode={viewMode}
              />
            )}
          </TabsContent>

          <TabsContent value="archived" className="pt-4">
            {archivedFolders.length === 0 ? (
              <EmptyState
                icon={<FolderKanban className="size-6" />}
                title="Nenhuma pasta arquivada"
              />
            ) : (
              <FolderList
                folders={archivedFolders}
                allFolders={folders}
                workspaceId={workspaceId as string}
                canManage={canManage}
                viewMode={viewMode}
              />
            )}
          </TabsContent>
        </Tabs>
        </>
      )}

      {workspaceId ? (
        <CreateFolderDialog
          workspaceId={workspaceId}
          open={createOpen}
          onOpenChange={setCreateOpen}
        />
      ) : null}
    </div>
  );
}
