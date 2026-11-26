import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { isStripeUrl } from "./stripe-url.ts";

describe("isStripeUrl", () => {
  it("aceita as páginas hospedadas pelo Stripe", () => {
    assert.equal(isStripeUrl("https://checkout.stripe.com/c/pay/cs_test_123"), true);
    assert.equal(isStripeUrl("https://billing.stripe.com/p/session/abc"), true);
  });

  it("recusa protocolo que não seja https", () => {
    assert.equal(isStripeUrl("http://checkout.stripe.com/c/pay/cs_1"), false);
    assert.equal(isStripeUrl("javascript:alert(1)"), false);
  });

  it("recusa outros domínios, inclusive imitações", () => {
    assert.equal(isStripeUrl("https://evil.com/checkout.stripe.com"), false);
    assert.equal(isStripeUrl("https://checkout.stripe.com.evil.com/x"), false);
    assert.equal(isStripeUrl("https://notstripe.com/x"), false);
    assert.equal(isStripeUrl("https://stripe.com/x"), false);
  });

  it("recusa texto que não é URL", () => {
    assert.equal(isStripeUrl("not a url"), false);
    assert.equal(isStripeUrl(""), false);
  });
});
