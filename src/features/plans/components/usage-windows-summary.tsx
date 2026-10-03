"use client";

import { Loader2, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { ErrorState } from "@/components/shared/error-state";
import {
  QUOTA_WINDOWS,
  useMyPlanQuery,
  usePlansQuery,
  useQuotaWindowsUsageQueries,
  type QuotaWindow,
} from "@/features/plans/hooks/use-plans";
import {
  DEFAULT_PLAN_NAME,
  derivedCaps,
  formatTokensHuman,
  utcMidnightInLocalTime,
} from "@/features/plans/lib/plan-caps";
import { cn } from "@/lib/utils";

const numberFormat = new Intl.NumberFormat("pt-BR");
const timeFormat = new Intl.DateTimeFormat("pt-BR", { hour: "2-digit", minute: "2-digit" });

const WINDOW_LABELS: Record<QuotaWindow, { title: string; since: string }> = {
  day: { title: "Hoje", since: "desde 00:00 UTC" },
  week: { title: "Nesta semana", since: "desde segunda-feira, 00:00 UTC" },
  month: { title: "Neste mês", since: "desde o dia 1º, 00:00 UTC" },
};

// The same windows TOKEN_QUOTA_GUARD counts (API.md § 23), against the caps
// of the current plan (or FREE, when none is assigned).
export function UsageWindowsSummary() {
  const queries = useQuotaWindowsUsageQueries();
  const myPlanQuery = useMyPlanQuery();
  const plansQuery = usePlansQuery();
  const budget =
    myPlanQuery.data?.plan?.monthlyTokenBudget ??
    (myPlanQuery.data
      ? plansQuery.data?.find((plan) => plan.name === DEFAULT_PLAN_NAME)?.monthlyTokenBudget
      : undefined);
  const caps: Record<QuotaWindow, number> | null = budget
    ? { day: derivedCaps(budget).daily, week: derivedCaps(budget).weekly, month: budget }
    : null;
  const failed = queries.find((query) => query.isError);
  const isFetching = queries.some((query) => query.isFetching);
  const updatedAt = Math.min(...queries.map((query) => query.dataUpdatedAt || Infinity));

  function refetchAll() {
    queries.forEach((query) => query.refetch());
  }

  if (failed) {
    return <ErrorState error={failed.error} onRetry={refetchAll} />;
  }

  return (
    <div className="space-y-3">
      <div className="grid gap-3 sm:grid-cols-3">
        {QUOTA_WINDOWS.map((window, index) => {
          const total = queries[index].data;
          const cap = caps?.[window];
          const percent = cap && total !== undefined ? Math.min(100, (total / cap) * 100) : null;
          return (
            <Card key={window} className="gap-1 p-4">
              <p className="text-xs text-muted-foreground">{WINDOW_LABELS[window].title}</p>
              {total === undefined ? (
                <Skeleton className="h-7 w-24" />
              ) : (
                <p className="text-xl font-semibold tabular-nums text-foreground">
                  {numberFormat.format(total)} tokens
                </p>
              )}
              {cap ? (
                <>
                  <div className="h-1.5 overflow-hidden rounded-full bg-muted" role="presentation">
                    <div
                      className={cn(
                        "h-full rounded-full transition-[width]",
                        percent !== null && percent >= 90 ? "bg-destructive" : "bg-primary"
                      )}
                      style={{ width: `${percent ?? 0}%` }}
                    />
                  </div>
                  <p className="text-xs text-muted-foreground">
                    de ≈ {formatTokensHuman(cap)} · {WINDOW_LABELS[window].since}
                  </p>
                </>
              ) : (
                <p className="text-xs text-muted-foreground">{WINDOW_LABELS[window].since}</p>
              )}
            </Card>
          );
        })}
      </div>

      <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-muted-foreground">
        <p>
          Contado das mesmas viradas que o limite usa (00:00 UTC é{" "}
          {/* Server and browser may be in different time zones. */}
          <span suppressHydrationWarning>{utcMidnightInLocalTime()}</span> no seu horário),
          comparado com o limite do seu plano.
        </p>
        <div className="flex items-center gap-2">
          {Number.isFinite(updatedAt) ? (
            <span>Atualizado às {timeFormat.format(updatedAt)}</span>
          ) : null}
          <Button size="sm" variant="ghost" disabled={isFetching} onClick={refetchAll}>
            {isFetching ? <Loader2 className="animate-spin" /> : <RefreshCw />}
            Atualizar
          </Button>
        </div>
      </div>
    </div>
  );
}
