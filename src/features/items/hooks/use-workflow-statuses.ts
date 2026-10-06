"use client";

import { useMutation, useQuery, useQueryClient, type QueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { itemsService } from "@/features/items/api/items-service";
import { scheduleItemListsRefresh } from "@/features/items/lib/item-list-refresh";
import { queryKeys } from "@/lib/query-keys";
import { getErrorMessage } from "@/lib/errors";
import type {
  CreateWorkflowStatusRequest,
  ItemStatus,
  UpdateWorkflowStatusRequest,
  WorkflowStatus,
} from "@/types/item";

export const STATUS_CATEGORIES: ItemStatus[] = ["TODO", "IN_PROGRESS", "DONE"];

// The server creates the default three on first read, so this is never empty.
export function useFolderStatusesQuery(folderId: string | null | undefined) {
  return useQuery({
    queryKey: queryKeys.statuses.all(folderId ?? ""),
    queryFn: () => itemsService.listStatuses(folderId!),
    enabled: !!folderId,
    staleTime: 5 * 60_000,
  });
}

/** Statuses of one category in board order — the first one is the category's default. */
export function statusesOfCategory(statuses: WorkflowStatus[], category: ItemStatus) {
  return statuses
    .filter((status) => status.category === category)
    .sort((a, b) => a.position - b.position);
}

/** The status an item is in: its own, or its category's default. */
export function resolveItemStatus(
  statuses: WorkflowStatus[] | undefined,
  item: { status: ItemStatus; statusId: string | null }
) {
  if (!statuses) return undefined;
  return (
    statuses.find((status) => status.id === item.statusId) ??
    statuses.find((status) => status.category === item.status && status.isDefault) ??
    statusesOfCategory(statuses, item.status)[0]
  );
}

function onStatusesChanged(queryClient: QueryClient, folderId: string, statuses: WorkflowStatus[]) {
  queryClient.setQueryData(queryKeys.statuses.all(folderId), statuses);
}

export function useCreateWorkflowStatusMutation(folderId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: CreateWorkflowStatusRequest) =>
      itemsService.createStatus(folderId, payload),
    onSuccess: (statuses) => {
      onStatusesChanged(queryClient, folderId, statuses);
      toast.success("Etapa criada.");
    },
    onError: (error) => toast.error(getErrorMessage(error)),
  });
}

export function useUpdateWorkflowStatusMutation(folderId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ statusId, payload }: { statusId: string; payload: UpdateWorkflowStatusRequest }) =>
      itemsService.updateStatus(statusId, payload),
    onSuccess: (statuses) => onStatusesChanged(queryClient, folderId, statuses),
    onError: (error) => toast.error(getErrorMessage(error)),
  });
}

// Reordering is a swap of two positions (the server never renumbers the others).
export function useSwapWorkflowStatusesMutation(folderId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ a, b }: { a: WorkflowStatus; b: WorkflowStatus }) => {
      // Equal positions (two statuses created with the same one) would make
      // the swap a no-op, so the second one is nudged past the first.
      const nextB = a.position === b.position ? a.position + 1 : a.position;
      await itemsService.updateStatus(a.id, { position: b.position });
      return itemsService.updateStatus(b.id, { position: nextB });
    },
    onSuccess: (statuses) => onStatusesChanged(queryClient, folderId, statuses),
    onError: (error) => {
      toast.error(getErrorMessage(error));
      queryClient.invalidateQueries({ queryKey: queryKeys.statuses.all(folderId) });
    },
  });
}

export function useDeleteWorkflowStatusMutation(folderId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ statusId, replacementStatusId }: { statusId: string; replacementStatusId?: string }) =>
      itemsService.deleteStatus(statusId, replacementStatusId),
    onSuccess: ({ statuses, movedItems }) => {
      onStatusesChanged(queryClient, folderId, statuses);
      // Items that were in it now point at the replacement.
      if (movedItems > 0) scheduleItemListsRefresh(queryClient);
      toast.success(
        movedItems > 0
          ? `Etapa apagada. ${movedItems === 1 ? "1 item foi movido" : `${movedItems} itens foram movidos`} para a etapa escolhida.`
          : "Etapa apagada."
      );
    },
    onError: (error) => toast.error(getErrorMessage(error)),
  });
}
