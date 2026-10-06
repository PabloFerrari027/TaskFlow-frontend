import { apiClient } from "@/lib/api/client";
import type { PaginatedResult } from "@/types/common";
import type {
  AdminFolderTemplateFilters,
  ApplyFolderTemplateRequest,
  CreateFolderTemplateRequest,
  InstantiateDraftRequest,
  InstantiateFolderTemplateRequest,
  InstantiateFolderTemplateResponse,
  FolderTemplate,
  FolderTemplateCategoryInfo,
  FolderTemplateDetail,
  FolderTemplateDraft,
  FolderTemplateFilters,
  FolderTemplateLanguage,
  FolderTemplateVersion,
  PublishTemplateVersionRequest,
  TemplateInstantiation,
  FolderTemplateSummary,
  SaveFolderAsTemplateRequest,
  UpdateFolderTemplateListingRequest,
  UpdateFolderTemplateRequest,
} from "@/types/folder-template";

const mediaBase = (admin: boolean) => (admin ? "/admin/folder-templates" : "/folder-templates");

export const folderTemplatesService = {
  // System catalog (API.md § 26.2): the API only ever lists system templates
  // here, no skeleton — just counts. It rejects unknown query params (400).
  async list(filters: FolderTemplateFilters = {}) {
    const { data } = await apiClient.get<PaginatedResult<FolderTemplateSummary>>(
      "/folder-templates",
      { params: filters }
    );
    return data;
  },

  async categories() {
    const { data } = await apiClient.get<FolderTemplateCategoryInfo[]>(
      "/folder-templates/categories"
    );
    return data;
  },

  async get(templateId: string) {
    const { data } = await apiClient.get<FolderTemplateDetail>(
      `/folder-templates/${templateId}`
    );
    return data;
  },

  async instantiate(
    workspaceId: string,
    templateId: string,
    input: InstantiateFolderTemplateRequest
  ) {
    const { data } = await apiClient.post<InstantiateFolderTemplateResponse>(
      `/workspaces/${workspaceId}/folder-templates/${templateId}/instantiate`,
      input
    );
    return data;
  },

  // Adds the template to an existing folder (sections/items go after the
  // existing ones; a field with the same name and type is reused).
  async apply(folderId: string, templateId: string, input: ApplyFolderTemplateRequest) {
    const { data } = await apiClient.post<InstantiateFolderTemplateResponse>(
      `/folders/${folderId}/apply-template/${templateId}`,
      input
    );
    return data;
  },

  // A skeleton that isn't a saved template (e.g. an AI draft), same validation.
  async instantiateDraft(workspaceId: string, input: InstantiateDraftRequest) {
    const { data } = await apiClient.post<InstantiateFolderTemplateResponse>(
      `/workspaces/${workspaceId}/folder-templates/draft/instantiate`,
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
    const { data } = await apiClient.get<FolderTemplateVersion[]>(
      `/folder-templates/${templateId}/versions`
    );
    return data;
  },

  // Workspace templates: a new version read again from the source folder.
  async publishVersion(templateId: string, input: PublishTemplateVersionRequest) {
    const { data } = await apiClient.post<FolderTemplateDetail>(
      `/folder-templates/${templateId}/versions`,
      input
    );
    return data;
  },

  // Binary, behind auth — fetched as a Blob like item covers.
  async getImage(templateId: string, image: "cover" | number) {
    const path = image === "cover" ? "cover" : `screenshots/${image}`;
    const response = await apiClient.get(`/folder-templates/${templateId}/${path}`, {
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
  async generateDraft(workspaceId: string, prompt: string, language?: FolderTemplateLanguage) {
    const { data } = await apiClient.post<FolderTemplateDraft>(
      `/workspaces/${workspaceId}/folder-templates/ai/generate`,
      { prompt, language }
    );
    return data;
  },

  async adaptDraft(workspaceId: string, templateId: string, instructions: string) {
    const { data } = await apiClient.post<FolderTemplateDraft>(
      `/workspaces/${workspaceId}/folder-templates/${templateId}/ai/adapt`,
      { instructions }
    );
    return data;
  },

  // A workspace template from a ready skeleton (e.g. a reviewed AI draft).
  async createForWorkspace(workspaceId: string, input: CreateFolderTemplateRequest) {
    const { data } = await apiClient.post<FolderTemplateDetail>(
      `/workspaces/${workspaceId}/folder-templates`,
      input
    );
    return data;
  },

  // Workspace templates (API.md § 26.7): private, visible to members only.
  async listForWorkspace(workspaceId: string) {
    const { data } = await apiClient.get<FolderTemplateDetail[]>(
      `/workspaces/${workspaceId}/folder-templates`
    );
    return data;
  },

  async saveFromFolder(folderId: string, input: SaveFolderAsTemplateRequest) {
    const { data } = await apiClient.post<FolderTemplateDetail>(
      `/folders/${folderId}/save-as-workspace-template`,
      input
    );
    return data;
  },

  // Name/description/category only — the skeleton is never editable here.
  async update(templateId: string, input: UpdateFolderTemplateListingRequest) {
    const { data } = await apiClient.patch<FolderTemplateDetail>(
      `/folder-templates/${templateId}`,
      input
    );
    return data;
  },

  // 204 with no body.
  async delete(templateId: string) {
    await apiClient.delete(`/folder-templates/${templateId}`);
  },

  // Admin (SUPER_ADMIN only, API.md § 26.7).
  async adminList(filters: AdminFolderTemplateFilters = {}) {
    const { data } = await apiClient.get<PaginatedResult<FolderTemplateSummary>>(
      "/admin/folder-templates",
      { params: filters }
    );
    return data;
  },

  async adminCreate(input: CreateFolderTemplateRequest) {
    const { data } = await apiClient.post<FolderTemplate>("/admin/folder-templates", input);
    return data;
  },

  async adminUpdate(templateId: string, input: UpdateFolderTemplateRequest) {
    const { data } = await apiClient.patch<FolderTemplate>(
      `/admin/folder-templates/${templateId}`,
      input
    );
    return data;
  },

  // 204 with no body.
  async adminDelete(templateId: string) {
    await apiClient.delete(`/admin/folder-templates/${templateId}`);
  },
};
