import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { isTopUpConfirmed } from "./top-up-confirmation.ts";
import type { MyAiTopUps } from "../../../types/ai-top-up.ts";

// Montado a partir do exemplo de GET /billing/ai-top-ups/me (API.md § 46):
// só compras pagas, da mais nova para a mais antiga. PENDING/EXPIRED nunca vêm.
const apiExample: MyAiTopUps = {
  balance: { credits: 1830, nextExpiresAt: "2027-11-26T14:02:11.000Z", nextExpiringCredits: 500 },
  purchases: {
    data: [
      {
        id: "c0f1",
        packName: "Recarga P",
        credits: 500,
        priceCents: 990,
        currency: "BRL",
        status: "COMPLETED",
        refundedCents: 0,
        createdAt: "2026-11-20T14:02:11.000Z",
        completedAt: "2026-11-20T14:03:00.000Z",
      },
    ],
    meta: { page: 1, limit: 20, total: 1, totalPages: 1 },
  },
};

// Quem já comprou antes e volta de uma nova compra, antes do webhook.
const beforeWebhook = apiExample;

// A mesma lista depois do webhook: a compra nova (c0f2) no topo, saldo maior.
const afterWebhook: MyAiTopUps = {
  balance: { credits: 2330, nextExpiresAt: "2027-11-26T14:02:11.000Z", nextExpiringCredits: 500 },
  purchases: {
    data: [
      { ...apiExample.purchases.data[0], id: "c0f2", createdAt: "2026-11-26T14:02:11.000Z", completedAt: "2026-11-26T14:03:00.000Z" },
      apiExample.purchases.data[0],
    ],
    meta: { page: 1, limit: 20, total: 2, totalPages: 1 },
  },
};

describe("isTopUpConfirmed", () => {
  it("sem dados, não confirma", () => {
    assert.equal(isTopUpConfirmed(undefined, undefined, "c0f2"), false);
  });

  it("compra repetida: o histórico só tem a compra antiga, não confirma antes do webhook", () => {
    assert.equal(isTopUpConfirmed(beforeWebhook, beforeWebhook, "c0f2"), false);
    assert.equal(isTopUpConfirmed(beforeWebhook, beforeWebhook, null), false);
  });

  it("com purchaseId: confirma quando a compra aparece na lista", () => {
    assert.equal(isTopUpConfirmed(afterWebhook, beforeWebhook, "c0f2"), true);
  });

  it("com purchaseId: webhook que chegou antes da primeira leitura também confirma", () => {
    assert.equal(isTopUpConfirmed(afterWebhook, afterWebhook, "c0f2"), true);
  });

  it("com purchaseId: saldo que mudou por outro motivo não confirma", () => {
    const consumed: MyAiTopUps = { ...beforeWebhook, balance: { ...beforeWebhook.balance, credits: 1700 } };
    assert.equal(isTopUpConfirmed(consumed, beforeWebhook, "c0f2"), false);
  });

  it("sem purchaseId: confirma quando o saldo muda", () => {
    assert.equal(isTopUpConfirmed(afterWebhook, beforeWebhook, null), true);
  });

  it("sem purchaseId: confirma quando o total de compras cresce com o saldo igual", () => {
    const sameBalance: MyAiTopUps = { ...afterWebhook, balance: beforeWebhook.balance };
    assert.equal(isTopUpConfirmed(sameBalance, beforeWebhook, null), true);
  });

  it("primeira compra: lista vazia, não confirma; a compra nova confirma", () => {
    const empty: MyAiTopUps = {
      balance: { credits: 0, nextExpiresAt: null, nextExpiringCredits: 0 },
      purchases: { data: [], meta: { page: 1, limit: 20, total: 0, totalPages: 0 } },
    };
    assert.equal(isTopUpConfirmed(empty, empty, "c0f1"), false);
    assert.equal(isTopUpConfirmed(apiExample, empty, "c0f1"), true);
    assert.equal(isTopUpConfirmed(apiExample, empty, null), true);
  });
});
