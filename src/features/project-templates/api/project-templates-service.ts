import { apiClient } from "@/lib/api/client";
import type { PaginatedResult } from "@/types/common";
import type {
  AdminProjectTemplateFilters,
  CreateProjectTemplateRequest,
  InstantiateProjectTemplateRequest,
  InstantiateProjectTemplateResponse,
  ProjectTemplate,
  ProjectTemplateCategoryInfo,
  ProjectTemplateDetail,
  ProjectTemplateFilters,
  ProjectTemplateSummary,
  SaveProjectAsTemplateRequest,
  UpdateProjectTemplateListingRequest,
  UpdateProjectTemplateRequest,
} from "@/types/project-template";

export const projectTemplatesService = {
  // System catalog (API.md § 26.2): the API only ever lists system templates
  // here, no skeleton — just counts. It rejects unknown query params (400).
  async list(filters: ProjectTemplateFilters = {}) {
    const { data } = await apiClient.get<PaginatedResult<ProjectTemplateSummary>>(
      "/project-templates",
      { params: filters }
    );
    return data;
  },

  async categories() {
    const { data } = await apiClient.get<ProjectTemplateCategoryInfo[]>(
      "/project-templates/categories"
    );
    return data;
  },

  async get(templateId: string) {
    const { data } = await apiClient.get<ProjectTemplateDetail>(
      `/project-templates/${templateId}`
    );
    return data;
  },

  async instantiate(
    workspaceId: string,
    templateId: string,
    input: InstantiateProjectTemplateRequest
  ) {
    const { data } = await apiClient.post<InstantiateProjectTemplateResponse>(
      `/workspaces/${workspaceId}/project-templates/${templateId}/instantiate`,
      input
    );
    return data;
  },

  // Workspace templates (API.md § 26.7): private, visible to members only.
  async listForWorkspace(workspaceId: string) {
    const { data } = await apiClient.get<ProjectTemplateDetail[]>(
      `/workspaces/${workspaceId}/project-templates`
    );
    return data;
  },

  async saveFromProject(projectId: string, input: SaveProjectAsTemplateRequest) {
    const { data } = await apiClient.post<ProjectTemplateDetail>(
      `/projects/${projectId}/save-as-workspace-template`,
      input
    );
    return data;
  },

  // Name/description/category only — the skeleton is never editable here.
  async update(templateId: string, input: UpdateProjectTemplateListingRequest) {
    const { data } = await apiClient.patch<ProjectTemplateDetail>(
      `/project-templates/${templateId}`,
      input
    );
    return data;
  },

  // 204 with no body.
  async delete(templateId: string) {
    await apiClient.delete(`/project-templates/${templateId}`);
  },

  // Admin (SUPER_ADMIN only, API.md § 26.7).
  async adminList(filters: AdminProjectTemplateFilters = {}) {
    const { data } = await apiClient.get<PaginatedResult<ProjectTemplateSummary>>(
      "/admin/project-templates",
      { params: filters }
    );
    return data;
  },

  async adminCreate(input: CreateProjectTemplateRequest) {
    const { data } = await apiClient.post<ProjectTemplate>("/admin/project-templates", input);
    return data;
  },

  async adminUpdate(templateId: string, input: UpdateProjectTemplateRequest) {
    const { data } = await apiClient.patch<ProjectTemplate>(
      `/admin/project-templates/${templateId}`,
      input
    );
    return data;
  },

  // 204 with no body.
  async adminDelete(templateId: string) {
    await apiClient.delete(`/admin/project-templates/${templateId}`);
  },
};
