"use client";

import * as React from "react";
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
  PublishProjectAsTemplateRequest,
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
    // Fixed list; only the counts move, and slowly.
    staleTime: 5 * 60_000,
  });
}

export function useProjectTemplateQuery(
  templateId: string | null | undefined,
  options: {
    // Decided from the latest answer — e.g. keep polling after a checkout
    // until `access` flips. Never polls while the query is in error.
    refetchInterval?: (template: ProjectTemplateDetail | undefined) => number | false;
  } = {}
) {
  const { refetchInterval } = options;
  return useQuery({
    queryKey: queryKeys.projectTemplates.detail(templateId ?? ""),
    queryFn: () => projectTemplatesService.get(templateId as string),
    enabled: Boolean(templateId),
    refetchInterval: refetchInterval
      ? (query) => (query.state.status === "error" ? false : refetchInterval(query.state.data))
      : undefined,
    // A 404 here is a real answer ("not in the hub for you"), not a blip.
    retry: (failureCount, error) =>
      getErrorCode(error) !== "PROJECT_TEMPLATE_NOT_FOUND" && failureCount < 1,
  });
}

export function useMyProjectTemplatesQuery() {
  return useQuery({
    queryKey: queryKeys.projectTemplates.mine(),
    queryFn: () => projectTemplatesService.mine(),
  });
}

export function usePurchasedProjectTemplatesQuery() {
  return useQuery({
    queryKey: queryKeys.projectTemplates.purchased(),
    queryFn: () => projectTemplatesService.purchased(),
  });
}

// A purchase is confirmed by Stripe's webhook, not by any request of ours,
// so the page that sees `access` flip is the one that refreshes "Comprados".
export function useInvalidatePurchasedProjectTemplates() {
  const queryClient = useQueryClient();
  return React.useCallback(
    () => queryClient.invalidateQueries({ queryKey: queryKeys.projectTemplates.purchased() }),
    [queryClient]
  );
}

// Anything that changes what the hub shows (a template entering/leaving it,
// or its name/category/price) — the lists and the per-category counts.
function invalidateHub(queryClient: QueryClient) {
  queryClient.invalidateQueries({ queryKey: queryKeys.projectTemplates.lists() });
  queryClient.invalidateQueries({ queryKey: queryKeys.projectTemplates.categories() });
  queryClient.invalidateQueries({ queryKey: queryKeys.projectTemplates.adminLists() });
}

// An author write answers with the fresh detail (`access: "AUTHOR"`), which
// is exactly what the author's own detail query holds.
function cacheAuthorTemplate(queryClient: QueryClient, template: ProjectTemplateDetail) {
  queryClient.setQueryData(queryKeys.projectTemplates.detail(template.id), template);
  queryClient.invalidateQueries({ queryKey: queryKeys.projectTemplates.mine() });
  invalidateHub(queryClient);
}

// The template left the hub (or never existed for this user) after a screen
// loaded: drop it so nothing keeps offering it.
function forgetTemplate(queryClient: QueryClient, templateId: string) {
  queryClient.removeQueries({ queryKey: queryKeys.projectTemplates.detail(templateId) });
  queryClient.invalidateQueries({ queryKey: queryKeys.projectTemplates.mine() });
  queryClient.invalidateQueries({ queryKey: queryKeys.projectTemplates.purchased() });
  invalidateHub(queryClient);
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
        toast.error("Este modelo foi tirado do hub pela moderação. Nada foi criado.");
        return;
      }
      // 402: the local `access` was stale (e.g. a refund) — refetch it so the
      // page swaps the button for "Comprar".
      if (code === "PROJECT_TEMPLATE_NOT_PURCHASED") {
        queryClient.invalidateQueries({
          queryKey: queryKeys.projectTemplates.detail(templateId),
        });
        toast.error("Este modelo é pago e ainda não foi comprado. Nada foi criado.");
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

export function usePublishProjectAsTemplateMutation(projectId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: PublishProjectAsTemplateRequest) =>
      projectTemplatesService.publishFromProject(projectId, input),
    onSuccess: (template) => cacheAuthorTemplate(queryClient, template),
    onError: (error) => {
      // On publish this code only means "too big" — the skeleton is built by
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

export function useUpdateProjectTemplateListingMutation() {
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
      cacheAuthorTemplate(queryClient, template);
      toast.success("Anúncio atualizado.");
    },
    onError: (error, { templateId }) => {
      if (getErrorCode(error) === "PROJECT_TEMPLATE_NOT_FOUND") forgetTemplate(queryClient, templateId);
      toast.error(getErrorMessage(error));
    },
  });
}

export function usePublishProjectTemplateMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (templateId: string) => projectTemplatesService.publish(templateId),
    onSuccess: (template) => {
      cacheAuthorTemplate(queryClient, template);
      toast.success("Modelo de volta ao hub.");
    },
    onError: (error, templateId) => {
      const code = getErrorCode(error);
      if (code === "PROJECT_TEMPLATE_NOT_FOUND" || code === "PROJECT_TEMPLATE_REMOVED") {
        queryClient.invalidateQueries({
          queryKey: queryKeys.projectTemplates.detail(templateId),
        });
        queryClient.invalidateQueries({ queryKey: queryKeys.projectTemplates.mine() });
      }
      toast.error(getErrorMessage(error));
    },
  });
}

export function useUnpublishProjectTemplateMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (templateId: string) => projectTemplatesService.unpublish(templateId),
    onSuccess: (template) => {
      cacheAuthorTemplate(queryClient, template);
      toast.success("Modelo tirado do hub. Quem já comprou continua usando.");
    },
    onError: (error, templateId) => {
      if (getErrorCode(error) === "PROJECT_TEMPLATE_NOT_FOUND") forgetTemplate(queryClient, templateId);
      toast.error(getErrorMessage(error));
    },
  });
}

/**
 * `PROJECT_TEMPLATE_HAS_PURCHASES` gets no toast: the caller explains it and
 * offers "Tirar do hub" instead, the only way out (API.md § 26.5).
 */
export function useDeleteProjectTemplateMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (templateId: string) => projectTemplatesService.delete(templateId),
    onSuccess: (_data, templateId) => {
      forgetTemplate(queryClient, templateId);
      toast.success("Modelo excluído.");
    },
    onError: (error, templateId) => {
      const code = getErrorCode(error);
      if (code === "PROJECT_TEMPLATE_HAS_PURCHASES") return;
      // Already gone — the outcome the author wanted.
      if (code === "PROJECT_TEMPLATE_NOT_FOUND") {
        forgetTemplate(queryClient, templateId);
        toast.success("Modelo excluído.");
        return;
      }
      toast.error(getErrorMessage(error));
    },
  });
}

/**
 * Sends the browser to Stripe. Access is only granted by Stripe's webhook,
 * never by the return trip — the detail page polls for it (API.md § 26.6).
 */
export function useCheckoutProjectTemplateMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (templateId: string) => projectTemplatesService.checkout(templateId),
    onSuccess: ({ checkoutUrl }) => {
      window.location.assign(checkoutUrl);
    },
    onError: (error, templateId) => {
      const code = getErrorCode(error);
      if (code === "PROJECT_TEMPLATE_ALREADY_ACCESSIBLE") {
        queryClient.invalidateQueries({
          queryKey: queryKeys.projectTemplates.detail(templateId),
        });
        queryClient.invalidateQueries({ queryKey: queryKeys.projectTemplates.purchased() });
        toast.info(getErrorMessage(error));
        return;
      }
      if (code === "PROJECT_TEMPLATE_NOT_FOUND") forgetTemplate(queryClient, templateId);
      toast.error(getErrorMessage(error));
    },
  });
}

// ---------------------------------------------------------------------------
// Admin (SUPER_ADMIN). There's no screen for creating/editing system
// templates yet; the create/update hooks exist for when there is.

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
  queryClient.invalidateQueries({ queryKey: queryKeys.projectTemplates.mine() });
  queryClient.invalidateQueries({ queryKey: queryKeys.projectTemplates.purchased() });
  invalidateHub(queryClient);
}

export function useAdminCreateProjectTemplateMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: CreateProjectTemplateRequest) => projectTemplatesService.adminCreate(input),
    onSuccess: () => {
      invalidateHub(queryClient);
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

/** Same HAS_PURCHASES contract as `useDeleteProjectTemplateMutation`. */
export function useAdminDeleteProjectTemplateMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (templateId: string) => projectTemplatesService.adminDelete(templateId),
    onSuccess: (_data, templateId) => {
      forgetTemplate(queryClient, templateId);
      toast.success("Modelo excluído.");
    },
    onError: (error, templateId) => {
      const code = getErrorCode(error);
      if (code === "PROJECT_TEMPLATE_HAS_PURCHASES") return;
      if (code === "PROJECT_TEMPLATE_NOT_FOUND") {
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
      toast.success("Modelo removido do hub.");
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
      toast.success("Modelo restaurado e de volta ao hub.");
    },
    onError: (error) => toast.error(getErrorMessage(error)),
  });
}
