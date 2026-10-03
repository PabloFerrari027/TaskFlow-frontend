"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Loader2, Save, Sparkles, Wand2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { TemplateListingDialog } from "@/features/project-templates/components/template-listing-dialog";
import { TemplateStructurePreview } from "@/features/project-templates/components/template-structure-preview";
import { UseTemplateDialog } from "@/features/project-templates/components/use-template-dialog";
import {
  useAdaptTemplateDraftMutation,
  useCreateWorkspaceTemplateMutation,
  useGenerateTemplateDraftMutation,
} from "@/features/project-templates/hooks/use-project-templates";
import { getCategoryInfo } from "@/features/project-templates/lib/categories";
import { toListingRequest } from "@/features/project-templates/schemas";
import type { ProjectTemplateDraft } from "@/types/project-template";
import type { Workspace } from "@/types/workspace";

const MIN_PROMPT = 10;
const MIN_INSTRUCTIONS = 5;
const MAX_TEXT = 2000;

type Mode =
  | { kind: "generate" }
  | { kind: "adapt"; templateId: string; templateName: string };

/**
 * Asks the AI for a template (from a description, or adapting an existing
 * one). Nothing is saved: the answer is a validated draft that can become a
 * project right away or a template of the workspace.
 */
export function TemplateAiDialog({
  mode,
  workspace,
  open,
  onOpenChange,
}: {
  mode: Mode;
  workspace: Workspace;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const router = useRouter();
  const [text, setText] = React.useState("");
  const [draft, setDraft] = React.useState<ProjectTemplateDraft | null>(null);
  const [useOpen, setUseOpen] = React.useState(false);
  const [saveOpen, setSaveOpen] = React.useState(false);

  const generateMutation = useGenerateTemplateDraftMutation(workspace.id);
  const adaptMutation = useAdaptTemplateDraftMutation(workspace.id);
  const createMutation = useCreateWorkspaceTemplateMutation(workspace.id);
  const isPending = generateMutation.isPending || adaptMutation.isPending;
  const min = mode.kind === "generate" ? MIN_PROMPT : MIN_INSTRUCTIONS;

  function ask(event: React.FormEvent) {
    event.preventDefault();
    const value = text.trim();
    if (value.length < min || isPending) return;
    const onSuccess = (result: ProjectTemplateDraft) => setDraft(result);
    if (mode.kind === "generate") {
      generateMutation.mutate({ prompt: value }, { onSuccess });
    } else {
      adaptMutation.mutate({ templateId: mode.templateId, instructions: value }, { onSuccess });
    }
  }

  const category = draft ? getCategoryInfo(draft.category) : null;

  return (
    <>
      <Dialog open={open && !useOpen && !saveOpen} onOpenChange={(next) => !isPending && onOpenChange(next)}>
        <DialogContent className="flex max-h-[90vh] flex-col sm:max-w-3xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Sparkles className="size-4" />
              {mode.kind === "generate" ? "Criar modelo com IA" : `Adaptar “${mode.templateName}” com IA`}
            </DialogTitle>
            <DialogDescription>
              {draft
                ? "Confira o rascunho. Nada foi salvo ainda."
                : mode.kind === "generate"
                  ? "Descreva o processo ou o projeto. A IA monta colunas, campos, tarefas e um guia de uso."
                  : "Diga o que mudar. O resultado vem como um rascunho novo; o modelo original continua igual."}
            </DialogDescription>
          </DialogHeader>

          {draft ? (
            <div className="min-h-0 flex-1 space-y-4 overflow-y-auto pr-1">
              <div className="space-y-1 rounded-lg border border-primary/30 bg-primary/5 p-3">
                <p className="text-xs text-muted-foreground">
                  <span aria-hidden>{category?.icon}</span> {category?.label}
                </p>
                <p className="font-medium text-foreground">{draft.name}</p>
                {draft.description ? (
                  <p className="text-sm text-muted-foreground">{draft.description}</p>
                ) : null}
              </div>
              <TemplateStructurePreview skeleton={draft.skeleton} />
            </div>
          ) : (
            <form id="template-ai-form" onSubmit={ask} className="space-y-2">
              <Label htmlFor="template-ai-text">
                {mode.kind === "generate" ? "O que você quer organizar?" : "O que mudar?"}
              </Label>
              <Textarea
                id="template-ai-text"
                autoFocus
                rows={5}
                maxLength={MAX_TEXT}
                disabled={isPending}
                placeholder={
                  mode.kind === "generate"
                    ? "Ex.: onboarding de clientes de uma agência de marketing, do contrato à primeira campanha."
                    : "Ex.: adapte para uma equipe de 3 pessoas e sprints de uma semana."
                }
                value={text}
                onChange={(event) => setText(event.target.value)}
              />
              <p className="text-xs text-muted-foreground">
                Usa a cota de IA do seu plano. A IA não cria automações, painéis, papéis nem
                subprojetos.
              </p>
            </form>
          )}

          <DialogFooter className="gap-2">
            {draft ? (
              <>
                <Button variant="ghost" onClick={() => setDraft(null)}>
                  <ArrowLeft /> Pedir outro
                </Button>
                <Button variant="outline" onClick={() => setSaveOpen(true)}>
                  <Save /> Salvar como modelo
                </Button>
                <Button onClick={() => setUseOpen(true)}>
                  <Wand2 /> Criar projeto
                </Button>
              </>
            ) : (
              <Button type="submit" form="template-ai-form" disabled={isPending || text.trim().length < min}>
                {isPending ? <Loader2 className="animate-spin" /> : <Sparkles />}
                {isPending ? "Gerando…" : "Gerar rascunho"}
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {draft && useOpen ? (
        <UseTemplateDialog
          source={{ kind: "draft", draft }}
          workspace={workspace}
          open
          // On success it navigates away; closing it goes back to the draft.
          onOpenChange={setUseOpen}
        />
      ) : null}

      {draft && saveOpen ? (
        <TemplateListingDialog
          open
          onOpenChange={setSaveOpen}
          title="Salvar como modelo do workspace"
          description="Fica disponível só para as pessoas deste workspace."
          submitLabel="Salvar modelo"
          isPending={createMutation.isPending}
          withDetails
          defaultValues={{
            name: draft.name,
            description: draft.description ?? "",
            category: draft.category,
            tags: "",
            level: "",
            language: "pt-BR",
            estimatedDurationDays: "",
          }}
          onSubmit={(values) => {
            const request = toListingRequest(values, "save");
            createMutation.mutate(
              {
                ...request,
                description: request.description ?? undefined,
                skeleton: draft.skeleton,
              },
              {
                onSuccess: (template) => {
                  setSaveOpen(false);
                  onOpenChange(false);
                  router.push(`/templates/${template.id}`);
                },
              }
            );
          }}
        />
      ) : null}
    </>
  );
}
