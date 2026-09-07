"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { customFieldsService } from "@/features/custom-fields/api/custom-fields-service";
import { queryKeys } from "@/lib/query-keys";
import { getErrorMessage } from "@/lib/errors";
import { MAX_PAGE_SIZE } from "@/types/common";
import { useCurrentWorkspace } from "@/features/workspaces/context/current-workspace-context";
import { isOffline, queueEntityUpdate } from "@/features/sync/lib/sync-engine";
import type {
  CreateCustomFieldDefinitionRequest,
  CustomFieldDefinition,
  SetTaskCustomFieldValueRequest,
  UpdateCustomFieldOptionsRequest,
} from "@/types/custom-field";

// Custom field definitions per project are realistically few — fetch the
// max page size once rather than paging.
export function useCustomFieldsQuery(projectId: string) {
  return useQuery({
    queryKey: queryKeys.customFields.all(projectId),
    queryFn: () => customFieldsService.listByProject(projectId, { limit: MAX_PAGE_SIZE }),
    select: (result) => result.data,
  });
}

export function useCreateCustomFieldMutation(projectId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: CreateCustomFieldDefinitionRequest) =>
      customFieldsService.create(projectId, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.customFields.all(projectId) });
      toast.success("Campo personalizado criado.");
    },
    onError: (error) => toast.error(getErrorMessage(error)),
  });
}

function findCachedDefinition(
  queryClient: ReturnType<typeof useQueryClient>,
  projectId: string,
  definitionId: string
) {
  const cached = queryClient.getQueryData<{ data: CustomFieldDefinition[] }>(
    queryKeys.customFields.all(projectId)
  );
  return cached?.data.find((definition) => definition.id === definitionId);
}

export function useUpdateCustomFieldOptionsMutation(projectId: string) {
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
      const current = findCachedDefinition(queryClient, projectId, definitionId);
      if (isOffline() && workspaceId && current) {
        queueEntityUpdate({
          workspaceId,
          entityType: "CUSTOM_FIELD_DEFINITION",
          entityId: definitionId,
          payload: payload as unknown as Record<string, unknown>,
          current,
          meta: { projectId },
        });
        return Promise.resolve();
      }
      return customFieldsService.updateOptions(definitionId, payload).then(() => undefined);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.customFields.all(projectId) });
      toast.success(
        isOffline()
          ? "Alteração salva offline — será sincronizada quando a conexão voltar."
          : "Opções atualizadas."
      );
    },
    onError: (error) => toast.error(getErrorMessage(error)),
  });
}

export function useArchiveCustomFieldMutation(projectId: string) {
  const queryClient = useQueryClient();
  const { workspaceId } = useCurrentWorkspace();

  return useMutation({
    mutationFn: (definitionId: string) => {
      const current = findCachedDefinition(queryClient, projectId, definitionId);
      if (isOffline() && workspaceId && current) {
        queueEntityUpdate({
          workspaceId,
          entityType: "CUSTOM_FIELD_DEFINITION",
          entityId: definitionId,
          payload: { archived: true },
          current,
          meta: { projectId },
        });
        return Promise.resolve();
      }
      return customFieldsService.archive(definitionId).then(() => undefined);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.customFields.all(projectId) });
      toast.success(
        isOffline()
          ? "Arquivamento salvo offline — será sincronizado quando a conexão voltar."
          : "Campo arquivado."
      );
    },
    onError: (error) => toast.error(getErrorMessage(error)),
  });
}

// Bounded by the number of field definitions on the project — always small.
export function useTaskCustomFieldValuesQuery(taskId: string) {
  return useQuery({
    queryKey: queryKeys.tasks.customFieldValues(taskId),
    queryFn: () => customFieldsService.listTaskValues(taskId, { limit: MAX_PAGE_SIZE }),
    select: (result) => result.data,
  });
}

export function useSetTaskCustomFieldValueMutation(taskId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      definitionId,
      payload,
    }: {
      definitionId: string;
      payload: SetTaskCustomFieldValueRequest;
    }) => customFieldsService.setTaskValue(taskId, definitionId, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.tasks.customFieldValues(taskId) });
    },
    onError: (error) => toast.error(getErrorMessage(error)),
  });
}
