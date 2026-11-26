"use client";

import { plansService } from "@/features/plans/api/plans-service";
import { usePaymentReturn } from "@/features/plans/hooks/use-payment-return";
import { hasSubscriptionInForce } from "@/features/plans/lib/subscription";
import { queryKeys } from "@/lib/query-keys";
import type { MyPlan } from "@/types/plan";

// A paid plan backed by a subscription in force (what the webhook produces).
function isPaidAndActive(myPlan: MyPlan | undefined) {
  return Boolean(
    myPlan?.plan && myPlan.plan.monthlyPriceCents > 0 && hasSubscriptionInForce(myPlan.subscription)
  );
}

/**
 * Where Stripe sends the user back after a plan checkout
 * (`?checkout=success|cancel`). Polls `GET /plans/me` until a paid
 * subscription is in force; the wait itself lives in `usePaymentReturn`.
 * Renders nothing.
 */
export function CheckoutReturnHandler() {
  usePaymentReturn<MyPlan>({
    param: "checkout",
    toastId: "checkout-return",
    cancelMessage: "Pagamento cancelado. Nada foi cobrado.",
    pendingMessage: "Confirmando o pagamento…",
    timeoutMessage: "Ainda estamos confirmando o pagamento. O plano muda assim que o Stripe avisar.",
    confirmedMessage: (myPlan) => `Pagamento confirmado. Plano ${myPlan.plan?.name} ativo.`,
    queryKey: queryKeys.plans.mine(),
    queryFn: () => plansService.getMine(),
    isConfirmed: isPaidAndActive,
  });
  return null;
}
