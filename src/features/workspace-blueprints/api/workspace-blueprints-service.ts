import { apiClient } from "@/lib/api/client";
import type {
  ApplyWorkspaceBlueprintRequest,
  BlueprintApplication,
  WorkspaceBlueprint,
  WorkspaceBlueprintFilters,
  WorkspaceBlueprintSummary,
} from "@/types/workspace-blueprint";

export const workspaceBlueprintsService = {
  async list(filters?: WorkspaceBlueprintFilters) {
    const { data } = await apiClient.get<WorkspaceBlueprintSummary[]>("/workspace-blueprints", {
      params: filters,
    });
    return data;
  },

  async get(key: string) {
    const { data } = await apiClient.get<WorkspaceBlueprint>(
      `/workspace-blueprints/${encodeURIComponent(key)}`
    );
    return data;
  },

  async apply(workspaceId: string, key: string, payload: ApplyWorkspaceBlueprintRequest) {
    const { data } = await apiClient.post<BlueprintApplication>(
      `/workspaces/${workspaceId}/workspace-blueprints/${encodeURIComponent(key)}/apply`,
      payload
    );
    return data;
  },

  async getApplication(workspaceId: string, applicationId: string) {
    const { data } = await apiClient.get<BlueprintApplication>(
      `/workspaces/${workspaceId}/blueprint-applications/${applicationId}`
    );
    return data;
  },
};
