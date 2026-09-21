"use client";

import * as React from "react";
import { toast } from "sonner";
import { Trash2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { SectionSelect } from "@/features/tasks/components/section-select";
import { useTaskSelection } from "@/features/tasks/context/task-selection-context";
import {
  useDeleteTasksMutation,
  useMoveTasksToSectionMutation,
} from "@/features/tasks/hooks/use-tasks";

/**
 * Floating toolbar for the tasks picked on the board: move them to another
 * column or delete them, all at once. Only rendered while something is selected.
 */
export function TaskSelectionBar({ projectId }: { projectId: string }) {
  const selection = useTaskSelection();
  const moveMutation = useMoveTasksToSectionMutation();
  const deleteMutation = useDeleteTasksMutation();
  const [deleteOpen, setDeleteOpen] = React.useState(false);

  if (selection.count === 0) return null;

  const isBusy = moveMutation.isPending || deleteMutation.isPending;
  const countLabel =
    selection.count === 1 ? "1 tarefa selecionada" : `${selection.count} tarefas selecionadas`;

  function handleMove(sectionId: string) {
    // Tasks already in the destination have nothing to move.
    const toMove = selection.tasks.filter((task) => task.sectionId !== sectionId);
    if (toMove.length === 0) {
      toast.info("As tarefas selecionadas já estão nessa coluna.");
      return;
    }
    moveMutation.mutate(
      { tasks: toMove, sectionId },
      // Keep the ones that failed selected so the move can be retried.
      { onSuccess: ({ movedIds }) => selection.deselect(movedIds) }
    );
  }

  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-4 z-40 flex justify-center px-4">
      <div
        role="toolbar"
        aria-label="Ações para as tarefas selecionadas"
        className="pointer-events-auto flex flex-wrap items-center gap-2 rounded-lg border border-border bg-background p-2 shadow-lg"
      >
        <span className="px-2 text-sm font-medium text-foreground">{countLabel}</span>
        <div className="w-52">
          <SectionSelect
            projectId={projectId}
            value=""
            placeholder="Mover para…"
            disabled={isBusy}
            onChange={handleMove}
          />
        </div>
        <Button
          variant="destructive"
          size="sm"
          disabled={isBusy}
          onClick={() => setDeleteOpen(true)}
        >
          <Trash2 /> Apagar
        </Button>
        <Button variant="ghost" size="sm" disabled={isBusy} onClick={selection.clear}>
          <X /> Limpar seleção
        </Button>
      </div>

      <ConfirmDialog
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        trigger={<span className="hidden" />}
        title={
          selection.count === 1
            ? "Apagar a tarefa selecionada?"
            : `Apagar as ${selection.count} tarefas selecionadas?`
        }
        description="As tarefas somem do quadro e essa ação não pode ser desfeita."
        confirmLabel={selection.count === 1 ? "Apagar tarefa" : "Apagar tarefas"}
        isLoading={deleteMutation.isPending}
        onConfirm={() =>
          // Keep the ones that weren't deleted selected, so it can be retried.
          deleteMutation.mutate(selection.tasks, {
            onSuccess: ({ deletedIds }) => selection.deselect(deletedIds),
          })
        }
      />
    </div>
  );
}
