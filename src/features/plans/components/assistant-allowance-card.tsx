"use client";

import Link from "next/link";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useAssistantAllowance } from "@/features/plans/hooks/use-plans";
import { messagesLabel, utcMidnightInLocalTime } from "@/features/plans/lib/plan-caps";
import { cn } from "@/lib/utils";

const RESET_TEXT = {
  day: () => `O limite do dia renova às ${utcMidnightInLocalTime()}.`,
  week: () => "O limite da semana acabou antes do dia: renova na segunda-feira.",
  month: () => "O limite do mês acabou antes do dia: renova no dia 1º.",
} as const;

// "Quanto ainda dá para conversar hoje", in plain words. The token tables
// stay one click away, under "Ver detalhes técnicos".
export function AssistantAllowanceCard({ showPlanLink = false }: { showPlanLink?: boolean }) {
  const allowance = useAssistantAllowance();

  if (!allowance) return <Skeleton className="h-32 w-full" />;

  const { percentToday, messagesLeft, messagesPerDay, limitedBy } = allowance;
  const percent = Math.round(percentToday);

  return (
    <Card className="gap-3 p-5">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <p className="font-medium text-foreground">Uso do assistente hoje</p>
        <p className="text-sm text-muted-foreground">
          Seu plano: {messagesLabel(messagesPerDay)} por dia
        </p>
      </div>
      <div
        className="h-2.5 overflow-hidden rounded-full bg-muted"
        role="progressbar"
        aria-label="Uso do assistente hoje"
        aria-valuenow={percent}
        aria-valuemin={0}
        aria-valuemax={100}
      >
        <div
          className={cn("h-full rounded-full transition-[width]", percent >= 90 ? "bg-destructive" : "bg-primary")}
          style={{ width: `${Math.max(percent, 1)}%` }}
        />
      </div>
      <p className="text-sm text-foreground">
        Você usou {percent}% do limite de hoje. Ainda dá para {messagesLabel(messagesLeft)}.
      </p>
      <p className="text-xs text-muted-foreground">
        {RESET_TEXT[limitedBy]()} Conversas longas ou com anexos gastam mais.
        {showPlanLink ? (
          <>
            {" "}
            <Link href="/settings/plan" className="text-primary hover:underline">
              Ver planos
            </Link>
          </>
        ) : null}
      </p>
    </Card>
  );
}
