"use client";

import { useMutation, useQueryClient, type QueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { billingService } from "@/features/plans/api/billing-service";
import { queryKeys } from "@/lib/query-keys";
import { getErrorCode, getErrorMessage } from "@/lib/errors";
import { formatDate } from "@/lib/format";

// Coupon errors are shown inline by the dialog's coupon field, not toasted.
function isCouponError(error: unknown) {
  return getErrorCode(error)?.startsWith("COUPON_") ?? false;
}

// The server state moved under the user (plan removed, subscription ended…):
// refresh what the screen shows before the toast.
function refreshOnStaleState(error: unknown, invalidate: () => void) {
  const code = getErrorCode(error);
  if (
    code === "PLAN_NOT_FOUND" ||
    code === "NO_ACTIVE_SUBSCRIPTION" ||
    code === "ALREADY_ON_PLAN" ||
    code === "SUBSCRIPTION_ALREADY_ACTIVE"
  ) {
    invalidate();
  }
}

// Stripe-hosted pages: a full navigation, not a router push.
export function goTo(url: string) {
  window.location.assign(url);
}

// Shared by checkout and change: coupon errors stay inline; a stale plan or
// subscription refreshes both caches before the toast.
function handlePlanPurchaseError(error: unknown, queryClient: QueryClient) {
  if (isCouponError(error)) return;
  refreshOnStaleState(error, () => {
    queryClient.invalidateQueries({ queryKey: queryKeys.plans.all() });
    queryClient.invalidateQueries({ queryKey: queryKeys.plans.mine() });
  });
  toast.error(getErrorMessage(error));
}

/** Paid plan without a subscription in force → Stripe Checkout (+ coupon). */
export function useStartCheckoutMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ planId, couponCode }: { planId: string; couponCode?: string }) =>
      billingService.startCheckout(planId, couponCode),
    // The dialog keeps its button locked (isSuccess) while the browser leaves for Stripe.
    onSuccess: (checkout) => goTo(checkout.url),
    onError: (error) => handlePlanPurchaseError(error, queryClient),
  });
}

/** Subscription in force → another paid plan, or a coupon on the current one. */
export function useChangeSubscriptionPlanMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ plan, couponCode }: { plan: { id: string; name: string }; couponCode?: string }) =>
      billingService.changePlan(plan.id, couponCode),
    onSuccess: (myPlan, { plan, couponCode }) => {
      queryClient.setQueryData(queryKeys.plans.mine(), myPlan);
      // The plan sets the quota limits the allowance is computed against.
      queryClient.invalidateQueries({ queryKey: queryKeys.aiUsage.root() });
      toast.success(
        couponCode && myPlan.discount
          ? `Plano ${plan.name} com o cupom ${myPlan.discount.couponCode}.`
          : `Plano ${plan.name} escolhido.`
      );
    },
    onError: (error) => handlePlanPurchaseError(error, queryClient),
  });
}

export function useCancelSubscriptionMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => billingService.cancel(),
    onSuccess: (subscription) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.plans.mine() });
      toast.success(
        subscription.currentPeriodEnd
          ? `Assinatura cancelada. Seu plano vale até ${formatDate(subscription.currentPeriodEnd)}.`
          : "Assinatura cancelada."
      );
    },
    onError: (error) => {
      refreshOnStaleState(error, () => queryClient.invalidateQueries({ queryKey: queryKeys.plans.mine() }));
      toast.error(getErrorMessage(error));
    },
  });
}

export function useResumeSubscriptionMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => billingService.resume(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.plans.mine() });
      toast.success("Assinatura retomada. Ela continua renovando normalmente.");
    },
    onError: (error) => {
      if (
        getErrorCode(error) === "NO_ACTIVE_SUBSCRIPTION" ||
        getErrorCode(error) === "SUBSCRIPTION_NOT_SCHEDULED_TO_CANCEL"
      ) {
        queryClient.invalidateQueries({ queryKey: queryKeys.plans.mine() });
      }
      toast.error(getErrorMessage(error));
    },
  });
}

/** Stripe customer portal: update the card, see invoices and receipts. */
export function useOpenBillingPortalMutation() {
  return useMutation({
    mutationFn: () => billingService.openPortal(),
    onSuccess: ({ url }) => goTo(url),
    onError: (error) => toast.error(getErrorMessage(error)),
  });
}
