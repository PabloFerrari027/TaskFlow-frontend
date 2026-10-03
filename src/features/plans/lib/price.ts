import type { DiscountTerms } from "@/types/plan";

const brl = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" });

/** BRL cents → "R$ 49,90" (or "Grátis" for 0). */
export function formatPriceCents(cents: number, { freeLabel = "Grátis" } = {}) {
  return cents === 0 ? freeLabel : brl.format(cents / 100);
}

const PRICE_INPUT = /^\d{1,7}([.,]\d{1,2})?$/;

export function isValidPriceInput(value: string) {
  return PRICE_INPUT.test(value.trim());
}

/** "49,90" / "49.9" / "49" → cents. Call only on a valid input. */
export function parsePriceInput(value: string) {
  const [reais, centavos = ""] = value.trim().replace(",", ".").split(".");
  return Number(reais) * 100 + Number(centavos.padEnd(2, "0"));
}

/** cents → "49,90", for an input's initial value. */
export function centsToPriceInput(cents: number) {
  return (cents / 100).toFixed(2).replace(".", ",");
}

/** "30% de desconto" / "R$ 10,00 de desconto", plus how long it lasts. */
export function describeDiscount(terms: DiscountTerms) {
  const amount =
    terms.discountType === "PERCENT"
      ? `${terms.percentOff ?? 0}% de desconto`
      : `${formatPriceCents(terms.amountOffCents ?? 0)} de desconto`;
  const duration =
    terms.duration === "ONCE"
      ? "no primeiro mês"
      : terms.duration === "FOREVER"
        ? "enquanto você ficar no plano"
        : `por ${terms.durationInMonths ?? 0} ${terms.durationInMonths === 1 ? "mês" : "meses"}`;
  return `${amount} ${duration}`;
}
