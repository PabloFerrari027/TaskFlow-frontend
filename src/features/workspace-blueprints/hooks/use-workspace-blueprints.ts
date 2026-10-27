"use client";

import * as React from "react";
import { keepPreviousData, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { workspaceBlueprintsService } from "@/features/workspace-blueprints/api/workspace-blueprints-service";
import { browserTimezone } from "@/features/recurring-items/lib/schedule-text";
import { queryKeys } from "@/lib/query-keys";
import { getErrorCode, getErrorMessage, getServerErrorMessage } from "@/lib/errors";
import type {
  ApplyWorkspaceBlueprintRequest,
  BlueprintApplication,
  WorkspaceBlueprintFilters,
} from "@/types/workspace-blueprint";

// A fixed catalog that only changes on a deploy.
const CATALOG_STALE_MS = 10 * 60 * 1000;
const POLL_MS = 1000;

export function useWorkspaceBlueprintsQuery(filters: WorkspaceBlueprintFilters = {}) {
  return useQuery({
    queryKey: queryKeys.workspaceBlueprints.list(filters),
    queryFn: () => workspaceBlueprintsService.list(filters),
    placeholderData: keepPreviousData,
    staleTime: CATALOG_STALE_MS,
  });
}

export function useWorkspaceBlueprintQuery(key: string | null | undefined) {
  return useQuery({
    queryKey: queryKeys.workspaceBlueprints.detail(key ?? ""),
    queryFn: () => workspaceBlueprintsService.get(key as string),
    enabled: Boolean(key),
    staleTime: CATALOG_STALE_MS,
  });
}

/**
 * Not idempotent — two calls create the folders twice — so callers must block
 * a second submit while `isPending` (and while the queued run is going). The
 * workspace goes with each call: on "create espaço from a blueprint" it
 * only exists once the create returns.
 */
export function useApplyWorkspaceBlueprintMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      workspaceId,
      key,
      input,
    }: {
      workspaceId: string;
      key: string;
      input: ApplyWorkspaceBlueprintRequest;
    }) =>
      // Always queued: a blueprint creates several folders, and the 202 gives
      // an id whose progress `useBlueprintApplicationRunner` follows.
      workspaceBlueprintsService.apply(workspaceId, key, {
        ...input,
        async: true,
        timezone: browserTimezone(),
      }),
    onError: (error) => {
      const code = getErrorCode(error);
      if (code === "WORKSPACE_BLUEPRINT_NOT_FOUND" || code === "WORKSPACE_BLUEPRINT_UNAVAILABLE") {
        queryClient.invalidateQueries({ queryKey: queryKeys.workspaceBlueprints.all() });
      }
      if (code === "FORBIDDEN_WORKSPACE_ACTION") {
        toast.error("Só donos e administradores do espaço podem usar modelos. Nada foi criado.");
        return;
      }
      // The server's text says which choice is wrong.
      const detail = code === "INVALID_BLUEPRINT_APPLICATION" ? getServerErrorMessage(error) : null;
      toast.error(`${getErrorMessage(error)} Nada foi criado.`, detail ? { description: detail } : undefined);
    },
  });
}

function useBlueprintApplicationQuery(workspaceId: string | null, applicationId: string | null) {
  return useQuery({
    queryKey: queryKeys.workspaceBlueprints.application(applicationId ?? ""),
    queryFn: () => workspaceBlueprintsService.getApplication(workspaceId!, applicationId!),
    enabled: Boolean(workspaceId && applicationId),
    refetchInterval: (query) => {
      const status = query.state.data?.status;
      return status === "SUCCEEDED" || status === "FAILED" ? false : POLL_MS;
    },
    retry: false,
  });
}

export interface BlueprintApplicationRun {
  /** Started and not finished: the form must stay locked. */
  isRunning: boolean;
  application: BlueprintApplication | undefined;
  /** Hand it the 202 of apply. */
  follow: (response: BlueprintApplication) => void;
  reset: () => void;
}

/**
 * Follows a queued blueprint application (API.md § 26.10) to the end. On
 * success what it created is refreshed and `onSucceeded` gets the result; on
 * failure nothing was created (all-or-nothing) and the error is shown.
 */
export function useBlueprintApplicationRunner(
  onSucceeded: (application: BlueprintApplication) => void,
  // Nothing was created by the blueprint (or we lost track of it).
  onFailed?: () => void
): BlueprintApplicationRun {
  const queryClient = useQueryClient();
  const [run, setRun] = React.useState<{ workspaceId: string; applicationId: string } | null>(
    null
  );
  const query = useBlueprintApplicationQuery(run?.workspaceId ?? null, run?.applicationId ?? null);
  // Each outcome is acted on once (the query keeps answering the same one).
  const handled = React.useRef<string | null>(null);
  const onSucceededRef = React.useRef(onSucceeded);
  const onFailedRef = React.useRef(onFailed);

  React.useEffect(() => {
    onSucceededRef.current = onSucceeded;
    onFailedRef.current = onFailed;
  });

  const application = run ? query.data : undefined;
  // Losing track of the run (404, network) is not a failure of the run
  // itself — it may still finish on the server.
  const lostTrack = run !== null && query.isError;
  const failed = application?.status === "FAILED" || lostTrack;

  React.useEffect(() => {
    if (!run || handled.current === run.applicationId) return;
    if (lostTrack) {
      handled.current = run.applicationId;
      toast.error("Perdemos o acompanhamento do modelo. Confira a lista de pastas em instantes.");
      onFailedRef.current?.();
      return;
    }
    if (!application) return;
    if (application.status === "SUCCEEDED") {
      handled.current = run.applicationId;
      const { workspaceId } = run;
      queryClient.invalidateQueries({ queryKey: queryKeys.folders.all(workspaceId) });
      queryClient.invalidateQueries({ queryKey: queryKeys.automations.all(workspaceId) });
      queryClient.invalidateQueries({ queryKey: queryKeys.dashboardPages.all(workspaceId) });
      queryClient.invalidateQueries({ queryKey: queryKeys.home.root() });
      onSucceededRef.current(application);
    } else if (application.status === "FAILED") {
      handled.current = run.applicationId;
      toast.error("Não foi possível usar o modelo. Nada foi criado.", {
        description: application.errorMessage ?? undefined,
      });
      onFailedRef.current?.();
    }
  }, [application, run, lostTrack, queryClient]);

  return {
    isRunning: run !== null && !failed,
    application,
    follow: (response) =>
      setRun({ workspaceId: response.workspaceId, applicationId: response.id }),
    reset: () => setRun(null),
  };
}
