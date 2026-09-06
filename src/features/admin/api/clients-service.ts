import { apiClient } from "@/lib/api/client";
import type { PaginatedResult } from "@/types/common";
import type { ClientDetail, ClientListItem, ListClientsParams } from "@/types/client";

export const clientsService = {
  async list(params?: ListClientsParams) {
    const { data } = await apiClient.get<PaginatedResult<ClientListItem>>(
      "/admin/clients",
      { params }
    );
    return data;
  },

  async get(clientId: string) {
    const { data } = await apiClient.get<ClientDetail>(`/admin/clients/${clientId}`);
    return data;
  },

  async suspend(clientId: string) {
    const { data } = await apiClient.patch<ClientListItem>(
      `/admin/clients/${clientId}/suspend`
    );
    return data;
  },

  async activate(clientId: string) {
    const { data } = await apiClient.patch<ClientListItem>(
      `/admin/clients/${clientId}/activate`
    );
    return data;
  },

  async close(clientId: string) {
    const { data } = await apiClient.delete<ClientListItem>(
      `/admin/clients/${clientId}`
    );
    return data;
  },
};
