"use client";

import * as React from "react";
import {
  BadgePercent,
  CalendarDays,
  CalendarRange,
  Check,
  CircleCheck,
  Crown,
  Info,
  Rocket,
  Sparkles,
  Sun,
  Zap,
  type LucideIcon,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/shared/empty-state";
import { ErrorState } from "@/components/shared/error-state";
import { cn } from "@/lib/utils";
import { useMyPlanQuery, usePlansQuery } from "@/features/plans/hooks/use-plans";
import { ChoosePlanDialog } from "@/features/plans/components/choose-plan-dialog";
import { describeDiscount, formatPriceCents } from "@/features/plans/lib/price";
import { formatDate } from "@/lib/format";
import {
  DEFAULT_PLAN_NAME,
  derivedCaps,
  formatTokensHuman,
  utcMidnightInLocalTime,
} from "@/features/plans/lib/plan-caps";
import type { MyPlan, Plan } from "@/types/plan";

const numberFormat = new Intl.NumberFormat("pt-BR");

// Picked by position in the budget-sorted list, not by name — plan names are
// free text set by admins. Plans past the last icon reuse it.
const TIER_ICONS: LucideIcon[] = [Sparkles, Zap, Rocket, Crown];

export function PlanPicker() {
  const plansQuery = usePlansQuery();
  const myPlanQuery = useMyPlanQuery();
  const [choosing, setChoosing] = React.useState<Plan | null>(null);
  const myPlan = myPlanQuery.data;

  if (plansQuery.isLoading) {
    return (
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <Skeleton key={i} className="h-80 w-full rounded-xl" />
        ))}
      </div>
    );
  }

  if (plansQuery.isError) {
    return <ErrorState error={plansQuery.error} onRetry={() => plansQuery.refetch()} />;
  }

  const plans = [...(plansQuery.data ?? [])].sort(
    (a, b) => a.monthlyTokenBudget - b.monthlyTokenBudget
  );
  const largestBudget = plans.at(-1)?.monthlyTokenBudget ?? 0;
  // No plan assigned = the FREE quota.
  const currentPlanId =
    myPlan?.plan?.id ?? plans.find((plan) => plan.name === DEFAULT_PLAN_NAME)?.id ?? null;

  return (
    <div className="space-y-6">
      {myPlanQuery.isLoading ? (
        <Skeleton className="h-24 w-full rounded-xl" />
      ) : myPlan ? (
        <CurrentPlanSummary
          myPlan={myPlan}
          onApplyCoupon={
            myPlan.plan && myPlan.plan.monthlyPriceCents > 0
              ? () => setChoosing(plans.find((plan) => plan.id === myPlan.plan?.id) ?? myPlan.plan)
              : undefined
          }
        />
      ) : null}

      {plans.length === 0 ? (
        <EmptyState
          icon={<Sparkles className="size-6" />}
          title="Nenhum plano disponível"
          description="Ainda não há planos cadastrados para escolher."
        />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {plans.map((plan, index) => (
            <PlanOption
              key={plan.id}
              plan={plan}
              icon={TIER_ICONS[Math.min(index, TIER_ICONS.length - 1)]}
              capacityPercent={
                largestBudget > 0 ? (plan.monthlyTokenBudget / largestBudget) * 100 : 0
              }
              isCurrent={plan.id === currentPlanId}
              onChoose={() => setChoosing(plan)}
            />
          ))}
        </div>
      )}

      <HowLimitsWork />

      {choosing ? (
        <ChoosePlanDialog
          plan={choosing}
          myPlan={myPlan}
          open
          onOpenChange={(open) => !open && setChoosing(null)}
        />
      ) : null}
    </div>
  );
}

function CurrentPlanSummary({
  myPlan,
  onApplyCoupon,
}: {
  myPlan: MyPlan;
  onApplyCoupon?: () => void;
}) {
  const { plan, discount } = myPlan;

  return (
    <div className="flex flex-col gap-3 rounded-xl border border-primary/30 bg-primary/5 p-4 text-sm sm:flex-row sm:items-center sm:justify-between">
      <div className="flex items-start gap-3">
        <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground">
          <Check className="size-4" />
        </div>
        <div className="space-y-0.5">
          <p className="font-medium text-foreground">
            Seu plano: {plan?.name ?? DEFAULT_PLAN_NAME}
            <span className="ml-2 font-normal text-muted-foreground">
              {formatPriceCents(myPlan.effectiveMonthlyPriceCents)}
              {myPlan.effectiveMonthlyPriceCents > 0 ? "/mês" : ""}
            </span>
          </p>
          {discount ? (
            <p className="flex items-center gap-1.5 text-muted-foreground">
              <BadgePercent className="size-4 text-emerald-600" />
              Cupom {discount.couponCode}: {describeDiscount(discount)}
              {discount.endsAt ? `, até ${formatDate(discount.endsAt)}` : ""}. Sem ele,{" "}
              {formatPriceCents(discount.originalPriceCents)}/mês.
            </p>
          ) : !plan ? (
            <p className="text-muted-foreground">
              Você ainda não escolheu um plano, então vale o limite do plano {DEFAULT_PLAN_NAME}.
            </p>
          ) : null}
        </div>
      </div>
      {onApplyCoupon ? (
        <Button variant="outline" size="sm" onClick={onApplyCoupon}>
          <BadgePercent /> Tenho um cupom
        </Button>
      ) : null}
    </div>
  );
}

function PlanOption({
  plan,
  icon: Icon,
  capacityPercent,
  isCurrent,
  onChoose,
}: {
  plan: Plan;
  icon: LucideIcon;
  capacityPercent: number;
  isCurrent: boolean;
  onChoose: () => void;
}) {
  const { daily, weekly } = derivedCaps(plan.monthlyTokenBudget);

  return (
    <Card
      className={cn(
        "relative gap-5 p-5 transition-shadow hover:shadow-md",
        isCurrent && "bg-primary/[0.03] ring-2 ring-primary"
      )}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex size-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
          <Icon className="size-5" />
        </div>
        <div className="flex flex-wrap justify-end gap-1.5">
          {plan.name === DEFAULT_PLAN_NAME ? (
            <Badge variant="secondary">Padrão</Badge>
          ) : null}
          {isCurrent ? <Badge>Seu plano</Badge> : null}
        </div>
      </div>

      <div className="space-y-1">
        <p className="text-sm font-medium tracking-wide text-muted-foreground uppercase">
          {plan.name}
        </p>
        <p className="text-2xl font-semibold tracking-tight text-foreground">
          {formatTokensHuman(plan.monthlyTokenBudget)}
        </p>
        <p className="text-xs text-muted-foreground">
          por mês · {numberFormat.format(plan.monthlyTokenBudget)} tokens
        </p>
        <p className="pt-1 text-sm font-medium text-foreground">
          {formatPriceCents(plan.monthlyPriceCents ?? 0)}
          {plan.monthlyPriceCents ? <span className="font-normal text-muted-foreground">/mês</span> : null}
        </p>
      </div>

      <div className="space-y-1.5">
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span>Capacidade</span>
          <span>{Math.round(capacityPercent)}% do maior plano</span>
        </div>
        <div
          className="h-1.5 overflow-hidden rounded-full bg-muted"
          role="presentation"
        >
          <div
            className="h-full rounded-full bg-primary transition-[width]"
            style={{ width: `${Math.max(capacityPercent, 2)}%` }}
          />
        </div>
      </div>

      <Separator />

      <ul className="flex-1 space-y-2 text-sm text-foreground">
        <li className="flex items-center gap-2">
          <CircleCheck className="size-4 shrink-0 text-primary" />
          Cerca de {formatTokensHuman(weekly)} por semana
        </li>
        <li className="flex items-center gap-2">
          <CircleCheck className="size-4 shrink-0 text-primary" />
          Cerca de {formatTokensHuman(daily)} por dia
        </li>
      </ul>

      <Button
        className="w-full"
        variant={isCurrent ? "default" : "outline"}
        disabled={isCurrent}
        onClick={onChoose}
      >
        <Check />
        {isCurrent ? "Plano atual" : "Escolher este plano"}
      </Button>
    </Card>
  );
}

function HowLimitsWork() {
  const resets: { icon: LucideIcon; label: string; when: string }[] = [
    {
      icon: Sun,
      label: "Limite do dia",
      when: `Reinicia à meia-noite UTC (${utcMidnightInLocalTime()} no seu horário)`,
    },
    {
      icon: CalendarRange,
      label: "Limite da semana",
      when: "Reinicia toda segunda-feira às 00:00 UTC",
    },
    {
      icon: CalendarDays,
      label: "Limite do mês",
      when: "Reinicia no dia 1º às 00:00 UTC",
    },
  ];

  return (
    <Card className="gap-5 p-5">
      <div className="space-y-1">
        <h3 className="font-medium text-foreground">Como funcionam os limites</h3>
        <p className="text-sm text-muted-foreground">
          Cada mensagem ao assistente gasta uma parte desses tokens — mais quando a conversa é
          longa ou tem anexos. Quanto maior o limite, mais você usa a IA antes de precisar
          esperar ele reiniciar. O que sobra não passa para o período seguinte.
        </p>
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        {resets.map(({ icon: Icon, label, when }) => (
          <div key={label} className="flex items-start gap-3 rounded-lg bg-muted/50 p-3">
            <Icon className="mt-0.5 size-4 shrink-0 text-primary" />
            <div className="space-y-0.5">
              <p className="text-sm font-medium text-foreground">{label}</p>
              <p className="text-xs text-muted-foreground">{when}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="flex items-start gap-2 text-xs text-muted-foreground">
        <Info className="mt-0.5 size-3.5 shrink-0" />
        <p>
          Se você nunca escolheu um plano, vale o limite do plano {DEFAULT_PLAN_NAME}. Um cupom
          de desconto vale só para o plano em que foi aplicado: trocar de plano encerra o
          desconto.
        </p>
      </div>
    </Card>
  );
}
