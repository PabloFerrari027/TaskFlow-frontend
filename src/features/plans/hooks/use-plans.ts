"use client";

import { useMutation, useQueries, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { plansService } from "@/features/plans/api/plans-service";
import { assistantService } from "@/features/assistant/api/assistant-service";
import { quotaWindowStarts } from "@/features/plans/lib/plan-caps";
import { queryKeys } from "@/lib/query-keys";
import { getErrorCode, getErrorMessage } from "@/lib/errors";

export function usePlansQuery() {
  return useQuery({
    queryKey: queryKeys.plans.all(),
    queryFn: () => plansService.list(),
  });
}

export const QUOTA_WINDOWS = ["day", "week", "month"] as const;
export type QuotaWindow = (typeof QUOTA_WINDOWS)[number];

// `/ai-usage/me` is throttled to 30 req/60s and each call aggregates the whole
// range (API.md § 1.4), so these three stay cached for a while and only
// refresh on demand — not on focus, not on every mount.
const WINDOW_USAGE_STALE_TIME = 5 * 60 * 1000;

// Tokens spent since the start of a quota window, read from
// `summary.totalTokens` with the smallest page of `items`. Deliberately not
// compared to a cap: the user's current plan can't be read (API.md § 23).
function quotaWindowUsageOptions(window: QuotaWindow, now: Date) {
  const from = quotaWindowStarts(now)[window].toISOString();
  return {
    queryKey: queryKeys.aiUsage.window(window, from),
    queryFn: async () => {
      const { summary } = await assistantService.getMyAiUsage({ from, page: 1, limit: 1 });
      return summary.totalTokens;
    },
    staleTime: WINDOW_USAGE_STALE_TIME,
    refetchOnWindowFocus: false,
  };
}

export function useQuotaWindowUsageQuery(window: QuotaWindow, options?: { enabled?: boolean }) {
  return useQuery({ ...quotaWindowUsageOptions(window, new Date()), enabled: options?.enabled });
}

export function useQuotaWindowsUsageQueries() {
  const now = new Date();
  return useQueries({
    queries: QUOTA_WINDOWS.map((window) => quotaWindowUsageOptions(window, now)),
  });
}

// `PATCH /plans/me` answers 200 with no body — there's nothing to write back
// to the cache, and no endpoint to re-read the user's plan from (API.md § 23).
export function useSetMyPlanMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (plan: { id: string; name: string }) => plansService.setMine(plan.id),
    onSuccess: (_data, plan) => toast.success(`Plano ${plan.name} escolhido.`),
    onError: (error) => {
      // A SUPER_ADMIN may have removed or changed the plan since the list
      // loaded — refresh it so the user picks from what exists now.
      if (getErrorCode(error) === "PLAN_NOT_FOUND") {
        queryClient.invalidateQueries({ queryKey: queryKeys.plans.all() });
        toast.error("Esse plano não está mais disponível. A lista foi atualizada.");
        return;
      }
      toast.error(getErrorMessage(error));
    },
  });
}

export function useAdminPlansQuery() {
  return useQuery({
    queryKey: queryKeys.plans.admin.all(),
    queryFn: () => plansService.adminList(),
  });
}

export function useCreatePlanMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: { name: string; monthlyTokenBudget: number }) =>
      plansService.adminCreate(input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.plans.admin.all() });
      toast.success("Plano criado.");
    },
    onError: (error) => {
      // A duplicate name is a field error, shown inline by the form — not a
      // generic toast.
      if (getErrorCode(error) === "PLAN_NAME_ALREADY_EXISTS") return;
      toast.error(getErrorMessage(error));
    },
  });
}

export function useUpdatePlanMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      planId,
      monthlyTokenBudget,
    }: {
      planId: string;
      monthlyTokenBudget: number;
    }) => plansService.adminUpdate(planId, { monthlyTokenBudget }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.plans.admin.all() });
      toast.success("Plano atualizado.");
    },
    onError: (error) => toast.error(getErrorMessage(error)),
  });
}

export function useAssignUserPlanMutation() {
  return useMutation({
    mutationFn: ({ userId, planId }: { userId: string; planId: string }) =>
      plansService.assignToUser(userId, planId),
    onSuccess: () => toast.success("Plano do cliente atualizado."),
    onError: (error) => toast.error(getErrorMessage(error)),
  });
}
