import { apiClient } from "@/lib/api/client";
import type { AiReasoningEffort, AiRule, AiRuleInput, AiSettings } from "@/types/ai-settings";

export const aiSettingsService = {
  async get() {
    const { data } = await apiClient.get<AiSettings>("/admin/ai-settings");
    return data;
  },

  async createRule(groupKey: string, input: AiRuleInput) {
    const { data } = await apiClient.post<AiRule>("/admin/ai-settings/rules", { groupKey, ...input });
    return data;
  },

  async updateRule(ruleId: string, input: Partial<AiRuleInput>) {
    const { data } = await apiClient.patch<AiRule>(`/admin/ai-settings/rules/${ruleId}`, input);
    return data;
  },

  async deleteRule(ruleId: string) {
    await apiClient.delete(`/admin/ai-settings/rules/${ruleId}`);
  },

  async restoreRule(ruleId: string) {
    const { data } = await apiClient.post<AiRule>(`/admin/ai-settings/rules/${ruleId}/restore`);
    return data;
  },

  async setRuleEnabled(planId: string, ruleId: string, enabled: boolean) {
    await apiClient.put(`/admin/ai-settings/plans/${planId}/rules/${ruleId}`, { enabled });
  },

  async setGroupEnabled(planId: string, groupKey: string, enabled: boolean) {
    await apiClient.put(`/admin/ai-settings/plans/${planId}/groups/${groupKey}`, { enabled });
  },

  /** `model: null` volta a tarefa ao padrão do servidor neste plano. */
  async setTaskModel(planId: string, task: string, model: string | null, reasoningEffort: AiReasoningEffort | null) {
    await apiClient.put(`/admin/ai-settings/plans/${planId}/tasks/${task}`, { model, reasoningEffort });
  },
};
