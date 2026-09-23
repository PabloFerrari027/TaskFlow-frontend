import { apiClient } from "@/lib/api/client";
import type { PaginatedResult, PaginationParams } from "@/types/common";
import type {
  ApiKeyDto,
  CreateApiKeyRequest,
  CreateWebhookEndpointRequest,
  UpdateApiKeyRequest,
  UpdateWebhookEndpointRequest,
  WebhookDeliveryDto,
  WebhookEndpointDto,
} from "@/types/developer";

export const apiKeysService = {
  async list(workspaceId: string, params?: PaginationParams) {
    const { data } = await apiClient.get<PaginatedResult<ApiKeyDto>>(
      `/workspaces/${workspaceId}/api-keys`,
      { params }
    );
    return data;
  },

  async create(workspaceId: string, payload: CreateApiKeyRequest) {
    const { data } = await apiClient.post<ApiKeyDto>(
      `/workspaces/${workspaceId}/api-keys`,
      payload
    );
    return data;
  },

  async update(workspaceId: string, apiKeyId: string, payload: UpdateApiKeyRequest) {
    const { data } = await apiClient.patch<ApiKeyDto>(
      `/workspaces/${workspaceId}/api-keys/${apiKeyId}`,
      payload
    );
    return data;
  },

  async rotate(workspaceId: string, apiKeyId: string) {
    const { data } = await apiClient.post<ApiKeyDto>(
      `/workspaces/${workspaceId}/api-keys/${apiKeyId}/rotate`
    );
    return data;
  },

  async revoke(workspaceId: string, apiKeyId: string) {
    const { data } = await apiClient.delete<{ revoked: boolean }>(
      `/workspaces/${workspaceId}/api-keys/${apiKeyId}`
    );
    return data;
  },
};

export const webhookEndpointsService = {
  async list(workspaceId: string, params?: PaginationParams) {
    const { data } = await apiClient.get<PaginatedResult<WebhookEndpointDto>>(
      `/workspaces/${workspaceId}/webhook-endpoints`,
      { params }
    );
    return data;
  },

  async create(workspaceId: string, payload: CreateWebhookEndpointRequest) {
    const { data } = await apiClient.post<WebhookEndpointDto>(
      `/workspaces/${workspaceId}/webhook-endpoints`,
      payload
    );
    return data;
  },

  async update(
    workspaceId: string,
    webhookEndpointId: string,
    payload: UpdateWebhookEndpointRequest
  ) {
    const { data } = await apiClient.patch<WebhookEndpointDto>(
      `/workspaces/${workspaceId}/webhook-endpoints/${webhookEndpointId}`,
      payload
    );
    return data;
  },

  async remove(workspaceId: string, webhookEndpointId: string) {
    const { data } = await apiClient.delete<{ deleted: boolean }>(
      `/workspaces/${workspaceId}/webhook-endpoints/${webhookEndpointId}`
    );
    return data;
  },

  async rotateSecret(workspaceId: string, webhookEndpointId: string) {
    const { data } = await apiClient.post<WebhookEndpointDto>(
      `/workspaces/${workspaceId}/webhook-endpoints/${webhookEndpointId}/rotate-secret`
    );
    return data;
  },

  async ping(workspaceId: string, webhookEndpointId: string) {
    const { data } = await apiClient.post<WebhookDeliveryDto>(
      `/workspaces/${workspaceId}/webhook-endpoints/${webhookEndpointId}/ping`
    );
    return data;
  },
};

export const webhookDeliveriesService = {
  async list(workspaceId: string, webhookEndpointId: string, params?: PaginationParams) {
    const { data } = await apiClient.get<PaginatedResult<WebhookDeliveryDto>>(
      `/workspaces/${workspaceId}/webhook-endpoints/${webhookEndpointId}/deliveries`,
      { params }
    );
    return data;
  },

  async redeliver(workspaceId: string, webhookEndpointId: string, deliveryId: string) {
    const { data } = await apiClient.post<WebhookDeliveryDto>(
      `/workspaces/${workspaceId}/webhook-endpoints/${webhookEndpointId}/deliveries/${deliveryId}/redeliver`
    );
    return data;
  },
};
