"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { customFieldsService } from "@/features/custom-fields/api/custom-fields-service";
import { queryKeys } from "@/lib/query-keys";
import { getErrorMessage } from "@/lib/errors";
import type {
  CreateCustomFieldDefinitionRequest,
  SetTaskCustomFieldValueRequest,
  UpdateCustomFieldOptionsRequest,
} from "@/types/custom-field";

export function useCustomFieldsQuery(projectId: string) {
  return useQuery({
    queryKey: queryKeys.customFields.all(projectId),
    queryFn: () => customFieldsService.listByProject(projectId),
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

export function useUpdateCustomFieldOptionsMutation(projectId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      definitionId,
      payload,
    }: {
      definitionId: string;
      payload: UpdateCustomFieldOptionsRequest;
    }) => customFieldsService.updateOptions(definitionId, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.customFields.all(projectId) });
      toast.success("Opções atualizadas.");
    },
    onError: (error) => toast.error(getErrorMessage(error)),
  });
}

export function useArchiveCustomFieldMutation(projectId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (definitionId: string) => customFieldsService.archive(definitionId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.customFields.all(projectId) });
      toast.success("Campo arquivado.");
    },
    onError: (error) => toast.error(getErrorMessage(error)),
  });
}

export function useTaskCustomFieldValuesQuery(taskId: string) {
  return useQuery({
    queryKey: queryKeys.tasks.customFieldValues(taskId),
    queryFn: () => customFieldsService.listTaskValues(taskId),
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
