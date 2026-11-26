import type { MyAiTopUps } from "../../../types/ai-top-up.ts";

const PENDING_PURCHASE_KEY = "taskflow:pending-top-up-purchase";

/**
 * The webhook settled the purchase. `GET /billing/ai-top-ups/me` lists only
 * paid purchases (API.md § 46: never PENDING or EXPIRED), so a purchase that
 * shows up there is a paid one — and the *newest* one already being paid says
 * nothing for someone who bought before. `first` is the first picture seen
 * after the return.
 *
 * - With the `purchaseId` the checkout returned: confirmed once that id is listed.
 * - Without it (storage unavailable, another tab): the balance moved, or the
 *   list grew, compared with `first`.
 */
export function isTopUpConfirmed(
  data: MyAiTopUps | undefined,
  first: MyAiTopUps | undefined,
  purchaseId: string | null = null
) {
  if (!data) return false;
  if (purchaseId) return data.purchases.data.some((purchase) => purchase.id === purchaseId);
  if (!first) return false;
  return (
    data.balance.credits !== first.balance.credits ||
    data.purchases.meta.total > first.purchases.meta.total
  );
}

// The id survives the round trip to Stripe in sessionStorage (same tab).
// Storage can be blocked or throw: then the fallback above applies.
export function rememberPendingTopUpPurchase(purchaseId: string) {
  try {
    sessionStorage.setItem(PENDING_PURCHASE_KEY, purchaseId);
  } catch {
    // no storage: the fallback comparison is used
  }
}

export function readPendingTopUpPurchase(): string | null {
  try {
    return sessionStorage.getItem(PENDING_PURCHASE_KEY);
  } catch {
    return null;
  }
}

export function clearPendingTopUpPurchase() {
  try {
    sessionStorage.removeItem(PENDING_PURCHASE_KEY);
  } catch {
    // nothing to clear
  }
}
