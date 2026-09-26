"use client";

import * as React from "react";
import { Check, Info, Loader2, Sparkles } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { EmptyState } from "@/components/shared/empty-state";
import { ErrorState } from "@/components/shared/error-state";
import { usePlansQuery, useSetMyPlanMutation } from "@/features/plans/hooks/use-plans";
import {
  DEFAULT_PLAN_NAME,
  derivedCaps,
  formatTokensHuman,
  utcMidnightInLocalTime,
} from "@/features/plans/lib/plan-caps";
import type { Plan } from "@/types/plan";

const numberFormat = new Intl.NumberFormat("pt-BR");

export function PlanPicker() {
  const plansQuery = usePlansQuery();
  const setMyPlanMutation = useSetMyPlanMutation();
  // GET /auth/me never returns a planId (API.md § 23), so the only plan this
  // screen can point at is the one picked while it's open — never persisted,
  // and labeled as "just chosen", not as the user's current plan.
  const [chosenPlanId, setChosenPlanId] = React.useState<string | null>(null);

  if (plansQuery.isLoading) {
    return (
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <Skeleton key={i} className="h-44 w-full" />
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

  function choosePlan(plan: Plan) {
    setMyPlanMutation.mutate(plan, { onSuccess: () => setChosenPlanId(plan.id) });
  }

  return (
    <div className="space-y-4">
      <div className="flex items-start gap-2 rounded-md border border-border bg-muted/40 p-3 text-sm text-muted-foreground">
        <Info className="mt-0.5 size-4 shrink-0" />
        <div className="space-y-1">
          <p>
            Não é possível mostrar qual é o seu plano atual: o TaskFlow consegue trocá-lo, mas
            não consultá-lo. Se você nunca escolheu um plano, vale o limite do plano{" "}
            {DEFAULT_PLAN_NAME}.
          </p>
          <p>
            Os limites reiniciam sozinhos no horário UTC: o do dia à meia-noite (
            {utcMidnightInLocalTime()} no seu horário), o da semana na segunda-feira às 00:00 e o
            do mês no dia 1º. O que sobra não passa para o período seguinte.
          </p>
        </div>
      </div>

      <p className="text-sm text-muted-foreground">
        Cada mensagem ao assistente gasta uma parte desses tokens — mais quando a conversa é
        longa ou tem anexos. Quanto maior o limite, mais você usa a IA antes de precisar esperar
        ele reiniciar.
      </p>

      {chosenPlan ? (
        <div
          role="status"
          className="flex items-start gap-2 rounded-md border border-primary/40 bg-primary/5 p-3 text-sm text-foreground"
        >
          <Check className="mt-0.5 size-4 shrink-0 text-primary" />
          <p>
            Você acabou de escolher o plano <strong>{chosenPlan.name}</strong>. Essa marcação só
            aparece enquanto esta tela estiver aberta — ela lembra a escolha que você fez agora,
            não é uma consulta ao servidor.
          </p>
        </div>
      ) : null}

      {plans.length === 0 ? (
        <EmptyState
          icon={<Sparkles className="size-6" />}
          title="Nenhum plano disponível"
          description="Ainda não há planos cadastrados para escolher."
        />
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {plans.map((plan) => (
            <PlanOption
              key={plan.id}
              plan={plan}
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
    </div>
  );
}

function PlanOption({
  plan,
  isChosen,
  isPending,
  disabled,
  onChoose,
}: {
  plan: Plan;
  isChosen: boolean;
  isPending: boolean;
  disabled: boolean;
  onChoose: () => void;
}) {
  const { daily, weekly } = derivedCaps(plan.monthlyTokenBudget);

  return (
    <Card className="justify-between gap-4 p-4">
      <div className="space-y-2">
        <div className="flex flex-wrap items-center gap-2">
          <p className="font-medium text-foreground">{plan.name}</p>
          {plan.name === DEFAULT_PLAN_NAME ? (
            <Badge variant="secondary">Padrão</Badge>
          ) : null}
          {isChosen ? <Badge>Escolhido agora</Badge> : null}
        </div>
        <p className="text-sm text-foreground">
          {numberFormat.format(plan.monthlyTokenBudget)} tokens por mês
        </p>
        <ul className="space-y-0.5 text-xs text-muted-foreground">
          <li>Cerca de {formatTokensHuman(weekly)} por semana</li>
          <li>Cerca de {formatTokensHuman(daily)} por dia</li>
        </ul>
      </div>

      <ConfirmDialog
        trigger={
          <Button size="sm" variant="outline" disabled={disabled || isChosen}>
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
