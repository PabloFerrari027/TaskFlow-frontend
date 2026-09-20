"use client";

import { useRouter } from "next/navigation";
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
  createProjectSchema,
  type CreateProjectFormValues,
} from "@/features/projects/schemas";
import { useCreateProjectMutation } from "@/features/projects/hooks/use-projects";
import type { Project } from "@/types/project";

interface CreateProjectDialogProps {
  workspaceId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  // When set, creates a sub-project of this project. The parent is fixed here —
  // re-parenting later is a separate "Mover para…" action, not part of this form.
  parent?: Project | null;
}

export function CreateProjectDialog({
  workspaceId,
  open,
  onOpenChange,
  parent,
}: CreateProjectDialogProps) {
  const router = useRouter();
  const createMutation = useCreateProjectMutation(workspaceId);

  const form = useForm<CreateProjectFormValues>({
    resolver: zodResolver(createProjectSchema),
    defaultValues: { name: "", description: "" },
  });

  function onSubmit(values: CreateProjectFormValues) {
    createMutation.mutate(
      {
        name: values.name,
        description: values.description || undefined,
        parentId: parent?.id,
      },
      {
        onSuccess: (project) => {
          form.reset();
          onOpenChange(false);
          router.push(`/projects/${project.id}`);
        },
      }
    );
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
          <DialogTitle>{parent ? "Novo sub-projeto" : "Novo projeto"}</DialogTitle>
          <DialogDescription>
            {parent
              ? `Crie um sub-projeto dentro de “${parent.name}”.`
              : "Crie um projeto dentro deste workspace."}
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nome</FormLabel>
                  <FormControl>
                    <Input placeholder="Website Redesign" autoFocus {...field} />
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
                    <Textarea rows={3} placeholder="Do que se trata este projeto?" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter>
              <Button type="submit" disabled={createMutation.isPending}>
                {createMutation.isPending ? <Loader2 className="animate-spin" /> : null}
                {parent ? "Criar sub-projeto" : "Criar projeto"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
