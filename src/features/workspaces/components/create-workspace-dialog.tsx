"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { LayoutTemplate, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { workspaceNameSchema, type WorkspaceNameFormValues } from "@/features/workspaces/schemas";
import { useCreateWorkspaceMutation } from "@/features/workspaces/hooks/use-workspaces";
import { useCurrentWorkspace } from "@/features/workspaces/context/current-workspace-context";
import { ErrorState } from "@/components/shared/error-state";
import { InstantiationProgress } from "@/features/folder-templates/components/template-choices-fields";
import {
  BlueprintPicker,
  formatBlueprintCounts,
} from "@/features/workspace-blueprints/components/blueprint-picker";
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
import { getErrorMessage } from "@/lib/errors";
import { queryKeys } from "@/lib/query-keys";
import type { Workspace } from "@/types/workspace";
import type { WorkspaceBlueprintSummary } from "@/types/workspace-blueprint";
import { toast } from "sonner";

interface CreateWorkspaceDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function CreateWorkspaceDialog({ open, onOpenChange }: CreateWorkspaceDialogProps) {
  // Mounted only while open, so every opening starts blank.
  if (!open) return null;
  return <CreateWorkspaceDialogContent onOpenChange={onOpenChange} />;
}

function CreateWorkspaceDialogContent({
  onOpenChange,
}: Pick<CreateWorkspaceDialogProps, "onOpenChange">) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const createMutation = useCreateWorkspaceMutation({ deferListRefresh: true });
  const applyMutation = useApplyWorkspaceBlueprintMutation();
  const { setWorkspaceId } = useCurrentWorkspace();
  const [blueprint, setBlueprint] = React.useState<WorkspaceBlueprintSummary | null>(null);
  // The gallery has no variables: what the blueprint asks comes from its detail.
  const detailQuery = useWorkspaceBlueprintQuery(blueprint?.key);
  const detail = blueprint && detailQuery.data?.key === blueprint.key ? detailQuery.data : undefined;
  const [setup, setSetup] = React.useState<BlueprintSetupValue | null>(null);
  const [setupError, setSetupError] = React.useState<string | null>(null);
  // Set once the workspace exists: from here on, any outcome ends in it.
  const [created, setCreated] = React.useState<Workspace | null>(null);

  // The list is refreshed only now (see `deferListRefresh`), and before the
  // switch: a current id missing from the list falls back to the first one.
  async function finish(workspaceId: string, href?: string) {
    await queryClient.invalidateQueries({ queryKey: queryKeys.workspaces.all() });
    setWorkspaceId(workspaceId);
    onOpenChange(false);
    if (href) router.push(href);
  }

  const runner = useBlueprintApplicationRunner(
    (application) => {
      const count = application.result?.folders.length ?? 0;
      toast.success(
        count > 0
          ? `Workspace criado com ${count} ${count === 1 ? "pasta pronta" : "pastas prontas"}.`
          : "Workspace criado."
      );
      void finish(application.workspaceId, "/folders");
    },
    // The blueprint left nothing behind, but the workspace exists.
    () => {
      if (created) void finish(created.id);
    }
  );

  const form = useForm<WorkspaceNameFormValues>({
    resolver: zodResolver(workspaceNameSchema),
    defaultValues: { name: "" },
  });

  const isLocked =
    createMutation.isPending || applyMutation.isPending || runner.isRunning || created !== null;
  const currentSetup = detail ? (setup ?? initialBlueprintSetup(detail)) : null;

  function selectBlueprint(next: WorkspaceBlueprintSummary) {
    if (blueprint?.key === next.key) {
      setBlueprint(null);
      return;
    }
    // Only fill the name when the user hasn't typed one, or it was the
    // previous blueprint's.
    const current = form.getValues("name").trim();
    if (!current || current === blueprint?.name) {
      form.setValue("name", next.name, { shouldValidate: form.formState.isSubmitted });
    }
    setBlueprint(next);
    setSetup(null);
    setSetupError(null);
  }

  function onSubmit(values: WorkspaceNameFormValues) {
    if (isLocked) return;

    let chosen: { key: string; setup: BlueprintSetupValue } | null = null;
    if (blueprint) {
      // Still loading what the blueprint asks.
      if (!detail || !currentSetup) return;
      const missing = missingBlueprintVariables(detail, currentSetup);
      if (missing.length > 0) {
        setSetupError(`Preencha: ${missing.join(", ")}.`);
        return;
      }
      setSetupError(null);
      chosen = { key: blueprint.key, setup: currentSetup };
    }

    createMutation.mutate(values, {
      onSuccess: (workspace) => {
        setCreated(workspace);
        if (!chosen) {
          toast.success("Workspace criado.");
          void finish(workspace.id);
          return;
        }
        applyMutation.mutate(
          { workspaceId: workspace.id, key: chosen.key, input: toApplyRequest(chosen.setup) },
          {
            onSuccess: runner.follow,
            // The hook already said why; the workspace itself was created.
            onError: () => void finish(workspace.id),
          }
        );
      },
      onError: (error) => toast.error(getErrorMessage(error)),
    });
  }

  const audience = blueprint ? getAudienceInfo(blueprint.audience) : null;

  return (
    <Dialog
      open
      onOpenChange={(next) => {
        // Closing mid-run would hide the outcome of a non-idempotent call.
        if (isLocked) return;
        onOpenChange(next);
      }}
    >
      {/* Header and footer stay put; only the body scrolls on short screens. */}
      <DialogContent className="flex max-h-[90vh] flex-col gap-0 overflow-hidden p-0 sm:max-w-3xl">
        <DialogHeader className="border-b px-6 pt-6 pb-4">
          <DialogTitle className="text-lg">Novo workspace</DialogTitle>
          <DialogDescription>
            Comece do zero ou escolha um modelo: o TaskFlow cria as pastas e o que liga uma à
            outra. Você será o proprietário.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="flex min-h-0 flex-1 flex-col">
            <div className="min-h-0 flex-1 space-y-5 overflow-y-auto px-6 py-5">
              {blueprint && audience ? (
                <div className="flex items-center gap-3 rounded-lg border border-primary/30 bg-primary/5 p-3 animate-in fade-in-0 slide-in-from-top-1">
                  <span
                    aria-hidden
                    className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-primary/15 text-lg"
                  >
                    {audience.icon}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">Usando “{blueprint.name}”</p>
                    <p className="text-xs text-muted-foreground">
                      Já vem com {formatBlueprintCounts(blueprint)}.
                    </p>
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    disabled={isLocked}
                    onClick={() => setBlueprint(null)}
                  >
                    <X /> Começar do zero
                  </Button>
                </div>
              ) : null}

              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nome do workspace</FormLabel>
                    <FormControl>
                      <Input placeholder="Marketing Team" autoFocus disabled={isLocked} {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {blueprint && detailQuery.isError ? (
                <ErrorState error={detailQuery.error} onRetry={() => detailQuery.refetch()} />
              ) : blueprint ? (
                <BlueprintSetupFields
                  blueprint={detail}
                  value={currentSetup}
                  onChange={setSetup}
                  disabled={isLocked}
                />
              ) : null}
              {setupError ? <p className="text-sm text-destructive">{setupError}</p> : null}
              {runner.isRunning ? (
                <InstantiationProgress
                  done={runner.application?.progressDone ?? 0}
                  total={runner.application?.progressTotal ?? 0}
                  label="Montando o workspace…"
                />
              ) : null}

              {!blueprint ? (
                <div className="space-y-3 border-t pt-5">
                  <p className="flex items-center gap-1.5 text-sm font-medium">
                    <LayoutTemplate className="size-4 text-primary" />
                    Comece com um modelo pronto
                  </p>
                  <BlueprintPicker
                    selectedKey={null}
                    onSelect={selectBlueprint}
                    disabled={isLocked}
                  />
                </div>
              ) : null}
            </div>

            <DialogFooter className="mx-0 mb-0 px-6 py-4">
              <Button
                type="button"
                variant="outline"
                disabled={isLocked}
                onClick={() => onOpenChange(false)}
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                disabled={isLocked || (blueprint !== null && !detail)}
                loading={isLocked}
              >
                {blueprint
                  ? isLocked
                    ? "Montando workspace…"
                    : "Criar a partir do modelo"
                  : "Criar workspace"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
