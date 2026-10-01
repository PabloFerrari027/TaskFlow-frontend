import { apiClient } from "@/lib/api/client";
import type { IntakeForm, PublicIntakeForm, SaveIntakeFormRequest } from "@/types/intake-form";

export const intakeFormsService = {
  async list(projectId: string) {
    const { data } = await apiClient.get<IntakeForm[]>(`/projects/${projectId}/forms`);
    return data;
  },

  async create(projectId: string, payload: SaveIntakeFormRequest) {
    const { data } = await apiClient.post<IntakeForm>(`/projects/${projectId}/forms`, payload);
    return data;
  },

  async update(formId: string, payload: Partial<SaveIntakeFormRequest>) {
    const { data } = await apiClient.patch<IntakeForm>(`/intake-forms/${formId}`, payload);
    return data;
  },

  // The old link stops working.
  async regenerateToken(formId: string) {
    const { data } = await apiClient.post<IntakeForm>(`/intake-forms/${formId}/regenerate-token`);
    return data;
  },

  async remove(formId: string) {
    await apiClient.delete(`/intake-forms/${formId}`);
  },

  // Anonymous, like the shared dashboard pages: the token is the authorization,
  // and a signed-in visitor must see exactly what anyone else sees.
  async getPublic(token: string) {
    const { data } = await apiClient.get<PublicIntakeForm>(`/forms/${encodeURIComponent(token)}`, {
      _skipAuth: true,
    });
    return data;
  },

  // `website` is the hidden anti-spam field: always sent empty by people.
  async submit(token: string, answers: Record<string, unknown>, website = "") {
    const { data } = await apiClient.post<{ received: true }>(
      `/forms/${encodeURIComponent(token)}/submissions`,
      { answers, website: website || undefined },
      { _skipAuth: true }
    );
    return data;
  },
};
