"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { intakeFormsService } from "@/features/intake-forms/api/intake-forms-service";
import { queryKeys } from "@/lib/query-keys";
import { getErrorMessage, getServerErrorMessage } from "@/lib/errors";
import type { SaveIntakeFormRequest } from "@/types/intake-form";

export function useIntakeFormsQuery(folderId: string) {
  return useQuery({
    queryKey: queryKeys.intakeForms.all(folderId),
    queryFn: () => intakeFormsService.list(folderId),
  });
}

function useInvalidate(folderId: string) {
  const queryClient = useQueryClient();
  return () => queryClient.invalidateQueries({ queryKey: queryKeys.intakeForms.all(folderId) });
}

// INVALID_INTAKE_FORM's server text says which field is wrong.
function toastFormError(error: unknown) {
  toast.error(getErrorMessage(error), { description: getServerErrorMessage(error) ?? undefined });
}

export function useCreateIntakeFormMutation(folderId: string) {
  const invalidate = useInvalidate(folderId);
  return useMutation({
    mutationFn: (payload: SaveIntakeFormRequest) => intakeFormsService.create(folderId, payload),
    onSuccess: () => {
      invalidate();
      toast.success("Formulário criado. Copie o link e compartilhe.");
    },
    onError: toastFormError,
  });
}

export function useUpdateIntakeFormMutation(folderId: string) {
  const invalidate = useInvalidate(folderId);
  return useMutation({
    mutationFn: ({ formId, payload }: { formId: string; payload: Partial<SaveIntakeFormRequest> }) =>
      intakeFormsService.update(formId, payload),
    onSuccess: () => {
      invalidate();
      toast.success("Formulário atualizado.");
    },
    onError: toastFormError,
  });
}

export function useRegenerateIntakeFormTokenMutation(folderId: string) {
  const invalidate = useInvalidate(folderId);
  return useMutation({
    mutationFn: (formId: string) => intakeFormsService.regenerateToken(formId),
    onSuccess: () => {
      invalidate();
      toast.success("Link novo gerado. O antigo parou de funcionar.");
    },
    onError: (error) => toast.error(getErrorMessage(error)),
  });
}

export function useDeleteIntakeFormMutation(folderId: string) {
  const invalidate = useInvalidate(folderId);
  return useMutation({
    mutationFn: (formId: string) => intakeFormsService.remove(formId),
    onSuccess: () => {
      invalidate();
      toast.success("Formulário apagado. Os itens que ele criou continuam na pasta.");
    },
    onError: (error) => toast.error(getErrorMessage(error)),
  });
}

export function usePublicIntakeFormQuery(token: string) {
  return useQuery({
    queryKey: queryKeys.intakeForms.public(token),
    queryFn: () => intakeFormsService.getPublic(token),
    retry: false,
  });
}

export function useSubmitIntakeFormMutation(token: string) {
  return useMutation({
    mutationFn: ({ answers, website }: { answers: Record<string, unknown>; website: string }) =>
      intakeFormsService.submit(token, answers, website),
  });
}
