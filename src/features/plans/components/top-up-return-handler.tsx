"use client";

import { useQueryClient } from "@tanstack/react-query";
import { aiTopUpsService } from "@/features/plans/api/ai-top-ups-service";
import { TOP_UP_HISTORY_PAGE_SIZE } from "@/features/plans/hooks/use-ai-top-ups";
import { usePaymentReturn } from "@/features/plans/hooks/use-payment-return";
import { formatCredits } from "@/features/plans/lib/top-up";
import { queryKeys } from "@/lib/query-keys";
import type { MyAiTopUps } from "@/types/ai-top-up";

// The webhook moved the balance, or settled the newest purchase (list order:
// newest first). Compared with the first picture seen after the return.
function isTopUpConfirmed(data: MyAiTopUps | undefined, first: MyAiTopUps | undefined) {
  if (!data) return false;
  if (first && data.balance.credits !== first.balance.credits) return true;
  const newest = data.purchases.data[0];
  return newest !== undefined && newest.status !== "PENDING";
}

/**
 * Where Stripe sends the user back after buying credits (`?topUp=success|cancel`).
 * Polls `GET /billing/ai-top-ups/me` (page 1, the one the section shows)
 * until the balance moves, then refreshes the quota so every buy/CTA state
 * catches up. Renders nothing.
 */
export function TopUpReturnHandler() {
  const queryClient = useQueryClient();

  usePaymentReturn<MyAiTopUps>({
    param: "topUp",
    toastId: "top-up-return",
    cancelMessage: "Compra cancelada. Nada foi cobrado.",
    pendingMessage: "Confirmando a compra dos créditos…",
    timeoutMessage: "Ainda estamos confirmando a compra. Os créditos entram assim que o Stripe avisar.",
    confirmedMessage: (data) => `Compra confirmada. Você tem ${formatCredits(data.balance.credits)} créditos.`,
    queryKey: queryKeys.aiTopUps.mine(1),
    queryFn: () => aiTopUpsService.getMine({ page: 1, limit: TOP_UP_HISTORY_PAGE_SIZE }),
    isConfirmed: isTopUpConfirmed,
    onConfirmed: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.aiUsage.quota() });
    },
  });
  return null;
}
