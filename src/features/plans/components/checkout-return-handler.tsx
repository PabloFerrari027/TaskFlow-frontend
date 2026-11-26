"use client";

import * as React from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import { plansService } from "@/features/plans/api/plans-service";
import { hasSubscriptionInForce } from "@/features/plans/lib/subscription";
import { queryKeys } from "@/lib/query-keys";
import type { MyPlan } from "@/types/plan";

const BILLING_PATH = "/settings/billing";
const POLL_INTERVAL_MS = 2_000;
const POLL_TIMEOUT_MS = 30_000;
const TOAST_ID = "checkout-return";

// A paid plan backed by a subscription in force (what the webhook produces).
function isPaidAndActive(myPlan: MyPlan | undefined) {
  return Boolean(
    myPlan?.plan && myPlan.plan.monthlyPriceCents > 0 && hasSubscriptionInForce(myPlan.subscription)
  );
}

/**
 * Where Stripe sends the user back (`?checkout=success|cancel`). Coming back
 * is not proof of payment: the plan only changes when the webhook arrives, a
 * few seconds later. On success it polls `GET /plans/me` every 2 s for up to
 * 30 s until a paid subscription is in force. The query string is cleaned
 * right away so a reload does not repeat the toast. Renders nothing.
 */
export function CheckoutReturnHandler() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const checkout = searchParams.get("checkout");
  const handled = React.useRef(false);
  // Read once, on mount: the query string is removed right after.
  const [returnedFromPayment] = React.useState(() => checkout === "success");
  const [timedOut, setTimedOut] = React.useState(false);

  const { data } = useQuery({
    queryKey: queryKeys.plans.mine(),
    queryFn: () => plansService.getMine(),
    // Cached data from before the payment must not end the wait.
    staleTime: 0,
    refetchInterval: (query) =>
      returnedFromPayment && !timedOut && !isPaidAndActive(query.state.data) ? POLL_INTERVAL_MS : false,
  });
  const confirmed = isPaidAndActive(data);
  const planName = data?.plan?.name;
  const startedAt = React.useRef<number | null>(null);
  const finished = React.useRef(false);

  React.useEffect(() => {
    if (!checkout || handled.current) return;
    handled.current = true;
    if (checkout === "cancel") toast.info("Pagamento cancelado. Nada foi cobrado.");
    router.replace(BILLING_PATH, { scroll: false });
  }, [checkout, router]);

  React.useEffect(() => {
    if (!returnedFromPayment || timedOut) return;
    if (confirmed) {
      finished.current = true;
      toast.success(`Pagamento confirmado. Plano ${planName} ativo.`, {
        id: TOAST_ID,
        duration: 5_000,
      });
      return;
    }
    // Same id: calling it again just keeps the one toast.
    toast.loading("Confirmando o pagamento…", { id: TOAST_ID, duration: Infinity });
    // The 30 s budget counts from the return, not from the last re-render.
    startedAt.current ??= Date.now();
    const remaining = Math.max(0, POLL_TIMEOUT_MS - (Date.now() - startedAt.current));
    const timer = window.setTimeout(() => {
      finished.current = true;
      toast.info("Ainda estamos confirmando o pagamento. O plano muda assim que o Stripe avisar.", {
        id: TOAST_ID,
        duration: 8_000,
      });
      setTimedOut(true);
    }, remaining);
    return () => {
      window.clearTimeout(timer);
      // Left before confirming or timing out: nothing else would close it.
      if (!finished.current) toast.dismiss(TOAST_ID);
    };
  }, [returnedFromPayment, confirmed, timedOut, planName]);

  return null;
}
