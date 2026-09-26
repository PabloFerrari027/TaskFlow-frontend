"use client";

import { Loader2, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { ErrorState } from "@/components/shared/error-state";
import {
  QUOTA_WINDOWS,
  useQuotaWindowsUsageQueries,
  type QuotaWindow,
} from "@/features/plans/hooks/use-plans";
import { utcMidnightInLocalTime } from "@/features/plans/lib/plan-caps";

const numberFormat = new Intl.NumberFormat("pt-BR");
const timeFormat = new Intl.DateTimeFormat("pt-BR", { hour: "2-digit", minute: "2-digit" });

const WINDOW_LABELS: Record<QuotaWindow, { title: string; since: string }> = {
  day: { title: "Hoje", since: "desde 00:00 UTC" },
  week: { title: "Nesta semana", since: "desde segunda-feira, 00:00 UTC" },
  month: { title: "Neste mês", since: "desde o dia 1º, 00:00 UTC" },
};

// The same windows TOKEN_QUOTA_GUARD counts (API.md § 23), shown as raw
// totals only — there's no known cap to turn them into a percentage.
export function UsageWindowsSummary() {
  const queries = useQuotaWindowsUsageQueries();
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
              <p className="text-xs text-muted-foreground">{WINDOW_LABELS[window].since}</p>
            </Card>
          );
        })}
      </div>

      <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-muted-foreground">
        <p>
          Contado das mesmas viradas que o limite usa (00:00 UTC é{" "}
          {/* Server and browser may be in different time zones. */}
          <span suppressHydrationWarning>{utcMidnightInLocalTime()}</span> no seu horário). Sem
          comparação com o limite, porque não é possível consultar o seu plano atual.
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
