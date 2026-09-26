import { apiClient } from "@/lib/api/client";
import { assistantService } from "@/features/assistant/api/assistant-service";
import type { CheckoutSessionResponse, PortalSessionResponse } from "@/types/billing";

// TOKEN_QUOTA_GUARD's monthly window starts on the 1st at 00:00 UTC (API.md
// § 23) — not the local month, and not `/ai-usage/me`'s default of 30 days.
function startOfCurrentUtcMonth(now: Date): Date {
  return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));
}

export function startOfNextUtcMonth(now: Date): Date {
  return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + 1, 1));
}

export const billingService = {
  // Both calls only return a Stripe-hosted URL; the caller redirects the
  // browser there. The success/cancel/return URLs are set by the backend and
  // point back to /settings/billing(?checkout=success|canceled).
  async createCheckoutSession(planId: string) {
    const { data } = await apiClient.post<CheckoutSessionResponse>(
      "/billing/checkout-session",
      { planId }
    );
    return data;
  },

  async createPortalSession() {
    const { data } = await apiClient.post<PortalSessionResponse>("/billing/portal-session");
    return data;
  },

  // Only `summary` is needed, so ask for the smallest page of `items`.
  async getCurrentMonthUsage() {
    const now = new Date();
    const { summary } = await assistantService.getMyAiUsage({
      from: startOfCurrentUtcMonth(now).toISOString(),
      to: now.toISOString(),
      page: 1,
      limit: 1,
    });
    return summary;
  },
};
