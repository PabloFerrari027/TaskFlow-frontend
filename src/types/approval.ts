export type ItemApprovalStatus = "PENDING" | "APPROVED" | "REJECTED" | "CANCELLED";

/** A request for ONE person to approve an item. */
export interface ItemApproval {
  id: string;
  itemId: string;
  folderId: string;
  requestedBy: string;
  approverId: string;
  status: ItemApprovalStatus;
  /** What the requester wrote. */
  note: string | null;
  /** What the approver wrote when answering. */
  decisionNote: string | null;
  requestedAt: string;
  decidedAt: string | null;
}

export interface RequestApprovalRequest {
  /** Must have access to the folder (a GUEST client can approve). */
  approverId: string;
  note?: string;
}
