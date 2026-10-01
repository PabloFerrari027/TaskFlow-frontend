import { apiClient } from "@/lib/api/client";
import type { DataJob, DataJobFormat, ImportMapping, ImportPreview } from "@/types/data-job";

export const MAX_IMPORT_BYTES = 2 * 1024 * 1024;

function importForm(file: File, mapping?: ImportMapping, skipInvalidRows?: boolean) {
  const form = new FormData();
  form.append("file", file);
  // Multipart fields are strings: the API parses the mapping as JSON.
  if (mapping && Object.keys(mapping).length > 0) form.append("mapping", JSON.stringify(mapping));
  if (skipInvalidRows !== undefined) form.append("skipInvalidRows", String(skipInvalidRows));
  return form;
}

export const dataPortabilityService = {
  // Dry run: reads the whole file and says what would happen. Saves nothing.
  async previewImport(projectId: string, file: File, mapping?: ImportMapping) {
    const { data } = await apiClient.post<ImportPreview>(
      `/projects/${projectId}/imports/preview`,
      importForm(file, mapping)
    );
    return data;
  },

  async startImport(projectId: string, file: File, mapping: ImportMapping, skipInvalidRows: boolean) {
    const { data } = await apiClient.post<DataJob>(
      `/projects/${projectId}/imports`,
      importForm(file, mapping, skipInvalidRows)
    );
    return data;
  },

  async startExport(projectId: string, format: DataJobFormat) {
    const { data } = await apiClient.post<DataJob>(`/projects/${projectId}/exports`, { format });
    return data;
  },

  async getJob(jobId: string) {
    const { data } = await apiClient.get<DataJob>(`/data-jobs/${jobId}`);
    return data;
  },

  async download(jobId: string) {
    const response = await apiClient.get(`/data-jobs/${jobId}/download`, { responseType: "blob" });
    return response.data as Blob;
  },
};
