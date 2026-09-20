"use client";

import * as React from "react";
import { Pencil, Trash2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { SentenceText } from "@/features/automations/components/automation-live-preview";
import {
  useDeleteAutomationRuleMutation,
  useToggleAutomationRuleMutation,
} from "@/features/automations/hooks/use-automation-rules";
import type { AutomationLookups } from "@/features/automations/hooks/use-automation-lookups";
import { describeDraft, fromRule } from "@/features/automations/lib/automation-draft";
import { formatRelativeTime } from "@/lib/format";
import type { AutomationRule } from "@/types/automation";

// The API doesn't say *why* a rule is off (manually, or switched off by the
// backend after too many firings / the creator losing OWNER/ADMIN), so the
// tooltip lists the possibilities instead of claiming one.
const DISABLED_HINT =
  "Esta automação não está rodando. Pode ter sido desligada por alguém ou pelo sistema (disparos demais em pouco tempo, ou quem a criou deixou de ser proprietário/administrador). Ative de novo quando quiser.";

export function AutomationRuleList({
  workspaceId,
  rules,
  lookups,
  onEdit,
}: {
  workspaceId: string;
  rules: AutomationRule[];
  lookups: AutomationLookups;
  onEdit: (rule: AutomationRule) => void;
}) {
  const toggleMutation = useToggleAutomationRuleMutation(workspaceId);
  const deleteMutation = useDeleteAutomationRuleMutation(workspaceId);

  return (
    <ul className="space-y-3">
      {rules.map((rule) => (
        <li
          key={rule.id}
          className="flex items-start justify-between gap-4 rounded-lg border border-border/60 p-4"
        >
          <div className="min-w-0 space-y-1.5">
            <div className="flex flex-wrap items-center gap-2">
              <p className="text-sm font-medium text-foreground">{rule.name}</p>
              {rule.enabled ? (
                <Badge
                  variant="secondary"
                  className="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                >
                  Ativa
                </Badge>
              ) : (
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Badge
                      variant="secondary"
                      className="bg-amber-500/10 text-amber-600 dark:text-amber-400"
                    >
                      Desativada
                    </Badge>
                  </TooltipTrigger>
                  <TooltipContent className="max-w-xs">{DISABLED_HINT}</TooltipContent>
                </Tooltip>
              )}
            </div>
            <p className="text-sm text-muted-foreground">
              <SentenceText segments={describeDraft(fromRule(rule), lookups)} />
            </p>
            <p className="text-xs text-muted-foreground">
              Criada por {lookups.labelFor("member", rule.createdBy)} ·{" "}
              {formatRelativeTime(rule.createdAt)}
            </p>
          </div>

          <div className="flex shrink-0 items-center gap-1">
            <Switch
              checked={rule.enabled}
              disabled={toggleMutation.isPending}
              aria-label={rule.enabled ? "Desativar automação" : "Ativar automação"}
              onCheckedChange={(enabled) => toggleMutation.mutate({ ruleId: rule.id, enabled })}
            />
            <Button
              variant="ghost"
              size="icon-sm"
              aria-label="Editar automação"
              onClick={() => onEdit(rule)}
            >
              <Pencil />
            </Button>
            <ConfirmDialog
              trigger={
                <Button variant="ghost" size="icon-sm" aria-label="Excluir automação">
                  <Trash2 className="text-destructive" />
                </Button>
              }
              title="Excluir automação"
              description={`“${rule.name}” deixará de rodar. Essa ação não pode ser desfeita.`}
              confirmLabel="Excluir"
              isLoading={deleteMutation.isPending}
              onConfirm={() => deleteMutation.mutate(rule.id)}
            />
          </div>
        </li>
      ))}
    </ul>
  );
}
