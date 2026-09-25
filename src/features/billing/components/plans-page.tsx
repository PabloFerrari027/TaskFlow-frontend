"use client";

import * as React from "react";
import { Loader2, Sparkles } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/shared/empty-state";
import { ErrorState } from "@/components/shared/error-state";
import { useCurrentUserQuery } from "@/features/auth/hooks/use-current-user";
import { usePlansQuery } from "@/features/plans/hooks/use-plans";
import {
  useCheckoutReturn,
  useCheckoutSessionMutation,
  useCurrentMonthUsageQuery,
  usePortalSessionMutation,
} from "@/features/billing/hooks/use-billing";
import { PlanCard, type PlanRelation } from "@/features/billing/components/plan-card";
import { UsageProgress } from "@/features/billing/components/usage-progress";
import type { Plan } from "@/types/plan";

// The cap TOKEN_QUOTA_GUARD applies while `planId` is null — guaranteed in the
// catalog by the backend seed (API.md § 23).
const DEFAULT_PLAN_NAME = "FREE";

function relationTo(plan: Plan, userPlanId: string | null, effectivePlan: Plan | null): PlanRelation {
  if (plan.id === effectivePlan?.id) return "current";
  // No plan of their own yet: not a subscriber, so every option is "Assinar".
  if (userPlanId === null || !effectivePlan) return "subscribe";
  if (plan.monthlyTokenBudget > effectivePlan.monthlyTokenBudget) return "upgrade";
  if (plan.monthlyTokenBudget < effectivePlan.monthlyTokenBudget) return "downgrade";
  return "subscribe";
}

export function PlansPage() {
  const isConfirmingCheckout = useCheckoutReturn();
  const userQuery = useCurrentUserQuery();
  const plansQuery = usePlansQuery();
  const usageQuery = useCurrentMonthUsageQuery();
  const checkoutMutation = useCheckoutSessionMutation();
  const portalMutation = usePortalSessionMutation();

  if (userQuery.isLoading || plansQuery.isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-24 w-full" />
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-32 w-full" />
          ))}
        </div>
      </div>
    );
  }

  if (plansQuery.isError) {
    return <ErrorState error={plansQuery.error} onRetry={() => plansQuery.refetch()} />;
  }
  if (userQuery.isError) {
    return <ErrorState error={userQuery.error} onRetry={() => userQuery.refetch()} />;
  }

  const plans = [...(plansQuery.data ?? [])].sort(
    (a, b) => a.monthlyTokenBudget - b.monthlyTokenBudget
  );
  const userPlanId = userQuery.data?.planId ?? null;
  // Without a plan there's nothing to manage, even for a past Stripe customer.
  const canManage = userPlanId !== null && (userQuery.data?.hasStripeCustomer ?? false);
  const effectivePlan =
    userPlanId !== null
      ? (plans.find((plan) => plan.id === userPlanId) ?? null)
      : (plans.find((plan) => plan.name === DEFAULT_PLAN_NAME) ?? null);

  // `isSuccess` means the browser is on its way to Stripe — keep everything busy.
  const isRedirecting =
    checkoutMutation.isPending ||
    checkoutMutation.isSuccess ||
    portalMutation.isPending ||
    portalMutation.isSuccess;
  const actionsDisabled = isRedirecting || isConfirmingCheckout;

  return (
    <div className="space-y-8">
      <div className="space-y-3">
        <h2 className="text-lg font-medium text-foreground">Seu consumo</h2>
        <UsageProgress
          usedTokens={usageQuery.data?.totalTokens}
          monthlyTokenBudget={effectivePlan?.monthlyTokenBudget ?? null}
          isLoading={usageQuery.isLoading}
        />
      </div>

      <div className="space-y-3">
        <h2 className="text-lg font-medium text-foreground">Planos</h2>

        {isConfirmingCheckout && (
          <div
            className="flex items-center gap-2 rounded-md border border-border bg-muted/40 p-3 text-sm text-muted-foreground"
            role="status"
          >
            <Loader2 className="size-4 shrink-0 animate-spin" />
            Atualizando seu plano…
          </div>
        )}

        {plans.length === 0 ? (
          <EmptyState
            icon={<Sparkles className="size-6" />}
            title="Nenhum plano disponível"
            description="Ainda não há planos cadastrados para escolher."
          />
        ) : (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {plans.map((plan) => {
              const relation = relationTo(plan, userPlanId, effectivePlan);
              const isPending =
                relation === "current"
                  ? portalMutation.isPending || portalMutation.isSuccess
                  : (checkoutMutation.isPending || checkoutMutation.isSuccess) &&
                    checkoutMutation.variables === plan.id;
              return (
                <PlanCard
                  key={plan.id}
                  plan={plan}
                  relation={relation}
                  isDefault={userPlanId === null}
                  canManage={canManage}
                  isPending={isPending}
                  disabled={actionsDisabled}
                  onSubscribe={() => checkoutMutation.mutate(plan.id)}
                  onManage={() => portalMutation.mutate()}
                />
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
