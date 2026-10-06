"use client";

import {
  keepPreviousData,
  useMutation,
  useQuery,
  useQueryClient,
  type QueryClient,
} from "@tanstack/react-query";
import { toast } from "sonner";
import { folderTemplatesService } from "@/features/folder-templates/api/folder-templates-service";
import { queryKeys } from "@/lib/query-keys";
import { browserTimezone } from "@/features/recurring-items/lib/schedule-text";
import { useObjectUrl } from "@/features/items/hooks/use-items";
import { getErrorCode, getErrorMessage, getServerErrorMessage } from "@/lib/errors";
import type {
  AdminFolderTemplateFilters,
  ApplyFolderTemplateRequest,
  CreateFolderTemplateRequest,
  InstantiateDraftRequest,
  InstantiateFolderTemplateRequest,
  FolderTemplateDetail,
  FolderTemplateFilters,
  FolderTemplateLanguage,
  FolderTemplateSummary,
  PublishTemplateVersionRequest,
  SaveFolderAsTemplateRequest,
  UpdateFolderTemplateListingRequest,
  UpdateFolderTemplateRequest,
} from "@/types/folder-template";

export function useFolderTemplatesQuery(filters: FolderTemplateFilters) {
  return useQuery({
    queryKey: queryKeys.folderTemplates.list(filters),
    queryFn: () => folderTemplatesService.list(filters),
    // Keeps the current page on screen while the next filter/page loads,
    // instead of flashing the skeleton on every keystroke.
    placeholderData: keepPreviousData,
  });
}

export function useFolderTemplateCategoriesQuery() {
  return useQuery({
    queryKey: queryKeys.folderTemplates.categories(),
    queryFn: () => folderTemplatesService.categories(),
    // Fixed list.
    staleTime: 5 * 60_000,
  });
}

export function useFolderTemplateQuery(templateId: string | null | undefined) {
  return useQuery({
    queryKey: queryKeys.folderTemplates.detail(templateId ?? ""),
    queryFn: () => folderTemplatesService.get(templateId as string),
    enabled: Boolean(templateId),
    // A 404 here is a real answer ("not available to you"), not a blip.
    retry: (failureCount, error) =>
      getErrorCode(error) !== "FOLDER_TEMPLATE_NOT_FOUND" && failureCount < 1,
  });
}

export function useWorkspaceFolderTemplatesQuery(workspaceId: string | null | undefined) {
  return useQuery({
    queryKey: queryKeys.folderTemplates.workspace(workspaceId ?? ""),
    queryFn: () => folderTemplatesService.listForWorkspace(workspaceId as string),
    enabled: Boolean(workspaceId),
  });
}

// Anything that changes what the system catalog shows — the public lists and
// the admin table.
function invalidateCatalog(queryClient: QueryClient) {
  queryClient.invalidateQueries({ queryKey: queryKeys.folderTemplates.lists() });
  queryClient.invalidateQueries({ queryKey: queryKeys.folderTemplates.adminLists() });
}

// A workspace-template write answers with the fresh detail, which is exactly
// what that template's detail query holds.
function cacheWorkspaceTemplate(queryClient: QueryClient, template: FolderTemplateDetail) {
  queryClient.setQueryData(queryKeys.folderTemplates.detail(template.id), template);
  if (template.workspaceId) {
    queryClient.invalidateQueries({
      queryKey: queryKeys.folderTemplates.workspace(template.workspaceId),
    });
  }
}

// The template is gone (or never existed for this user) after a screen
// loaded: drop it so nothing keeps offering it.
function forgetTemplate(queryClient: QueryClient, templateId: string) {
  queryClient.removeQueries({ queryKey: queryKeys.folderTemplates.detail(templateId) });
  queryClient.invalidateQueries({
    queryKey: [...queryKeys.folderTemplates.all(), "workspace"],
  });
  invalidateCatalog(queryClient);
}

// Errors that come back before anything is written: choices are validated
// first, and a failure mid-way undoes everything (API.md § 26.3).
function toastInstantiationError(queryClient: QueryClient, error: unknown, templateId?: string) {
  const code = getErrorCode(error);
  if (code === "FOLDER_TEMPLATE_NOT_FOUND" && templateId) {
    forgetTemplate(queryClient, templateId);
    toast.error("Este modelo não está mais disponível. Nada foi criado; escolha outro.");
    return;
  }
  if (code === "FORBIDDEN_WORKSPACE_ACTION") {
    toast.error("Só donos e administradores do workspace podem usar modelos. Nada foi criado.");
    return;
  }
  if (code === "INVALID_TEMPLATE_INSTANTIATION" || code === "INVALID_FOLDER_TEMPLATE_SKELETON") {
    // The server's text says which choice is wrong.
    const detail = getServerErrorMessage(error);
    toast.error(getErrorMessage(error), detail ? { description: detail } : undefined);
    return;
  }
  toast.error(`${getErrorMessage(error)} Nada foi criado; tente de novo.`);
}

// Always queued (`async: true`): a big template takes a while, and the 202
// gives an id whose progress `useTemplateInstantiationQuery` follows. The
// browser's timezone drives the template's recurring items.
const QUEUED = () => ({ async: true, timezone: browserTimezone() });

/**
 * Not idempotent — two calls create two folders — so callers must block a
 * second submit while `isPending` (and while the queued run is going).
 */
export function useInstantiateFolderTemplateMutation(workspaceId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      templateId,
      input,
    }: {
      templateId: string;
      input: InstantiateFolderTemplateRequest;
    }) => folderTemplatesService.instantiate(workspaceId, templateId, { ...input, ...QUEUED() }),
    onError: (error, { templateId }) => toastInstantiationError(queryClient, error, templateId),
  });
}

export function useApplyFolderTemplateMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      folderId,
      templateId,
      input,
    }: {
      folderId: string;
      templateId: string;
      input: ApplyFolderTemplateRequest;
    }) => folderTemplatesService.apply(folderId, templateId, { ...input, ...QUEUED() }),
    onError: (error, { templateId }) => toastInstantiationError(queryClient, error, templateId),
  });
}

export function useInstantiateDraftMutation(workspaceId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: InstantiateDraftRequest) =>
      folderTemplatesService.instantiateDraft(workspaceId, { ...input, ...QUEUED() }),
    onError: (error) => toastInstantiationError(queryClient, error),
  });
}

const POLL_MS = 1000;

/** Polls a queued instantiation until it succeeds or fails. */
export function useTemplateInstantiationQuery(workspaceId: string, instantiationId: string | null) {
  return useQuery({
    queryKey: queryKeys.folderTemplates.instantiation(instantiationId ?? ""),
    queryFn: () => folderTemplatesService.getInstantiation(workspaceId, instantiationId!),
    enabled: Boolean(instantiationId),
    refetchInterval: (query) => {
      const status = query.state.data?.status;
      return status === "SUCCEEDED" || status === "FAILED" ? false : POLL_MS;
    },
    retry: false,
  });
}

/** What a finished instantiation changed: the folders (and the board, on apply). */
export function useOnInstantiationFinished() {
  const queryClient = useQueryClient();
  return (workspaceId: string, folderId: string | null) => {
    queryClient.invalidateQueries({ queryKey: queryKeys.folders.all(workspaceId) });
    if (folderId) {
      queryClient.invalidateQueries({ queryKey: queryKeys.folders.detail(folderId) });
      queryClient.invalidateQueries({ queryKey: queryKeys.sections.all(folderId) });
      queryClient.invalidateQueries({ queryKey: queryKeys.items.all(folderId) });
      queryClient.invalidateQueries({ queryKey: queryKeys.statuses.all(folderId) });
    }
    queryClient.invalidateQueries({ queryKey: queryKeys.items.bySectionAll() });
    // `myLastInstantiatedVersion` / `updateAvailable` and the use count.
    queryClient.invalidateQueries({ queryKey: [...queryKeys.folderTemplates.all(), "detail"] });
  };
}

// ---------------------------------------------------------------- versions

export function useTemplateVersionsQuery(templateId: string | null | undefined) {
  return useQuery({
    queryKey: queryKeys.folderTemplates.versions(templateId ?? ""),
    queryFn: () => folderTemplatesService.versions(templateId as string),
    enabled: Boolean(templateId),
  });
}

export function usePublishTemplateVersionMutation(templateId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: PublishTemplateVersionRequest) =>
      folderTemplatesService.publishVersion(templateId, input),
    onSuccess: (template) => {
      cacheWorkspaceTemplate(queryClient, template);
      queryClient.invalidateQueries({ queryKey: queryKeys.folderTemplates.versions(templateId) });
      toast.success(`Versão ${template.version} publicada.`);
    },
    onError: (error) => {
      if (getErrorCode(error) === "FOLDER_TEMPLATE_NOT_FOUND") {
        toast.error(
          "A pasta de origem deste modelo foi apagada, então não dá para tirar uma versão nova dele."
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
  template: Pick<FolderTemplateSummary, "id" | "updatedAt" | "hasCover" | "screenshotCount">,
  image: "cover" | number
) {
  const exists = image === "cover" ? template.hasCover : image < template.screenshotCount;
  const query = useQuery({
    queryKey: queryKeys.folderTemplates.image(template.id, image, template.updatedAt),
    queryFn: () => folderTemplatesService.getImage(template.id, image),
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
          return folderTemplatesService.setCover(templateId, action.file, admin);
        case "removeCover":
          return folderTemplatesService.removeCover(templateId, admin);
        case "addScreenshot":
          return folderTemplatesService.addScreenshot(templateId, action.file, admin);
        case "removeScreenshot":
          return folderTemplatesService.removeScreenshot(templateId, action.index, admin);
      }
    },
    onSuccess: () => {
      // Screenshots shift down when one is removed, so every image goes.
      queryClient.removeQueries({ queryKey: queryKeys.folderTemplates.image(templateId, "cover") });
      queryClient.removeQueries({ queryKey: ["template-images", templateId] });
      queryClient.invalidateQueries({ queryKey: queryKeys.folderTemplates.detail(templateId) });
      queryClient.invalidateQueries({ queryKey: [...queryKeys.folderTemplates.all(), "workspace"] });
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
    mutationFn: ({ prompt, language }: { prompt: string; language?: FolderTemplateLanguage }) =>
      folderTemplatesService.generateDraft(workspaceId, prompt, language),
    onError: toastAiError,
  });
}

export function useAdaptTemplateDraftMutation(workspaceId: string) {
  return useMutation({
    mutationFn: ({ templateId, instructions }: { templateId: string; instructions: string }) =>
      folderTemplatesService.adaptDraft(workspaceId, templateId, instructions),
    onError: toastAiError,
  });
}

export function useCreateWorkspaceTemplateMutation(workspaceId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: CreateFolderTemplateRequest) =>
      folderTemplatesService.createForWorkspace(workspaceId, input),
    onSuccess: (template) => {
      cacheWorkspaceTemplate(queryClient, template);
      toast.success("Modelo salvo no workspace.");
    },
    onError: toastTemplateWriteError,
  });
}

export function useSaveFolderAsTemplateMutation(folderId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: SaveFolderAsTemplateRequest) =>
      folderTemplatesService.saveFromFolder(folderId, input),
    onSuccess: (template) => cacheWorkspaceTemplate(queryClient, template),
    onError: (error) => {
      // On save this code only means "too big" — the skeleton is built by
      // the server from the folder, never by the user.
      if (getErrorCode(error) === "INVALID_FOLDER_TEMPLATE_SKELETON") {
        toast.error(
          "Esta pasta é grande demais para virar modelo. O limite é de 100 colunas e 50 campos."
        );
        return;
      }
      toast.error(getErrorMessage(error));
    },
  });
}

export function useUpdateFolderTemplateMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      templateId,
      input,
    }: {
      templateId: string;
      input: UpdateFolderTemplateListingRequest;
    }) => folderTemplatesService.update(templateId, input),
    onSuccess: (template) => {
      cacheWorkspaceTemplate(queryClient, template);
      toast.success("Modelo atualizado.");
    },
    onError: (error, { templateId }) => {
      if (getErrorCode(error) === "FOLDER_TEMPLATE_NOT_FOUND") forgetTemplate(queryClient, templateId);
      toast.error(getErrorMessage(error));
    },
  });
}

export function useDeleteFolderTemplateMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (templateId: string) => folderTemplatesService.delete(templateId),
    onSuccess: (_data, templateId) => {
      forgetTemplate(queryClient, templateId);
      toast.success("Modelo excluído.");
    },
    onError: (error, templateId) => {
      // Already gone — the outcome the user wanted.
      if (getErrorCode(error) === "FOLDER_TEMPLATE_NOT_FOUND") {
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

export function useAdminFolderTemplatesQuery(filters: AdminFolderTemplateFilters) {
  return useQuery({
    queryKey: queryKeys.folderTemplates.adminList(filters),
    queryFn: () => folderTemplatesService.adminList(filters),
    placeholderData: keepPreviousData,
    // A 403 means "not a super admin" — the page redirects, no retry.
    retry: false,
  });
}

// INVALID_FOLDER_TEMPLATE_SKELETON is only a safety net behind the editor's
// own validation — when it does fire, the server's text is the one that says
// which item is wrong, so it's shown as is.
function toastTemplateWriteError(error: unknown) {
  if (getErrorCode(error) === "INVALID_FOLDER_TEMPLATE_SKELETON") {
    const detail = getServerErrorMessage(error);
    toast.error(getErrorMessage(error), detail ? { description: detail } : undefined);
    return;
  }
  toast.error(getErrorMessage(error));
}

// Admin responses are the full template, not the per-user detail — so they
// never go into the detail cache; the detail is refetched instead.
function invalidateAfterAdminWrite(queryClient: QueryClient, templateId: string) {
  queryClient.invalidateQueries({ queryKey: queryKeys.folderTemplates.detail(templateId) });
  invalidateCatalog(queryClient);
}

export function useAdminCreateFolderTemplateMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: CreateFolderTemplateRequest) => folderTemplatesService.adminCreate(input),
    onSuccess: () => {
      invalidateCatalog(queryClient);
      toast.success("Modelo criado.");
    },
    onError: toastTemplateWriteError,
  });
}

export function useAdminUpdateFolderTemplateMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      templateId,
      input,
    }: {
      templateId: string;
      input: UpdateFolderTemplateRequest;
    }) => folderTemplatesService.adminUpdate(templateId, input),
    onSuccess: (template) => {
      invalidateAfterAdminWrite(queryClient, template.id);
      toast.success("Modelo salvo.");
    },
    onError: (error, { templateId }) => {
      if (getErrorCode(error) === "FOLDER_TEMPLATE_NOT_FOUND") forgetTemplate(queryClient, templateId);
      toastTemplateWriteError(error);
    },
  });
}

export function useAdminDeleteFolderTemplateMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (templateId: string) => folderTemplatesService.adminDelete(templateId),
    onSuccess: (_data, templateId) => {
      forgetTemplate(queryClient, templateId);
      toast.success("Modelo excluído.");
    },
    onError: (error, templateId) => {
      if (getErrorCode(error) === "FOLDER_TEMPLATE_NOT_FOUND") {
        forgetTemplate(queryClient, templateId);
        toast.success("Modelo excluído.");
        return;
      }
      toast.error(getErrorMessage(error));
    },
  });
}
