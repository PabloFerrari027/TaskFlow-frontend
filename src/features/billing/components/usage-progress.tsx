"use client";

import { Coins } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { startOfNextUtcMonth } from "@/features/billing/api/billing-service";
import { cn } from "@/lib/utils";

const numberFormat = new Intl.NumberFormat("pt-BR");
const resetDateFormat = new Intl.DateTimeFormat("pt-BR", {
  day: "numeric",
  month: "long",
  timeZone: "UTC",
});

export function UsageProgress({
  usedTokens,
  monthlyTokenBudget,
  isLoading,
}: {
  usedTokens: number | undefined;
  // null when the current plan's cap isn't known (e.g. FREE missing from the
  // catalog) — the bar is hidden and only the raw count is shown.
  monthlyTokenBudget: number | null;
  isLoading: boolean;
}) {
  if (isLoading || usedTokens === undefined) {
    return <Skeleton className="h-24 w-full" />;
  }

  const percent =
    monthlyTokenBudget && monthlyTokenBudget > 0
      ? Math.min(100, (usedTokens / monthlyTokenBudget) * 100)
      : null;

  return (
    <Card className="gap-3 p-4">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <p className="flex items-center gap-2 text-sm font-medium text-foreground">
          <Coins className="size-4 text-muted-foreground" />
          {monthlyTokenBudget !== null
            ? `${numberFormat.format(usedTokens)} de ${numberFormat.format(monthlyTokenBudget)} tokens usados este mês`
            : `${numberFormat.format(usedTokens)} tokens usados este mês`}
        </p>
        <p className="text-xs text-muted-foreground">
          Renova em {resetDateFormat.format(startOfNextUtcMonth(new Date()))}
        </p>
      </div>
      {percent !== null && (
        <div
          className="h-2 w-full overflow-hidden rounded-full bg-muted"
          role="progressbar"
          aria-label="Uso de tokens de IA este mês"
          aria-valuenow={Math.round(percent)}
          aria-valuemin={0}
          aria-valuemax={100}
        >
          <div
            className={cn(
              "h-full rounded-full transition-[width] duration-500 ease-out",
              percent >= 90 ? "bg-destructive" : "bg-primary"
            )}
            style={{ width: `${percent}%` }}
          />
        </div>
      )}
    </Card>
  );
}
