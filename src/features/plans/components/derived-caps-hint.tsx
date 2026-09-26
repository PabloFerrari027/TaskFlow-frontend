"use client";

import { FormDescription } from "@/components/ui/form";
import { derivedCaps, formatTokensHuman } from "@/features/plans/lib/plan-caps";

// Live preview of the caps TOKEN_QUOTA_GUARD will derive from the monthly
// budget being typed (API.md § 23). `value` is the raw <Input> value.
export function DerivedCapsHint({ value }: { value: unknown }) {
  const monthly = Number(value);
  if (!Number.isInteger(monthly) || monthly < 1) {
    return <FormDescription>Os limites por semana e por dia saem deste número.</FormDescription>;
  }
  const { weekly, daily } = derivedCaps(monthly);
  return (
    <FormDescription>
      Cerca de {formatTokensHuman(weekly)} por semana (÷ 4) e {formatTokensHuman(daily)} por dia
      (÷ 30).
    </FormDescription>
  );
}
