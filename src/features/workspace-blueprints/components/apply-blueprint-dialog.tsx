"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Bot, LayoutDashboard, Repeat, Workflow } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ErrorState } from "@/components/shared/error-state";
import { toast } from "sonner";
import { InstantiationProgress } from "@/features/folder-templates/components/template-choices-fields";
import { TEMPLATE_LEVEL_LABEL } from "@/features/folder-templates/lib/template-labels";
import {
  BlueprintSetupFields,
  initialBlueprintSetup,
  missingBlueprintVariables,
  toApplyRequest,
  type BlueprintSetupValue,
} from "@/features/workspace-blueprints/components/blueprint-setup-fields";
import {
  useApplyWorkspaceBlueprintMutation,
  useBlueprintApplicationRunner,
  useWorkspaceBlueprintQuery,
} from "@/features/workspace-blueprints/hooks/use-workspace-blueprints";
import { getAudienceInfo } from "@/features/workspace-blueprints/lib/audiences";
import type { Workspace } from "@/types/workspace";
import type {
  WorkspaceBlueprintConnection,
  WorkspaceBlueprintSummary,
} from "@/types/workspace-blueprint";

const CONNECTION_INFO: Record<
  WorkspaceBlueprintConnection["kind"],
  { label: string; icon: React.ReactNode }
> = {
  AUTOMATION: { label: "Automação", icon: <Workflow className="size-3.5" /> },
  DASHBOARD: { label: "Painel", icon: <LayoutDashboard className="size-3.5" /> },
  RECURRENCE: { label: "Rotina", icon: <Repeat className="size-3.5" /> },
};

interface ApplyBlueprintDialogProps {
  blueprint: WorkspaceBlueprintSummary;
  workspace: Workspace;
  // OWNER/ADMIN; anyone else only looks.
  canApply: boolean;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

/** A blueprint's detail, and applying it to the current workspace. */
export function ApplyBlueprintDialog({
  blueprint,
  workspace,
  canApply,
  open,
  onOpenChange,
}: ApplyBlueprintDialogProps) {
  const router = useRouter();
  const detailQuery = useWorkspaceBlueprintQuery(blueprint.key);
  const detail = detailQuery.data;
  const applyMutation = useApplyWorkspaceBlueprintMutation();
  const [setup, setSetup] = React.useState<BlueprintSetupValue | null>(null);
  const [setupError, setSetupError] = React.useState<string | null>(null);
  const runner = useBlueprintApplicationRunner((application) => {
    const count = application.result?.folders.length ?? 0;
    toast.success(
      `Modelo aplicado: ${count} ${count === 1 ? "pasta criada" : "pastas criadas"} em ${workspace.name}.`
    );
    onOpenChange(false);
    router.push("/folders");
  });

  const isLocked = applyMutation.isPending || runner.isRunning;
  const currentSetup = detail ? (setup ?? initialBlueprintSetup(detail)) : null;
  const audience = getAudienceInfo(blueprint.audience);

  function onApply() {
    if (isLocked || !detail || !currentSetup) return;
    const missing = missingBlueprintVariables(detail, currentSetup);
    if (missing.length > 0) {
      setSetupError(`Preencha: ${missing.join(", ")}.`);
      return;
    }
    setSetupError(null);
    applyMutation.mutate(
      { workspaceId: workspace.id, key: blueprint.key, input: toApplyRequest(currentSetup) },
      { onSuccess: runner.follow }
    );
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        // Closing mid-run would hide the outcome of a non-idempotent call.
        if (isLocked) return;
        onOpenChange(next);
      }}
    >
      <DialogContent className="flex max-h-[90vh] flex-col gap-0 overflow-hidden p-0 sm:max-w-2xl">
        <DialogHeader className="border-b px-6 pt-6 pb-4">
          <div className="flex items-center gap-3">
            <span
              aria-hidden
              className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-muted text-xl"
            >
              {audience.icon}
            </span>
            <div className="min-w-0">
              <DialogTitle className="text-lg">{blueprint.name}</DialogTitle>
              <DialogDescription>
                {audience.label} · {TEMPLATE_LEVEL_LABEL[blueprint.level]}
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="min-h-0 flex-1 space-y-5 overflow-y-auto px-6 py-5">
          {detailQuery.isError ? (
            <ErrorState error={detailQuery.error} onRetry={() => detailQuery.refetch()} />
          ) : (
            <>
              <p className="text-sm text-muted-foreground">
                {detail?.description ?? blueprint.tagline}
              </p>

              <BlueprintSetupFields
                blueprint={detail}
                value={currentSetup}
                onChange={setSetup}
                disabled={isLocked || !canApply}
              />

              {detail && detail.connections.length > 0 ? (
                <div className="space-y-2">
                  <p className="text-sm font-medium">O que liga as pastas</p>
                  <ul className="flex flex-wrap gap-1.5">
                    {detail.connections.map((connection) => {
                      const info = CONNECTION_INFO[connection.kind];
                      return (
                        <li
                          key={`${connection.kind}-${connection.name}`}
                          title={info.label}
                          className="inline-flex items-center gap-1.5 rounded-full border bg-card px-2.5 py-1 text-xs text-muted-foreground"
                        >
                          {info.icon} {connection.name}
                        </li>
                      );
                    })}
                  </ul>
                </div>
              ) : null}

              {detail && detail.placementHints.length > 0 ? (
                <p className="flex items-start gap-2 rounded-lg bg-muted/60 p-3 text-xs text-muted-foreground">
                  <Bot className="mt-0.5 size-4 shrink-0" />
                  O assistente já sabe em qual pasta guardar cada assunto desde o primeiro dia.
                </p>
              ) : null}

              {setupError ? <p className="text-sm text-destructive">{setupError}</p> : null}
              {runner.isRunning ? (
                <InstantiationProgress
                  done={runner.application?.progressDone ?? 0}
                  total={runner.application?.progressTotal ?? 0}
                  label="Criando as pastas…"
                />
              ) : null}
            </>
          )}
        </div>

        <DialogFooter className="mx-0 mb-0 px-6 py-4">
          {canApply ? (
            <>
              <Button
                type="button"
                variant="outline"
                disabled={isLocked}
                onClick={() => onOpenChange(false)}
              >
                Cancelar
              </Button>
              <Button
                type="button"
                onClick={onApply}
                disabled={isLocked || !detail || !blueprint.available}
                loading={isLocked}
              >
                {isLocked ? "Criando pastas…" : `Usar em ${workspace.name}`}
              </Button>
            </>
          ) : (
            <p className="mr-auto text-xs text-muted-foreground">
              Só donos e administradores do workspace podem usar modelos.
            </p>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
