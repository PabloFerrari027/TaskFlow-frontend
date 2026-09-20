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
import { ProjectStatusBadge } from "@/components/shared/status-badge";
import { CreateProjectDialog } from "@/features/projects/components/create-project-dialog";
import { MoveProjectDialog } from "@/features/projects/components/move-project-dialog";
import { useUpdateProjectMutation } from "@/features/projects/hooks/use-projects";
import { formatRelativeTime } from "@/lib/format";
import { buildTree, type TreeNode } from "@/lib/tree";
import { cn } from "@/lib/utils";
import type { Project } from "@/types/project";

// Same minimum as the create/edit forms (see `updateProjectSchema`).
const MIN_NAME_LENGTH = 2;

// Cells look like plain table text until hovered or focused, like a spreadsheet.
const CELL_CLASS = "border-r border-border/60 p-0.5! last:border-r-0";
const HEAD_CLASS = "h-9! border-r border-border/60 px-2.5 text-xs text-muted-foreground last:border-r-0";
const INPUT_CLASS =
  "h-8 border-transparent bg-transparent px-2 pr-7 shadow-none hover:border-input focus-visible:border-ring dark:bg-transparent";

type TextField = "name" | "description";

// Every text input of the table carries its column here so Enter/arrows can hop
// between rows like a spreadsheet column.
const CELL_ATTR = "data-project-cell";

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
function ProjectTextCell({
  project,
  field,
  label,
  placeholder,
}: {
  project: Project;
  field: TextField;
  label: string;
  placeholder?: string;
}) {
  const mutation = useUpdateProjectMutation(project.id, { silent: true });
  const [draft, setDraft] = React.useState<string | null>(null);
  const serverValue = (field === "name" ? project.name : project.description) ?? "";

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
        aria-label={`${label} de ${project.name}`}
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

interface ProjectRowProps {
  node: TreeNode<Project>;
  depth: number;
  isExpanded: boolean;
  // Archived projects are kept for consultation only, so they never edit inline.
  canEdit: boolean;
  canManage: boolean;
  onToggle: (id: string) => void;
  onCreateSubproject: (project: Project) => void;
  onMove: (project: Project) => void;
}

function ProjectRow({
  node,
  depth,
  isExpanded,
  canEdit,
  canManage,
  onToggle,
  onCreateSubproject,
  onMove,
}: ProjectRowProps) {
  const project = node.item;
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
              aria-label={isExpanded ? "Recolher sub-projetos" : "Expandir sub-projetos"}
              onClick={() => onToggle(project.id)}
            >
              {isExpanded ? <ChevronDown /> : <ChevronRight />}
            </Button>
          ) : (
            // Keeps names aligned with siblings that do have a disclosure button.
            <span className="size-6 shrink-0" aria-hidden />
          )}
          {canEdit ? (
            <ProjectTextCell project={project} field="name" label="Nome" />
          ) : (
            <Link
              href={`/projects/${project.id}`}
              className="min-w-0 flex-1 truncate px-2 text-sm font-medium hover:underline"
            >
              {project.name}
            </Link>
          )}
        </div>
      </TableCell>
      <TableCell className={CELL_CLASS}>
        {canEdit ? (
          <ProjectTextCell
            project={project}
            field="description"
            label="Descrição"
            placeholder="Sem descrição"
          />
        ) : (
          <p className="truncate px-2 text-sm text-muted-foreground">
            {project.description || "Sem descrição"}
          </p>
        )}
      </TableCell>
      <TableCell className={cn(CELL_CLASS, "px-2!")}>
        <ProjectStatusBadge status={project.status} />
      </TableCell>
      <TableCell className={cn(CELL_CLASS, "px-2! text-xs text-muted-foreground")}>
        {formatRelativeTime(project.updatedAt)}
      </TableCell>
      <TableCell className={cn(CELL_CLASS, "text-center")}>
        <div className="flex items-center justify-center gap-0.5">
          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="ghost" size="icon-xs" asChild>
                <Link
                  href={`/projects/${project.id}`}
                  aria-label={`Abrir o projeto “${project.name}”`}
                >
                  <PanelRightOpen />
                </Link>
              </Button>
            </TooltipTrigger>
            <TooltipContent>Abrir projeto</TooltipContent>
          </Tooltip>
          {canManage ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon-xs" aria-label={`Ações de ${project.name}`}>
                  <MoreHorizontal />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                {project.status === "ACTIVE" ? (
                  <DropdownMenuItem onSelect={() => onCreateSubproject(project)}>
                    <FolderPlus /> Criar sub-projeto
                  </DropdownMenuItem>
                ) : null}
                <DropdownMenuItem onSelect={() => onMove(project)}>
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

interface ProjectTableProps {
  // The projects to render (already filtered by the active tab).
  projects: Project[];
  // Every project of the workspace, used as the "Mover para…" destination list.
  allProjects: Project[];
  workspaceId: string;
  canManage: boolean;
}

/**
 * Spreadsheet-style view of the projects: name and description edit in place
 * and save on their own. Keeps the tree's nesting (indent + collapse) so
 * sub-projects stay under their parent.
 */
export function ProjectTable({ projects, allProjects, workspaceId, canManage }: ProjectTableProps) {
  // Track what's collapsed (not expanded) so the table starts fully open and
  // projects that appear later show up without the user having to expand.
  const [collapsed, setCollapsed] = React.useState<Set<string>>(() => new Set());
  const [subprojectParent, setSubprojectParent] = React.useState<Project | null>(null);
  const [movingProject, setMovingProject] = React.useState<Project | null>(null);

  const rows = React.useMemo(() => {
    const result: { node: TreeNode<Project>; depth: number; isExpanded: boolean }[] = [];
    function walk(nodes: TreeNode<Project>[], depth: number) {
      for (const node of nodes) {
        const isExpanded = node.children.length > 0 && !collapsed.has(node.item.id);
        result.push({ node, depth, isExpanded });
        if (isExpanded) walk(node.children, depth + 1);
      }
    }
    walk(buildTree(projects), 0);
    return result;
  }, [projects, collapsed]);

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
              <TableHead className={cn(HEAD_CLASS, "w-72")}>Projeto</TableHead>
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
              <ProjectRow
                key={node.item.id}
                node={node}
                depth={depth}
                isExpanded={isExpanded}
                canEdit={canManage && node.item.status === "ACTIVE"}
                canManage={canManage}
                onToggle={toggle}
                onCreateSubproject={setSubprojectParent}
                onMove={setMovingProject}
              />
            ))}
          </TableBody>
        </Table>
      </div>

      {subprojectParent ? (
        <CreateProjectDialog
          workspaceId={workspaceId}
          parent={subprojectParent}
          open
          onOpenChange={(open) => !open && setSubprojectParent(null)}
        />
      ) : null}
      {movingProject ? (
        <MoveProjectDialog
          project={movingProject}
          projects={allProjects}
          open
          onOpenChange={(open) => !open && setMovingProject(null)}
        />
      ) : null}
    </>
  );
}
