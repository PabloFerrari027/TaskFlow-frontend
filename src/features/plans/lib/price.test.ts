import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { centsToPriceInput, isValidPriceInput, parsePriceInput } from "./price.ts";

describe("parsePriceInput", () => {
  it("converte reais em centavos", () => {
    assert.equal(parsePriceInput("9,5"), 950);
    assert.equal(parsePriceInput("29,90"), 2990);
    assert.equal(parsePriceInput("9.9"), 990);
    assert.equal(parsePriceInput("49"), 4900);
    assert.equal(parsePriceInput("0,01"), 1);
    assert.equal(parsePriceInput(" 1234,56 "), 123456);
  });

  it("não sofre erro de ponto flutuante", () => {
    assert.equal(parsePriceInput("0,29"), 29);
    assert.equal(parsePriceInput("19,99"), 1999);
    assert.equal(parsePriceInput("1,15"), 115);
  });
});

describe("isValidPriceInput", () => {
  it("aceita até 2 casas decimais", () => {
    for (const value of ["9", "9,9", "9,90", "9.90", "0,01"]) assert.equal(isValidPriceInput(value), true, value);
  });

  it("recusa entrada inválida", () => {
    for (const value of ["", "abc", "9,999", "-5", "1,2,3", "R$ 9,90", "12345678"]) {
      assert.equal(isValidPriceInput(value), false, value);
    }
  });
});

describe("centsToPriceInput", () => {
  it("formata centavos para o campo", () => {
    assert.equal(centsToPriceInput(990), "9,90");
    assert.equal(centsToPriceInput(2990), "29,90");
    assert.equal(centsToPriceInput(1), "0,01");
  });

  it("ida e volta preserva o valor", () => {
    for (const cents of [1, 10, 29, 115, 990, 2490, 5990, 123456]) {
      assert.equal(parsePriceInput(centsToPriceInput(cents)), cents);
    }
  });
});
