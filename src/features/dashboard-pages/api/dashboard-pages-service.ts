import { apiClient } from "@/lib/api/client";
import type {
  AuthenticatedDashboardPageView,
  ChartDefinition,
  ChartDefinitionRequest,
  CreateAccessGrantRequest,
  CreateDashboardPageRequest,
  DashboardPageSummary,
  DashboardPageView,
  PageAccessGrant,
  PublicAccessTokenResponse,
  UpdateDashboardPageRequest,
} from "@/types/dashboard-page";

export const dashboardPagesService = {
  async list(workspaceId: string) {
    const { data } = await apiClient.get<DashboardPageSummary[]>(
      `/workspaces/${workspaceId}/dashboard-pages`
    );
    return data;
  },

  async get(workspaceId: string, pageId: string) {
    const { data } = await apiClient.get<AuthenticatedDashboardPageView>(
      `/workspaces/${workspaceId}/dashboard-pages/${pageId}`
    );
    return data;
  },

  async create(workspaceId: string, payload: CreateDashboardPageRequest) {
    const { data } = await apiClient.post<DashboardPageSummary>(
      `/workspaces/${workspaceId}/dashboard-pages`,
      payload
    );
    return data;
  },

  async update(workspaceId: string, pageId: string, payload: UpdateDashboardPageRequest) {
    const { data } = await apiClient.patch<DashboardPageSummary>(
      `/workspaces/${workspaceId}/dashboard-pages/${pageId}`,
      payload
    );
    return data;
  },

  async remove(workspaceId: string, pageId: string) {
    await apiClient.delete(`/workspaces/${workspaceId}/dashboard-pages/${pageId}`);
  },

  // Also turns the page PUBLIC if it wasn't yet. Any previous link stops
  // working the moment this returns.
  async regeneratePublicToken(workspaceId: string, pageId: string) {
    const { data } = await apiClient.post<PublicAccessTokenResponse>(
      `/workspaces/${workspaceId}/dashboard-pages/${pageId}/regenerate-public-token`
    );
    return data;
  },

  async listAccessGrants(workspaceId: string, pageId: string) {
    const { data } = await apiClient.get<PageAccessGrant[]>(
      `/workspaces/${workspaceId}/dashboard-pages/${pageId}/access-grants`
    );
    return data;
  },

  async createAccessGrant(workspaceId: string, pageId: string, payload: CreateAccessGrantRequest) {
    const { data } = await apiClient.post<PageAccessGrant>(
      `/workspaces/${workspaceId}/dashboard-pages/${pageId}/access-grants`,
      payload
    );
    return data;
  },

  async revokeAccessGrant(workspaceId: string, pageId: string, grantId: string) {
    await apiClient.delete(
      `/workspaces/${workspaceId}/dashboard-pages/${pageId}/access-grants/${grantId}`
    );
  },
};

// Chart routes are scoped to the page only — no workspaceId in the path.
export const chartDefinitionsService = {
  async create(pageId: string, payload: ChartDefinitionRequest) {
    const { data } = await apiClient.post<ChartDefinition>(
      `/dashboard-pages/${pageId}/charts`,
      payload
    );
    return data;
  },

  async update(pageId: string, chartId: string, payload: Partial<ChartDefinitionRequest>) {
    const { data } = await apiClient.patch<ChartDefinition>(
      `/dashboard-pages/${pageId}/charts/${chartId}`,
      payload
    );
    return data;
  },

  async remove(pageId: string, chartId: string) {
    await apiClient.delete(`/dashboard-pages/${pageId}/charts/${chartId}`);
  },
};

export type SharedPageLinkKind = "public" | "guest";

// The only anonymous calls in the app: the token in the URL is the whole
// authorization. `_skipAuth` keeps the interceptor from attaching a session
// token (a logged-in visitor must see exactly what an anonymous one sees)
// and from redirecting to /login on failure.
export async function getSharedDashboardPage(kind: SharedPageLinkKind, token: string) {
  const { data } = await apiClient.get<DashboardPageView>(
    `/pages/${kind}/${encodeURIComponent(token)}`,
    { _skipAuth: true }
  );
  return data;
}
