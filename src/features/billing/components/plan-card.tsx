"use client";

import { ArrowDown, ArrowUp, Loader2, Settings } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import type { Plan } from "@/types/plan";

const numberFormat = new Intl.NumberFormat("pt-BR");

// How a catalog plan relates to the user's current one. Only the button label
// changes between subscribe/upgrade/downgrade — the action is always Checkout.
export type PlanRelation = "current" | "subscribe" | "upgrade" | "downgrade";

const ACTION_LABELS: Record<Exclude<PlanRelation, "current">, string> = {
  subscribe: "Assinar",
  upgrade: "Fazer upgrade",
  downgrade: "Fazer downgrade",
};

export function PlanCard({
  plan,
  relation,
  isDefault,
  canManage,
  isPending,
  disabled,
  onSubscribe,
  onManage,
}: {
  plan: Plan;
  relation: PlanRelation;
  // The platform's FREE plan, applied while the user has no plan of their own.
  isDefault: boolean;
  // Only a user who has already paid through Stripe has a subscription to manage.
  canManage: boolean;
  isPending: boolean;
  disabled: boolean;
  onSubscribe: () => void;
  onManage: () => void;
}) {
  const isCurrent = relation === "current";

  return (
    <Card
      className={cn(
        "justify-between gap-4 p-4",
        isCurrent && "border-primary ring-1 ring-primary"
      )}
    >
      <div className="space-y-1">
        <div className="flex items-center justify-between gap-2">
          <p className="font-medium text-foreground">{plan.name}</p>
          {isCurrent && <Badge>{isDefault ? "Plano padrão" : "Seu plano"}</Badge>}
        </div>
        <p className="text-sm text-muted-foreground">
          {numberFormat.format(plan.monthlyTokenBudget)} tokens/mês
        </p>
      </div>

      {isCurrent ? (
        canManage && (
          <Button size="sm" variant="outline" disabled={disabled} onClick={onManage}>
            {isPending ? <Loader2 className="animate-spin" /> : <Settings />}
            Gerenciar assinatura
          </Button>
        )
      ) : (
        <Button
          size="sm"
          variant={relation === "downgrade" ? "outline" : "default"}
          disabled={disabled}
          onClick={onSubscribe}
        >
          {isPending ? (
            <Loader2 className="animate-spin" />
          ) : relation === "downgrade" ? (
            <ArrowDown />
          ) : relation === "upgrade" ? (
            <ArrowUp />
          ) : null}
          {ACTION_LABELS[relation]}
        </Button>
      )}
    </Card>
  );
}
