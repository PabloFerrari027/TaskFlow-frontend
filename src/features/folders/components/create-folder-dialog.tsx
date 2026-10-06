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
import { canInstantiateFolderTemplate } from "@/lib/permissions";
import {
  createFolderSchema,
  type CreateFolderFormValues,
} from "@/features/folders/schemas";
import { useCreateFolderMutation } from "@/features/folders/hooks/use-folders";
import { useCurrentWorkspace } from "@/features/workspaces/context/current-workspace-context";
import {
  useInstantiateFolderTemplateMutation,
  useFolderTemplateQuery,
} from "@/features/folder-templates/hooks/use-folder-templates";
import { useInstantiationRunner } from "@/features/folder-templates/hooks/use-instantiation-runner";
import {
  InstantiationProgress,
  TemplateChoicesFields,
  hasTemplateQuestions,
  initialTemplateChoices,
  missingTemplateChoices,
  toChoicesRequest,
  type TemplateChoicesValue,
} from "@/features/folder-templates/components/template-choices-fields";
import { TemplateSuggestions } from "@/features/folder-templates/components/template-suggestions";
import { getCategoryInfo } from "@/features/folder-templates/lib/categories";
import { formatTemplateCounts } from "@/features/folder-templates/lib/template-labels";
import type { Folder } from "@/types/folder";
import type { FolderTemplateSummary } from "@/types/folder-template";

interface CreateFolderDialogProps {
  workspaceId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  // When set, creates a sub-folder of this folder. The parent is fixed here —
  // re-parenting later is a separate "Mover para…" action, not part of this form.
  parent?: Folder | null;
}

export function CreateFolderDialog({
  workspaceId,
  open,
  onOpenChange,
  parent,
}: CreateFolderDialogProps) {
  const router = useRouter();
  const { workspace } = useCurrentWorkspace();
  const { userId } = useAuth();
  const createMutation = useCreateFolderMutation(workspaceId);
  const instantiateMutation = useInstantiateFolderTemplateMutation(workspaceId);
  const [template, setTemplate] = React.useState<FolderTemplateSummary | null>(null);
  // The list has no `preview`: what the template asks comes from its detail.
  const detailQuery = useFolderTemplateQuery(template?.id);
  const questions = template && detailQuery.data?.id === template.id ? detailQuery.data.preview : null;
  const [choices, setChoices] = React.useState<TemplateChoicesValue | null>(null);
  const [choicesError, setChoicesError] = React.useState<string | null>(null);
  const runner = useInstantiationRunner(workspaceId, (folderId) => {
    reset();
    onOpenChange(false);
    router.push(`/folders/${folderId}/items`);
  });

  const form = useForm<CreateFolderFormValues>({
    resolver: zodResolver(createFolderSchema),
    defaultValues: { name: "", description: "" },
  });
  const name = useWatch({ control: form.control, name: "name" });

  // Using a template takes OWNER/ADMIN (stricter than a blank folder) —
  // otherwise no suggestions. With a parent, it becomes a sub-folder.
  const myRole =
    workspace?.id === workspaceId
      ? workspace.members.find((member) => member.userId === userId)?.role
      : undefined;
  const showSuggestions = canInstantiateFolderTemplate(myRole);
  // Stays locked while the queued run goes, until the navigation replaces
  // the page: a second submit would create a second folder.
  const isLocked = createMutation.isPending || instantiateMutation.isPending || runner.isRunning;
  const currentChoices = questions ? (choices ?? initialTemplateChoices(questions)) : null;

  function reset() {
    form.reset();
    setTemplate(null);
    setChoices(null);
    setChoicesError(null);
    instantiateMutation.reset();
    runner.reset();
  }

  function selectTemplate(next: FolderTemplateSummary) {
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
    setChoices(null);
    setChoicesError(null);
  }

  function onSubmit(values: CreateFolderFormValues) {
    if (isLocked) return;

    if (template) {
      // Still loading what the template asks.
      if (!questions || !currentChoices) return;
      const missing = missingTemplateChoices(questions, currentChoices);
      if (missing.length > 0) {
        setChoicesError(`Preencha: ${missing.join(", ")}.`);
        return;
      }
      setChoicesError(null);
      instantiateMutation.mutate(
        {
          templateId: template.id,
          input: {
            ...toChoicesRequest(questions, currentChoices),
            name: values.name.trim(),
            parentFolderId: parent?.id,
          },
        },
        { onSuccess: runner.follow }
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
        onSuccess: (folder) => {
          reset();
          onOpenChange(false);
          router.push(`/folders/${folder.id}`);
        },
      }
    );
  }

  const category = template ? getCategoryInfo(template.category) : null;

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        // Closing mid-run would hide the outcome of a non-idempotent call.
        if (instantiateMutation.isPending || runner.isRunning) return;
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
            {parent ? "Nova subpasta" : "Nova pasta"}
          </DialogTitle>
          <DialogDescription>
            {parent
              ? `Crie uma subpasta dentro de “${parent.name}”, do zero ou a partir de um modelo.`
              : showSuggestions
                ? "Comece do zero ou escolha um modelo com colunas e itens já organizados."
                : "Crie uma pasta dentro deste workspace."}
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
                    <FormLabel>{template ? "Nome da pasta" : "Nome"}</FormLabel>
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

              {template && workspace && currentChoices && questions && hasTemplateQuestions(questions) ? (
                <TemplateChoicesFields
                  questions={questions}
                  value={currentChoices}
                  onChange={setChoices}
                  members={workspace.members}
                  disabled={isLocked}
                />
              ) : template && !questions ? (
                <TemplateChoicesFields
                  questions={{}}
                  value={initialTemplateChoices({})}
                  onChange={() => {}}
                  members={[]}
                  isLoading
                />
              ) : null}
              {choicesError ? <p className="text-sm text-destructive">{choicesError}</p> : null}
              {runner.isRunning ? (
                <InstantiationProgress
                  done={runner.instantiation?.progressDone ?? 0}
                  total={runner.instantiation?.progressTotal ?? 0}
                />
              ) : null}

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
                          placeholder="Do que se trata esta pasta?"
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
                disabled={instantiateMutation.isPending || runner.isRunning}
                onClick={() => {
                  reset();
                  onOpenChange(false);
                }}
              >
                Cancelar
              </Button>
              <Button type="submit" disabled={isLocked || (template !== null && !questions)}>
                {isLocked ? <Loader2 className="animate-spin" /> : null}
                {template
                  ? isLocked
                    ? "Criando pasta…"
                    : "Criar a partir do modelo"
                  : parent
                    ? "Criar subpasta"
                    : "Criar pasta"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
