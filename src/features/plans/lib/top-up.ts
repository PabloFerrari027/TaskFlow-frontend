// Relative with extension: `npm run test:unit` runs this file straight on Node.
import { formatPriceCents } from "./price.ts";

// A chat message is estimated at TOKENS_PER_MESSAGE tokens (plan-caps.ts) and
// the server prices it in µUSD, which the front never sees. This is the
// display-only ratio for "≈N mensagens" (decisoes-v1: reuse the front's
// heuristic); it is NOT used for any charge or limit.
export const CREDITS_PER_MESSAGE = 5;

const numberFormat = new Intl.NumberFormat("pt-BR");

/** 1830 → "1.830". Credits are always whole numbers for the user. */
export function formatCredits(credits: number) {
  return numberFormat.format(Math.max(0, Math.floor(credits)));
}

export function creditsToMessages(credits: number) {
  return Math.max(0, Math.floor(credits / CREDITS_PER_MESSAGE));
}

/** "500 créditos · ≈100 mensagens · R$ 9,90" */
export function describePack(pack: { credits: number; priceCents: number }) {
  return `${formatCredits(pack.credits)} créditos · ≈${numberFormat.format(
    creditsToMessages(pack.credits)
  )} mensagens · ${formatPriceCents(pack.priceCents)}`;
}

/** "26/11" from an ISO instant, in the user's time zone. */
export function formatDayMonth(iso: string) {
  return new Date(iso).toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" });
}
