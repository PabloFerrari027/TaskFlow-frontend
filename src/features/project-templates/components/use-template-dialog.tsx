"use client";

import { useRouter } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { Loader2 } from "lucide-react";
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
import { useInstantiateProjectTemplateMutation } from "@/features/project-templates/hooks/use-project-templates";
import {
  instantiateTemplateSchema,
  type InstantiateTemplateFormValues,
} from "@/features/project-templates/schemas";
import type { ProjectTemplateSummary } from "@/types/project-template";
import type { Workspace } from "@/types/workspace";

interface UseTemplateDialogProps {
  template: ProjectTemplateSummary;
  workspace: Workspace;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function UseTemplateDialog({ template, workspace, open, onOpenChange }: UseTemplateDialogProps) {
  const router = useRouter();
  const instantiateMutation = useInstantiateProjectTemplateMutation(workspace.id);
  // Stays locked after success too, until the navigation replaces the page:
  // a second submit would create a second project.
  const isLocked = instantiateMutation.isPending || instantiateMutation.isSuccess;

  const form = useForm<InstantiateTemplateFormValues>({
    resolver: zodResolver(instantiateTemplateSchema),
    defaultValues: { name: template.name },
  });

  function onSubmit(values: InstantiateTemplateFormValues) {
    if (isLocked) return;
    instantiateMutation.mutate(
      { templateId: template.id, name: values.name },
      { onSuccess: ({ projectId }) => router.push(`/projects/${projectId}/tasks`) }
    );
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        // Closing mid-request would hide the outcome of a non-idempotent call.
        if (instantiateMutation.isPending) return;
        onOpenChange(next);
      }}
    >
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Usar este modelo</DialogTitle>
          <DialogDescription>
            Um projeto novo será criado em <strong>{workspace.name}</strong>, já com as colunas, os
            campos e as tarefas de exemplo do modelo.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nome do projeto</FormLabel>
                  <FormControl>
                    <Input autoFocus disabled={isLocked} {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter>
              <Button type="submit" disabled={isLocked}>
                {isLocked ? <Loader2 className="animate-spin" /> : null}
                {isLocked ? "Criando projeto…" : "Criar projeto"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
