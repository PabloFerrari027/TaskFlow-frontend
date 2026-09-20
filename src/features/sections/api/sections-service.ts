import { apiClient } from "@/lib/api/client";
import type { PaginatedResult, PaginationParams } from "@/types/common";
import type {
  CreateSectionRequest,
  MoveSectionRequest,
  Section,
  UpdateSectionRequest,
} from "@/types/section";

export const sectionsService = {
  async listByProject(projectId: string, params?: PaginationParams) {
    const { data } = await apiClient.get<PaginatedResult<Section>>(
      `/projects/${projectId}/sections`,
      { params }
    );
    return data;
  },

  async create(projectId: string, payload: CreateSectionRequest) {
    const { data } = await apiClient.post<Section>(
      `/projects/${projectId}/sections`,
      payload
    );
    return data;
  },

  async update(sectionId: string, payload: UpdateSectionRequest) {
    const { data } = await apiClient.patch<Section>(`/sections/${sectionId}`, payload);
    return data;
  },

  async move(sectionId: string, payload: MoveSectionRequest) {
    const { data } = await apiClient.patch<Section>(`/sections/${sectionId}/move`, payload);
    return data;
  },

  async remove(sectionId: string) {
    const { data } = await apiClient.delete<{ deleted: boolean; projectId: string }>(
      `/sections/${sectionId}`
    );
    return data;
  },
};
