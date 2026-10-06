import { apiClient } from "@/lib/api/client";
import type { PaginatedResult, PaginationParams } from "@/types/common";
import type {
  CreateCustomFieldDefinitionRequest,
  CustomFieldDefinition,
  SetItemCustomFieldValueRequest,
  ItemCustomFieldValue,
  UpdateCustomFieldDetailsRequest,
  UpdateCustomFieldOptionsRequest,
} from "@/types/custom-field";

export const customFieldsService = {
  async listByFolder(folderId: string, params?: PaginationParams) {
    const { data } = await apiClient.get<PaginatedResult<CustomFieldDefinition>>(
      `/folders/${folderId}/custom-fields`,
      { params }
    );
    return data;
  },

  async create(folderId: string, payload: CreateCustomFieldDefinitionRequest) {
    const { data } = await apiClient.post<CustomFieldDefinition>(
      `/folders/${folderId}/custom-fields`,
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

  async updateDetails(definitionId: string, payload: UpdateCustomFieldDetailsRequest) {
    const { data } = await apiClient.patch<CustomFieldDefinition>(
      `/custom-fields/${definitionId}/details`,
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

  async listItemValues(itemId: string, params?: PaginationParams) {
    const { data } = await apiClient.get<PaginatedResult<ItemCustomFieldValue>>(
      `/items/${itemId}/custom-field-values`,
      { params }
    );
    return data;
  },

  async setItemValue(
    itemId: string,
    definitionId: string,
    payload: SetItemCustomFieldValueRequest
  ) {
    const { data } = await apiClient.patch<ItemCustomFieldValue>(
      `/items/${itemId}/custom-field-values/${definitionId}`,
      payload
    );
    return data;
  },
};
