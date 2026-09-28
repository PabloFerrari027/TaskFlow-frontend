"use client";

import * as React from "react";
import {
  CalendarDays,
  CalendarRange,
  Check,
  CircleCheck,
  Crown,
  Info,
  Loader2,
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
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { EmptyState } from "@/components/shared/empty-state";
import { ErrorState } from "@/components/shared/error-state";
import { cn } from "@/lib/utils";
import { usePlansQuery, useSetMyPlanMutation } from "@/features/plans/hooks/use-plans";
import {
  DEFAULT_PLAN_NAME,
  derivedCaps,
  formatTokensHuman,
  utcMidnightInLocalTime,
} from "@/features/plans/lib/plan-caps";
import type { Plan } from "@/types/plan";

const numberFormat = new Intl.NumberFormat("pt-BR");

// Picked by position in the budget-sorted list, not by name — plan names are
// free text set by admins. Plans past the last icon reuse it.
const TIER_ICONS: LucideIcon[] = [Sparkles, Zap, Rocket, Crown];

export function PlanPicker() {
  const plansQuery = usePlansQuery();
  const setMyPlanMutation = useSetMyPlanMutation();
  // GET /auth/me never returns a planId (API.md § 23), so the only plan this
  // screen can point at is the one picked while it's open — never persisted,
  // and labeled as "just chosen", not as the user's current plan.
  const [chosenPlanId, setChosenPlanId] = React.useState<string | null>(null);

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
  // Looked up in the list so a plan removed after being chosen stops showing.
  const chosenPlan = plans.find((plan) => plan.id === chosenPlanId) ?? null;
  const largestBudget = plans.at(-1)?.monthlyTokenBudget ?? 0;

  function choosePlan(plan: Plan) {
    setMyPlanMutation.mutate(plan, { onSuccess: () => setChosenPlanId(plan.id) });
  }

  return (
    <div className="space-y-6">
      {chosenPlan ? (
        <div
          role="status"
          className="flex items-start gap-3 rounded-xl border border-primary/30 bg-primary/5 p-4 text-sm text-foreground"
        >
          <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground">
            <Check className="size-4" />
          </div>
          <div className="space-y-0.5">
            <p className="font-medium">
              Pronto! Você escolheu o plano {chosenPlan.name}.
            </p>
            <p className="text-muted-foreground">
              Essa marcação só aparece enquanto esta tela estiver aberta — ela lembra a escolha
              que você fez agora, não é uma consulta ao servidor.
            </p>
          </div>
        </div>
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
              isChosen={plan.id === chosenPlan?.id}
              isPending={
                setMyPlanMutation.isPending && setMyPlanMutation.variables?.id === plan.id
              }
              disabled={setMyPlanMutation.isPending}
              onChoose={() => choosePlan(plan)}
            />
          ))}
        </div>
      )}

      <HowLimitsWork />
    </div>
  );
}

function PlanOption({
  plan,
  icon: Icon,
  capacityPercent,
  isChosen,
  isPending,
  disabled,
  onChoose,
}: {
  plan: Plan;
  icon: LucideIcon;
  capacityPercent: number;
  isChosen: boolean;
  isPending: boolean;
  disabled: boolean;
  onChoose: () => void;
}) {
  const { daily, weekly } = derivedCaps(plan.monthlyTokenBudget);

  return (
    <Card
      className={cn(
        "relative gap-5 p-5 transition-shadow hover:shadow-md",
        isChosen && "bg-primary/[0.03] ring-2 ring-primary"
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
          {isChosen ? <Badge>Escolhido agora</Badge> : null}
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

      <ConfirmDialog
        trigger={
          <Button
            className="w-full"
            variant={isChosen ? "default" : "outline"}
            disabled={disabled || isChosen}
          >
            {isPending ? <Loader2 className="animate-spin" /> : <Check />}
            {isChosen ? "Escolhido" : "Escolher este plano"}
          </Button>
        }
        title={`Trocar para o plano ${plan.name}?`}
        description="O novo limite passa a valer na próxima vez que você usar a IA. Você pode trocar de plano de novo quando quiser."
        confirmLabel="Trocar de plano"
        variant="default"
        onConfirm={onChoose}
      />
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
          Não é possível mostrar qual é o seu plano atual: o TaskFlow consegue trocá-lo, mas não
          consultá-lo. Se você nunca escolheu um plano, vale o limite do plano{" "}
          {DEFAULT_PLAN_NAME}.
        </p>
      </div>
    </Card>
  );
}
