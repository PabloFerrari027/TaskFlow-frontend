import type { Subscription, SubscriptionStatus } from "@/types/plan";

// Statuses in which the Stripe subscription still backs the plan (API.md § 23):
// PAST_DUE keeps the plan while Stripe retries the charge.
const IN_FORCE: ReadonlySet<SubscriptionStatus> = new Set(["ACTIVE", "TRIALING", "PAST_DUE"]);

// Ended: the user went back to the default plan.
const ENDED: ReadonlySet<SubscriptionStatus> = new Set([
  "UNPAID",
  "CANCELED",
  "INCOMPLETE_EXPIRED",
  "PAUSED",
]);

/** ACTIVE / TRIALING / PAST_DUE: a plan change goes through `/billing/subscription/change`. */
export function hasSubscriptionInForce(subscription: Subscription | null | undefined) {
  return Boolean(subscription && IN_FORCE.has(subscription.status));
}

export function hasSubscriptionEnded(subscription: Subscription | null | undefined) {
  return Boolean(subscription && ENDED.has(subscription.status));
}
