// TOKEN_QUOTA_GUARD derives the daily/weekly caps from the only stored number
// with fixed divisors — not an exact share of the month (API.md § 23).
const DAYS_DIVISOR = 30;
const WEEKS_DIVISOR = 4;

// The plan TOKEN_QUOTA_GUARD falls back to while a user has never been given
// one — guaranteed in the catalog by the backend seed (API.md § 23).
export const DEFAULT_PLAN_NAME = "FREE";

export function derivedCaps(monthlyTokenBudget: number) {
  return {
    daily: monthlyTokenBudget / DAYS_DIVISOR,
    weekly: monthlyTokenBudget / WEEKS_DIVISOR,
  };
}

const integerFormat = new Intl.NumberFormat("pt-BR", { maximumFractionDigits: 0 });
const decimalFormat = new Intl.NumberFormat("pt-BR", { maximumFractionDigits: 1 });

// "33 mil tokens", "1,2 milhão de tokens" — easier to read than "33.333 tokens"
// for the lay audience, and the derived caps aren't round numbers anyway.
export function formatTokensHuman(value: number): string {
  if (value < 1_000) return `${integerFormat.format(value)} tokens`;
  if (value < 1_000_000) return `${integerFormat.format(value / 1_000)} mil tokens`;
  const millions = value / 1_000_000;
  const unit = millions < 2 ? "milhão" : "milhões";
  return `${decimalFormat.format(millions)} ${unit} de tokens`;
}

// Start of each quota window, all in UTC (API.md § 23): midnight, Monday
// 00:00 and the 1st at 00:00. Summing usage from these instants reproduces
// what the guard counts.
export function quotaWindowStarts(now: Date) {
  const day = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
  // getUTCDay(): Sunday = 0 — shift so Monday is 0.
  const daysSinceMonday = (day.getUTCDay() + 6) % 7;
  const week = new Date(day.getTime() - daysSinceMonday * 24 * 60 * 60 * 1000);
  const month = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));
  return { day, week, month };
}

// What UTC midnight is on the viewer's clock (e.g. "21:00" in Brasília), so
// "reinicia à meia-noite UTC" means something to someone who doesn't know UTC.
// Uses today's midnight (not a fixed date) so the offset matches the current
// daylight-saving rules.
export function utcMidnightInLocalTime(now: Date = new Date()): string {
  return new Intl.DateTimeFormat("pt-BR", { hour: "2-digit", minute: "2-digit" }).format(
    quotaWindowStarts(now).day
  );
}
