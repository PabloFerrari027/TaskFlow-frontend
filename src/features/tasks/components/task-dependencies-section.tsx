"use client";

import * as React from "react";
import { CheckCircle2, Circle, Link2, Loader2, Plus, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Skeleton } from "@/components/ui/skeleton";
import { TaskDueDateBadge } from "@/components/shared/status-badge";
import { useDebouncedValue } from "@/lib/use-debounced-value";
import { useCurrentWorkspace } from "@/features/workspaces/context/current-workspace-context";
import { MIN_SEARCH_LENGTH, useWorkspaceSearchQuery } from "@/features/search/hooks/use-search";
import { useTaskPanel } from "@/features/tasks/hooks/use-task-panel";
import {
  useAddTaskDependencyMutation,
  useRemoveTaskDependencyMutation,
  useTaskDependenciesQuery,
} from "@/features/tasks/hooks/use-task-dependencies";
import type { TaskDependencyLink } from "@/types/task";

function LinkRow({
  link,
  onRemove,
  removeLabel,
}: {
  link: TaskDependencyLink;
  onRemove?: () => void;
  removeLabel?: string;
}) {
  const { openTask } = useTaskPanel();
  const done = link.status === "DONE";

  return (
    <li className="flex items-center gap-2">
      {done ? (
        <CheckCircle2 className="size-4 shrink-0 text-emerald-600" aria-label="Concluída" />
      ) : (
        <Circle className="size-4 shrink-0 text-muted-foreground" aria-label="Não concluída" />
      )}
      <button
        type="button"
        onClick={() => openTask(link.taskId)}
        className={
          done
            ? "min-w-0 flex-1 truncate text-left text-sm text-muted-foreground line-through hover:underline"
            : "min-w-0 flex-1 truncate text-left text-sm hover:underline"
        }
      >
        {link.title}
      </button>
      {link.dueDate && !done ? <TaskDueDateBadge dueDate={link.dueDate} /> : null}
      {onRemove ? (
        <Button variant="ghost" size="icon-sm" aria-label={removeLabel} title={removeLabel} onClick={onRemove}>
          <X />
        </Button>
      ) : null}
    </li>
  );
}

function BlockerPicker({
  projectId,
  taskId,
  excluded,
}: {
  projectId: string;
  taskId: string;
  excluded: Set<string>;
}) {
  const [open, setOpen] = React.useState(false);
  const [text, setText] = React.useState("");
  const q = useDebouncedValue(text.trim(), 250);
  const { workspaceId } = useCurrentWorkspace();
  const searchQuery = useWorkspaceSearchQuery(workspaceId, {
    q,
    types: ["TASK"],
    projectId,
    limit: 20,
  });
  const addMutation = useAddTaskDependencyMutation(taskId);

  // Search also covers sub-projects; a dependency must stay in this project.
  const candidates = (searchQuery.data?.data ?? []).filter(
    (result) => result.projectId === projectId && result.id !== taskId && !excluded.has(result.id)
  );

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="outline" size="sm" className="w-full">
          <Plus /> Esta tarefa depende de…
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-0" align="start">
        <Command shouldFilter={false}>
          <CommandInput value={text} onValueChange={setText} placeholder="Buscar tarefa deste projeto…" />
          <CommandList>
            {text.trim().length < MIN_SEARCH_LENGTH ? (
              <p className="p-4 text-center text-xs text-muted-foreground">
                Digite parte do nome da tarefa que precisa terminar antes desta.
              </p>
            ) : searchQuery.isFetching && candidates.length === 0 ? (
              <p className="flex items-center justify-center gap-2 p-4 text-xs text-muted-foreground">
                <Loader2 className="size-3.5 animate-spin" /> Buscando…
              </p>
            ) : (
              <>
                <CommandEmpty>Nenhuma tarefa encontrada.</CommandEmpty>
                <CommandGroup>
                  {candidates.map((result) => (
                    <CommandItem
                      key={result.id}
                      value={result.id}
                      disabled={addMutation.isPending}
                      onSelect={() =>
                        addMutation.mutate(result.id, {
                          onSuccess: () => {
                            setOpen(false);
                            setText("");
                          },
                        })
                      }
                    >
                      <span className="truncate">{result.title}</span>
                    </CommandItem>
                  ))}
                </CommandGroup>
              </>
            )}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}

/** "Depende de" (must finish first) and "Bloqueia" (waits for this one). */
export function TaskDependenciesSection({ projectId, taskId }: { projectId: string; taskId: string }) {
  const dependenciesQuery = useTaskDependenciesQuery(taskId);
  const removeMutation = useRemoveTaskDependencyMutation(taskId);
  const view = dependenciesQuery.data;

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <Link2 className="size-4 text-muted-foreground" />
        <h3 className="text-sm font-medium text-foreground">Dependências</h3>
      </div>

      {dependenciesQuery.isLoading ? (
        <Skeleton className="h-16 w-full" />
      ) : !view ? (
        <p className="text-sm text-muted-foreground">Não foi possível carregar as dependências.</p>
      ) : (
        <>
          <div className="space-y-2">
            <p className="text-xs font-medium text-muted-foreground uppercase">Depende de</p>
            {view.blockedBy.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                Nenhuma. Use quando esta tarefa só puder começar depois que outra terminar.
              </p>
            ) : (
              <>
                {view.openBlockerCount > 0 ? (
                  <p className="rounded-md bg-amber-500/10 px-2 py-1 text-xs text-amber-700 dark:text-amber-400">
                    {view.openBlockerCount === 1
                      ? "Ainda falta terminar 1 tarefa antes desta."
                      : `Ainda faltam terminar ${view.openBlockerCount} tarefas antes desta.`}
                  </p>
                ) : null}
                <ul className="space-y-1.5">
                  {view.blockedBy.map((link) => (
                    <LinkRow
                      key={link.dependencyId}
                      link={link}
                      removeLabel={`Não depender mais de ${link.title}`}
                      onRemove={() => removeMutation.mutate(link.taskId)}
                    />
                  ))}
                </ul>
              </>
            )}
            <BlockerPicker
              projectId={projectId}
              taskId={taskId}
              excluded={new Set(view.blockedBy.map((link) => link.taskId))}
            />
          </div>

          {view.blocking.length > 0 ? (
            <div className="space-y-2">
              <p className="text-xs font-medium text-muted-foreground uppercase">Esperando por esta</p>
              <ul className="space-y-1.5">
                {view.blocking.map((link) => (
                  <LinkRow key={link.dependencyId} link={link} />
                ))}
              </ul>
            </div>
          ) : null}
        </>
      )}
    </div>
  );
}
