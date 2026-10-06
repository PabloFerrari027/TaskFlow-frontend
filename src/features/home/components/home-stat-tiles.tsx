"use client";

import * as React from "react";
import { AlertTriangle, CalendarClock, ListTodo, Trophy } from "lucide-react";
import type { UseQueryResult } from "@tanstack/react-query";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { DUE_SOON_DAYS, readCount, readDerived } from "@/features/home/lib/home-queries";
import { formatRatio } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { AnalyticsResult } from "@/types/analytics";

type Tone = "primary" | "danger" | "warning" | "success";

const TONE_CLASS: Record<Tone, string> = {
  primary: "bg-primary/10 text-primary",
  danger: "bg-destructive/10 text-destructive",
  warning: "bg-amber-500/15 text-amber-600 dark:text-amber-400",
  success: "bg-success/15 text-success",
};

function StatTile({
  icon,
  tone,
  label,
  query,
  value,
  hint,
  children,
}: {
  icon: React.ReactNode;
  tone: Tone;
  label: string;
  query: UseQueryResult<AnalyticsResult>;
  value: string;
  hint: string;
  children?: React.ReactNode;
}) {
  return (
    <Card className="gap-3">
      <div className="flex items-center gap-3 px-(--card-spacing)">
        <span
          className={cn(
            "flex size-9 shrink-0 items-center justify-center rounded-lg [&_svg]:size-4.5",
            TONE_CLASS[tone]
          )}
        >
          {icon}
        </span>
        <p className="text-sm font-medium text-muted-foreground">{label}</p>
      </div>
      <div className="px-(--card-spacing)">
        {query.isPending ? (
          <Skeleton className="h-9 w-16" />
        ) : query.isError ? (
          <p className="text-sm text-muted-foreground">Não foi possível carregar.</p>
        ) : (
          <>
            <p className="text-3xl font-bold tracking-tight tabular-nums">{value}</p>
            <p className="mt-1 text-xs text-muted-foreground">{hint}</p>
            {children}
          </>
        )}
      </div>
    </Card>
  );
}

export function HomeStatTiles({
  progress,
  open,
  overdue,
  dueSoon,
}: {
  progress: UseQueryResult<AnalyticsResult>;
  open: UseQueryResult<AnalyticsResult>;
  overdue: UseQueryResult<AnalyticsResult>;
  dueSoon: UseQueryResult<AnalyticsResult>;
}) {
  const openCount = readCount(open.data);
  const overdueCount = readCount(overdue.data);
  const dueSoonCount = readCount(dueSoon.data);
  const total = readCount(progress.data);
  const rate = readDerived(progress.data, "completion_rate");

  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      <StatTile
        icon={<ListTodo />}
        tone="primary"
        label="Com você"
        query={open}
        value={String(openCount)}
        hint={openCount === 1 ? "item em aberto" : "itens em aberto"}
      />
      <StatTile
        icon={<AlertTriangle />}
        tone={overdueCount > 0 ? "danger" : "success"}
        label="Atrasadas"
        query={overdue}
        value={String(overdueCount)}
        hint={overdueCount > 0 ? "passaram do prazo" : "nada atrasado, muito bem!"}
      />
      <StatTile
        icon={<CalendarClock />}
        tone="warning"
        label="Vencem em breve"
        query={dueSoon}
        value={String(dueSoonCount)}
        hint={`nos próximos ${DUE_SOON_DAYS} dias`}
      />
      <StatTile
        icon={<Trophy />}
        tone="success"
        label="Seu progresso"
        query={progress}
        value={rate === null ? "—" : formatRatio(rate)}
        hint={
          total === 0
            ? "nenhum item atribuído a você ainda"
            : `dos ${total} itens atribuídos a você estão concluídos`
        }
      >
        {rate !== null ? (
          <div
            className="mt-3 h-2 overflow-hidden rounded-full bg-muted"
            role="progressbar"
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuenow={Math.round(rate * 100)}
            aria-label="Itens concluídos"
          >
            <div
              className="h-full rounded-full bg-success transition-[width] duration-700 ease-out"
              style={{ width: `${rate * 100}%` }}
            />
          </div>
        ) : null}
      </StatTile>
    </div>
  );
}
