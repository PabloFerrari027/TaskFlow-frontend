"use client";

import * as React from "react";
import { CheckCircle2, FolderKanban, ListChecks } from "lucide-react";
import { Card } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ErrorState } from "@/components/shared/error-state";
import { PROJECT_STATUS_LABEL, TASK_STATUS_LABEL } from "@/components/shared/status-badge";
import { shortenId } from "@/lib/format";
import { useAuth } from "@/lib/auth/auth-context";
import { useProjectsQuery } from "@/features/projects/hooks/use-projects";
import {
  useAverageCompletionTimeByProjectQuery,
  useCompletedTaskCountQuery,
  useCompletionRateByProjectQuery,
  useOverdueRateByProjectQuery,
  useOverdueTasksByProjectQuery,
  useProjectsByStatusQuery,
  useTotalTasksCountQuery,
  useTasksByAssigneeQuery,
  useTasksByProjectQuery,
  useTasksByStatusQuery,
} from "@/features/analytics/hooks/use-analytics";
import { StatCard } from "@/features/analytics/components/stat-card";
import {
  CategoryBarChart,
  type CategoryBarChartRow,
} from "@/features/analytics/components/category-bar-chart";
import type { ProjectStatus } from "@/types/project";
import type { TaskStatus } from "@/types/task";

const ALL_PROJECTS = "__all__";

const TASK_STATUS_ORDER: TaskStatus[] = ["TODO", "IN_PROGRESS", "DONE"];
const PROJECT_STATUS_ORDER: ProjectStatus[] = ["ACTIVE", "ARCHIVED"];

// Flat colors (no light/dark split needed, unlike the categorical palette
// below) — mid-lightness hues that already read fine on both card surfaces,
// matching the hues the badges use for the same statuses.
const TASK_STATUS_COLOR: Record<TaskStatus, string> = {
  TODO: "#94a3b8",
  IN_PROGRESS: "#f59e0b",
  DONE: "#10b981",
};

const PROJECT_STATUS_COLOR: Record<ProjectStatus, string> = {
  ACTIVE: "#10b981",
  ARCHIVED: "#94a3b8",
};

const MAX_CATEGORY_SLICES = 6;

const percentFormatter = new Intl.NumberFormat("pt-BR", { style: "percent", maximumFractionDigits: 0 });
const formatPercent = (value: number) => percentFormatter.format(value);
const formatHours = (value: number) =>
  `${value.toLocaleString("pt-BR", { maximumFractionDigits: 1 })}h`;

/**
 * Shared by the 3 derived-metric charts (completion rate, overdue rate,
 * average completion time): unlike `rankAndFold`, these values aren't counts
 * — a rate or an average in hours can't be summed into a meaningful "Outros"
 * bucket, so this just ranks and caps, with no long-tail folding. Projects
 * with no eligible data (`value: null` — e.g. no tasks with a due date yet)
 * are dropped rather than shown as a misleading zero.
 */
function rankOnly(entries: { key: string; label: string; value: number | null }[]): CategoryBarChartRow[] {
  return entries
    .filter((entry): entry is { key: string; label: string; value: number } => entry.value !== null)
    .sort((a, b) => b.value - a.value)
    .slice(0, MAX_CATEGORY_SLICES)
    .map((entry, index) => ({
      key: entry.key,
      label: entry.label,
      value: entry.value,
      color: `var(--analytics-cat-${index + 1})`,
    }));
}

/**
 * Shared by every "compare N open-ended categories" chart (projects,
 * assignees): ranks by count, keeps the top slice, and folds the long tail
 * into a single "Outros" bar so the chart never grows past a glance-able
 * size no matter how many projects/people exist.
 */
function rankAndFold(
  entries: { key: string; label: string; count: number }[],
  otherLabel: string
): CategoryBarChartRow[] {
  const sorted = entries.filter((e) => e.count > 0).sort((a, b) => b.count - a.count);
  const top = sorted.slice(0, MAX_CATEGORY_SLICES);
  const restTotal = sorted
    .slice(MAX_CATEGORY_SLICES)
    .reduce((sum, entry) => sum + entry.count, 0);

  const rows: CategoryBarChartRow[] = top.map((entry, index) => ({
    key: entry.key,
    label: entry.label,
    value: entry.count,
    color: `var(--analytics-cat-${index + 1})`,
  }));

  if (restTotal > 0) {
    rows.push({ key: "__others__", label: otherLabel, value: restTotal, color: "var(--muted-foreground)" });
  }

  return rows;
}

export function AnalyticsDashboard({ workspaceId }: { workspaceId: string }) {
  const { userId: currentUserId } = useAuth();
  const [projectId, setProjectId] = React.useState<string | undefined>(undefined);

  const projectsQuery = useProjectsQuery(workspaceId);
  const projects = projectsQuery.data?.data ?? [];
  const activeProjectsCount = projects.filter((p) => p.status === "ACTIVE").length;
  const projectNameById = new Map(projects.map((p) => [p.id, p.name]));

  const taskCount = useTotalTasksCountQuery(workspaceId, projectId);
  const completedCount = useCompletedTaskCountQuery(workspaceId, projectId);
  const byStatus = useTasksByStatusQuery(workspaceId, projectId);
  const byAssignee = useTasksByAssigneeQuery(workspaceId, projectId);
  const byProject = useTasksByProjectQuery(workspaceId);
  const byProjectStatus = useProjectsByStatusQuery(workspaceId);
  const overdueByProject = useOverdueTasksByProjectQuery(workspaceId);
  const completionRateByProject = useCompletionRateByProjectQuery(workspaceId);
  const overdueRateByProject = useOverdueRateByProjectQuery(workspaceId);
  const avgCompletionTimeByProject = useAverageCompletionTimeByProjectQuery(workspaceId);

  const statusRows: CategoryBarChartRow[] = TASK_STATUS_ORDER.map((status) => ({
    key: status,
    label: TASK_STATUS_LABEL[status],
    value: byStatus.rows.find((row) => row.status === status)?.count ?? 0,
    color: TASK_STATUS_COLOR[status],
  }));

  const projectRows = rankAndFold(
    byProject.rows.map((row) => ({
      key: row.projectId,
      label: projectNameById.get(row.projectId) ?? "Projeto removido",
      count: row.count,
    })),
    "Outros projetos"
  );

  const assigneeRows = rankAndFold(
    byAssignee.rows
      .filter((row) => row.assigneeId)
      .map((row) => ({
        key: row.assigneeId as string,
        label:
          row.assigneeId === currentUserId
            ? "Você"
            : `Usuário ${shortenId(row.assigneeId as string)}…`,
        count: row.count,
      })),
    "Outras pessoas"
  );
  const unassignedCount = byAssignee.rows.find((row) => !row.assigneeId)?.count ?? 0;
  if (unassignedCount > 0) {
    assigneeRows.push({
      key: "__unassigned__",
      label: "Sem responsável",
      value: unassignedCount,
      color: "var(--muted-foreground)",
    });
  }

  const projectStatusRows: CategoryBarChartRow[] = PROJECT_STATUS_ORDER.map((status) => ({
    key: status,
    label: PROJECT_STATUS_LABEL[status],
    value: byProjectStatus.rows.find((row) => row.status === status)?.count ?? 0,
    color: PROJECT_STATUS_COLOR[status],
  }));

  const overdueProjectRows = rankAndFold(
    overdueByProject.rows.map((row) => ({
      key: row.projectId,
      label: projectNameById.get(row.projectId) ?? "Projeto removido",
      count: row.count,
    })),
    "Outros projetos"
  );

  const completionRateRows = rankOnly(
    completionRateByProject.rows.map((row) => ({
      key: row.projectId,
      label: projectNameById.get(row.projectId) ?? "Projeto removido",
      value: row.value,
    }))
  );

  const overdueRateRows = rankOnly(
    overdueRateByProject.rows.map((row) => ({
      key: row.projectId,
      label: projectNameById.get(row.projectId) ?? "Projeto removido",
      value: row.value,
    }))
  );

  const avgCompletionTimeRows = rankOnly(
    avgCompletionTimeByProject.rows.map((row) => ({
      key: row.projectId,
      label: projectNameById.get(row.projectId) ?? "Projeto removido",
      value: row.hours,
    }))
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-sm text-muted-foreground">Mostrando dados de:</span>
        <Select
          value={projectId ?? ALL_PROJECTS}
          onValueChange={(next) => setProjectId(next === ALL_PROJECTS ? undefined : next)}
        >
          <SelectTrigger className="w-56">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={ALL_PROJECTS}>Todos os projetos</SelectItem>
            {projects.map((project) => (
              <SelectItem key={project.id} value={project.id}>
                {project.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard
          label="Tarefas no total"
          value={taskCount.count}
          icon={ListChecks}
          isLoading={taskCount.isLoading}
        />
        <StatCard
          label="Tarefas concluídas"
          value={completedCount.count}
          icon={CheckCircle2}
          isLoading={completedCount.isLoading}
        />
        <StatCard
          label="Projetos ativos"
          value={activeProjectsCount}
          icon={FolderKanban}
          isLoading={projectsQuery.isLoading}
        />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card className="space-y-3 p-5">
          <div>
            <h2 className="text-sm font-medium text-foreground">Tarefas por status</h2>
            <p className="text-xs text-muted-foreground">
              {projectId
                ? "Somente do projeto selecionado."
                : "Em todos os projetos deste workspace."}
            </p>
          </div>
          {byStatus.isError ? (
            <ErrorState error={byStatus.error} onRetry={() => byStatus.refetch()} />
          ) : (
            <CategoryBarChart
              rows={statusRows}
              isLoading={byStatus.isLoading}
              emptyTitle="Nenhuma tarefa criada ainda"
            />
          )}
        </Card>

        <Card className="space-y-3 p-5">
          <div>
            <h2 className="text-sm font-medium text-foreground">Tarefas por responsável</h2>
            <p className="text-xs text-muted-foreground">
              {projectId
                ? "Somente do projeto selecionado."
                : "Em todos os projetos deste workspace."}
            </p>
          </div>
          {byAssignee.isError ? (
            <ErrorState error={byAssignee.error} onRetry={() => byAssignee.refetch()} />
          ) : (
            <CategoryBarChart
              rows={assigneeRows}
              isLoading={byAssignee.isLoading}
              emptyTitle="Nenhuma tarefa criada ainda"
            />
          )}
        </Card>

        <Card className="space-y-3 p-5">
          <div>
            <h2 className="text-sm font-medium text-foreground">Tarefas por projeto</h2>
            <p className="text-xs text-muted-foreground">
              Compara os projetos deste workspace entre si.
            </p>
          </div>
          {byProject.isError ? (
            <ErrorState error={byProject.error} onRetry={() => byProject.refetch()} />
          ) : (
            <CategoryBarChart
              rows={projectRows}
              isLoading={byProject.isLoading || projectsQuery.isLoading}
              emptyTitle="Nenhum projeto com tarefas ainda"
            />
          )}
        </Card>

        <Card className="space-y-3 p-5">
          <div>
            <h2 className="text-sm font-medium text-foreground">Projetos por status</h2>
            <p className="text-xs text-muted-foreground">
              Ativos vs. arquivados neste workspace.
            </p>
          </div>
          {byProjectStatus.isError ? (
            <ErrorState error={byProjectStatus.error} onRetry={() => byProjectStatus.refetch()} />
          ) : (
            <CategoryBarChart
              rows={projectStatusRows}
              isLoading={byProjectStatus.isLoading}
              emptyTitle="Nenhum projeto criado ainda"
            />
          )}
        </Card>

        <Card className="space-y-3 p-5">
          <div>
            <h2 className="text-sm font-medium text-foreground">Tarefas atrasadas por projeto</h2>
            <p className="text-xs text-muted-foreground">
              Com prazo vencido, em todos os projetos deste workspace.
            </p>
          </div>
          {overdueByProject.isError ? (
            <ErrorState
              error={overdueByProject.error}
              onRetry={() => overdueByProject.refetch()}
            />
          ) : (
            <CategoryBarChart
              rows={overdueProjectRows}
              isLoading={overdueByProject.isLoading || projectsQuery.isLoading}
              emptyTitle="Nenhuma tarefa atrasada"
            />
          )}
        </Card>

        <Card className="space-y-3 p-5">
          <div>
            <h2 className="text-sm font-medium text-foreground">Taxa de conclusão por projeto</h2>
            <p className="text-xs text-muted-foreground">
              Tarefas concluídas sobre o total, em todos os projetos deste workspace.
            </p>
          </div>
          {completionRateByProject.isError ? (
            <ErrorState
              error={completionRateByProject.error}
              onRetry={() => completionRateByProject.refetch()}
            />
          ) : (
            <CategoryBarChart
              rows={completionRateRows}
              isLoading={completionRateByProject.isLoading || projectsQuery.isLoading}
              emptyTitle="Nenhuma tarefa criada ainda"
              valueFormatter={formatPercent}
            />
          )}
        </Card>

        <Card className="space-y-3 p-5">
          <div>
            <h2 className="text-sm font-medium text-foreground">Taxa de atraso por projeto</h2>
            <p className="text-xs text-muted-foreground">
              Entre as tarefas com prazo definido, em todos os projetos deste workspace.
            </p>
          </div>
          {overdueRateByProject.isError ? (
            <ErrorState
              error={overdueRateByProject.error}
              onRetry={() => overdueRateByProject.refetch()}
            />
          ) : (
            <CategoryBarChart
              rows={overdueRateRows}
              isLoading={overdueRateByProject.isLoading || projectsQuery.isLoading}
              emptyTitle="Nenhuma tarefa com prazo definido"
              valueFormatter={formatPercent}
            />
          )}
        </Card>

        <Card className="space-y-3 p-5">
          <div>
            <h2 className="text-sm font-medium text-foreground">Tempo médio de conclusão por projeto</h2>
            <p className="text-xs text-muted-foreground">
              Da criação até a conclusão, em horas, em todos os projetos deste workspace.
            </p>
          </div>
          {avgCompletionTimeByProject.isError ? (
            <ErrorState
              error={avgCompletionTimeByProject.error}
              onRetry={() => avgCompletionTimeByProject.refetch()}
            />
          ) : (
            <CategoryBarChart
              rows={avgCompletionTimeRows}
              isLoading={avgCompletionTimeByProject.isLoading || projectsQuery.isLoading}
              emptyTitle="Nenhuma tarefa concluída ainda"
              valueFormatter={formatHours}
            />
          )}
        </Card>
      </div>
    </div>
  );
}
