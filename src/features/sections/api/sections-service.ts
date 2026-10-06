import { apiClient } from "@/lib/api/client";
import type { PaginatedResult, PaginationParams } from "@/types/common";
import type {
  CreateSectionRequest,
  MoveSectionRequest,
  Section,
  UpdateSectionRequest,
} from "@/types/section";

export const sectionsService = {
  async listByFolder(folderId: string, params?: PaginationParams) {
    const { data } = await apiClient.get<PaginatedResult<Section>>(
      `/folders/${folderId}/sections`,
      { params }
    );
    return data;
  },

  async create(folderId: string, payload: CreateSectionRequest) {
    const { data } = await apiClient.post<Section>(
      `/folders/${folderId}/sections`,
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
    const { data } = await apiClient.delete<{ deleted: boolean; folderId: string }>(
      `/sections/${sectionId}`
    );
    return data;
  },
};
