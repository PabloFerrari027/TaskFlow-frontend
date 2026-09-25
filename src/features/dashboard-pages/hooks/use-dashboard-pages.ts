"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  chartDefinitionsService,
  dashboardPagesService,
  getSharedDashboardPage,
  type SharedPageLinkKind,
} from "@/features/dashboard-pages/api/dashboard-pages-service";
import { getErrorMessage } from "@/lib/errors";
import { queryKeys } from "@/lib/query-keys";
import type {
  CreateAccessGrantRequest,
  CreateDashboardPageRequest,
  UpdateDashboardPageRequest,
} from "@/types/dashboard-page";

export function useDashboardPagesQuery(workspaceId: string | null) {
  return useQuery({
    queryKey: queryKeys.dashboardPages.all(workspaceId ?? ""),
    queryFn: () => dashboardPagesService.list(workspaceId as string),
    enabled: Boolean(workspaceId),
  });
}

// Every chart's result comes back already executed — same longer staleTime
// as the fixed analytics charts, since aggregates change slowly.
export function useDashboardPageQuery(workspaceId: string, pageId: string) {
  return useQuery({
    queryKey: queryKeys.dashboardPages.detail(pageId),
    queryFn: () => dashboardPagesService.get(workspaceId, pageId),
    staleTime: 60_000,
  });
}

export function useCreateDashboardPageMutation(workspaceId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: CreateDashboardPageRequest) =>
      dashboardPagesService.create(workspaceId, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.dashboardPages.all(workspaceId) });
    },
    onError: (error) => toast.error(getErrorMessage(error)),
  });
}

export function useUpdateDashboardPageMutation(workspaceId: string, pageId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: UpdateDashboardPageRequest) =>
      dashboardPagesService.update(workspaceId, pageId, payload),
    onSuccess: () => {
      // Visibility changes can flip `canEdit` and `hasActivePublicLink`
      // (leaving PUBLIC revokes the link), so both views are refetched.
      queryClient.invalidateQueries({ queryKey: queryKeys.dashboardPages.all(workspaceId) });
      queryClient.invalidateQueries({ queryKey: queryKeys.dashboardPages.detail(pageId) });
    },
    onError: (error) => toast.error(getErrorMessage(error)),
  });
}

export function useDeleteDashboardPageMutation(workspaceId: string, pageId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => dashboardPagesService.remove(workspaceId, pageId),
    onSuccess: () => {
      queryClient.removeQueries({ queryKey: queryKeys.dashboardPages.detail(pageId) });
      queryClient.invalidateQueries({ queryKey: queryKeys.dashboardPages.all(workspaceId) });
      toast.success("Página excluída.");
    },
    onError: (error) => toast.error(getErrorMessage(error)),
  });
}

// No duplicate endpoint exists: a copy is a new PRIVATE page plus the same
// charts, created one by one. If a chart fails midway the copy keeps the ones
// already created — it's the caller's own new page, nothing else is touched.
export function useDuplicateDashboardPageMutation(workspaceId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (pageId: string) => {
      const source = await queryClient.fetchQuery({
        queryKey: queryKeys.dashboardPages.detail(pageId),
        queryFn: () => dashboardPagesService.get(workspaceId, pageId),
      });
      const copy = await dashboardPagesService.create(workspaceId, {
        name: `${source.name} (cópia)`,
        visibility: "PRIVATE",
      });
      for (const chart of source.charts) {
        await chartDefinitionsService.create(copy.id, {
          name: chart.name,
          chartType: chart.chartType,
          query: chart.query,
          position: chart.position,
        });
      }
      return copy;
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.dashboardPages.all(workspaceId) });
    },
    onSuccess: () => toast.success("Cópia criada. Ela começa como privada."),
    onError: (error) => toast.error(getErrorMessage(error)),
  });
}

// The response is the only time the plaintext token exists — the caller
// must show it right away; nothing can fetch it again later.
export function useRegeneratePublicTokenMutation(workspaceId: string, pageId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => dashboardPagesService.regeneratePublicToken(workspaceId, pageId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.dashboardPages.all(workspaceId) });
      queryClient.invalidateQueries({ queryKey: queryKeys.dashboardPages.detail(pageId) });
    },
    onError: (error) => toast.error(getErrorMessage(error)),
  });
}

export function useAccessGrantsQuery(workspaceId: string, pageId: string, enabled: boolean) {
  return useQuery({
    queryKey: queryKeys.dashboardPages.accessGrants(pageId),
    queryFn: () => dashboardPagesService.listAccessGrants(workspaceId, pageId),
    // Revoked grants stay in the backend's history; only live ones matter here.
    select: (grants) => grants.filter((grant) => grant.revokedAt === null),
    enabled,
  });
}

export function useCreateAccessGrantMutation(workspaceId: string, pageId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: CreateAccessGrantRequest) =>
      dashboardPagesService.createAccessGrant(workspaceId, pageId, payload),
    onSuccess: (_grant, payload) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.dashboardPages.accessGrants(pageId) });
      toast.success(
        "email" in payload
          ? "Acesso liberado. Enviamos o link por e-mail."
          : "Acesso liberado."
      );
    },
    onError: (error) => toast.error(getErrorMessage(error)),
  });
}

export function useRevokeAccessGrantMutation(workspaceId: string, pageId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (grantId: string) =>
      dashboardPagesService.revokeAccessGrant(workspaceId, pageId, grantId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.dashboardPages.accessGrants(pageId) });
      toast.success("Acesso removido.");
    },
    onError: (error) => toast.error(getErrorMessage(error)),
  });
}

// Anonymous — used only by the public/guest viewer, outside the signed-in
// shell. A bad token is an expected outcome, not a transient failure, so it
// is never retried.
export function useSharedDashboardPageQuery(kind: SharedPageLinkKind, token: string) {
  return useQuery({
    queryKey: queryKeys.dashboardPages.shared(kind, token),
    queryFn: () => getSharedDashboardPage(kind, token),
    retry: false,
    staleTime: 60_000,
  });
}
