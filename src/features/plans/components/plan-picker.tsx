"use client";

import * as React from "react";
import { Check, Info, Loader2, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/shared/empty-state";
import { ErrorState } from "@/components/shared/error-state";
import { usePlansQuery, useSetMyPlanMutation } from "@/features/plans/hooks/use-plans";

const numberFormat = new Intl.NumberFormat("pt-BR");

export function PlanPicker() {
  const plansQuery = usePlansQuery();
  const setMyPlanMutation = useSetMyPlanMutation();
  const [pendingPlanId, setPendingPlanId] = React.useState<string | null>(null);

  function selectPlan(planId: string) {
    setPendingPlanId(planId);
    setMyPlanMutation.mutate(planId);
  }

  if (plansQuery.isLoading) {
    return (
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <Skeleton key={i} className="h-32 w-full" />
        ))}
      </div>
    );
  }

  if (plansQuery.isError) {
    return <ErrorState error={plansQuery.error} onRetry={() => plansQuery.refetch()} />;
  }

  const plans = plansQuery.data ?? [];

  return (
    <div className="space-y-4">
      {/* GET /auth/me never comes back with a planId (API.md § 23) — there's no
          endpoint that lets a user read back their own current plan, so this
          screen can't highlight "your plan" among the list below. */}
      <div className="flex items-start gap-2 rounded-md border border-border bg-muted/40 p-3 text-sm text-muted-foreground">
        <Info className="mt-0.5 size-4 shrink-0" />
        <p>Não é possível confirmar aqui qual é o seu plano atual. Escolha um plano abaixo para assiná-lo.</p>
      </div>

      {plans.length === 0 ? (
        <EmptyState
          icon={<Sparkles className="size-6" />}
          title="Nenhum plano disponível"
          description="Ainda não há planos cadastrados para escolher."
        />
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {plans.map((plan) => {
            const isPending = setMyPlanMutation.isPending && pendingPlanId === plan.id;
            return (
              <Card key={plan.id} className="justify-between gap-3 p-4">
                <div className="space-y-1">
                  <p className="font-medium text-foreground">{plan.name}</p>
                  <p className="text-sm text-muted-foreground">
                    {numberFormat.format(plan.monthlyTokenBudget)} tokens/mês
                  </p>
                </div>
                <Button
                  size="sm"
                  variant="outline"
                  disabled={setMyPlanMutation.isPending}
                  onClick={() => selectPlan(plan.id)}
                >
                  {isPending ? <Loader2 className="animate-spin" /> : <Check />}
                  Assinar este plano
                </Button>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
