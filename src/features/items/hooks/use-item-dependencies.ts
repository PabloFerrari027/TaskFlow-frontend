"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { itemsService } from "@/features/items/api/items-service";
import { queryKeys } from "@/lib/query-keys";
import { getErrorMessage } from "@/lib/errors";
import type { ItemDependencies } from "@/types/item";

export function useItemDependenciesQuery(itemId: string) {
  return useQuery({
    queryKey: queryKeys.items.dependencies(itemId),
    queryFn: () => itemsService.listDependencies(itemId),
  });
}

function useOnDependenciesChanged() {
  const queryClient = useQueryClient();
  return (view: ItemDependencies, otherItemId: string) => {
    queryClient.setQueryData(queryKeys.items.dependencies(view.itemId), view);
    // The other end of the link sees it from the other side.
    queryClient.invalidateQueries({ queryKey: queryKeys.items.dependencies(otherItemId) });
    queryClient.invalidateQueries({ queryKey: ["items", "timeline"] });
  };
}

export function useAddItemDependencyMutation(itemId: string) {
  const onChanged = useOnDependenciesChanged();

  return useMutation({
    mutationFn: (blockerItemId: string) => itemsService.addDependency(itemId, blockerItemId),
    onSuccess: (view, blockerItemId) => {
      onChanged(view, blockerItemId);
      toast.success("Dependência adicionada.");
    },
    onError: (error) => toast.error(getErrorMessage(error)),
  });
}

export function useRemoveItemDependencyMutation(itemId: string) {
  const onChanged = useOnDependenciesChanged();

  return useMutation({
    mutationFn: (blockerItemId: string) => itemsService.removeDependency(itemId, blockerItemId),
    onSuccess: (view, blockerItemId) => {
      onChanged(view, blockerItemId);
      toast.success("Dependência removida.");
    },
    onError: (error) => toast.error(getErrorMessage(error)),
  });
}

export function useFolderTimelineQuery(folderId: string) {
  return useQuery({
    queryKey: queryKeys.items.timeline(folderId),
    queryFn: () => itemsService.timeline(folderId),
  });
}
