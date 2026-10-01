"use client";

import * as React from "react";
import Link from "next/link";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { BookOpen, Bot, Building2, LayoutTemplate, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PageHeader } from "@/components/shared/page-header";
import { EmptyState } from "@/components/shared/empty-state";
import { useSelfIdentity } from "@/features/auth/hooks/use-current-user";
import { HomeStatTiles } from "@/features/home/components/home-stat-tiles";
import { HomeTasksByProject } from "@/features/home/components/home-tasks-by-project";
import { HomeRecentProjects } from "@/features/home/components/home-recent-projects";
import { PendingApprovalsCard } from "@/features/approvals/components/pending-approvals-card";
import { useHomeStats } from "@/features/home/hooks/use-home-stats";
import { readCount } from "@/features/home/lib/home-queries";
import { CreateProjectDialog } from "@/features/projects/components/create-project-dialog";
import { useProjectsQuery } from "@/features/projects/hooks/use-projects";
import { CreateWorkspaceDialog } from "@/features/workspaces/components/create-workspace-dialog";
import { useCurrentWorkspace } from "@/features/workspaces/context/current-workspace-context";
import { useAuth } from "@/lib/auth/auth-context";

function greetingFor(date: Date) {
  const hour = date.getHours();
  if (hour < 12) return "Bom dia";
  if (hour < 18) return "Boa tarde";
  return "Boa noite";
}

function todayLabel(date: Date) {
  const label = format(date, "EEEE, d 'de' MMMM", { locale: ptBR });
  return label.charAt(0).toUpperCase() + label.slice(1);
}

/** One line that tells the user what matters most right now. */
function nudge(open: number, overdue: number, dueSoon: number) {
  if (overdue > 0) {
    return overdue === 1
      ? "Você tem 1 tarefa atrasada. Que tal começar por ela?"
      : `Você tem ${overdue} tarefas atrasadas. Que tal começar por elas?`;
  }
  if (dueSoon > 0) {
    return dueSoon === 1
      ? "Tudo em dia! 1 tarefa vence nesta semana."
      : `Tudo em dia! ${dueSoon} tarefas vencem nesta semana.`;
  }
  if (open > 0) return "Tudo em dia. Continue assim!";
  return "Nada pendente com você por enquanto.";
}

export default function HomePage() {
  const { workspace, workspaceId, isLoading: workspaceLoading } = useCurrentWorkspace();
  const { userId } = useAuth();
  const { name } = useSelfIdentity();
  const [createOpen, setCreateOpen] = React.useState(false);
  const [createWorkspaceOpen, setCreateWorkspaceOpen] = React.useState(false);
  const projectsQuery = useProjectsQuery(workspaceId);
  const stats = useHomeStats(workspaceId, userId);

  const now = new Date();
  const firstName = name?.split(/\s+/)[0];
  const title = firstName ? `${greetingFor(now)}, ${firstName}` : greetingFor(now);
  const statsReady = !stats.open.isPending && !stats.overdue.isPending && !stats.dueSoon.isPending;
  const description = statsReady
    ? `${todayLabel(now)} · ${nudge(
        readCount(stats.open.data),
        readCount(stats.overdue.data),
        readCount(stats.dueSoon.data)
      )}`
    : todayLabel(now);

  if (!workspaceLoading && !workspace) {
    return (
      <div className="space-y-8">
        <PageHeader title={title} description={todayLabel(now)} />
        <EmptyState
          icon={<Building2 className="size-6" />}
          title="Vamos começar criando um workspace"
          description="O workspace é o espaço da sua equipe: lá ficam os projetos, as tarefas e as pessoas."
          action={
            <Button onClick={() => setCreateWorkspaceOpen(true)}>
              <Plus /> Criar workspace
            </Button>
          }
        />
        <CreateWorkspaceDialog open={createWorkspaceOpen} onOpenChange={setCreateWorkspaceOpen} />
      </div>
    );
  }

  const projects = projectsQuery.data?.data ?? [];

  return (
    <div className="space-y-8">
      <PageHeader
        title={title}
        description={description}
        actions={
          workspaceId ? (
            <Button onClick={() => setCreateOpen(true)}>
              <Plus /> Novo projeto
            </Button>
          ) : null
        }
      />

      <HomeStatTiles
        progress={stats.progress}
        open={stats.open}
        overdue={stats.overdue}
        dueSoon={stats.dueSoon}
      />

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <PendingApprovalsCard />
          <HomeTasksByProject
            openByProject={stats.openByProject}
            overdueByProject={stats.overdueByProject}
            projects={projects}
          />
        </div>
        <div className="space-y-6">
          <HomeRecentProjects
            projects={projects}
            isLoading={workspaceLoading || projectsQuery.isLoading}
          />
          <Card>
            <CardHeader>
              <CardTitle>Atalhos</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-1">
              <ShortcutLink href="/templates" icon={<LayoutTemplate />}>
                Começar de um modelo
              </ShortcutLink>
              <ShortcutLink href="/assistant" icon={<Bot />}>
                Pedir ajuda ao assistente
              </ShortcutLink>
              <ShortcutLink href="/tutorial" icon={<BookOpen />}>
                Aprender a usar o TaskFlow
              </ShortcutLink>
            </CardContent>
          </Card>
        </div>
      </div>

      {workspaceId ? (
        <CreateProjectDialog workspaceId={workspaceId} open={createOpen} onOpenChange={setCreateOpen} />
      ) : null}
    </div>
  );
}

function ShortcutLink({
  href,
  icon,
  children,
}: {
  href: string;
  icon: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      className="-mx-2 flex items-center gap-3 rounded-lg px-2 py-2 text-sm font-medium transition-colors hover:bg-muted/60 [&_svg]:size-4 [&_svg]:text-primary"
    >
      {icon}
      {children}
    </Link>
  );
}
