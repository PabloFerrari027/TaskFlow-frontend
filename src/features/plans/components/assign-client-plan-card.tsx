"use client";

import * as React from "react";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { useAdminPlansQuery, useAssignUserPlanMutation } from "@/features/plans/hooks/use-plans";
import { DEFAULT_PLAN_NAME, formatTokensHuman } from "@/features/plans/lib/plan-caps";
import { getErrorCode } from "@/lib/errors";

interface AssignClientPlanCardProps {
  clientId: string;
}

// Neither `GET /admin/clients/:id` nor `GET /auth/me` expose the user's
// current planId (API.md § 23) — this can only write a new assignment, never
// show what's currently set.
export function AssignClientPlanCard({ clientId }: AssignClientPlanCardProps) {
  const plansQuery = useAdminPlansQuery();
  const assignMutation = useAssignUserPlanMutation();
  const [selectedPlanId, setSelectedPlanId] = React.useState<string>("");

  const plans = plansQuery.data ?? [];

  return (
    <Card className="gap-3 p-4">
      <div className="space-y-1">
        <p className="font-medium text-foreground">Plano de tokens de IA</p>
        <p className="text-sm text-muted-foreground">
          Não é possível confirmar aqui qual é o plano atual deste cliente — apenas atribuir um novo.
          Quem nunca recebeu nem escolheu um plano usa o limite do plano {DEFAULT_PLAN_NAME}.
        </p>
      </div>

      {plansQuery.isLoading ? (
        <Skeleton className="h-9 w-full max-w-sm" />
      ) : (
        <div className="flex flex-wrap items-center gap-2">
          <Select value={selectedPlanId} onValueChange={setSelectedPlanId}>
            <SelectTrigger className="w-72">
              <SelectValue placeholder="Selecione um plano" />
            </SelectTrigger>
            <SelectContent>
              {plans.map((plan) => (
                <SelectItem key={plan.id} value={plan.id}>
                  {plan.name} · {formatTokensHuman(plan.monthlyTokenBudget)}/mês
                  {plan.name === DEFAULT_PLAN_NAME ? " (padrão)" : ""}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button
            size="sm"
            disabled={!selectedPlanId || assignMutation.isPending}
            onClick={() =>
              assignMutation.mutate(
                { userId: clientId, planId: selectedPlanId },
                {
                  onSuccess: () => setSelectedPlanId(""),
                  // The selected plan no longer exists; the list is refetched.
                  onError: (error) => {
                    if (getErrorCode(error) === "PLAN_NOT_FOUND") setSelectedPlanId("");
                  },
                }
              )
            }
          >
            {assignMutation.isPending ? <Loader2 className="animate-spin" /> : null}
            Atribuir plano
          </Button>
        </div>
      )}
    </Card>
  );
}
