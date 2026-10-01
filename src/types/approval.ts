export type TaskApprovalStatus = "PENDING" | "APPROVED" | "REJECTED" | "CANCELLED";

/** A request for ONE person to approve a task. */
export interface TaskApproval {
  id: string;
  taskId: string;
  projectId: string;
  requestedBy: string;
  approverId: string;
  status: TaskApprovalStatus;
  /** What the requester wrote. */
  note: string | null;
  /** What the approver wrote when answering. */
  decisionNote: string | null;
  requestedAt: string;
  decidedAt: string | null;
}

export interface RequestApprovalRequest {
  /** Must have access to the project (a GUEST client can approve). */
  approverId: string;
  note?: string;
}
