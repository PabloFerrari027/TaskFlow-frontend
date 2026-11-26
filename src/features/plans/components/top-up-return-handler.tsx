"use client";

import * as React from "react";
import { useQueryClient } from "@tanstack/react-query";
import { aiTopUpsService } from "@/features/plans/api/ai-top-ups-service";
import { TOP_UP_HISTORY_PAGE_SIZE } from "@/features/plans/hooks/use-ai-top-ups";
import { usePaymentReturn } from "@/features/plans/hooks/use-payment-return";
import { formatCredits } from "@/features/plans/lib/top-up";
import {
  clearPendingTopUpPurchase,
  isTopUpConfirmed,
  readPendingTopUpPurchase,
} from "@/features/plans/lib/top-up-confirmation";
import { queryKeys } from "@/lib/query-keys";
import type { MyAiTopUps } from "@/types/ai-top-up";

/**
 * Where Stripe sends the user back after buying credits (`?topUp=success|cancel`).
 * Polls `GET /billing/ai-top-ups/me` (page 1, the one the section shows)
 * until that purchase shows up in the paid list (or, without its id, the
 * balance moves), then refreshes the quota so every buy/CTA state
 * catches up. Renders nothing.
 */
export function TopUpReturnHandler() {
  const queryClient = useQueryClient();
  // The purchase the checkout opened (saved before leaving for Stripe).
  const [purchaseId] = React.useState(readPendingTopUpPurchase);

  usePaymentReturn<MyAiTopUps>({
    param: "topUp",
    toastId: "top-up-return",
    cancelMessage: "Compra cancelada. Nada foi cobrado.",
    pendingMessage: "Confirmando a compra dos créditos…",
    timeoutMessage: "Ainda estamos confirmando a compra. Os créditos entram assim que o Stripe avisar.",
    confirmedMessage: (data) => `Compra confirmada. Você tem ${formatCredits(data.balance.credits)} créditos.`,
    queryKey: queryKeys.aiTopUps.mine(1),
    queryFn: () => aiTopUpsService.getMine({ page: 1, limit: TOP_UP_HISTORY_PAGE_SIZE }),
    isConfirmed: (data, first) => isTopUpConfirmed(data, first, purchaseId),
    onConfirmed: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.aiUsage.quota() });
    },
    onSettled: clearPendingTopUpPurchase,
  });
  return null;
}
