import { apiClient } from "@/lib/api/client";
import type { PaginatedResult } from "@/types/common";
import type {
  AdminProjectTemplateFilters,
  CreateProjectTemplateRequest,
  InstantiateProjectTemplateRequest,
  InstantiateProjectTemplateResponse,
  ModerateProjectTemplateRequest,
  ProjectTemplate,
  ProjectTemplateCategoryInfo,
  ProjectTemplateCheckoutResponse,
  ProjectTemplateDetail,
  ProjectTemplateFilters,
  ProjectTemplateSummary,
  PublishProjectAsTemplateRequest,
  UpdateProjectTemplateListingRequest,
  UpdateProjectTemplateRequest,
} from "@/types/project-template";

export const projectTemplatesService = {
  // Hub (API.md § 26.2): only PUBLISHED templates, no skeleton — just counts.
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

  // Every status, newest first.
  async mine() {
    const { data } = await apiClient.get<ProjectTemplateDetail[]>("/project-templates/mine");
    return data;
  },

  async purchased() {
    const { data } = await apiClient.get<ProjectTemplateDetail[]>(
      "/project-templates/purchased"
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

  // Author (API.md § 26.4–26.5). Someone else's template answers 404.
  async publishFromProject(projectId: string, input: PublishProjectAsTemplateRequest) {
    const { data } = await apiClient.post<ProjectTemplateDetail>(
      `/projects/${projectId}/publish-as-template`,
      input
    );
    return data;
  },

  // The skeleton is never editable here — only the listing.
  async update(templateId: string, input: UpdateProjectTemplateListingRequest) {
    const { data } = await apiClient.patch<ProjectTemplateDetail>(
      `/project-templates/${templateId}`,
      input
    );
    return data;
  },

  async publish(templateId: string) {
    const { data } = await apiClient.post<ProjectTemplateDetail>(
      `/project-templates/${templateId}/publish`
    );
    return data;
  },

  async unpublish(templateId: string) {
    const { data } = await apiClient.post<ProjectTemplateDetail>(
      `/project-templates/${templateId}/unpublish`
    );
    return data;
  },

  // 204 with no body.
  async delete(templateId: string) {
    await apiClient.delete(`/project-templates/${templateId}`);
  },

  // Calling it again while a checkout is still open returns the same session,
  // so a double click never charges twice (API.md § 26.6).
  async checkout(templateId: string) {
    const { data } = await apiClient.post<ProjectTemplateCheckoutResponse>(
      `/project-templates/${templateId}/checkout`
    );
    return data;
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

  async adminRemove(templateId: string, input: ModerateProjectTemplateRequest = {}) {
    const { data } = await apiClient.post<ProjectTemplate>(
      `/admin/project-templates/${templateId}/remove`,
      input
    );
    return data;
  },

  async adminRestore(templateId: string, input: ModerateProjectTemplateRequest = {}) {
    const { data } = await apiClient.post<ProjectTemplate>(
      `/admin/project-templates/${templateId}/restore`,
      input
    );
    return data;
  },
};
