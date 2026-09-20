"use client";

import * as React from "react";
import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { useProjectsQuery } from "@/features/projects/hooks/use-projects";
import { useWorkspaceQuery } from "@/features/workspaces/hooks/use-workspaces";
import { getAncestors } from "@/lib/tree";
import type { Project } from "@/types/project";

// Shown only for sub-projects: Workspace → ancestors (root first) → current.
// The ancestors come from the workspace's project list already in cache (the
// same query the projects page uses), so no per-ancestor request is needed.
export function ProjectBreadcrumb({ project }: { project: Project }) {
  const projectsQuery = useProjectsQuery(project.parentId ? project.workspaceId : null);
  const workspaceQuery = useWorkspaceQuery(project.parentId ? project.workspaceId : null);

  const ancestors = React.useMemo(
    () => getAncestors(projectsQuery.data?.data ?? [], project.id),
    [projectsQuery.data, project.id]
  );

  if (!project.parentId || ancestors.length === 0) return null;

  return (
    <nav aria-label="Breadcrumb">
      <ol className="flex flex-wrap items-center gap-1 text-sm text-muted-foreground">
        <li>
          <Link href="/projects" className="hover:text-foreground hover:underline">
            {workspaceQuery.data?.name ?? "Workspace"}
          </Link>
        </li>
        {ancestors.map((ancestor) => (
          <li key={ancestor.id} className="flex items-center gap-1">
            <ChevronRight className="size-3.5" aria-hidden />
            <Link href={`/projects/${ancestor.id}`} className="hover:text-foreground hover:underline">
              {ancestor.name}
            </Link>
          </li>
        ))}
        <li className="flex items-center gap-1" aria-current="page">
          <ChevronRight className="size-3.5" aria-hidden />
          <span className="font-medium text-foreground">{project.name}</span>
        </li>
      </ol>
    </nav>
  );
}
