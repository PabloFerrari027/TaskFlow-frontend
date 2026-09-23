"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { apiKeysService } from "@/features/developers/api/developers-service";
import { queryKeys } from "@/lib/query-keys";
import { getErrorMessage } from "@/lib/errors";
import { MAX_PAGE_SIZE } from "@/types/common";
import type { CreateApiKeyRequest, UpdateApiKeyRequest } from "@/types/developer";

// A workspace's keys are realistically few — fetched in one go, like
// automation rules. Not cacheable long-term: `lastUsedAt` changes on every
// authenticated request made with a key, outside of any request to this list.
export function useApiKeysQuery(workspaceId: string) {
  return useQuery({
    queryKey: queryKeys.developers.apiKeys(workspaceId),
    queryFn: () => apiKeysService.list(workspaceId, { limit: MAX_PAGE_SIZE }),
    select: (result) => result.data,
    staleTime: 0,
  });
}

export function useCreateApiKeyMutation(workspaceId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: CreateApiKeyRequest) => apiKeysService.create(workspaceId, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.developers.apiKeys(workspaceId) });
    },
    onError: (error) => toast.error(getErrorMessage(error)),
  });
}

export function useUpdateApiKeyMutation(workspaceId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ apiKeyId, payload }: { apiKeyId: string; payload: UpdateApiKeyRequest }) =>
      apiKeysService.update(workspaceId, apiKeyId, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.developers.apiKeys(workspaceId) });
      toast.success("Chave de API atualizada.");
    },
    onError: (error) => toast.error(getErrorMessage(error)),
  });
}

// Kept separate from create so the caller can tell "brand new secret" apart
// from "rotated secret" when deciding what dialog copy to show.
export function useRotateApiKeyMutation(workspaceId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (apiKeyId: string) => apiKeysService.rotate(workspaceId, apiKeyId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.developers.apiKeys(workspaceId) });
    },
    onError: (error) => toast.error(getErrorMessage(error)),
  });
}

export function useRevokeApiKeyMutation(workspaceId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (apiKeyId: string) => apiKeysService.revoke(workspaceId, apiKeyId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.developers.apiKeys(workspaceId) });
      toast.success("Chave de API revogada.");
    },
    onError: (error) => toast.error(getErrorMessage(error)),
  });
}
