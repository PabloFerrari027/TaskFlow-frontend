"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm, useWatch } from "react-hook-form";
import { Loader2, X } from "lucide-react";
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
import { useAuth } from "@/lib/auth/auth-context";
import { cn } from "@/lib/utils";
import { canInstantiateProjectTemplate } from "@/lib/permissions";
import {
  createProjectSchema,
  type CreateProjectFormValues,
} from "@/features/projects/schemas";
import { useCreateProjectMutation } from "@/features/projects/hooks/use-projects";
import { useCurrentWorkspace } from "@/features/workspaces/context/current-workspace-context";
import { useInstantiateProjectTemplateMutation } from "@/features/project-templates/hooks/use-project-templates";
import { TemplateSuggestions } from "@/features/project-templates/components/template-suggestions";
import { getCategoryInfo } from "@/features/project-templates/lib/categories";
import { formatTemplateCounts } from "@/features/project-templates/lib/template-labels";
import type { Project } from "@/types/project";
import type { ProjectTemplateSummary } from "@/types/project-template";

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
  const { workspace } = useCurrentWorkspace();
  const { userId } = useAuth();
  const createMutation = useCreateProjectMutation(workspaceId);
  const instantiateMutation = useInstantiateProjectTemplateMutation(workspaceId);
  const [template, setTemplate] = React.useState<ProjectTemplateSummary | null>(null);

  const form = useForm<CreateProjectFormValues>({
    resolver: zodResolver(createProjectSchema),
    defaultValues: { name: "", description: "" },
  });
  const name = useWatch({ control: form.control, name: "name" });

  // A template always creates a top-level project, and using one takes
  // OWNER/ADMIN (stricter than a blank project) — otherwise no suggestions.
  const myRole =
    workspace?.id === workspaceId
      ? workspace.members.find((member) => member.userId === userId)?.role
      : undefined;
  const showSuggestions = !parent && canInstantiateProjectTemplate(myRole);
  // Stays locked after success too, until the navigation replaces the page:
  // a second submit would create a second project.
  const isLocked =
    createMutation.isPending || instantiateMutation.isPending || instantiateMutation.isSuccess;

  function reset() {
    form.reset();
    setTemplate(null);
    instantiateMutation.reset();
  }

  function selectTemplate(next: ProjectTemplateSummary) {
    if (template?.id === next.id) {
      setTemplate(null);
      return;
    }
    // Only fill the name when the user hasn't typed one, or it was the
    // previous template's.
    const current = form.getValues("name").trim();
    if (!current || current === template?.name) {
      form.setValue("name", next.name, { shouldValidate: form.formState.isSubmitted });
    }
    setTemplate(next);
  }

  function onSubmit(values: CreateProjectFormValues) {
    if (isLocked) return;

    if (template) {
      instantiateMutation.mutate(
        { templateId: template.id, name: values.name.trim() },
        {
          onSuccess: ({ projectId }) => {
            reset();
            onOpenChange(false);
            router.push(`/projects/${projectId}/tasks`);
          },
        }
      );
      return;
    }

    createMutation.mutate(
      {
        name: values.name,
        description: values.description || undefined,
        parentId: parent?.id,
      },
      {
        onSuccess: (project) => {
          reset();
          onOpenChange(false);
          router.push(`/projects/${project.id}`);
        },
      }
    );
  }

  const category = template ? getCategoryInfo(template.category) : null;

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        // Closing mid-request would hide the outcome of a non-idempotent call.
        if (instantiateMutation.isPending) return;
        if (!next) reset();
        onOpenChange(next);
      }}
    >
      {/* Header and footer stay put; only the body scrolls on short screens. */}
      <DialogContent
        className={cn(
          "flex max-h-[90vh] flex-col gap-0 overflow-hidden p-0",
          showSuggestions ? "sm:max-w-3xl" : "sm:max-w-lg"
        )}
      >
        <DialogHeader className="border-b px-6 pt-6 pb-4">
          <DialogTitle className="text-lg">
            {parent ? "Novo sub-projeto" : "Novo projeto"}
          </DialogTitle>
          <DialogDescription>
            {parent
              ? `Crie um sub-projeto dentro de “${parent.name}”.`
              : showSuggestions
                ? "Comece do zero ou escolha um modelo com colunas e tarefas já organizadas."
                : "Crie um projeto dentro deste workspace."}
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="flex min-h-0 flex-1 flex-col">
            <div className="min-h-0 flex-1 space-y-5 overflow-y-auto px-6 py-5">
              {template && category ? (
                <div className="flex items-center gap-3 rounded-lg border border-primary/30 bg-primary/5 p-3 animate-in fade-in-0 slide-in-from-top-1">
                  <span
                    aria-hidden
                    className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-primary/15 text-lg"
                  >
                    {category.icon}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">Usando “{template.name}”</p>
                    <p className="text-xs text-muted-foreground">
                      Já vem com {formatTemplateCounts(template)}.
                    </p>
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    disabled={isLocked}
                    onClick={() => setTemplate(null)}
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
                    <FormLabel>{template ? "Nome do projeto" : "Nome"}</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Website Redesign"
                        autoFocus
                        disabled={isLocked}
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Instantiating only takes a name — the template brings the rest. */}
              {!template ? (
                <FormField
                  control={form.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Descrição (opcional)</FormLabel>
                      <FormControl>
                        <Textarea
                          rows={3}
                          placeholder="Do que se trata este projeto?"
                          disabled={isLocked}
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              ) : null}

              {showSuggestions ? (
                <div className="border-t pt-5">
                  <TemplateSuggestions
                    workspaceId={workspaceId}
                    query={template ? "" : name}
                    selectedId={template?.id ?? null}
                    onSelect={selectTemplate}
                    onNavigate={() => {
                      reset();
                      onOpenChange(false);
                    }}
                  />
                </div>
              ) : null}
            </div>

            <DialogFooter className="mx-0 mb-0 px-6 py-4">
              <Button
                type="button"
                variant="outline"
                disabled={instantiateMutation.isPending}
                onClick={() => {
                  reset();
                  onOpenChange(false);
                }}
              >
                Cancelar
              </Button>
              <Button type="submit" disabled={isLocked}>
                {isLocked ? <Loader2 className="animate-spin" /> : null}
                {parent
                  ? "Criar sub-projeto"
                  : template
                    ? isLocked
                      ? "Criando projeto…"
                      : "Criar a partir do modelo"
                    : "Criar projeto"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
