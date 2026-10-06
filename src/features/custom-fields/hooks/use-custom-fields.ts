"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { customFieldsService } from "@/features/custom-fields/api/custom-fields-service";
import { queryKeys } from "@/lib/query-keys";
import { getErrorMessage } from "@/lib/errors";
import { MAX_PAGE_SIZE } from "@/types/common";
import { useCurrentWorkspace } from "@/features/workspaces/context/current-workspace-context";
import { isOffline, queueEntityUpdate } from "@/features/sync/lib/sync-engine";
import type { PaginatedResult } from "@/types/common";
import type {
  CreateCustomFieldDefinitionRequest,
  CustomFieldDefinition,
  SetItemCustomFieldValueRequest,
  UpdateCustomFieldOptionsRequest,
} from "@/types/custom-field";

// Custom field definitions per folder are realistically few — fetch the
// max page size once rather than paging.
export function useCustomFieldsQuery(folderId: string) {
  return useQuery({
    queryKey: queryKeys.customFields.all(folderId),
    queryFn: () => customFieldsService.listByFolder(folderId, { limit: MAX_PAGE_SIZE }),
    select: (result) => result.data,
  });
}

export function useCreateCustomFieldMutation(folderId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: CreateCustomFieldDefinitionRequest) =>
      customFieldsService.create(folderId, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.customFields.all(folderId) });
      toast.success("Campo personalizado criado.");
    },
    onError: (error) => toast.error(getErrorMessage(error)),
  });
}

function findCachedDefinition(
  queryClient: ReturnType<typeof useQueryClient>,
  folderId: string,
  definitionId: string
) {
  const cached = queryClient.getQueryData<{ data: CustomFieldDefinition[] }>(
    queryKeys.customFields.all(folderId)
  );
  return cached?.data.find((definition) => definition.id === definitionId);
}

// Offline updates only reach the server on the next sync pull, and
// invalidateQueries' refetch stays paused (networkMode: "online") until
// then — without this optimistic patch, an offline options change or
// archive wouldn't show up in the list until reconnect.
async function patchCachedDefinition(
  queryClient: ReturnType<typeof useQueryClient>,
  folderId: string,
  definitionId: string,
  patch: Partial<CustomFieldDefinition>
) {
  await queryClient.cancelQueries({ queryKey: queryKeys.customFields.all(folderId) });
  const previous = queryClient.getQueryData<PaginatedResult<CustomFieldDefinition>>(
    queryKeys.customFields.all(folderId)
  );
  if (previous) {
    queryClient.setQueryData<PaginatedResult<CustomFieldDefinition>>(
      queryKeys.customFields.all(folderId),
      {
        ...previous,
        data: previous.data.map((definition) =>
          definition.id === definitionId ? { ...definition, ...patch } : definition
        ),
      }
    );
  }
  return { previous };
}

export function useUpdateCustomFieldOptionsMutation(folderId: string) {
  const queryClient = useQueryClient();
  const { workspaceId } = useCurrentWorkspace();

  return useMutation({
    mutationFn: ({
      definitionId,
      payload,
    }: {
      definitionId: string;
      payload: UpdateCustomFieldOptionsRequest;
    }) => {
      const current = findCachedDefinition(queryClient, folderId, definitionId);
      if (isOffline() && workspaceId && current) {
        queueEntityUpdate({
          workspaceId,
          entityType: "CUSTOM_FIELD_DEFINITION",
          entityId: definitionId,
          payload: payload as unknown as Record<string, unknown>,
          current,
          meta: { folderId },
        });
        return Promise.resolve();
      }
      // Colors live on a separate endpoint and are validated against the
      // saved options, so they go second — after any rename has landed.
      const { optionColors, ...options } = payload;
      return customFieldsService.updateOptions(definitionId, options).then(() =>
        optionColors !== undefined
          ? customFieldsService.updateDetails(definitionId, { optionColors }).then(() => undefined)
          : undefined
      );
    },
    onMutate: ({ definitionId, payload }) =>
      patchCachedDefinition(queryClient, folderId, definitionId, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.customFields.all(folderId) });
      toast.success(
        isOffline()
          ? "Alteração salva offline — será sincronizada quando a conexão voltar."
          : "Opções atualizadas."
      );
    },
    onError: (error, _vars, context) => {
      if (context?.previous) {
        queryClient.setQueryData(queryKeys.customFields.all(folderId), context.previous);
      }
      toast.error(getErrorMessage(error));
    },
  });
}

export function useArchiveCustomFieldMutation(folderId: string) {
  const queryClient = useQueryClient();
  const { workspaceId } = useCurrentWorkspace();

  return useMutation({
    mutationFn: (definitionId: string) => {
      const current = findCachedDefinition(queryClient, folderId, definitionId);
      if (isOffline() && workspaceId && current) {
        queueEntityUpdate({
          workspaceId,
          entityType: "CUSTOM_FIELD_DEFINITION",
          entityId: definitionId,
          payload: { archived: true },
          current,
          meta: { folderId },
        });
        return Promise.resolve();
      }
      return customFieldsService.archive(definitionId).then(() => undefined);
    },
    onMutate: (definitionId) =>
      patchCachedDefinition(queryClient, folderId, definitionId, { archived: true }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.customFields.all(folderId) });
      toast.success(
        isOffline()
          ? "Arquivamento salvo offline — será sincronizado quando a conexão voltar."
          : "Campo arquivado."
      );
    },
    onError: (error, _definitionId, context) => {
      if (context?.previous) {
        queryClient.setQueryData(queryKeys.customFields.all(folderId), context.previous);
      }
      toast.error(getErrorMessage(error));
    },
  });
}

// Bounded by the number of field definitions on the folder — always small.
export function useItemCustomFieldValuesQuery(itemId: string) {
  return useQuery({
    queryKey: queryKeys.items.customFieldValues(itemId),
    queryFn: () => customFieldsService.listItemValues(itemId, { limit: MAX_PAGE_SIZE }),
    select: (result) => result.data,
  });
}

export function useSetItemCustomFieldValueMutation(itemId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      definitionId,
      payload,
    }: {
      definitionId: string;
      payload: SetItemCustomFieldValueRequest;
    }) => customFieldsService.setItemValue(itemId, definitionId, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.items.customFieldValues(itemId) });
    },
    onError: (error) => toast.error(getErrorMessage(error)),
  });
}
