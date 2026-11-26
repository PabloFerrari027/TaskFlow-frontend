import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { isTopUpConfirmed } from "./top-up-confirmation.ts";
import type { AiTopUpPurchase, MyAiTopUps } from "../../../types/ai-top-up.ts";

function purchase(status: AiTopUpPurchase["status"]): AiTopUpPurchase {
  return { id: status, packName: "Recarga P", credits: 500, priceCents: 990, currency: "BRL", status, refundedCents: 0, createdAt: "", completedAt: null };
}

function snapshot(credits: number, ...statuses: AiTopUpPurchase["status"][]): MyAiTopUps {
  return {
    balance: { credits, nextExpiresAt: null, nextExpiringCredits: 0 },
    purchases: {
      data: statuses.map(purchase),
      meta: { page: 1, limit: 10, total: statuses.length, totalPages: 1 },
    },
  };
}

describe("isTopUpConfirmed", () => {
  it("sem dados, não confirma", () => {
    assert.equal(isTopUpConfirmed(undefined, undefined), false);
  });

  it("saldo igual e compra mais recente PENDING: continua esperando", () => {
    const before = snapshot(100, "PENDING", "COMPLETED");
    assert.equal(isTopUpConfirmed(snapshot(100, "PENDING", "COMPLETED"), before), false);
  });

  it("saldo mudou: confirma", () => {
    assert.equal(isTopUpConfirmed(snapshot(600, "PENDING"), snapshot(100, "PENDING")), true);
  });

  it("compra mais recente deixou de ser PENDING (webhook antes da página): confirma", () => {
    const first = snapshot(600, "COMPLETED");
    assert.equal(isTopUpConfirmed(first, first), true);
  });

  it("sem nenhuma compra, não confirma", () => {
    const empty = snapshot(0);
    assert.equal(isTopUpConfirmed(empty, empty), false);
  });
});
