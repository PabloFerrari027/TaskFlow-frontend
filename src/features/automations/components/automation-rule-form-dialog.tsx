"use client";

import * as React from "react";
import { FolderKanban, Globe, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { AutomationLivePreview } from "@/features/automations/components/automation-live-preview";
import { AutomationSentenceBuilder } from "@/features/automations/components/automation-sentence-builder";
import {
  useCreateAutomationRuleMutation,
  useUpdateAutomationRuleMutation,
} from "@/features/automations/hooks/use-automation-rules";
import { useAutomationLookups } from "@/features/automations/hooks/use-automation-lookups";
import {
  autoName,
  emptyDraft,
  fromRule,
  toRequest,
  validateDraft,
  type RuleDraft,
} from "@/features/automations/lib/automation-draft";
import {
  canLimitToProject,
  isDraftLimitedToProject,
  scopeDraftToProject,
} from "@/features/automations/lib/project-scope";
import type { AutomationRule } from "@/types/automation";

interface AutomationRuleFormDialogProps {
  workspaceId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  // Editing an existing rule; otherwise creating (from `initialDraft` if given).
  rule?: AutomationRule | null;
  initialDraft?: RuleDraft | null;
  // Opened from a project's tab: says whether the rule is limited to it.
  project?: { id: string; name: string } | null;
}

// The draft lives in this component's state and is seeded once, so the parent
// must remount it (`key`) each time it opens for a different rule/template.
export function AutomationRuleFormDialog({
  workspaceId,
  open,
  onOpenChange,
  rule,
  initialDraft,
  project,
}: AutomationRuleFormDialogProps) {
  const [draft, setDraft] = React.useState<RuleDraft>(() =>
    rule ? fromRule(rule) : (initialDraft ?? emptyDraft())
  );
  const lookups = useAutomationLookups(workspaceId);
  const createMutation = useCreateAutomationRuleMutation(workspaceId);
  const updateMutation = useUpdateAutomationRuleMutation(workspaceId);

  const isPending = createMutation.isPending || updateMutation.isPending;
  const problems = validateDraft(draft);

  function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (problems.length > 0 || isPending) return;

    // A blank name isn't an error — the automation's own sentence is a better name
    // than making someone invent one.
    const request = toRequest(draft, autoName(draft, lookups));
    const onSuccess = () => onOpenChange(false);
    if (rule) {
      updateMutation.mutate({ ruleId: rule.id, payload: request }, { onSuccess });
    } else {
      createMutation.mutate(request, { onSuccess });
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-3xl">
        <DialogHeader>
          <DialogTitle>{rule ? "Editar automação" : "Nova automação"}</DialogTitle>
          <DialogDescription>
            Uma automação faz algo sozinha quando algo acontece. Responda aos três passos abaixo
            — os campos destacados em laranja ainda precisam de uma escolha.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <AutomationSentenceBuilder draft={draft} onChange={setDraft} lookups={lookups} />

          <AutomationLivePreview draft={draft} lookups={lookups} />

          {project ? (
            <ProjectScopeNote draft={draft} project={project} onChange={setDraft} />
          ) : null}

          <div className="space-y-2">
            <Label htmlFor="automation-name">Nome da automação (opcional)</Label>
            <Input
              id="automation-name"
              value={draft.name}
              maxLength={120}
              placeholder="Se deixar em branco, usamos o resumo acima como nome"
              onChange={(event) => setDraft({ ...draft, name: event.target.value })}
            />
          </div>

          <DialogFooter className="items-center sm:justify-between">
            <p className="text-xs text-muted-foreground">
              {problems.length > 0 ? `Falta escolher: ${problems.join(", ")}.` : null}
            </p>
            <div className="flex gap-2">
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Cancelar
              </Button>
              <Button type="submit" disabled={problems.length > 0 || isPending}>
                {isPending ? <Loader2 className="animate-spin" /> : null}
                {rule ? "Salvar alterações" : "Criar automação"}
              </Button>
            </div>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

// Picking an event without a project (e.g. "ganhar um participante") drops the
// project condition, silently widening the rule to the whole workspace — this
// note makes that visible and offers the way back.
function ProjectScopeNote({
  draft,
  project,
  onChange,
}: {
  draft: RuleDraft;
  project: { id: string; name: string };
  onChange: (draft: RuleDraft) => void;
}) {
  if (isDraftLimitedToProject(draft, project.id)) {
    return (
      <p className="flex items-center gap-2 text-sm text-muted-foreground">
        <FolderKanban className="size-4 shrink-0" aria-hidden />
        Vale só para o projeto “{project.name}”.
      </p>
    );
  }

  const canLimit = canLimitToProject(draft);
  return (
    <div className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-amber-500/30 bg-amber-500/5 px-3 py-2 text-sm text-amber-700 dark:text-amber-400">
      <p className="flex items-center gap-2">
        <Globe className="size-4 shrink-0" aria-hidden />
        {canLimit
          ? "Do jeito que está, esta automação vale para todos os projetos do workspace."
          : "Este tipo de acontecimento não pode ser limitado a um projeto: a automação vai valer para todo o workspace."}
      </p>
      {canLimit ? (
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => onChange(scopeDraftToProject(draft, project.id))}
        >
          Limitar a este projeto
        </Button>
      ) : null}
    </div>
  );
}
