"use client";

import * as React from "react";
import { CalendarRange, Diamond } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/shared/empty-state";
import { ErrorState } from "@/components/shared/error-state";
import { cn } from "@/lib/utils";
import { useTaskPanel } from "@/features/tasks/hooks/use-task-panel";
import { useProjectTimelineQuery } from "@/features/tasks/hooks/use-task-dependencies";
import type { TimelineTask } from "@/types/task";

const DAY_MS = 86_400_000;
const ROW_HEIGHT = 36;
const HEADER_HEIGHT = 44;
const NAME_WIDTH = 220;

const ZOOMS = [
  { key: "days", label: "Dias", dayWidth: 32 },
  { key: "weeks", label: "Semanas", dayWidth: 14 },
  { key: "months", label: "Meses", dayWidth: 5 },
] as const;

type ZoomKey = (typeof ZOOMS)[number]["key"];

const MONTHS = ["jan", "fev", "mar", "abr", "mai", "jun", "jul", "ago", "set", "out", "nov", "dez"];

// Dates are saved as UTC midnight of the chosen day (`fromDateInputValue`),
// so the timeline counts whole UTC days — the bar lands on the day picked.
function utcDay(iso: string) {
  return Math.floor(Date.parse(iso) / DAY_MS);
}

function todayDay() {
  const now = new Date();
  return Math.floor(Date.UTC(now.getFullYear(), now.getMonth(), now.getDate()) / DAY_MS);
}

function dayToDate(day: number) {
  return new Date(day * DAY_MS);
}

interface Row {
  task: TimelineTask;
  start: number;
  end: number;
}

function barClass(task: TimelineTask, end: number, today: number) {
  if (task.status === "DONE") return "bg-emerald-500/80";
  if (end < today) return "bg-destructive/80";
  if (task.status === "IN_PROGRESS") return "bg-amber-500/80";
  return "bg-primary/70";
}

export function ProjectTimeline({ projectId }: { projectId: string }) {
  const timelineQuery = useProjectTimelineQuery(projectId);
  const { openTask } = useTaskPanel();
  const [zoom, setZoom] = React.useState<ZoomKey>("weeks");
  const dayWidth = ZOOMS.find((z) => z.key === zoom)!.dayWidth;
  const today = todayDay();

  const { rows, undated, first, last } = React.useMemo(() => {
    const data = timelineQuery.data;
    if (!data) return { rows: [] as Row[], undated: 0, first: today, last: today };
    const dated: Row[] = [];
    let undatedCount = 0;
    for (const task of data.tasks) {
      const startIso = task.startDate ?? task.dueDate;
      const endIso = task.dueDate ?? task.startDate;
      if (!startIso || !endIso) {
        undatedCount += 1;
        continue;
      }
      const start = utcDay(startIso);
      dated.push({ task, start, end: Math.max(start, utcDay(endIso)) });
    }
    dated.sort((a, b) => a.start - b.start || a.end - b.end);
    const minDay = Math.min(today, ...dated.map((r) => r.start)) - 3;
    const maxDay = Math.max(today, ...dated.map((r) => r.end)) + 7;
    return { rows: dated, undated: undatedCount, first: minDay, last: maxDay };
  }, [timelineQuery.data, today]);

  if (timelineQuery.isLoading) return <Skeleton className="h-80 w-full" />;
  if (timelineQuery.isError || !timelineQuery.data) {
    return <ErrorState error={timelineQuery.error} onRetry={() => timelineQuery.refetch()} />;
  }

  if (rows.length === 0) {
    return (
      <EmptyState
        icon={<CalendarRange className="size-6" />}
        title="Nenhuma tarefa com datas ainda"
        description="Dê um prazo (e, se quiser, uma data de início) às tarefas para vê-las aqui numa linha do tempo."
      />
    );
  }

  const totalDays = last - first + 1;
  const width = totalDays * dayWidth;
  const height = rows.length * ROW_HEIGHT;
  const x = (day: number) => (day - first) * dayWidth;
  const rowIndex = new Map(rows.map((row, index) => [row.task.id, index]));

  // Month labels across the top, plus day numbers when there's room.
  const months: { day: number; label: string }[] = [];
  for (let day = first; day <= last; day++) {
    const date = dayToDate(day);
    if (day === first || date.getUTCDate() === 1) {
      months.push({ day, label: `${MONTHS[date.getUTCMonth()]} ${date.getUTCFullYear()}` });
    }
  }

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-sm text-muted-foreground">
          Cada barra vai do início ao prazo da tarefa; as setas mostram o que precisa terminar antes.
          {undated > 0
            ? ` ${undated === 1 ? "1 tarefa sem datas não aparece" : `${undated} tarefas sem datas não aparecem`} aqui.`
            : ""}
        </p>
        <div role="group" aria-label="Zoom" className="flex gap-0.5 rounded-md border border-border/60 p-0.5">
          {ZOOMS.map((option) => (
            <Button
              key={option.key}
              size="sm"
              variant={zoom === option.key ? "secondary" : "ghost"}
              aria-pressed={zoom === option.key}
              onClick={() => setZoom(option.key)}
            >
              {option.label}
            </Button>
          ))}
        </div>
      </div>

      <Card className="overflow-hidden p-0">
        <div className="flex">
          {/* Task names, fixed while the chart scrolls sideways. */}
          <div className="shrink-0 border-r border-border/60" style={{ width: NAME_WIDTH }}>
            <div className="border-b border-border/60" style={{ height: HEADER_HEIGHT }} />
            {rows.map(({ task }) => (
              <button
                key={task.id}
                type="button"
                onClick={() => openTask(task.id)}
                className="flex w-full items-center gap-1.5 truncate px-3 text-left text-sm hover:bg-muted"
                style={{ height: ROW_HEIGHT }}
                title={task.title}
              >
                {task.isMilestone ? <Diamond className="size-3 shrink-0 text-violet-500" /> : null}
                <span className={cn("truncate", task.status === "DONE" && "text-muted-foreground line-through")}>
                  {task.title}
                </span>
              </button>
            ))}
          </div>

          <div className="min-w-0 flex-1 overflow-x-auto">
            <div className="relative" style={{ width, height: HEADER_HEIGHT + height }}>
              {/* Header */}
              <div className="absolute inset-x-0 top-0 border-b border-border/60" style={{ height: HEADER_HEIGHT }}>
                {months.map((month) => (
                  <span
                    key={month.day}
                    className="absolute top-1 border-l border-border/60 pl-1 text-[11px] font-medium text-muted-foreground"
                    style={{ left: x(month.day) }}
                  >
                    {month.label}
                  </span>
                ))}
                {dayWidth >= 14
                  ? Array.from({ length: totalDays }, (_, i) => first + i).map((day) => (
                      <span
                        key={day}
                        className={cn(
                          "absolute bottom-1 text-center text-[10px] text-muted-foreground",
                          day === today && "font-semibold text-primary"
                        )}
                        style={{ left: x(day), width: dayWidth }}
                      >
                        {dayToDate(day).getUTCDate()}
                      </span>
                    ))
                  : null}
              </div>

              {/* Weekend shading (days zoom) and the "today" line */}
              <div className="absolute inset-x-0" style={{ top: HEADER_HEIGHT, height }}>
                {dayWidth >= 14
                  ? Array.from({ length: totalDays }, (_, i) => first + i)
                      .filter((day) => [0, 6].includes(dayToDate(day).getUTCDay()))
                      .map((day) => (
                        <div
                          key={day}
                          className="absolute inset-y-0 bg-muted/50"
                          style={{ left: x(day), width: dayWidth }}
                        />
                      ))
                  : null}
                <div
                  className="absolute inset-y-0 w-px bg-primary"
                  style={{ left: x(today) + dayWidth / 2 }}
                  title="Hoje"
                />
              </div>

              {/* Dependency arrows: from the end of the blocker to the start of the blocked task. */}
              <svg
                className="pointer-events-none absolute left-0"
                style={{ top: HEADER_HEIGHT }}
                width={width}
                height={height}
                aria-hidden
              >
                <defs>
                  <marker id="timeline-arrow" viewBox="0 0 8 8" refX="7" refY="4" markerWidth="6" markerHeight="6" orient="auto">
                    <path d="M0,0 L8,4 L0,8 z" className="fill-muted-foreground" />
                  </marker>
                </defs>
                {timelineQuery.data.dependencies.map((edge) => {
                  const from = rowIndex.get(edge.blockerTaskId);
                  const to = rowIndex.get(edge.blockedTaskId);
                  if (from === undefined || to === undefined) return null;
                  const x1 = x(rows[from].end + 1);
                  const y1 = from * ROW_HEIGHT + ROW_HEIGHT / 2;
                  const x2 = x(rows[to].start);
                  const y2 = to * ROW_HEIGHT + ROW_HEIGHT / 2;
                  const elbow = Math.max(x1 + 8, Math.min(x2 - 8, x1 + 16));
                  return (
                    <path
                      key={edge.id}
                      d={`M${x1},${y1} H${elbow} V${y2} H${x2}`}
                      fill="none"
                      strokeWidth={1.25}
                      className="stroke-muted-foreground"
                      markerEnd="url(#timeline-arrow)"
                    />
                  );
                })}
              </svg>

              {/* Bars */}
              {rows.map(({ task, start, end }, index) => {
                const top = HEADER_HEIGHT + index * ROW_HEIGHT;
                if (task.isMilestone) {
                  return (
                    <button
                      key={task.id}
                      type="button"
                      onClick={() => openTask(task.id)}
                      title={task.title}
                      aria-label={`Marco: ${task.title}`}
                      className={cn(
                        "absolute size-3.5 rotate-45 rounded-[2px]",
                        task.status === "DONE" ? "bg-emerald-500" : "bg-violet-500"
                      )}
                      style={{ left: x(end) + dayWidth / 2 - 7, top: top + ROW_HEIGHT / 2 - 7 }}
                    />
                  );
                }
                return (
                  <button
                    key={task.id}
                    type="button"
                    onClick={() => openTask(task.id)}
                    title={task.title}
                    aria-label={task.title}
                    className={cn(
                      "absolute overflow-hidden rounded-md px-1.5 text-left text-[11px] leading-5 text-white shadow-sm hover:brightness-110",
                      barClass(task, end, today)
                    )}
                    style={{
                      left: x(start) + 1,
                      width: Math.max(dayWidth - 2, (end - start + 1) * dayWidth - 2),
                      top: top + 8,
                      height: ROW_HEIGHT - 16,
                    }}
                  >
                    {(end - start + 1) * dayWidth > 60 ? <span className="truncate">{task.title}</span> : null}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </Card>

      <div className="flex flex-wrap gap-4 text-xs text-muted-foreground">
        <span className="flex items-center gap-1.5"><span className="size-2.5 rounded-sm bg-primary/70" /> A fazer</span>
        <span className="flex items-center gap-1.5"><span className="size-2.5 rounded-sm bg-amber-500/80" /> Em andamento</span>
        <span className="flex items-center gap-1.5"><span className="size-2.5 rounded-sm bg-emerald-500/80" /> Concluída</span>
        <span className="flex items-center gap-1.5"><span className="size-2.5 rounded-sm bg-destructive/80" /> Atrasada</span>
        <span className="flex items-center gap-1.5"><span className="size-2.5 rotate-45 rounded-[1px] bg-violet-500" /> Marco</span>
      </div>
    </div>
  );
}
