"use client";

import * as React from "react";
import { use } from "react";
import Link from "next/link";
import { Archive, FolderInput, FolderPlus, LayoutTemplate, Pencil, Wand2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { PageHeader } from "@/components/shared/page-header";
import { ErrorState } from "@/components/shared/error-state";
import { RoleGate } from "@/components/shared/role-gate";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { FolderStatusBadge } from "@/components/shared/status-badge";
import { FolderTabsNav } from "@/features/folders/components/folder-tabs-nav";
import { EditFolderDialog } from "@/features/folders/components/edit-folder-dialog";
import { CreateFolderDialog } from "@/features/folders/components/create-folder-dialog";
import { MoveFolderDialog } from "@/features/folders/components/move-folder-dialog";
import { FolderBreadcrumb } from "@/features/folders/components/folder-breadcrumb";
import { SaveAsTemplateDialog } from "@/features/folder-templates/components/save-as-template-dialog";
import { ItemDetailSheet } from "@/features/items/components/item-detail-sheet";
import {
  useArchiveFolderMutation,
  useFolderQuery,
  useFoldersQuery,
} from "@/features/folders/hooks/use-folders";
import { useFolderPermission } from "@/features/folders/hooks/use-folder-permission";
import { useAuth } from "@/lib/auth/auth-context";

export default function FolderDetailLayout(
  props: LayoutProps<"/folders/[folderId]">
) {
  const { folderId } = use(props.params);
  const [editOpen, setEditOpen] = React.useState(false);
  const [subfolderOpen, setSubfolderOpen] = React.useState(false);
  const [moveOpen, setMoveOpen] = React.useState(false);
  const [archiveOpen, setArchiveOpen] = React.useState(false);
  const [saveTemplateOpen, setSaveTemplateOpen] = React.useState(false);

  const { userId } = useAuth();
  const folderQuery = useFolderQuery(folderId);
  const { canManage } = useFolderPermission(folderId);
  const archiveMutation = useArchiveFolderMutation(folderId);
  // Destination list for "Mover para…" — same cached query as the folders page.
  const workspaceFoldersQuery = useFoldersQuery(folderQuery.data?.workspaceId ?? null);

  if (folderQuery.isLoading) {
    return (
      <div data-page-width="full" className="space-y-4">
        <Skeleton className="h-9 w-64" />
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-48 w-full" />
      </div>
    );
  }

  if (folderQuery.isError || !folderQuery.data) {
    return <ErrorState error={folderQuery.error} onRetry={() => folderQuery.refetch()} />;
  }

  const folder = folderQuery.data;

  return (
    // Every tab shares the full width (the board and timeline need it), so the
    // header and tabs do not change width when switching between tabs.
    <div data-page-width="full" className="space-y-6">
      <FolderBreadcrumb folder={folder} />

      <PageHeader
        title={folder.name}
        description={folder.description || "Sem descrição"}
        actions={
          <div className="flex flex-wrap items-center gap-2">
            <FolderStatusBadge status={folder.status} />
            <RoleGate allowed={canManage}>
              <Button variant="outline" size="sm" onClick={() => setEditOpen(true)}>
                <Pencil /> Editar nome e descrição
              </Button>
              {folder.status === "ACTIVE" ? (
                <Button variant="outline" size="sm" onClick={() => setSubfolderOpen(true)}>
                  <FolderPlus /> Criar subpasta
                </Button>
              ) : null}
              <Button variant="outline" size="sm" onClick={() => setMoveOpen(true)}>
                <FolderInput /> Mover para outra pasta
              </Button>
              <Button variant="outline" size="sm" onClick={() => setSaveTemplateOpen(true)}>
                <LayoutTemplate /> Salvar como modelo
              </Button>
              {folder.status === "ACTIVE" ? (
                <Button asChild variant="outline" size="sm">
                  <Link href={`/templates?applyTo=${folder.id}`}>
                    <Wand2 /> Aplicar um modelo
                  </Link>
                </Button>
              ) : null}
              {folder.status === "ACTIVE" ? (
                <Button
                  variant="outline"
                  size="sm"
                  className="text-destructive hover:text-destructive"
                  onClick={() => setArchiveOpen(true)}
                >
                  <Archive /> Arquivar pasta
                </Button>
              ) : null}
            </RoleGate>
          </div>
        }
      />

      {folder.status === "ARCHIVED" ? (
        <div className="-mt-2 flex items-center gap-2 rounded-lg border border-border/60 bg-muted/40 px-4 py-3 text-sm text-muted-foreground">
          <Archive className="size-4 shrink-0" aria-hidden />
          Esta pasta está arquivada: ela fica guardada apenas para consulta.
        </div>
      ) : null}

      {folder.createdBy === userId ? (
        <p className="-mt-4 text-xs text-muted-foreground">Criado por você</p>
      ) : null}

      <FolderTabsNav folderId={folder.id} showAutomations={canManage} />

      {props.children}

      <EditFolderDialog folder={folder} open={editOpen} onOpenChange={setEditOpen} />
      <CreateFolderDialog
        workspaceId={folder.workspaceId}
        parent={folder}
        open={subfolderOpen}
        onOpenChange={setSubfolderOpen}
      />
      <ConfirmDialog
        open={archiveOpen}
        onOpenChange={setArchiveOpen}
        trigger={<span className="hidden" />}
        title="Arquivar esta pasta?"
        description="A pasta fica guardada apenas para consulta. Pastas não podem ser excluídas, somente arquivadas."
        confirmLabel="Arquivar pasta"
        isLoading={archiveMutation.isPending}
        onConfirm={() => archiveMutation.mutate()}
      />
      {moveOpen ? (
        <MoveFolderDialog
          folder={folder}
          folders={workspaceFoldersQuery.data?.data ?? []}
          open
          onOpenChange={setMoveOpen}
        />
      ) : null}
      {saveTemplateOpen ? (
        <SaveAsTemplateDialog folder={folder} open onOpenChange={setSaveTemplateOpen} />
      ) : null}
      <ItemDetailSheet folderId={folder.id} />
    </div>
  );
}
