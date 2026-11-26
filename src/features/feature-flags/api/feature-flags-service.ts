import { apiClient } from "@/lib/api/client";
import type { MyFeatures } from "@/types/feature-flag";

export const featureFlagsService = {
  // Pass the open workspace so workspace-scoped rules are applied.
  async getMine(workspaceId?: string) {
    const { data } = await apiClient.get<MyFeatures>("/features/me", {
      params: workspaceId ? { workspaceId } : undefined,
    });
    return data;
  },
};
