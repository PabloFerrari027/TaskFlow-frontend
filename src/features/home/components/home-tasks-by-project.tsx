"use client";

import Link from "next/link";
import { ChevronRight, FolderKanban, PartyPopper } from "lucide-react";
import type { UseQueryResult } from "@tanstack/react-query";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { ErrorState } from "@/components/shared/error-state";
import { countsByProject } from "@/features/home/lib/home-queries";
import type { AnalyticsResult } from "@/types/analytics";
import type { Project } from "@/types/project";

export function HomeTasksByProject({
  openByProject,
  overdueByProject,
  projects,
}: {
  openByProject: UseQueryResult<AnalyticsResult>;
  overdueByProject: UseQueryResult<AnalyticsResult>;
  projects: Project[];
}) {
  const names = new Map(projects.map((project) => [project.id, project.name]));
  const open = countsByProject(openByProject.data);
  const overdue = countsByProject(overdueByProject.data);

  // Most urgent first: projects with late tasks, then by how much is open.
  const rows = [...open.entries()]
    .map(([projectId, count]) => ({
      projectId,
      name: names.get(projectId) ?? "Projeto",
      open: count,
      overdue: overdue.get(projectId) ?? 0,
    }))
    .sort((a, b) => b.overdue - a.overdue || b.open - a.open);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Onde estão suas tarefas</CardTitle>
        <CardDescription>
          Tarefas em aberto atribuídas a você, por projeto. Sub-projetos entram no projeto principal.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {openByProject.isPending ? (
          <div className="space-y-2">
            {Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} className="h-14 w-full rounded-lg" />
            ))}
          </div>
        ) : openByProject.isError ? (
          <ErrorState
            className="py-8"
            error={openByProject.error}
            onRetry={() => openByProject.refetch()}
          />
        ) : rows.length === 0 ? (
          <div className="flex flex-col items-center gap-2 rounded-lg bg-success/10 px-6 py-10 text-center">
            <PartyPopper className="size-7 text-success" aria-hidden />
            <p className="font-semibold">Nada pendente com você</p>
            <p className="max-w-sm text-sm text-muted-foreground">
              Quando alguém atribuir uma tarefa a você, ela aparece aqui.
            </p>
          </div>
        ) : (
          <ul className="-mx-2 divide-y divide-border/60">
            {rows.map((row) => (
              <li key={row.projectId}>
                <Link
                  href={`/projects/${row.projectId}/tasks`}
                  className="group flex items-center gap-3 rounded-lg px-2 py-3 transition-colors hover:bg-muted/60"
                >
                  <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                    <FolderKanban className="size-4.5" />
                  </span>
                  <span className="min-w-0 flex-1 truncate font-medium">{row.name}</span>
                  <span className="flex shrink-0 items-center gap-1.5">
                    {row.overdue > 0 ? (
                      <Badge variant="destructive">
                        {row.overdue} {row.overdue === 1 ? "atrasada" : "atrasadas"}
                      </Badge>
                    ) : null}
                    <Badge variant="secondary">{row.open} em aberto</Badge>
                  </span>
                  <ChevronRight className="size-4 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5" />
                </Link>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}
