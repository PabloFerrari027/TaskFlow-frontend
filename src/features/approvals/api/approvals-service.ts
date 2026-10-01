import { apiClient } from "@/lib/api/client";
import type { RequestApprovalRequest, TaskApproval } from "@/types/approval";

export const approvalsService = {
  async listForTask(taskId: string) {
    const { data } = await apiClient.get<TaskApproval[]>(`/tasks/${taskId}/approvals`);
    return data;
  },

  // Waiting for MY answer, across every project I can see.
  async listMyPending() {
    const { data } = await apiClient.get<TaskApproval[]>("/approvals/pending");
    return data;
  },

  async request(taskId: string, payload: RequestApprovalRequest) {
    const { data } = await apiClient.post<TaskApproval>(`/tasks/${taskId}/approvals`, payload);
    return data;
  },

  // Only the approver answers; only the requester cancels.
  async decide(approvalId: string, decision: "approve" | "reject", note?: string) {
    const { data } = await apiClient.post<TaskApproval>(`/approvals/${approvalId}/${decision}`, { note });
    return data;
  },

  async cancel(approvalId: string) {
    const { data } = await apiClient.post<TaskApproval>(`/approvals/${approvalId}/cancel`);
    return data;
  },
};
