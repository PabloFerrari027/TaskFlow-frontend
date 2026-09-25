"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { plansService } from "@/features/plans/api/plans-service";
import { queryKeys } from "@/lib/query-keys";
import { getErrorCode, getErrorMessage } from "@/lib/errors";

export function usePlansQuery() {
  return useQuery({
    queryKey: queryKeys.plans.all(),
    queryFn: () => plansService.list(),
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
