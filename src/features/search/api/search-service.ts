import { apiClient } from "@/lib/api/client";
import type { PaginatedResult } from "@/types/common";
import type { SearchParams, SearchResult } from "@/types/search";

export const searchService = {
  async search(workspaceId: string, { types, ...params }: SearchParams) {
    const { data } = await apiClient.get<PaginatedResult<SearchResult>>(
      `/workspaces/${workspaceId}/search`,
      // The API takes the types comma-separated, not as a repeated param.
      { params: { ...params, types: types?.length ? types.join(",") : undefined } }
    );
    return data;
  },
};
