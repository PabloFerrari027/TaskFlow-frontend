"use client";

import { keepPreviousData, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { aiTopUpsService } from "@/features/plans/api/ai-top-ups-service";
import { assistantService } from "@/features/assistant/api/assistant-service";
import { goTo } from "@/features/plans/hooks/use-billing";
import { rememberPendingTopUpPurchase } from "@/features/plans/lib/top-up-confirmation";
import { queryKeys } from "@/lib/query-keys";
import { getErrorCode, getErrorMessage } from "@/lib/errors";
import type { CreateAiTopUpPackRequest, UpdateAiTopUpPackRequest } from "@/types/ai-top-up";

export const TOP_UP_HISTORY_PAGE_SIZE = 10;

/**
 * Percent per window + the top-up summary. `topUp.purchasable` is the only
 * thing that may show a buy button. Not refetched on focus: the endpoint is
 * cheap but the chat and the billing page both read it.
 */
export function useMyAiQuotaQuery(options?: { enabled?: boolean }) {
  return useQuery({
    queryKey: queryKeys.aiUsage.quota(),
    queryFn: () => assistantService.getMyAiQuota(),
    staleTime: 60 * 1000,
    refetchOnWindowFocus: false,
    enabled: options?.enabled,
  });
}

export function useAiTopUpPacksQuery(options?: { enabled?: boolean }) {
  return useQuery({
    queryKey: queryKeys.aiTopUps.packs(),
    queryFn: () => aiTopUpsService.listPacks(),
    enabled: options?.enabled,
  });
}

/** Balance + purchase history. A 403/404 (flag off) is not retried: the section hides. */
export function useMyAiTopUpsQuery(page: number, options?: { enabled?: boolean }) {
  return useQuery({
    queryKey: queryKeys.aiTopUps.mine(page),
    queryFn: () => aiTopUpsService.getMine({ page, limit: TOP_UP_HISTORY_PAGE_SIZE }),
    placeholderData: keepPreviousData,
    retry: false,
    enabled: options?.enabled,
  });
}

/** Pack → Stripe Checkout. The dialog stays locked (isSuccess) while the browser leaves. */
export function useStartAiTopUpCheckoutMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (packId: string) => aiTopUpsService.startCheckout(packId),
    onSuccess: (checkout) => {
      // The paid list never shows PENDING: the return confirms by this id.
      rememberPendingTopUpPurchase(checkout.purchaseId);
      goTo(checkout.url);
    },
    onError: (error) => {
      const code = getErrorCode(error);
      // The catalog or the user's eligibility moved: refresh what the dialog shows.
      if (code === "AI_TOP_UP_PACK_NOT_FOUND") {
        queryClient.invalidateQueries({ queryKey: queryKeys.aiTopUps.packs() });
      }
      if (code === "AI_TOP_UP_UNAVAILABLE") {
        queryClient.invalidateQueries({ queryKey: queryKeys.aiUsage.quota() });
      }
      toast.error(getErrorMessage(error));
    },
  });
}

// ---------------------------------------------------------------- admin (SUPER_ADMIN)

export function useAdminAiTopUpPacksQuery() {
  return useQuery({
    queryKey: queryKeys.aiTopUps.adminPacks(),
    queryFn: () => aiTopUpsService.listAdminPacks(),
    // A 403 means "not a super admin": the page redirects, no retry.
    retry: false,
  });
}

// Shown by the form, not toasted.
const FORM_PACK_ERRORS = new Set(["AI_TOP_UP_PACK_NAME_ALREADY_EXISTS", "INVALID_AI_TOP_UP_PACK"]);

function invalidatePacks(queryClient: ReturnType<typeof useQueryClient>) {
  // The admin list and the users' catalog are separate keys.
  queryClient.invalidateQueries({ queryKey: queryKeys.aiTopUps.packs() });
  queryClient.invalidateQueries({ queryKey: queryKeys.aiTopUps.adminPacks() });
}

export function useCreateAiTopUpPackMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: CreateAiTopUpPackRequest) => aiTopUpsService.createAdminPack(input),
    onSuccess: (pack) => {
      invalidatePacks(queryClient);
      toast.success(`Pacote ${pack.name} criado.`);
    },
    onError: (error) => {
      if (FORM_PACK_ERRORS.has(getErrorCode(error) ?? "")) return;
      toast.error(getErrorMessage(error));
    },
  });
}

export function useUpdateAiTopUpPackMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ packId, input }: { packId: string; input: UpdateAiTopUpPackRequest }) =>
      aiTopUpsService.updateAdminPack(packId, input),
    onSuccess: () => {
      invalidatePacks(queryClient);
      toast.success("Pacote atualizado.");
    },
    onError: (error) => {
      const code = getErrorCode(error);
      if (code === "AI_TOP_UP_PACK_NOT_FOUND") invalidatePacks(queryClient);
      if (FORM_PACK_ERRORS.has(code ?? "")) return;
      toast.error(getErrorMessage(error));
    },
  });
}
