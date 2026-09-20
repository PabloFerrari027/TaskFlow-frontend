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
import { ProjectStatusBadge } from "@/components/shared/status-badge";
import { CreateProjectDialog } from "@/features/projects/components/create-project-dialog";
import { MoveProjectDialog } from "@/features/projects/components/move-project-dialog";
import { buildTree, type TreeNode } from "@/lib/tree";
import type { Project } from "@/types/project";

interface ProjectTreeProps {
  // The projects to render (already filtered by the active tab).
  projects: Project[];
  // Every project of the workspace, used as the "Mover para…" destination list.
  allProjects: Project[];
  workspaceId: string;
  canManage: boolean;
}

export function ProjectTree({ projects, allProjects, workspaceId, canManage }: ProjectTreeProps) {
  // Track what's collapsed (not expanded) so the tree starts fully open and
  // projects that appear later show up without the user having to expand.
  const [collapsed, setCollapsed] = React.useState<Set<string>>(() => new Set());
  const [subprojectParent, setSubprojectParent] = React.useState<Project | null>(null);
  const [movingProject, setMovingProject] = React.useState<Project | null>(null);

  const roots = React.useMemo(() => buildTree(projects), [projects]);

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
          <ProjectTreeNode
            key={node.item.id}
            node={node}
            collapsed={collapsed}
            canManage={canManage}
            onToggle={toggle}
            onCreateSubproject={setSubprojectParent}
            onMove={setMovingProject}
          />
        ))}
      </ul>

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

function ProjectTreeNode({
  node,
  collapsed,
  canManage,
  onToggle,
  onCreateSubproject,
  onMove,
}: {
  node: TreeNode<Project>;
  collapsed: Set<string>;
  canManage: boolean;
  onToggle: (id: string) => void;
  onCreateSubproject: (project: Project) => void;
  onMove: (project: Project) => void;
}) {
  const project = node.item;
  const hasChildren = node.children.length > 0;
  const isExpanded = hasChildren && !collapsed.has(project.id);

  return (
    <li>
      <div className="flex items-center gap-2 rounded-lg border border-border/60 bg-card px-2 py-2 transition-shadow hover:shadow-sm">
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

        <Link href={`/projects/${project.id}`} className="flex min-w-0 flex-1 items-center gap-3">
          <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
            <FolderKanban className="size-4" />
          </div>
          <div className="min-w-0">
            <p className="truncate text-sm font-medium text-foreground">{project.name}</p>
            <p className="truncate text-xs text-muted-foreground">
              {project.description || "Sem descrição"}
            </p>
          </div>
        </Link>

        {hasChildren ? (
          <span className="hidden shrink-0 text-xs text-muted-foreground sm:inline">
            {node.children.length} {node.children.length === 1 ? "sub-projeto" : "sub-projetos"}
          </span>
        ) : null}
        <ProjectStatusBadge status={project.status} />

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

      {isExpanded ? (
        <ul className="ml-5 mt-1.5 space-y-1.5 border-l border-border/60 pl-3">
          {node.children.map((child) => (
            <ProjectTreeNode
              key={child.item.id}
              node={child}
              collapsed={collapsed}
              canManage={canManage}
              onToggle={onToggle}
              onCreateSubproject={onCreateSubproject}
              onMove={onMove}
            />
          ))}
        </ul>
      ) : null}
    </li>
  );
}
