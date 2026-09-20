"use client";

import * as React from "react";
import { Loader2 } from "lucide-react";
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
import type { AutomationRule } from "@/types/automation";

interface AutomationRuleFormDialogProps {
  workspaceId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  // Editing an existing rule; otherwise creating (from `initialDraft` if given).
  rule?: AutomationRule | null;
  initialDraft?: RuleDraft | null;
}

// The draft lives in this component's state and is seeded once, so the parent
// must remount it (`key`) each time it opens for a different rule/template.
export function AutomationRuleFormDialog({
  workspaceId,
  open,
  onOpenChange,
  rule,
  initialDraft,
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

    // A blank name isn't an error — the rule's own sentence is a better name
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
            Monte a regra como uma frase: clique em cada trecho destacado para escolher.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="sticky top-0 z-10 bg-popover pb-1">
            <AutomationLivePreview draft={draft} lookups={lookups} />
          </div>

          <div className="space-y-2">
            <Label htmlFor="automation-name">Nome (opcional)</Label>
            <Input
              id="automation-name"
              value={draft.name}
              maxLength={120}
              placeholder="Se ficar em branco, usamos a própria frase da regra"
              onChange={(event) => setDraft({ ...draft, name: event.target.value })}
            />
          </div>

          <AutomationSentenceBuilder draft={draft} onChange={setDraft} lookups={lookups} />

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
