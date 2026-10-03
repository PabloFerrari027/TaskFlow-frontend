import { apiClient } from "@/lib/api/client";
import type { PaginatedResult } from "@/types/common";
import type {
  AdminProjectTemplateFilters,
  ApplyProjectTemplateRequest,
  CreateProjectTemplateRequest,
  InstantiateDraftRequest,
  InstantiateProjectTemplateRequest,
  InstantiateProjectTemplateResponse,
  ProjectTemplate,
  ProjectTemplateCategoryInfo,
  ProjectTemplateDetail,
  ProjectTemplateDraft,
  ProjectTemplateFilters,
  ProjectTemplateLanguage,
  ProjectTemplateVersion,
  PublishTemplateVersionRequest,
  TemplateInstantiation,
  ProjectTemplateSummary,
  SaveProjectAsTemplateRequest,
  UpdateProjectTemplateListingRequest,
  UpdateProjectTemplateRequest,
} from "@/types/project-template";

const mediaBase = (admin: boolean) => (admin ? "/admin/project-templates" : "/project-templates");

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

  // Adds the template to an existing project (sections/tasks go after the
  // existing ones; a field with the same name and type is reused).
  async apply(projectId: string, templateId: string, input: ApplyProjectTemplateRequest) {
    const { data } = await apiClient.post<InstantiateProjectTemplateResponse>(
      `/projects/${projectId}/apply-template/${templateId}`,
      input
    );
    return data;
  },

  // A skeleton that isn't a saved template (e.g. an AI draft), same validation.
  async instantiateDraft(workspaceId: string, input: InstantiateDraftRequest) {
    const { data } = await apiClient.post<InstantiateProjectTemplateResponse>(
      `/workspaces/${workspaceId}/project-templates/draft/instantiate`,
      input
    );
    return data;
  },

  // Only whoever started it can read it (404 otherwise).
  async getInstantiation(workspaceId: string, instantiationId: string) {
    const { data } = await apiClient.get<TemplateInstantiation>(
      `/workspaces/${workspaceId}/template-instantiations/${instantiationId}`
    );
    return data;
  },

  async versions(templateId: string) {
    const { data } = await apiClient.get<ProjectTemplateVersion[]>(
      `/project-templates/${templateId}/versions`
    );
    return data;
  },

  // Workspace templates: a new version read again from the source project.
  async publishVersion(templateId: string, input: PublishTemplateVersionRequest) {
    const { data } = await apiClient.post<ProjectTemplateDetail>(
      `/project-templates/${templateId}/versions`,
      input
    );
    return data;
  },

  // Binary, behind auth — fetched as a Blob like task covers.
  async getImage(templateId: string, image: "cover" | number) {
    const path = image === "cover" ? "cover" : `screenshots/${image}`;
    const response = await apiClient.get(`/project-templates/${templateId}/${path}`, {
      responseType: "blob",
    });
    return response.data as Blob;
  },

  // Media writes (JPEG/PNG/WebP up to 5MB, 6 screenshots). `admin` goes
  // through the SUPER_ADMIN routes, which reach any template.
  async setCover(templateId: string, file: File, admin = false) {
    const formData = new FormData();
    formData.append("file", file);
    await apiClient.put(`${mediaBase(admin)}/${templateId}/cover`, formData);
  },

  async removeCover(templateId: string, admin = false) {
    await apiClient.delete(`${mediaBase(admin)}/${templateId}/cover`);
  },

  async addScreenshot(templateId: string, file: File, admin = false) {
    const formData = new FormData();
    formData.append("file", file);
    await apiClient.post(`${mediaBase(admin)}/${templateId}/screenshots`, formData);
  },

  async removeScreenshot(templateId: string, index: number, admin = false) {
    await apiClient.delete(`${mediaBase(admin)}/${templateId}/screenshots/${index}`);
  },

  // AI (§ 26.7): nothing is saved, the answer is a validated draft.
  async generateDraft(workspaceId: string, prompt: string, language?: ProjectTemplateLanguage) {
    const { data } = await apiClient.post<ProjectTemplateDraft>(
      `/workspaces/${workspaceId}/project-templates/ai/generate`,
      { prompt, language }
    );
    return data;
  },

  async adaptDraft(workspaceId: string, templateId: string, instructions: string) {
    const { data } = await apiClient.post<ProjectTemplateDraft>(
      `/workspaces/${workspaceId}/project-templates/${templateId}/ai/adapt`,
      { instructions }
    );
    return data;
  },

  // A workspace template from a ready skeleton (e.g. a reviewed AI draft).
  async createForWorkspace(workspaceId: string, input: CreateProjectTemplateRequest) {
    const { data } = await apiClient.post<ProjectTemplateDetail>(
      `/workspaces/${workspaceId}/project-templates`,
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
