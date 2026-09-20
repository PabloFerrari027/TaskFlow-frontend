import { apiClient } from "@/lib/api/client";
import type { PaginatedResult, PaginationParams } from "@/types/common";
import type {
  AutomationRule,
  CreateAutomationRuleRequest,
  UpdateAutomationRuleRequest,
} from "@/types/automation";

export const automationRulesService = {
  async list(workspaceId: string, params?: PaginationParams) {
    const { data } = await apiClient.get<PaginatedResult<AutomationRule>>(
      `/workspaces/${workspaceId}/automation-rules`,
      { params }
    );
    return data;
  },

  async create(workspaceId: string, payload: CreateAutomationRuleRequest) {
    const { data } = await apiClient.post<AutomationRule>(
      `/workspaces/${workspaceId}/automation-rules`,
      payload
    );
    return data;
  },

  async update(workspaceId: string, ruleId: string, payload: UpdateAutomationRuleRequest) {
    const { data } = await apiClient.patch<AutomationRule>(
      `/workspaces/${workspaceId}/automation-rules/${ruleId}`,
      payload
    );
    return data;
  },

  async remove(workspaceId: string, ruleId: string) {
    const { data } = await apiClient.delete<{ deleted: boolean }>(
      `/workspaces/${workspaceId}/automation-rules/${ruleId}`
    );
    return data;
  },
};
