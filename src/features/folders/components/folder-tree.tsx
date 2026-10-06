"use client";

import * as React from "react";
import Link from "next/link";
import {
  ChevronDown,
  ChevronRight,
  FolderInput,
  FolderKanban,
  FolderPlus,
  MoreHorizontal,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { FolderStatusBadge } from "@/components/shared/status-badge";
import { CreateFolderDialog } from "@/features/folders/components/create-folder-dialog";
import { MoveFolderDialog } from "@/features/folders/components/move-folder-dialog";
import { buildTree, type TreeNode } from "@/lib/tree";
import type { Folder } from "@/types/folder";

interface FolderTreeProps {
  // The folders to render (already filtered by the active tab).
  folders: Folder[];
  // Every folder of the workspace, used as the "Mover para…" destination list.
  allFolders: Folder[];
  workspaceId: string;
  canManage: boolean;
}

export function FolderTree({ folders, allFolders, workspaceId, canManage }: FolderTreeProps) {
  // Track what's collapsed (not expanded) so the tree starts fully open and
  // folders that appear later show up without the user having to expand.
  const [collapsed, setCollapsed] = React.useState<Set<string>>(() => new Set());
  const [subfolderParent, setSubfolderParent] = React.useState<Folder | null>(null);
  const [movingFolder, setMovingFolder] = React.useState<Folder | null>(null);

  const roots = React.useMemo(() => buildTree(folders), [folders]);

  function toggle(id: string) {
    setCollapsed((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  return (
    <>
      <ul className="space-y-1.5">
        {roots.map((node) => (
          <FolderTreeNode
            key={node.item.id}
            node={node}
            collapsed={collapsed}
            canManage={canManage}
            onToggle={toggle}
            onCreateSubfolder={setSubfolderParent}
            onMove={setMovingFolder}
          />
        ))}
      </ul>

      {subfolderParent ? (
        <CreateFolderDialog
          workspaceId={workspaceId}
          parent={subfolderParent}
          open
          onOpenChange={(open) => !open && setSubfolderParent(null)}
        />
      ) : null}
      {movingFolder ? (
        <MoveFolderDialog
          folder={movingFolder}
          folders={allFolders}
          open
          onOpenChange={(open) => !open && setMovingFolder(null)}
        />
      ) : null}
    </>
  );
}

function FolderTreeNode({
  node,
  collapsed,
  canManage,
  onToggle,
  onCreateSubfolder,
  onMove,
}: {
  node: TreeNode<Folder>;
  collapsed: Set<string>;
  canManage: boolean;
  onToggle: (id: string) => void;
  onCreateSubfolder: (folder: Folder) => void;
  onMove: (folder: Folder) => void;
}) {
  const folder = node.item;
  const hasChildren = node.children.length > 0;
  const isExpanded = hasChildren && !collapsed.has(folder.id);

  return (
    <li>
      <div className="flex items-center gap-2 rounded-xl border border-border/60 bg-card px-2.5 py-2.5 shadow-card transition-all hover:border-primary/25 hover:shadow-card-hover">
        {hasChildren ? (
          <Button
            variant="ghost"
            size="icon-xs"
            aria-expanded={isExpanded}
            aria-label={isExpanded ? "Recolher subpastas" : "Expandir subpastas"}
            onClick={() => onToggle(folder.id)}
          >
            {isExpanded ? <ChevronDown /> : <ChevronRight />}
          </Button>
        ) : (
          // Keeps names aligned with siblings that do have a disclosure button.
          <span className="size-6 shrink-0" aria-hidden />
        )}

        <Link href={`/folders/${folder.id}`} className="flex min-w-0 flex-1 items-center gap-3">
          <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
            <FolderKanban className="size-4" />
          </div>
          <div className="min-w-0">
            <p className="truncate text-sm font-medium text-foreground">{folder.name}</p>
            <p className="truncate text-xs text-muted-foreground">
              {folder.description || "Sem descrição"}
            </p>
          </div>
        </Link>

        {hasChildren ? (
          <span className="hidden shrink-0 text-xs text-muted-foreground sm:inline">
            {node.children.length} {node.children.length === 1 ? "subpasta" : "subpastas"}
          </span>
        ) : null}
        <FolderStatusBadge status={folder.status} />

        {canManage ? (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon-xs" aria-label={`Ações de ${folder.name}`}>
                <MoreHorizontal />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {folder.status === "ACTIVE" ? (
                <DropdownMenuItem onSelect={() => onCreateSubfolder(folder)}>
                  <FolderPlus /> Criar subpasta
                </DropdownMenuItem>
              ) : null}
              <DropdownMenuItem onSelect={() => onMove(folder)}>
                <FolderInput /> Mover para…
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        ) : null}
      </div>

      {isExpanded ? (
        <ul className="ml-5 mt-1.5 space-y-1.5 border-l border-border/60 pl-3">
          {node.children.map((child) => (
            <FolderTreeNode
              key={child.item.id}
              node={child}
              collapsed={collapsed}
              canManage={canManage}
              onToggle={onToggle}
              onCreateSubfolder={onCreateSubfolder}
              onMove={onMove}
            />
          ))}
        </ul>
      ) : null}
    </li>
  );
}
