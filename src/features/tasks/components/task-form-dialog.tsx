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
import { AssigneeSelect } from "@/features/tasks/components/assignee-select";
import { taskFormSchema, type TaskFormValues } from "@/features/tasks/schemas";
import { useCreateTaskMutation, useUpdateTaskMutation } from "@/features/tasks/hooks/use-tasks";
import type { Task } from "@/types/task";

interface TaskFormDialogProps {
  projectId: string;
  task?: Task;
  parentTaskId?: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function TaskFormDialog({
  projectId,
  task,
  parentTaskId,
  open,
  onOpenChange,
}: TaskFormDialogProps) {
  const isEditing = Boolean(task);
  const createMutation = useCreateTaskMutation(projectId);
  const updateMutation = useUpdateTaskMutation(task?.id ?? "");
  const isPending = createMutation.isPending || updateMutation.isPending;

  const form = useForm<TaskFormValues>({
    resolver: zodResolver(taskFormSchema),
    values: {
      title: task?.title ?? "",
      description: task?.description ?? "",
      assigneeId: task?.assigneeId ?? undefined,
    },
  });

  function onSubmit(values: TaskFormValues) {
    if (isEditing && task) {
      updateMutation.mutate(
        {
          title: values.title,
          description: values.description || undefined,
          assigneeId: values.assigneeId,
        },
        { onSuccess: () => onOpenChange(false) }
      );
    } else {
      createMutation.mutate(
        {
          title: values.title,
          description: values.description || undefined,
          assigneeId: values.assigneeId,
          parentTaskId,
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
