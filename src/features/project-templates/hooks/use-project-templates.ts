"use client";

import {
  keepPreviousData,
  useMutation,
  useQuery,
  useQueryClient,
  type QueryClient,
} from "@tanstack/react-query";
import { toast } from "sonner";
import { projectTemplatesService } from "@/features/project-templates/api/project-templates-service";
import { queryKeys } from "@/lib/query-keys";
import { getErrorCode, getErrorMessage, getServerErrorMessage } from "@/lib/errors";
import type {
  AdminProjectTemplateFilters,
  CreateProjectTemplateRequest,
  ModerateProjectTemplateRequest,
  ProjectTemplateDetail,
  ProjectTemplateFilters,
  SaveProjectAsTemplateRequest,
  UpdateProjectTemplateListingRequest,
  UpdateProjectTemplateRequest,
} from "@/types/project-template";

export function useProjectTemplatesQuery(filters: ProjectTemplateFilters) {
  return useQuery({
    queryKey: queryKeys.projectTemplates.list(filters),
    queryFn: () => projectTemplatesService.list(filters),
    // Keeps the current page on screen while the next filter/page loads,
    // instead of flashing the skeleton on every keystroke.
    placeholderData: keepPreviousData,
  });
}

export function useProjectTemplateCategoriesQuery() {
  return useQuery({
    queryKey: queryKeys.projectTemplates.categories(),
    queryFn: () => projectTemplatesService.categories(),
    // Fixed list.
    staleTime: 5 * 60_000,
  });
}

export function useProjectTemplateQuery(templateId: string | null | undefined) {
  return useQuery({
    queryKey: queryKeys.projectTemplates.detail(templateId ?? ""),
    queryFn: () => projectTemplatesService.get(templateId as string),
    enabled: Boolean(templateId),
    // A 404 here is a real answer ("not available to you"), not a blip.
    retry: (failureCount, error) =>
      getErrorCode(error) !== "PROJECT_TEMPLATE_NOT_FOUND" && failureCount < 1,
  });
}

export function useWorkspaceProjectTemplatesQuery(workspaceId: string | null | undefined) {
  return useQuery({
    queryKey: queryKeys.projectTemplates.workspace(workspaceId ?? ""),
    queryFn: () => projectTemplatesService.listForWorkspace(workspaceId as string),
    enabled: Boolean(workspaceId),
  });
}

// Anything that changes what the system catalog shows — the public lists and
// the admin table.
function invalidateCatalog(queryClient: QueryClient) {
  queryClient.invalidateQueries({ queryKey: queryKeys.projectTemplates.lists() });
  queryClient.invalidateQueries({ queryKey: queryKeys.projectTemplates.adminLists() });
}

// A workspace-template write answers with the fresh detail, which is exactly
// what that template's detail query holds.
function cacheWorkspaceTemplate(queryClient: QueryClient, template: ProjectTemplateDetail) {
  queryClient.setQueryData(queryKeys.projectTemplates.detail(template.id), template);
  if (template.workspaceId) {
    queryClient.invalidateQueries({
      queryKey: queryKeys.projectTemplates.workspace(template.workspaceId),
    });
  }
}

// The template is gone (or never existed for this user) after a screen
// loaded: drop it so nothing keeps offering it.
function forgetTemplate(queryClient: QueryClient, templateId: string) {
  queryClient.removeQueries({ queryKey: queryKeys.projectTemplates.detail(templateId) });
  queryClient.invalidateQueries({
    queryKey: [...queryKeys.projectTemplates.all(), "workspace"],
  });
  invalidateCatalog(queryClient);
}

/**
 * Not idempotent — two calls create two projects — so callers must block a
 * second submit while `isPending`. The API is all-or-nothing (API.md § 26.3):
 * on any error the partial project was already discarded, so the message can
 * safely say nothing was created.
 */
export function useInstantiateProjectTemplateMutation(workspaceId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ templateId, name }: { templateId: string; name: string }) =>
      projectTemplatesService.instantiate(workspaceId, templateId, { name }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.projects.all(workspaceId) });
      toast.success("Projeto criado a partir do modelo.");
    },
    onError: (error, { templateId }) => {
      const code = getErrorCode(error);
      if (code === "PROJECT_TEMPLATE_NOT_FOUND") {
        forgetTemplate(queryClient, templateId);
        toast.error("Este modelo não está mais disponível. Nada foi criado; escolha outro.");
        return;
      }
      if (code === "PROJECT_TEMPLATE_REMOVED") {
        forgetTemplate(queryClient, templateId);
        toast.error("Este modelo não está mais disponível. Nada foi criado.");
        return;
      }
      if (code === "FORBIDDEN_WORKSPACE_ACTION") {
        toast.error(
          "Só donos e administradores do workspace podem criar projetos a partir de modelos. Nada foi criado."
        );
        return;
      }
      toast.error(`${getErrorMessage(error)} Nada foi criado; tente de novo.`);
    },
  });
}

export function useSaveProjectAsTemplateMutation(projectId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: SaveProjectAsTemplateRequest) =>
      projectTemplatesService.saveFromProject(projectId, input),
    onSuccess: (template) => cacheWorkspaceTemplate(queryClient, template),
    onError: (error) => {
      // On save this code only means "too big" — the skeleton is built by
      // the server from the project, never by the user.
      if (getErrorCode(error) === "INVALID_PROJECT_TEMPLATE_SKELETON") {
        toast.error(
          "Este projeto é grande demais para virar modelo. O limite é de 100 colunas e 50 campos."
        );
        return;
      }
      toast.error(getErrorMessage(error));
    },
  });
}

export function useUpdateProjectTemplateMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      templateId,
      input,
    }: {
      templateId: string;
      input: UpdateProjectTemplateListingRequest;
    }) => projectTemplatesService.update(templateId, input),
    onSuccess: (template) => {
      cacheWorkspaceTemplate(queryClient, template);
      toast.success("Modelo atualizado.");
    },
    onError: (error, { templateId }) => {
      if (getErrorCode(error) === "PROJECT_TEMPLATE_NOT_FOUND") forgetTemplate(queryClient, templateId);
      toast.error(getErrorMessage(error));
    },
  });
}

export function useDeleteProjectTemplateMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (templateId: string) => projectTemplatesService.delete(templateId),
    onSuccess: (_data, templateId) => {
      forgetTemplate(queryClient, templateId);
      toast.success("Modelo excluído.");
    },
    onError: (error, templateId) => {
      // Already gone — the outcome the user wanted.
      if (getErrorCode(error) === "PROJECT_TEMPLATE_NOT_FOUND") {
        forgetTemplate(queryClient, templateId);
        toast.success("Modelo excluído.");
        return;
      }
      toast.error(getErrorMessage(error));
    },
  });
}

// ---------------------------------------------------------------------------
// Admin (SUPER_ADMIN): the system catalog. There's no screen for creating or
// editing system templates yet; the create/update hooks exist for when there is.

export function useAdminProjectTemplatesQuery(filters: AdminProjectTemplateFilters) {
  return useQuery({
    queryKey: queryKeys.projectTemplates.adminList(filters),
    queryFn: () => projectTemplatesService.adminList(filters),
    placeholderData: keepPreviousData,
    // A 403 means "not a super admin" — the page redirects, no retry.
    retry: false,
  });
}

// INVALID_PROJECT_TEMPLATE_SKELETON is only a safety net behind the editor's
// own validation — when it does fire, the server's text is the one that says
// which item is wrong, so it's shown as is.
function toastTemplateWriteError(error: unknown) {
  if (getErrorCode(error) === "INVALID_PROJECT_TEMPLATE_SKELETON") {
    const detail = getServerErrorMessage(error);
    toast.error(getErrorMessage(error), detail ? { description: detail } : undefined);
    return;
  }
  toast.error(getErrorMessage(error));
}

// Admin responses are the full template, not the per-user detail — so they
// never go into the detail cache; the detail is refetched instead.
function invalidateAfterAdminWrite(queryClient: QueryClient, templateId: string) {
  queryClient.invalidateQueries({ queryKey: queryKeys.projectTemplates.detail(templateId) });
  invalidateCatalog(queryClient);
}

export function useAdminCreateProjectTemplateMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: CreateProjectTemplateRequest) => projectTemplatesService.adminCreate(input),
    onSuccess: () => {
      invalidateCatalog(queryClient);
      toast.success("Modelo criado.");
    },
    onError: toastTemplateWriteError,
  });
}

export function useAdminUpdateProjectTemplateMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      templateId,
      input,
    }: {
      templateId: string;
      input: UpdateProjectTemplateRequest;
    }) => projectTemplatesService.adminUpdate(templateId, input),
    onSuccess: (template) => {
      invalidateAfterAdminWrite(queryClient, template.id);
      toast.success("Modelo salvo.");
    },
    onError: (error, { templateId }) => {
      if (getErrorCode(error) === "PROJECT_TEMPLATE_NOT_FOUND") forgetTemplate(queryClient, templateId);
      toastTemplateWriteError(error);
    },
  });
}

export function useAdminDeleteProjectTemplateMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (templateId: string) => projectTemplatesService.adminDelete(templateId),
    onSuccess: (_data, templateId) => {
      forgetTemplate(queryClient, templateId);
      toast.success("Modelo excluído.");
    },
    onError: (error, templateId) => {
      if (getErrorCode(error) === "PROJECT_TEMPLATE_NOT_FOUND") {
        forgetTemplate(queryClient, templateId);
        toast.success("Modelo excluído.");
        return;
      }
      toast.error(getErrorMessage(error));
    },
  });
}

export function useAdminRemoveProjectTemplateMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      templateId,
      input,
    }: {
      templateId: string;
      input?: ModerateProjectTemplateRequest;
    }) => projectTemplatesService.adminRemove(templateId, input),
    onSuccess: (template) => {
      invalidateAfterAdminWrite(queryClient, template.id);
      toast.success("Modelo tirado da lista.");
    },
    onError: (error) => toast.error(getErrorMessage(error)),
  });
}

export function useAdminRestoreProjectTemplateMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      templateId,
      input,
    }: {
      templateId: string;
      input?: ModerateProjectTemplateRequest;
    }) => projectTemplatesService.adminRestore(templateId, input),
    onSuccess: (template) => {
      invalidateAfterAdminWrite(queryClient, template.id);
      toast.success("Modelo restaurado e de volta à lista.");
    },
    onError: (error) => toast.error(getErrorMessage(error)),
  });
}
