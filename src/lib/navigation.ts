import { isStripeUrl } from "./stripe-url.ts";

/**
 * Stripe-hosted pages (checkout, billing portal): a full navigation, not a
 * router push. Throws on anything that is not a Stripe https URL, so the
 * mutation that called it ends in its error state instead of navigating.
 */
export function goToStripe(url: string) {
  if (!isStripeUrl(url)) throw new Error("Unexpected payment URL");
  window.location.assign(url);
}
