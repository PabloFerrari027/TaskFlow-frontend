"use client";

import * as React from "react";
import { Timer } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardAction, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ErrorState } from "@/components/shared/error-state";
import { MemberAvatar } from "@/components/shared/member-avatar";
import { formatMinutes } from "@/lib/format";
import { useTaskPanel } from "@/features/tasks/hooks/use-task-panel";
import { useMemberName } from "@/features/tasks/components/task-assignees-field";
import { useProjectTimeReportQuery } from "@/features/time-tracking/hooks/use-time-tracking";
import type { TimeReportGroupBy } from "@/types/time-tracking";

const PERIODS = [
  { value: "7", label: "Últimos 7 dias" },
  { value: "30", label: "Últimos 30 dias" },
  { value: "90", label: "Últimos 90 dias" },
  { value: "all", label: "Desde o início" },
];

function periodStart(period: string) {
  if (period === "all") return undefined;
  const start = new Date();
  start.setHours(0, 0, 0, 0);
  start.setDate(start.getDate() - Number(period) + 1);
  return start.toISOString();
}

/** Where the time went: per person or per task, in a period. Not for guests (API refuses). */
export function ProjectTimeReport({ projectId }: { projectId: string }) {
  const [groupBy, setGroupBy] = React.useState<TimeReportGroupBy>("user");
  const [period, setPeriod] = React.useState("30");
  // Recomputed only when the period changes, so the query key stays stable.
  const from = React.useMemo(() => periodStart(period), [period]);
  const reportQuery = useProjectTimeReportQuery(projectId, groupBy, from);
  const memberName = useMemberName(projectId);
  const { openTask } = useTaskPanel();
  const report = reportQuery.data;
  const max = Math.max(1, ...(report?.rows.map((row) => row.totalSeconds) ?? []));

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Timer className="size-4" aria-hidden /> Tempo registrado
        </CardTitle>
        <CardDescription>
          Quanto tempo foi registrado nas tarefas deste projeto, pelo cronômetro ou à mão.
        </CardDescription>
        <CardAction className="flex flex-wrap gap-2">
          <div role="group" aria-label="Agrupar por" className="flex gap-0.5 rounded-md border border-border/60 p-0.5">
            {(
              [
                ["user", "Por pessoa"],
                ["task", "Por tarefa"],
              ] as const
            ).map(([value, label]) => (
              <Button
                key={value}
                size="sm"
                variant={groupBy === value ? "secondary" : "ghost"}
                aria-pressed={groupBy === value}
                onClick={() => setGroupBy(value)}
              >
                {label}
              </Button>
            ))}
          </div>
          <Select value={period} onValueChange={setPeriod}>
            <SelectTrigger size="sm" className="w-40" aria-label="Período">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {PERIODS.map((p) => (
                <SelectItem key={p.value} value={p.value}>
                  {p.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </CardAction>
      </CardHeader>
      <CardContent>
        {reportQuery.isLoading ? (
          <Skeleton className="h-32 w-full" />
        ) : reportQuery.isError || !report ? (
          <ErrorState error={reportQuery.error} onRetry={() => reportQuery.refetch()} />
        ) : report.rows.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            Nenhum tempo registrado nesse período. Use “Iniciar cronômetro” dentro de uma tarefa.
          </p>
        ) : (
          <div className={reportQuery.isPlaceholderData ? "space-y-3 opacity-60" : "space-y-3"}>
            <p className="text-sm">
              Total: <span className="font-semibold">{formatMinutes(report.totalSeconds / 60)}</span>
            </p>
            <ul className="space-y-2">
              {report.rows.map((row) => (
                <li key={row.key} className="space-y-1">
                  <div className="flex items-center gap-2 text-sm">
                    {groupBy === "user" ? (
                      <>
                        <MemberAvatar userId={row.key} className="size-6" />
                        <span className="min-w-0 flex-1 truncate">{memberName(row.key)}</span>
                      </>
                    ) : (
                      <button
                        type="button"
                        onClick={() => openTask(row.key)}
                        className="min-w-0 flex-1 truncate text-left hover:underline"
                      >
                        {row.label}
                      </button>
                    )}
                    <span className="font-medium tabular-nums">{formatMinutes(row.totalSeconds / 60)}</span>
                    {row.estimateMinutes ? (
                      <span className="text-xs text-muted-foreground">
                        / {formatMinutes(row.estimateMinutes)}
                      </span>
                    ) : null}
                  </div>
                  <div className="h-1.5 overflow-hidden rounded-full bg-muted" aria-hidden>
                    <div className="h-full bg-primary" style={{ width: `${(row.totalSeconds / max) * 100}%` }} />
                  </div>
                </li>
              ))}
            </ul>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
