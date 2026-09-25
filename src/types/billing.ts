// Proposed billing contract — not in API.md yet. Both endpoints only hand back
// a Stripe-hosted URL to redirect the browser to; no Stripe SDK runs here.
export interface CheckoutSessionResponse {
  checkoutUrl: string;
}

export interface PortalSessionResponse {
  portalUrl: string;
}
