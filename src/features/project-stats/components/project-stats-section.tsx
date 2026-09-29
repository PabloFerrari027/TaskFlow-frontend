"use client";

import Link from "next/link";
import type { UseQueryResult } from "@tanstack/react-query";
import { BarChart3, FolderTree } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/shared/empty-state";
import { ErrorState } from "@/components/shared/error-state";
import { useAutomationLookups } from "@/features/automations/hooks/use-automation-lookups";
import type { ValueLabeler } from "@/features/automations/lib/automation-draft";
import { ChartRenderer } from "@/features/dashboard-pages/components/renderers/chart-renderer";
import { useProjectStats } from "@/features/project-stats/hooks/use-project-stats";
import {
  CREATED_OVER_TIME_WEEKS,
  pickMetric,
} from "@/features/project-stats/lib/project-stats-queries";
import { useProjectQuery } from "@/features/projects/hooks/use-projects";
import { getErrorCode } from "@/lib/errors";
import type { AnalyticsResult } from "@/types/analytics";
import type { DashboardChartType } from "@/types/dashboard-page";

/**
 * The project's Estatísticas tab: a row of headline numbers, then the charts.
 * Drawing is `ChartRenderer`'s job (palette, status/priority order, labels,
 * "Outros") — the same one dashboard pages use — so nothing is formatted here.
 */
export function ProjectStatsSection({ projectId }: { projectId: string }) {
  // Already loaded by the project layout, which only renders its tabs after it.
  const projectQuery = useProjectQuery(projectId);
  const workspaceId = projectQuery.data?.workspaceId;
  if (!workspaceId) return null;

  return <ProjectStatsContent projectId={projectId} workspaceId={workspaceId} />;
}

function ProjectStatsContent({ projectId, workspaceId }: { projectId: string; workspaceId: string }) {
  const stats = useProjectStats(projectId, workspaceId);
  const lookups = useAutomationLookups(workspaceId);

  const total = stats.summary.data ? pickMetric(stats.summary.data, "count") : null;
  const totalValue = Number(total?.data[0]?.[total.metrics[0].alias] ?? 0);

  if (stats.summary.isSuccess && totalValue === 0) {
    return (
      <EmptyState
        icon={<BarChart3 className="size-5" />}
        title="Ainda não há números para mostrar"
        description="As estatísticas aparecem assim que o projeto (ou um sub-projeto dele) tiver a primeira tarefa."
        action={
          <Button asChild>
            <Link href={`/projects/${projectId}/tasks`}>Ir para Tarefas</Link>
          </Button>
        }
      />
    );
  }

  const fromSummary = (key: string) => (result: AnalyticsResult) => pickMetric(result, key);

  return (
    <div className="space-y-6">
      <p className="flex items-center gap-2 text-sm text-muted-foreground">
        <FolderTree className="size-4 shrink-0" aria-hidden />
        Inclui os sub-projetos: as tarefas deles entram em todos os números abaixo.
      </p>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <NumberCard
          label="Total de tarefas"
          hint="Todas as tarefas, concluídas ou não."
          query={stats.summary}
          select={fromSummary("count")}
        />
        <NumberCard
          label="Tarefas em aberto"
          hint="As que ainda não foram concluídas."
          query={stats.open}
        />
        <NumberCard
          label="Taxa de conclusão"
          hint="Quanto do total já foi concluído."
          query={stats.summary}
          select={fromSummary("completion_rate")}
        />
        <NumberCard
          label="Taxa de atraso"
          hint="Considera só tarefas com prazo: quantas passaram do prazo sem ser concluídas."
          query={stats.summary}
          select={fromSummary("overdue_rate")}
        />
        <NumberCard
          label="Tempo médio de conclusão"
          hint="Da criação até a conclusão. Só conta tarefas concluídas depois que o TaskFlow passou a guardar a data de conclusão."
          query={stats.summary}
          select={fromSummary("average_completion_time")}
        />
        <NumberCard
          label="Urgentes em aberto"
          hint="Tarefas com prioridade Urgente que ainda não foram concluídas."
          query={stats.urgentOpen}
        />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <ChartCard
          title="Tarefas por status"
          description="Como as tarefas se dividem entre a fazer, em progresso e concluídas."
          chartType="PIE"
          query={stats.byStatus}
          lookups={lookups}
        />
        <ChartCard
          title="Tarefas por prioridade"
          description="Quantas tarefas há em cada nível de prioridade."
          chartType="BAR"
          query={stats.byPriority}
          lookups={lookups}
        />
        <ChartCard
          title="Tarefas criadas ao longo do tempo"
          description={`Quantas tarefas foram criadas em cada semana, nas últimas ${CREATED_OVER_TIME_WEEKS} semanas.`}
          chartType="LINE"
          query={stats.createdOverTime}
          lookups={lookups}
        />
        <ChartCard
          title="Tarefas por responsável"
          description="Quantas tarefas estão com cada pessoa, concluídas ou não."
          chartType="BAR"
          query={stats.byAssignee}
          lookups={lookups}
        />
      </div>
    </div>
  );
}

// 403 means the viewer lost access to the workspace; the generic "ação"
// wording of that code reads oddly on a page that only shows numbers.
function errorTitle(error: unknown, what: "este número" | "este gráfico") {
  return getErrorCode(error) === "FORBIDDEN_WORKSPACE_ACTION"
    ? "Você não tem acesso a estes dados"
    : `Não foi possível carregar ${what}`;
}

function NumberCard({
  label,
  hint,
  query,
  select,
}: {
  label: string;
  hint: string;
  query: UseQueryResult<AnalyticsResult>;
  select?: (result: AnalyticsResult) => AnalyticsResult | null;
}) {
  if (query.isPending) return <Skeleton className="h-36 rounded-xl" />;

  if (query.isError) {
    return (
      <ErrorState
        className="py-6"
        title={errorTitle(query.error, "este número")}
        error={query.error}
        onRetry={() => query.refetch()}
      />
    );
  }

  const result = select ? select(query.data) : query.data;

  return (
    <Card size="sm" className="min-h-36 justify-between px-4">
      {result ? (
        <ChartRenderer chartType="NUMBER" result={result} label={label} />
      ) : (
        <p className="text-sm text-muted-foreground">Sem dados</p>
      )}
      <p className="text-xs text-muted-foreground">{hint}</p>
    </Card>
  );
}

function ChartCard({
  title,
  description,
  chartType,
  query,
  lookups,
}: {
  title: string;
  description: string;
  chartType: DashboardChartType;
  query: UseQueryResult<AnalyticsResult>;
  lookups: ValueLabeler;
}) {
  return (
    <Card size="sm" className="gap-3 px-4">
      <div>
        <h3 className="text-sm font-medium text-foreground">{title}</h3>
        <p className="text-xs text-muted-foreground">{description}</p>
      </div>
      {query.isPending ? (
        <Skeleton className="h-64 w-full" />
      ) : query.isError ? (
        <ErrorState
          className="py-8"
          title={errorTitle(query.error, "este gráfico")}
          error={query.error}
          onRetry={() => query.refetch()}
        />
      ) : (
        <div className="h-64">
          <ChartRenderer chartType={chartType} result={query.data} lookups={lookups} />
        </div>
      )}
    </Card>
  );
}
