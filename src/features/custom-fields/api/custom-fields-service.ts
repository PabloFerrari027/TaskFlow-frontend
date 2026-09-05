import { apiClient } from "@/lib/api/client";
import type { PaginatedResult, PaginationParams } from "@/types/common";
import type {
  CreateCustomFieldDefinitionRequest,
  CustomFieldDefinition,
  SetTaskCustomFieldValueRequest,
  TaskCustomFieldValue,
  UpdateCustomFieldOptionsRequest,
} from "@/types/custom-field";

export const customFieldsService = {
  async listByProject(projectId: string, params?: PaginationParams) {
    const { data } = await apiClient.get<PaginatedResult<CustomFieldDefinition>>(
      `/projects/${projectId}/custom-fields`,
      { params }
    );
    return data;
  },

  async create(projectId: string, payload: CreateCustomFieldDefinitionRequest) {
    const { data } = await apiClient.post<CustomFieldDefinition>(
      `/projects/${projectId}/custom-fields`,
      payload
    );
    return data;
  },

  async updateOptions(definitionId: string, payload: UpdateCustomFieldOptionsRequest) {
    const { data } = await apiClient.patch<CustomFieldDefinition>(
      `/custom-fields/${definitionId}/options`,
      payload
    );
    return data;
  },

  async archive(definitionId: string) {
    const { data } = await apiClient.patch<CustomFieldDefinition>(
      `/custom-fields/${definitionId}/archive`
    );
    return data;
  },

  async listTaskValues(taskId: string, params?: PaginationParams) {
    const { data } = await apiClient.get<PaginatedResult<TaskCustomFieldValue>>(
      `/tasks/${taskId}/custom-field-values`,
      { params }
    );
    return data;
  },

  async setTaskValue(
    taskId: string,
    definitionId: string,
    payload: SetTaskCustomFieldValueRequest
  ) {
    const { data } = await apiClient.patch<TaskCustomFieldValue>(
      `/tasks/${taskId}/custom-field-values/${definitionId}`,
      payload
    );
    return data;
  },
};
