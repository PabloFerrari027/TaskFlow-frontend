"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { automationRulesService } from "@/features/automations/api/automation-rules-service";
import { queryKeys } from "@/lib/query-keys";
import { getErrorMessage } from "@/lib/errors";
import { MAX_PAGE_SIZE } from "@/types/common";
import type {
  CreateAutomationRuleRequest,
  UpdateAutomationRuleRequest,
} from "@/types/automation";

// A workspace's rules are realistically few — fetched in one go. staleTime 0
// (not the 30s default) because a rule can be switched off by the backend on
// its own (kill switch / lost authority), so reopening the tab must refetch.
export function useAutomationRulesQuery(workspaceId: string) {
  return useQuery({
    queryKey: queryKeys.automations.all(workspaceId),
    queryFn: () => automationRulesService.list(workspaceId, { limit: MAX_PAGE_SIZE }),
    select: (result) => result.data,
    staleTime: 0,
  });
}

export function useCreateAutomationRuleMutation(workspaceId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: CreateAutomationRuleRequest) =>
      automationRulesService.create(workspaceId, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.automations.all(workspaceId) });
      toast.success("Automação criada.");
    },
    onError: (error) => toast.error(getErrorMessage(error)),
  });
}

export function useUpdateAutomationRuleMutation(workspaceId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ ruleId, payload }: { ruleId: string; payload: UpdateAutomationRuleRequest }) =>
      automationRulesService.update(workspaceId, ruleId, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.automations.all(workspaceId) });
      toast.success("Automação atualizada.");
    },
    onError: (error) => toast.error(getErrorMessage(error)),
  });
}

// Separate from the edit mutation only so the toast can say what happened —
// both hit the same PATCH (`enabled` is the sole way to turn a rule back on).
export function useToggleAutomationRuleMutation(workspaceId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ ruleId, enabled }: { ruleId: string; enabled: boolean }) =>
      automationRulesService.update(workspaceId, ruleId, { enabled }),
    onSuccess: (rule) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.automations.all(workspaceId) });
      toast.success(rule.enabled ? "Automação ativada." : "Automação desativada.");
    },
    onError: (error) => toast.error(getErrorMessage(error)),
  });
}

export function useDeleteAutomationRuleMutation(workspaceId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (ruleId: string) => automationRulesService.remove(workspaceId, ruleId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.automations.all(workspaceId) });
      toast.success("Automação excluída.");
    },
    onError: (error) => toast.error(getErrorMessage(error)),
  });
}
