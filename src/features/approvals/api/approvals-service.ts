import { apiClient } from "@/lib/api/client";
import type { RequestApprovalRequest, ItemApproval } from "@/types/approval";

export const approvalsService = {
  async listForItem(itemId: string) {
    const { data } = await apiClient.get<ItemApproval[]>(`/items/${itemId}/approvals`);
    return data;
  },

  // Waiting for MY answer, across every folder I can see.
  async listMyPending() {
    const { data } = await apiClient.get<ItemApproval[]>("/approvals/pending");
    return data;
  },

  async request(itemId: string, payload: RequestApprovalRequest) {
    const { data } = await apiClient.post<ItemApproval>(`/items/${itemId}/approvals`, payload);
    return data;
  },

  // Only the approver answers; only the requester cancels.
  async decide(approvalId: string, decision: "approve" | "reject", note?: string) {
    const { data } = await apiClient.post<ItemApproval>(`/approvals/${approvalId}/${decision}`, { note });
    return data;
  },

  async cancel(approvalId: string) {
    const { data } = await apiClient.post<ItemApproval>(`/approvals/${approvalId}/cancel`);
    return data;
  },
};
