"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { aiSettingsService } from "@/features/admin/api/ai-settings-service";
import { queryKeys } from "@/lib/query-keys";
import { getErrorMessage } from "@/lib/errors";
import type { AiReasoningEffort, AiRuleInput } from "@/types/ai-settings";

export function useAiSettingsQuery() {
  return useQuery({ queryKey: queryKeys.aiSettings.all(), queryFn: () => aiSettingsService.get() });
}

/**
 * Toda mudança relê a tela inteira (poucas dezenas de linhas): o servidor é quem sabe o efeito de um
 * grupo desligado sobre as regras dele. Erros viram toast; sucesso não — o interruptor já mostra.
 */
function useAiSettingsMutation<TVariables>(mutationFn: (variables: TVariables) => Promise<unknown>, successMessage?: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn,
    onSuccess: () => {
      if (successMessage) toast.success(successMessage);
    },
    onError: (error) => toast.error(getErrorMessage(error)),
    onSettled: () => queryClient.invalidateQueries({ queryKey: queryKeys.aiSettings.all() }),
  });
}

export function useSetRuleEnabledMutation() {
  return useAiSettingsMutation((v: { planId: string; ruleId: string; enabled: boolean }) =>
    aiSettingsService.setRuleEnabled(v.planId, v.ruleId, v.enabled)
  );
}

export function useSetGroupEnabledMutation() {
  return useAiSettingsMutation((v: { planId: string; groupKey: string; enabled: boolean }) =>
    aiSettingsService.setGroupEnabled(v.planId, v.groupKey, v.enabled)
  );
}

export function useCreateRuleMutation() {
  return useAiSettingsMutation((v: { groupKey: string; input: AiRuleInput }) => aiSettingsService.createRule(v.groupKey, v.input), "Regra criada.");
}

export function useUpdateRuleMutation() {
  return useAiSettingsMutation((v: { ruleId: string; input: Partial<AiRuleInput> }) => aiSettingsService.updateRule(v.ruleId, v.input), "Regra salva.");
}

export function useDeleteRuleMutation() {
  return useAiSettingsMutation((ruleId: string) => aiSettingsService.deleteRule(ruleId), "Regra apagada.");
}

export function useRestoreRuleMutation() {
  return useAiSettingsMutation((ruleId: string) => aiSettingsService.restoreRule(ruleId), "Texto original de volta.");
}

export function useSetTaskModelMutation() {
  return useAiSettingsMutation(
    (v: { planId: string; task: string; model: string | null; reasoningEffort: AiReasoningEffort | null }) =>
      aiSettingsService.setTaskModel(v.planId, v.task, v.model, v.reasoningEffort),
    "Modelo salvo."
  );
}
