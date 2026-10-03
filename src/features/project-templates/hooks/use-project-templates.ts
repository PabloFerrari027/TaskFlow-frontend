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
import { browserTimezone } from "@/features/recurring-tasks/lib/schedule-text";
import { useObjectUrl } from "@/features/tasks/hooks/use-tasks";
import { getErrorCode, getErrorMessage, getServerErrorMessage } from "@/lib/errors";
import type {
  AdminProjectTemplateFilters,
  ApplyProjectTemplateRequest,
  CreateProjectTemplateRequest,
  InstantiateDraftRequest,
  InstantiateProjectTemplateRequest,
  ProjectTemplateDetail,
  ProjectTemplateFilters,
  ProjectTemplateLanguage,
  ProjectTemplateSummary,
  PublishTemplateVersionRequest,
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

// Errors that come back before anything is written: choices are validated
// first, and a failure mid-way undoes everything (API.md § 26.3).
function toastInstantiationError(queryClient: QueryClient, error: unknown, templateId?: string) {
  const code = getErrorCode(error);
  if (code === "PROJECT_TEMPLATE_NOT_FOUND" && templateId) {
    forgetTemplate(queryClient, templateId);
    toast.error("Este modelo não está mais disponível. Nada foi criado; escolha outro.");
    return;
  }
  if (code === "FORBIDDEN_WORKSPACE_ACTION") {
    toast.error("Só donos e administradores do workspace podem usar modelos. Nada foi criado.");
    return;
  }
  if (code === "INVALID_TEMPLATE_INSTANTIATION" || code === "INVALID_PROJECT_TEMPLATE_SKELETON") {
    // The server's text says which choice is wrong.
    const detail = getServerErrorMessage(error);
    toast.error(getErrorMessage(error), detail ? { description: detail } : undefined);
    return;
  }
  toast.error(`${getErrorMessage(error)} Nada foi criado; tente de novo.`);
}

// Always queued (`async: true`): a big template takes a while, and the 202
// gives an id whose progress `useTemplateInstantiationQuery` follows. The
// browser's timezone drives the template's recurring tasks.
const QUEUED = () => ({ async: true, timezone: browserTimezone() });

/**
 * Not idempotent — two calls create two projects — so callers must block a
 * second submit while `isPending` (and while the queued run is going).
 */
export function useInstantiateProjectTemplateMutation(workspaceId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      templateId,
      input,
    }: {
      templateId: string;
      input: InstantiateProjectTemplateRequest;
    }) => projectTemplatesService.instantiate(workspaceId, templateId, { ...input, ...QUEUED() }),
    onError: (error, { templateId }) => toastInstantiationError(queryClient, error, templateId),
  });
}

export function useApplyProjectTemplateMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      projectId,
      templateId,
      input,
    }: {
      projectId: string;
      templateId: string;
      input: ApplyProjectTemplateRequest;
    }) => projectTemplatesService.apply(projectId, templateId, { ...input, ...QUEUED() }),
    onError: (error, { templateId }) => toastInstantiationError(queryClient, error, templateId),
  });
}

export function useInstantiateDraftMutation(workspaceId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: InstantiateDraftRequest) =>
      projectTemplatesService.instantiateDraft(workspaceId, { ...input, ...QUEUED() }),
    onError: (error) => toastInstantiationError(queryClient, error),
  });
}

const POLL_MS = 1000;

/** Polls a queued instantiation until it succeeds or fails. */
export function useTemplateInstantiationQuery(workspaceId: string, instantiationId: string | null) {
  return useQuery({
    queryKey: queryKeys.projectTemplates.instantiation(instantiationId ?? ""),
    queryFn: () => projectTemplatesService.getInstantiation(workspaceId, instantiationId!),
    enabled: Boolean(instantiationId),
    refetchInterval: (query) => {
      const status = query.state.data?.status;
      return status === "SUCCEEDED" || status === "FAILED" ? false : POLL_MS;
    },
    retry: false,
  });
}

/** What a finished instantiation changed: the projects (and the board, on apply). */
export function useOnInstantiationFinished() {
  const queryClient = useQueryClient();
  return (workspaceId: string, projectId: string | null) => {
    queryClient.invalidateQueries({ queryKey: queryKeys.projects.all(workspaceId) });
    if (projectId) {
      queryClient.invalidateQueries({ queryKey: queryKeys.projects.detail(projectId) });
      queryClient.invalidateQueries({ queryKey: queryKeys.sections.all(projectId) });
      queryClient.invalidateQueries({ queryKey: queryKeys.tasks.all(projectId) });
      queryClient.invalidateQueries({ queryKey: queryKeys.statuses.all(projectId) });
    }
    queryClient.invalidateQueries({ queryKey: queryKeys.tasks.bySectionAll() });
    // `myLastInstantiatedVersion` / `updateAvailable` and the use count.
    queryClient.invalidateQueries({ queryKey: [...queryKeys.projectTemplates.all(), "detail"] });
  };
}

// ---------------------------------------------------------------- versions

export function useTemplateVersionsQuery(templateId: string | null | undefined) {
  return useQuery({
    queryKey: queryKeys.projectTemplates.versions(templateId ?? ""),
    queryFn: () => projectTemplatesService.versions(templateId as string),
    enabled: Boolean(templateId),
  });
}

export function usePublishTemplateVersionMutation(templateId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: PublishTemplateVersionRequest) =>
      projectTemplatesService.publishVersion(templateId, input),
    onSuccess: (template) => {
      cacheWorkspaceTemplate(queryClient, template);
      queryClient.invalidateQueries({ queryKey: queryKeys.projectTemplates.versions(templateId) });
      toast.success(`Versão ${template.version} publicada.`);
    },
    onError: (error) => {
      if (getErrorCode(error) === "PROJECT_TEMPLATE_NOT_FOUND") {
        toast.error(
          "O projeto de origem deste modelo foi apagado, então não dá para tirar uma versão nova dele."
        );
        return;
      }
      toastTemplateWriteError(error);
    },
  });
}

// ---------------------------------------------------------------- images

/** Cover (or screenshot N) as an object URL, or `null` while loading / when absent. */
export function useTemplateImageUrl(
  template: Pick<ProjectTemplateSummary, "id" | "updatedAt" | "hasCover" | "screenshotCount">,
  image: "cover" | number
) {
  const exists = image === "cover" ? template.hasCover : image < template.screenshotCount;
  const query = useQuery({
    queryKey: queryKeys.projectTemplates.image(template.id, image, template.updatedAt),
    queryFn: () => projectTemplatesService.getImage(template.id, image),
    enabled: exists,
    placeholderData: (previous) => previous,
    staleTime: Infinity,
    gcTime: 5 * 60_000,
    retry: false,
  });
  const objectUrl = useObjectUrl(exists ? query.data : null, "image/jpeg");
  return exists ? objectUrl : null;
}

type MediaAction =
  | { kind: "setCover"; file: File }
  | { kind: "removeCover" }
  | { kind: "addScreenshot"; file: File }
  | { kind: "removeScreenshot"; index: number };

/** Cover and screenshots; `admin` uses the SUPER_ADMIN routes. */
export function useTemplateMediaMutation(templateId: string, admin = false) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (action: MediaAction) => {
      switch (action.kind) {
        case "setCover":
          return projectTemplatesService.setCover(templateId, action.file, admin);
        case "removeCover":
          return projectTemplatesService.removeCover(templateId, admin);
        case "addScreenshot":
          return projectTemplatesService.addScreenshot(templateId, action.file, admin);
        case "removeScreenshot":
          return projectTemplatesService.removeScreenshot(templateId, action.index, admin);
      }
    },
    onSuccess: () => {
      // Screenshots shift down when one is removed, so every image goes.
      queryClient.removeQueries({ queryKey: queryKeys.projectTemplates.image(templateId, "cover") });
      queryClient.removeQueries({ queryKey: ["template-images", templateId] });
      queryClient.invalidateQueries({ queryKey: queryKeys.projectTemplates.detail(templateId) });
      queryClient.invalidateQueries({ queryKey: [...queryKeys.projectTemplates.all(), "workspace"] });
      invalidateCatalog(queryClient);
    },
    onError: (error) => toast.error(getErrorMessage(error)),
  });
}

// ---------------------------------------------------------------- AI

function toastAiError(error: unknown) {
  if (getErrorCode(error) === "FORBIDDEN_WORKSPACE_ACTION") {
    toast.error("Só donos e administradores do workspace podem usar a IA nos modelos.");
    return;
  }
  toast.error(getErrorMessage(error));
}

export function useGenerateTemplateDraftMutation(workspaceId: string) {
  return useMutation({
    mutationFn: ({ prompt, language }: { prompt: string; language?: ProjectTemplateLanguage }) =>
      projectTemplatesService.generateDraft(workspaceId, prompt, language),
    onError: toastAiError,
  });
}

export function useAdaptTemplateDraftMutation(workspaceId: string) {
  return useMutation({
    mutationFn: ({ templateId, instructions }: { templateId: string; instructions: string }) =>
      projectTemplatesService.adaptDraft(workspaceId, templateId, instructions),
    onError: toastAiError,
  });
}

export function useCreateWorkspaceTemplateMutation(workspaceId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: CreateProjectTemplateRequest) =>
      projectTemplatesService.createForWorkspace(workspaceId, input),
    onSuccess: (template) => {
      cacheWorkspaceTemplate(queryClient, template);
      toast.success("Modelo salvo no workspace.");
    },
    onError: toastTemplateWriteError,
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
