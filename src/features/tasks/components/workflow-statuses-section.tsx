"use client";

import * as React from "react";
import { ArrowDown, ArrowUp, Plus, Trash2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { ErrorState } from "@/components/shared/error-state";
import { TASK_STATUS_LABEL } from "@/components/shared/status-badge";
import { CATEGORY_COLOR } from "@/features/tasks/components/workflow-status-badge";
import {
  STATUS_CATEGORIES,
  statusesOfCategory,
  useCreateWorkflowStatusMutation,
  useDeleteWorkflowStatusMutation,
  useProjectStatusesQuery,
  useSwapWorkflowStatusesMutation,
  useUpdateWorkflowStatusMutation,
} from "@/features/tasks/hooks/use-workflow-statuses";
import type { TaskStatus, WorkflowStatus } from "@/types/task";

const CATEGORY_HINT: Record<TaskStatus, string> = {
  TODO: "Tarefas que ainda não começaram (ex.: Ideias, Backlog, Para fazer).",
  IN_PROGRESS: "Tarefas em andamento (ex.: Fazendo, Em revisão, Aguardando cliente).",
  DONE: "Tarefas terminadas (ex.: Concluída, Entregue, Cancelada).",
};

function ColorInput({
  value,
  onChange,
  label,
}: {
  value: string;
  onChange: (color: string) => void;
  label: string;
}) {
  return (
    <input
      type="color"
      value={value}
      onChange={(event) => onChange(event.target.value)}
      aria-label={label}
      title="Trocar a cor"
      className="size-8 shrink-0 cursor-pointer rounded-md border border-input bg-transparent p-0.5"
    />
  );
}

function StatusRow({
  status,
  projectId,
  isFirst,
  isLast,
  onMoveUp,
  onMoveDown,
  onDelete,
}: {
  status: WorkflowStatus;
  projectId: string;
  isFirst: boolean;
  isLast: boolean;
  onMoveUp: () => void;
  onMoveDown: () => void;
  onDelete: () => void;
}) {
  const updateMutation = useUpdateWorkflowStatusMutation(projectId);
  const [name, setName] = React.useState(status.name);
  // The color input fires on every drag step; only the last pick is saved.
  const colorTimer = React.useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const [color, setColor] = React.useState(status.color ?? CATEGORY_COLOR[status.category]);

  function saveName() {
    const trimmed = name.trim();
    if (!trimmed || trimmed === status.name) {
      setName(status.name);
      return;
    }
    updateMutation.mutate({ statusId: status.id, payload: { name: trimmed } });
  }

  function changeColor(next: string) {
    setColor(next);
    clearTimeout(colorTimer.current);
    colorTimer.current = setTimeout(
      () => updateMutation.mutate({ statusId: status.id, payload: { color: next.toUpperCase() } }),
      400
    );
  }

  return (
    <li className="flex items-center gap-2">
      <ColorInput value={color} onChange={changeColor} label={`Cor da etapa ${status.name}`} />
      <Input
        value={name}
        onChange={(event) => setName(event.target.value)}
        onBlur={saveName}
        onKeyDown={(event) => {
          if (event.key === "Enter") event.currentTarget.blur();
          if (event.key === "Escape") setName(status.name);
        }}
        aria-label="Nome da etapa"
        className="h-8"
      />
      {status.isDefault ? (
        <Badge variant="secondary" title="É para cá que a tarefa vai quando só o tipo é escolhido">
          Padrão
        </Badge>
      ) : null}
      <Button
        variant="ghost"
        size="icon-sm"
        aria-label="Subir"
        title="Subir"
        disabled={isFirst}
        onClick={onMoveUp}
      >
        <ArrowUp />
      </Button>
      <Button
        variant="ghost"
        size="icon-sm"
        aria-label="Descer"
        title="Descer"
        disabled={isLast}
        onClick={onMoveDown}
      >
        <ArrowDown />
      </Button>
      <Button
        variant="ghost"
        size="icon-sm"
        aria-label="Apagar etapa"
        title={isFirst && isLast ? "Cada tipo precisa de pelo menos uma etapa" : "Apagar etapa"}
        disabled={isFirst && isLast}
        className="text-destructive hover:text-destructive"
        onClick={onDelete}
      >
        <Trash2 />
      </Button>
    </li>
  );
}

function AddStatusForm({ projectId, category }: { projectId: string; category: TaskStatus }) {
  const createMutation = useCreateWorkflowStatusMutation(projectId);
  const [name, setName] = React.useState("");
  const [color, setColor] = React.useState(CATEGORY_COLOR[category]);

  return (
    <form
      className="flex items-center gap-2"
      onSubmit={(event) => {
        event.preventDefault();
        const trimmed = name.trim();
        if (!trimmed) return;
        createMutation.mutate(
          { name: trimmed, category, color: color.toUpperCase() },
          { onSuccess: () => setName("") }
        );
      }}
    >
      <ColorInput value={color} onChange={setColor} label="Cor da nova etapa" />
      <Input
        value={name}
        onChange={(event) => setName(event.target.value)}
        placeholder="Nome da nova etapa"
        aria-label={`Nova etapa em ${TASK_STATUS_LABEL[category]}`}
        className="h-8"
      />
      <Button type="submit" size="sm" variant="outline" disabled={!name.trim() || createMutation.isPending}>
        <Plus /> Adicionar
      </Button>
    </form>
  );
}

function DeleteStatusDialog({
  projectId,
  status,
  siblings,
  onClose,
}: {
  projectId: string;
  status: WorkflowStatus;
  siblings: WorkflowStatus[];
  onClose: () => void;
}) {
  const deleteMutation = useDeleteWorkflowStatusMutation(projectId);
  const [replacementId, setReplacementId] = React.useState(siblings[0]?.id ?? "");

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Apagar a etapa “{status.name}”?</DialogTitle>
          <DialogDescription>
            As tarefas que estão nela vão para outra etapa do mesmo tipo (
            {TASK_STATUS_LABEL[status.category].toLowerCase()}). Escolha qual:
          </DialogDescription>
        </DialogHeader>
        <Select value={replacementId} onValueChange={setReplacementId}>
          <SelectTrigger className="w-full" aria-label="Etapa que recebe as tarefas">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {siblings.map((sibling) => (
              <SelectItem key={sibling.id} value={sibling.id}>
                {sibling.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancelar
          </Button>
          <Button
            variant="destructive"
            disabled={!replacementId || deleteMutation.isPending}
            onClick={() =>
              deleteMutation.mutate(
                { statusId: status.id, replacementStatusId: replacementId },
                { onSuccess: onClose }
              )
            }
          >
            Apagar etapa
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export function WorkflowStatusesSection({ projectId }: { projectId: string }) {
  const statusesQuery = useProjectStatusesQuery(projectId);
  const swapMutation = useSwapWorkflowStatusesMutation(projectId);
  const [deleting, setDeleting] = React.useState<WorkflowStatus | null>(null);
  const statuses = statusesQuery.data;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Etapas das tarefas</CardTitle>
        <CardDescription>
          Toda tarefa está em uma etapa. As etapas se dividem em três tipos — a fazer, em andamento e
          concluída — e você pode criar quantas quiser em cada um. A primeira de cada tipo é a padrão.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {statusesQuery.isLoading ? (
          <Skeleton className="h-40 w-full" />
        ) : statusesQuery.isError || !statuses ? (
          <ErrorState error={statusesQuery.error} onRetry={() => statusesQuery.refetch()} />
        ) : (
          STATUS_CATEGORIES.map((category) => {
            const items = statusesOfCategory(statuses, category);
            return (
              <section key={category} className="space-y-2">
                <div>
                  <h3 className="text-sm font-medium text-foreground">{TASK_STATUS_LABEL[category]}</h3>
                  <p className="text-xs text-muted-foreground">{CATEGORY_HINT[category]}</p>
                </div>
                <ul className="space-y-2">
                  {items.map((status, index) => (
                    <StatusRow
                      // Remount when the server renames it, so the input shows the saved name.
                      key={`${status.id}:${status.name}`}
                      status={status}
                      projectId={projectId}
                      isFirst={index === 0}
                      isLast={index === items.length - 1}
                      onMoveUp={() => swapMutation.mutate({ a: status, b: items[index - 1] })}
                      onMoveDown={() => swapMutation.mutate({ a: status, b: items[index + 1] })}
                      onDelete={() => setDeleting(status)}
                    />
                  ))}
                </ul>
                <AddStatusForm projectId={projectId} category={category} />
              </section>
            );
          })
        )}
      </CardContent>

      {deleting && statuses ? (
        <DeleteStatusDialog
          projectId={projectId}
          status={deleting}
          siblings={statusesOfCategory(statuses, deleting.category).filter((s) => s.id !== deleting.id)}
          onClose={() => setDeleting(null)}
        />
      ) : null}
    </Card>
  );
}
