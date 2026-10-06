"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { approvalsService } from "@/features/approvals/api/approvals-service";
import { queryKeys } from "@/lib/query-keys";
import { getErrorMessage } from "@/lib/errors";
import type { RequestApprovalRequest } from "@/types/approval";

export function useItemApprovalsQuery(itemId: string) {
  return useQuery({
    queryKey: queryKeys.approvals.item(itemId),
    queryFn: () => approvalsService.listForItem(itemId),
  });
}

export function useMyPendingApprovalsQuery() {
  return useQuery({
    queryKey: queryKeys.approvals.pending(),
    queryFn: () => approvalsService.listMyPending(),
  });
}

function useInvalidateApprovals() {
  const queryClient = useQueryClient();
  return () => {
    queryClient.invalidateQueries({ queryKey: queryKeys.approvals.root() });
    // A decision can trigger an automation (e.g. "concluir ao ser aprovada").
    queryClient.invalidateQueries({ queryKey: queryKeys.activity.root() });
  };
}

export function useRequestApprovalMutation(itemId: string) {
  const invalidate = useInvalidateApprovals();

  return useMutation({
    mutationFn: (payload: RequestApprovalRequest) => approvalsService.request(itemId, payload),
    onSuccess: () => {
      invalidate();
      toast.success("Pedido de aprovação enviado.");
    },
    onError: (error) => toast.error(getErrorMessage(error)),
  });
}

export function useDecideApprovalMutation() {
  const invalidate = useInvalidateApprovals();

  return useMutation({
    mutationFn: ({
      approvalId,
      decision,
      note,
    }: {
      approvalId: string;
      decision: "approve" | "reject";
      note?: string;
    }) => approvalsService.decide(approvalId, decision, note),
    onSuccess: (approval) => {
      invalidate();
      toast.success(approval.status === "APPROVED" ? "Item aprovado." : "Item recusado.");
    },
    onError: (error) => toast.error(getErrorMessage(error)),
  });
}

export function useCancelApprovalMutation() {
  const invalidate = useInvalidateApprovals();

  return useMutation({
    mutationFn: (approvalId: string) => approvalsService.cancel(approvalId),
    onSuccess: () => {
      invalidate();
      toast.success("Pedido cancelado.");
    },
    onError: (error) => toast.error(getErrorMessage(error)),
  });
}
