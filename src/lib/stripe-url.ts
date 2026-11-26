/**
 * Only an https page on a `*.stripe.com` host (checkout, billing portal) may
 * receive the browser: the URL comes from an API response and goes straight
 * into a full navigation.
 */
export function isStripeUrl(value: string) {
  try {
    const url = new URL(value);
    return url.protocol === "https:" && url.hostname.endsWith(".stripe.com");
  } catch {
    return false;
  }
}
