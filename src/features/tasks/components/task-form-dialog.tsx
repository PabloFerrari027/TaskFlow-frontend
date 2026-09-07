"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { AssigneeSelect } from "@/features/tasks/components/assignee-select";
import { SectionSelect } from "@/features/tasks/components/section-select";
import {
  NO_PRIORITY_VALUE,
  taskFormSchema,
  type TaskFormValues,
} from "@/features/tasks/schemas";
import {
  useCreateTaskMutation,
  useUnassignTaskMutation,
  useUpdateTaskMutation,
} from "@/features/tasks/hooks/use-tasks";
import { useSectionsQuery } from "@/features/sections/hooks/use-sections";
import { TASK_PRIORITY_LABEL } from "@/components/shared/status-badge";
import { fromDateInputValue, toDateInputValue } from "@/lib/format";
import type { Task, TaskPriority } from "@/types/task";

interface TaskFormDialogProps {
  projectId: string;
  task?: Task;
  parentTaskId?: string;
  sectionId?: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function TaskFormDialog({
  projectId,
  task,
  parentTaskId,
  sectionId,
  open,
  onOpenChange,
}: TaskFormDialogProps) {
  const isEditing = Boolean(task);
  const createMutation = useCreateTaskMutation(projectId);
  const updateMutation = useUpdateTaskMutation(task?.id ?? "");
  const unassignMutation = useUnassignTaskMutation(task?.id ?? "");
  const isPending =
    createMutation.isPending || updateMutation.isPending || unassignMutation.isPending;
  const sectionsQuery = useSectionsQuery(projectId);
  const defaultSectionId = sectionsQuery.data?.find((s) => s.isDefault)?.id;

  const form = useForm<TaskFormValues>({
    resolver: zodResolver(taskFormSchema),
    values: {
      title: task?.title ?? "",
      description: task?.description ?? "",
      assigneeId: task?.assigneeId ?? undefined,
      sectionId: task?.sectionId ?? sectionId ?? defaultSectionId ?? "",
      dueDate: toDateInputValue(task?.dueDate),
      priority: task?.priority ?? undefined,
    },
  });

  function onSubmit(values: TaskFormValues) {
    const dueDate = values.dueDate ? fromDateInputValue(values.dueDate) : undefined;

    if (isEditing && task) {
      // `PATCH /tasks/:taskId` can't clear `assigneeId` (see
      // `useUnassignTaskMutation`) — omitting it from this request would
      // silently leave the previous assignee in place, so that specific
      // change has to go through a separate call.
      const isUnassigning = Boolean(task.assigneeId) && !values.assigneeId;
      updateMutation.mutate(
        {
          title: values.title,
          description: values.description || undefined,
          assigneeId: isUnassigning ? undefined : values.assigneeId,
          sectionId: values.sectionId,
          dueDate,
          priority: values.priority,
        },
        {
          onSuccess: () => {
            if (isUnassigning) {
              unassignMutation.mutate(undefined, { onSuccess: () => onOpenChange(false) });
            } else {
              onOpenChange(false);
            }
          },
        }
      );
    } else {
      createMutation.mutate(
        {
          title: values.title,
          description: values.description || undefined,
          assigneeId: values.assigneeId,
          sectionId: values.sectionId,
          parentTaskId,
          dueDate,
          priority: values.priority,
        },
        {
          onSuccess: () => {
            form.reset();
            onOpenChange(false);
          },
        }
      );
    }
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (!next) form.reset();
        onOpenChange(next);
      }}
    >
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {isEditing ? "Editar tarefa" : parentTaskId ? "Nova subtarefa" : "Nova tarefa"}
          </DialogTitle>
          {!isEditing ? (
            <DialogDescription>
              {parentTaskId
                ? "A subtarefa será criada neste mesmo projeto."
                : "Crie uma tarefa neste projeto."}
            </DialogDescription>
          ) : null}
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Título</FormLabel>
                  <FormControl>
                    <Input placeholder="Corrigir bug de login" autoFocus {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Descrição (opcional)</FormLabel>
                  <FormControl>
                    <Textarea rows={3} {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="sectionId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Coluna</FormLabel>
                  <FormControl>
                    <SectionSelect
                      projectId={projectId}
                      value={field.value}
                      onChange={field.onChange}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="assigneeId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Responsável</FormLabel>
                  <FormControl>
                    <AssigneeSelect
                      projectId={projectId}
                      value={field.value}
                      onChange={field.onChange}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="dueDate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Prazo (opcional)</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} />
                    </FormControl>
                    {task?.dueDate ? (
                      <p className="text-xs text-muted-foreground">
                        Só é possível trocar por outra data.
                      </p>
                    ) : null}
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="priority"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Prioridade (opcional)</FormLabel>
                    <FormControl>
                      <Select
                        value={field.value ?? NO_PRIORITY_VALUE}
                        onValueChange={(next) =>
                          field.onChange(next === NO_PRIORITY_VALUE ? undefined : next as TaskPriority)
                        }
                      >
                        <SelectTrigger className="w-full">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {!task?.priority ? (
                            <SelectItem value={NO_PRIORITY_VALUE}>Sem prioridade</SelectItem>
                          ) : null}
                          {(Object.keys(TASK_PRIORITY_LABEL) as TaskPriority[]).map((p) => (
                            <SelectItem key={p} value={p}>
                              {TASK_PRIORITY_LABEL[p]}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </FormControl>
                    {task?.priority ? (
                      <p className="text-xs text-muted-foreground">
                        Só é possível trocar por outra prioridade.
                      </p>
                    ) : null}
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <DialogFooter>
              <Button type="submit" disabled={isPending}>
                {isPending ? <Loader2 className="animate-spin" /> : null}
                {isEditing ? "Salvar" : "Criar"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
