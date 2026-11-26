import { apiClient } from "@/lib/api/client";
import type { CheckoutResponse, MyPlan, Subscription } from "@/types/plan";

// Mirrors API.md § 23 "Assinatura (/billing, Stripe)". The plan only changes
// when Stripe confirms the payment (webhook), never on the redirect back.
export const billingService = {
  // Opens a Stripe-hosted payment page; redirect the user to `url`. With a
  // coupon, its slot stays reserved until `expiresAt`.
  async startCheckout(planId: string, couponCode?: string) {
    const { data } = await apiClient.post<CheckoutResponse>("/billing/checkout", {
      planId,
      couponCode: couponCode || undefined,
    });
    return data;
  },

  // Paid → paid (up/downgrade) or a coupon on the current plan. An upgrade is
  // charged pro rata right away; a downgrade becomes credit.
  async changePlan(planId: string, couponCode?: string) {
    const { data } = await apiClient.post<MyPlan>("/billing/subscription/change", {
      planId,
      couponCode: couponCode || undefined,
    });
    return data;
  },

  // Cancels at the end of the paid period (idempotent).
  async cancel() {
    const { data } = await apiClient.post<Subscription>("/billing/subscription/cancel");
    return data;
  },

  async resume() {
    const { data } = await apiClient.post<Subscription>("/billing/subscription/resume");
    return data;
  },

  // Stripe customer portal: card, invoices and receipts.
  async openPortal() {
    const { data } = await apiClient.post<{ url: string }>("/billing/portal");
    return data;
  },
};
