import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { CREDITS_PER_MESSAGE, creditsToMessages, describePack, formatCredits, formatDayMonth } from "./top-up.ts";

// Intl pt-BR usa espaço não separável entre "R$" e o valor.
const nbsp = (text: string) => text.replace(/\u00A0/g, " ");

describe("formatCredits", () => {
  it("usa separador de milhar e só inteiros", () => {
    assert.equal(formatCredits(1830), "1.830");
    assert.equal(formatCredits(1830.9), "1.830");
    assert.equal(formatCredits(0), "0");
  });

  it("nunca negativo", () => {
    assert.equal(formatCredits(-5), "0");
  });
});

describe("creditsToMessages", () => {
  it("arredonda para baixo", () => {
    assert.equal(creditsToMessages(CREDITS_PER_MESSAGE * 3 + 1), 3);
    assert.equal(creditsToMessages(CREDITS_PER_MESSAGE - 1), 0);
  });

  it("nunca negativo", () => {
    assert.equal(creditsToMessages(-10), 0);
  });
});

describe("describePack", () => {
  it("descreve créditos, mensagens e preço", () => {
    assert.equal(
      nbsp(describePack({ credits: 500, priceCents: 990 })),
      `500 créditos · ≈${500 / CREDITS_PER_MESSAGE} mensagens · R$ 9,90`
    );
  });

  it("mostra milhar nos créditos", () => {
    assert.match(describePack({ credits: 4000, priceCents: 5990 }), /^4\.000 créditos/);
  });
});

// formatDayMonth lê o fuso do processo: fixa para o teste não depender da máquina.
process.env.TZ = "UTC";

describe("formatDayMonth", () => {
  it("devolve DD/MM", () => {
    assert.match(formatDayMonth("2027-11-26T12:00:00.000Z"), /^\d{2}\/\d{2}$/);
    assert.equal(formatDayMonth("2027-11-26T12:00:00.000Z"), "26/11");
  });
});
