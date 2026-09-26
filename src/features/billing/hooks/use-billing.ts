"use client";

import * as React from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { authService } from "@/features/auth/api/auth-service";
import { billingService } from "@/features/billing/api/billing-service";
import { queryKeys } from "@/lib/query-keys";
import { getErrorMessage } from "@/lib/errors";

// The plan only changes once the backend processes Stripe's webhook, which
// can land a few seconds after the redirect back. Re-read GET /auth/me a few
// times instead of polling forever.
const CONFIRM_MAX_ATTEMPTS = 5;
const CONFIRM_INTERVAL_MS = 2_000;

// Remembers which plan the checkout was for, so the return page knows what
// `planId` to wait for. Per-tab and best effort: without it the page still
// refreshes a few times, it just can't tell when to stop early.
const PENDING_CHECKOUT_KEY = "taskflow:billing:pending-checkout-plan";

function writePendingCheckoutPlan(planId: string | null) {
  try {
    if (planId) sessionStorage.setItem(PENDING_CHECKOUT_KEY, planId);
    else sessionStorage.removeItem(PENDING_CHECKOUT_KEY);
  } catch {
    // Storage unavailable (private mode, blocked site data) — see above.
  }
}

function readPendingCheckoutPlan(): string | null {
  try {
    return sessionStorage.getItem(PENDING_CHECKOUT_KEY);
  } catch {
    return null;
  }
}

export function useCurrentMonthUsageQuery() {
  return useQuery({
    queryKey: queryKeys.aiUsage.currentMonth(),
    queryFn: () => billingService.getCurrentMonthUsage(),
  });
}

// On success the browser leaves the app, so `isSuccess` means "redirecting" —
// callers keep the button busy through it.
export function useCheckoutSessionMutation() {
  return useMutation({
    mutationFn: (planId: string) => billingService.createCheckoutSession(planId),
    onSuccess: ({ checkoutUrl }, planId) => {
      writePendingCheckoutPlan(planId);
      window.location.href = checkoutUrl;
    },
    onError: (error) => toast.error(getErrorMessage(error)),
  });
}

export function usePortalSessionMutation() {
  return useMutation({
    mutationFn: () => billingService.createPortalSession(),
    onSuccess: ({ portalUrl }) => {
      window.location.href = portalUrl;
    },
    onError: (error) => toast.error(getErrorMessage(error)),
  });
}

/**
 * Handles the return from Stripe Checkout (`?checkout=success|canceled`).
 * Returns `true` while it's waiting for the new plan to show up.
 */
export function useCheckoutReturn(): boolean {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const queryClient = useQueryClient();
  const checkout = searchParams.get("checkout");

  // Seeded from the URL on mount; the effect below strips the param right
  // after, so this only ever starts once per return from Checkout.
  const [confirming, setConfirming] = React.useState<{
    expectedPlanId: string | null;
    attempt: number;
  } | null>(() =>
    checkout === "success" ? { expectedPlanId: readPendingCheckoutPlan(), attempt: 0 } : null
  );

  React.useEffect(() => {
    if (!checkout) return;
    // Drop the param so a reload doesn't replay the toast/confirmation.
    router.replace(pathname, { scroll: false });
    // Canceling checkout is the user's choice, not a failure — nothing to say.
    if (checkout !== "success") return;
    // A fixed id dedupes the toast if this effect runs twice (Strict Mode).
    toast.success("Pagamento confirmado!", { id: "billing-checkout-success" });
  }, [checkout, pathname, router]);

  React.useEffect(() => {
    if (!confirming) return;
    let cancelled = false;

    const timeout = setTimeout(
      async () => {
        const [user] = await Promise.all([
          queryClient
            .fetchQuery({
              queryKey: queryKeys.auth.me(),
              queryFn: authService.getCurrentUser,
              staleTime: 0,
            })
            .catch(() => null),
          queryClient.invalidateQueries({ queryKey: queryKeys.aiUsage.meAll() }),
        ]);
        if (cancelled) return;

        const { expectedPlanId, attempt } = confirming;
        const confirmed = expectedPlanId !== null && user?.planId === expectedPlanId;
        const lastAttempt = attempt + 1 >= CONFIRM_MAX_ATTEMPTS;

        if (confirmed || lastAttempt) {
          writePendingCheckoutPlan(null);
          setConfirming(null);
          if (!confirmed && expectedPlanId !== null) {
            toast.info(
              "Seu pagamento foi confirmado, mas o novo plano ainda não apareceu. Ele deve ser atualizado em alguns minutos."
            );
          }
          return;
        }
        setConfirming({ expectedPlanId, attempt: attempt + 1 });
      },
      confirming.attempt === 0 ? 0 : CONFIRM_INTERVAL_MS
    );

    return () => {
      cancelled = true;
      clearTimeout(timeout);
    };
  }, [confirming, queryClient]);

  return confirming !== null;
}
