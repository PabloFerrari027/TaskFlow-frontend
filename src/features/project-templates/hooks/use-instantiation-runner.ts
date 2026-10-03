"use client";

import * as React from "react";
import { toast } from "sonner";
import {
  useOnInstantiationFinished,
  useTemplateInstantiationQuery,
} from "@/features/project-templates/hooks/use-project-templates";
import type {
  InstantiateProjectTemplateResponse,
  TemplateInstantiation,
} from "@/types/project-template";

export interface InstantiationRun {
  /** Started and not finished: the form must stay locked. */
  isRunning: boolean;
  instantiation: TemplateInstantiation | undefined;
  /** Hand it the 202 of instantiate / apply / draft. */
  follow: (response: InstantiateProjectTemplateResponse) => void;
  reset: () => void;
}

/**
 * Follows a queued instantiation (API.md § 26.5) to the end. On success the
 * caches it touched are refreshed and `onSucceeded` gets the project; on
 * failure nothing was created (the run is all-or-nothing), the error is shown
 * and the form can be sent again.
 */
export function useInstantiationRunner(
  workspaceId: string,
  onSucceeded: (projectId: string) => void
): InstantiationRun {
  const [instantiationId, setInstantiationId] = React.useState<string | null>(null);
  const query = useTemplateInstantiationQuery(workspaceId, instantiationId);
  const onFinished = useOnInstantiationFinished();
  // Each outcome is acted on once (the query keeps answering the same one).
  const handled = React.useRef<string | null>(null);
  const onSucceededRef = React.useRef(onSucceeded);

  React.useEffect(() => {
    onSucceededRef.current = onSucceeded;
  });

  const instantiation = instantiationId ? query.data : undefined;
  // Losing track of the run (404, network) is not a failure of the run
  // itself — it may still finish on the server.
  const lostTrack = instantiationId !== null && query.isError;
  const failed = instantiation?.status === "FAILED" || lostTrack;

  React.useEffect(() => {
    if (!instantiationId || handled.current === instantiationId) return;
    if (lostTrack) {
      handled.current = instantiationId;
      toast.error("Perdemos o acompanhamento do modelo. Confira a lista de projetos em instantes.");
      return;
    }
    if (!instantiation) return;
    if (instantiation.status === "SUCCEEDED" && instantiation.projectId) {
      handled.current = instantiationId;
      onFinished(workspaceId, instantiation.projectId);
      onSucceededRef.current(instantiation.projectId);
    } else if (instantiation.status === "FAILED") {
      handled.current = instantiationId;
      toast.error("Não foi possível usar o modelo. Nada foi criado.", {
        description: instantiation.errorMessage ?? undefined,
      });
    }
  }, [instantiation, instantiationId, lostTrack, onFinished, workspaceId]);

  return {
    isRunning: instantiationId !== null && !failed,
    instantiation,
    follow: (response) => setInstantiationId(response.instantiationId),
    reset: () => setInstantiationId(null),
  };
}
