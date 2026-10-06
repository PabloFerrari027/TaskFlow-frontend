"use client";

import * as React from "react";
import Link from "next/link";
import {
  ChevronDown,
  ChevronRight,
  FolderInput,
  FolderPlus,
  Loader2,
  MoreHorizontal,
  PanelRightOpen,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { FolderStatusBadge } from "@/components/shared/status-badge";
import { CreateFolderDialog } from "@/features/folders/components/create-folder-dialog";
import { MoveFolderDialog } from "@/features/folders/components/move-folder-dialog";
import { useUpdateFolderMutation } from "@/features/folders/hooks/use-folders";
import { formatRelativeTime } from "@/lib/format";
import { buildTree, type TreeNode } from "@/lib/tree";
import { cn } from "@/lib/utils";
import type { Folder } from "@/types/folder";

// Same minimum as the create/edit forms (see `updateFolderSchema`).
const MIN_NAME_LENGTH = 2;

// Cells look like plain table text until hovered or focused, like a spreadsheet.
const CELL_CLASS = "border-r border-border/60 p-0.5! last:border-r-0";
const HEAD_CLASS = "h-9! border-r border-border/60 px-2.5 text-xs text-muted-foreground last:border-r-0";
const INPUT_CLASS =
  "h-8 border-transparent bg-transparent px-2 pr-7 shadow-none hover:border-input focus-visible:border-ring dark:bg-transparent";

type TextField = "name" | "description";

// Every text input of the table carries its column here so Enter/arrows can hop
// between rows like a spreadsheet column.
const CELL_ATTR = "data-folder-cell";

function focusSiblingCell(input: HTMLInputElement, field: TextField, offset: 1 | -1) {
  const cells = Array.from(
    input.closest("table")?.querySelectorAll<HTMLInputElement>(`input[${CELL_ATTR}="${field}"]`) ??
      []
  );
  cells[cells.indexOf(input) + offset]?.focus();
}

/**
 * Text cell with a local draft on top of the server value: `null` means "not
 * being edited, show what the server has". The draft is only dropped once the
 * save settles, so the cell doesn't flash the old value between blur and the
 * response, and a failed save falls back to the server value.
 */
function FolderTextCell({
  folder,
  field,
  label,
  placeholder,
}: {
  folder: Folder;
  field: TextField;
  label: string;
  placeholder?: string;
}) {
  const mutation = useUpdateFolderMutation(folder.id, { silent: true });
  const [draft, setDraft] = React.useState<string | null>(null);
  const serverValue = (field === "name" ? folder.name : folder.description) ?? "";

  function commit() {
    if (draft === null || mutation.isPending) return;
    const next = draft.trim();
    if (next === serverValue.trim()) {
      setDraft(null);
      return;
    }
    if (field === "name" && next.length < MIN_NAME_LENGTH) {
      toast.error(`O nome precisa ter pelo menos ${MIN_NAME_LENGTH} caracteres.`);
      setDraft(null);
      return;
    }
    mutation.mutate({ [field]: next }, { onSettled: () => setDraft(null) });
  }

  return (
    <div className="relative min-w-0 flex-1">
      <Input
        {...{ [CELL_ATTR]: field }}
        aria-label={`${label} de ${folder.name}`}
        placeholder={placeholder}
        value={draft ?? serverValue}
        onChange={(e) => setDraft(e.target.value)}
        onBlur={commit}
        onKeyDown={(e) => {
          const input = e.currentTarget;
          if (e.key === "Enter") {
            // Blur first so the draft is committed, then move down a row.
            input.blur();
            focusSiblingCell(input, field, 1);
          } else if (e.key === "ArrowDown") {
            e.preventDefault();
            focusSiblingCell(input, field, 1);
          } else if (e.key === "ArrowUp") {
            e.preventDefault();
            focusSiblingCell(input, field, -1);
          } else if (e.key === "Escape") {
            setDraft(null);
            input.blur();
          }
        }}
        className={INPUT_CLASS}
      />
      {mutation.isPending ? (
        <Loader2 className="absolute top-1/2 right-2 size-3.5 -translate-y-1/2 animate-spin text-muted-foreground" />
      ) : null}
    </div>
  );
}

interface FolderRowProps {
  node: TreeNode<Folder>;
  depth: number;
  isExpanded: boolean;
  // Archived folders are kept for consultation only, so they never edit inline.
  canEdit: boolean;
  canManage: boolean;
  onToggle: (id: string) => void;
  onCreateSubfolder: (folder: Folder) => void;
  onMove: (folder: Folder) => void;
}

function FolderRow({
  node,
  depth,
  isExpanded,
  canEdit,
  canManage,
  onToggle,
  onCreateSubfolder,
  onMove,
}: FolderRowProps) {
  const folder = node.item;
  const hasChildren = node.children.length > 0;

  return (
    <TableRow>
      <TableCell className={CELL_CLASS}>
        <div className="flex items-center" style={{ paddingLeft: depth * 20 }}>
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
          {canEdit ? (
            <FolderTextCell folder={folder} field="name" label="Nome" />
          ) : (
            <Link
              href={`/folders/${folder.id}`}
              className="min-w-0 flex-1 truncate px-2 text-sm font-medium hover:underline"
            >
              {folder.name}
            </Link>
          )}
        </div>
      </TableCell>
      <TableCell className={CELL_CLASS}>
        {canEdit ? (
          <FolderTextCell
            folder={folder}
            field="description"
            label="Descrição"
            placeholder="Sem descrição"
          />
        ) : (
          <p className="truncate px-2 text-sm text-muted-foreground">
            {folder.description || "Sem descrição"}
          </p>
        )}
      </TableCell>
      <TableCell className={cn(CELL_CLASS, "px-2!")}>
        <FolderStatusBadge status={folder.status} />
      </TableCell>
      <TableCell className={cn(CELL_CLASS, "px-2! text-xs text-muted-foreground")}>
        {formatRelativeTime(folder.updatedAt)}
      </TableCell>
      <TableCell className={cn(CELL_CLASS, "text-center")}>
        <div className="flex items-center justify-center gap-0.5">
          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="ghost" size="icon-xs" asChild>
                <Link
                  href={`/folders/${folder.id}`}
                  aria-label={`Abrir a pasta “${folder.name}”`}
                >
                  <PanelRightOpen />
                </Link>
              </Button>
            </TooltipTrigger>
            <TooltipContent>Abrir pasta</TooltipContent>
          </Tooltip>
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
      </TableCell>
    </TableRow>
  );
}

interface FolderTableProps {
  // The folders to render (already filtered by the active tab).
  folders: Folder[];
  // Every folder of the workspace, used as the "Mover para…" destination list.
  allFolders: Folder[];
  workspaceId: string;
  canManage: boolean;
}

/**
 * Spreadsheet-style view of the folders: name and description edit in place
 * and save on their own. Keeps the tree's nesting (indent + collapse) so
 * sub-folders stay under their parent.
 */
export function FolderTable({ folders, allFolders, workspaceId, canManage }: FolderTableProps) {
  // Track what's collapsed (not expanded) so the table starts fully open and
  // folders that appear later show up without the user having to expand.
  const [collapsed, setCollapsed] = React.useState<Set<string>>(() => new Set());
  const [subfolderParent, setSubfolderParent] = React.useState<Folder | null>(null);
  const [movingFolder, setMovingFolder] = React.useState<Folder | null>(null);

  const rows = React.useMemo(() => {
    const result: { node: TreeNode<Folder>; depth: number; isExpanded: boolean }[] = [];
    function walk(nodes: TreeNode<Folder>[], depth: number) {
      for (const node of nodes) {
        const isExpanded = node.children.length > 0 && !collapsed.has(node.item.id);
        result.push({ node, depth, isExpanded });
        if (isExpanded) walk(node.children, depth + 1);
      }
    }
    walk(buildTree(folders), 0);
    return result;
  }, [folders, collapsed]);

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
      <div className="rounded-md border border-border/60 bg-background">
        <Table className="min-w-4xl table-fixed">
          <TableHeader>
            <TableRow className="hover:bg-transparent">
              <TableHead className={cn(HEAD_CLASS, "w-72")}>Pasta</TableHead>
              <TableHead className={cn(HEAD_CLASS, "w-auto")}>Descrição</TableHead>
              <TableHead className={cn(HEAD_CLASS, "w-28")}>Status</TableHead>
              <TableHead className={cn(HEAD_CLASS, "w-36")}>Atualizado</TableHead>
              <TableHead className={cn(HEAD_CLASS, "w-20")}>
                <span className="sr-only">Ações</span>
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map(({ node, depth, isExpanded }) => (
              <FolderRow
                key={node.item.id}
                node={node}
                depth={depth}
                isExpanded={isExpanded}
                canEdit={canManage && node.item.status === "ACTIVE"}
                canManage={canManage}
                onToggle={toggle}
                onCreateSubfolder={setSubfolderParent}
                onMove={setMovingFolder}
              />
            ))}
          </TableBody>
        </Table>
      </div>

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
