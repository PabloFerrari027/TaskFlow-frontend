"use client";

import * as React from "react";
import { Plus, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { ErrorState } from "@/components/shared/error-state";
import { AutomationRuleFormDialog } from "@/features/automations/components/automation-rule-form-dialog";
import { AutomationRuleList } from "@/features/automations/components/automation-rule-list";
import { AutomationTemplatesGallery } from "@/features/automations/components/automation-templates-gallery";
import { useAutomationLookups } from "@/features/automations/hooks/use-automation-lookups";
import { useAutomationRulesQuery } from "@/features/automations/hooks/use-automation-rules";
import type { RuleDraft } from "@/features/automations/lib/automation-draft";
import type { AutomationRule } from "@/types/automation";

interface DialogState {
  open: boolean;
  // Bumped per open so the form remounts with a fresh draft.
  session: number;
  rule: AutomationRule | null;
  draft: RuleDraft | null;
}

// Workspace "Automações" tab. With no rules yet, the template gallery *is*
// the screen; once there are rules they take over and the gallery is one
// click away.
export function AutomationsSection({ workspaceId }: { workspaceId: string }) {
  const rulesQuery = useAutomationRulesQuery(workspaceId);
  const lookups = useAutomationLookups(workspaceId);
  const [showGallery, setShowGallery] = React.useState(false);
  const [dialog, setDialog] = React.useState<DialogState>({
    open: false,
    session: 0,
    rule: null,
    draft: null,
  });

  function openDialog(rule: AutomationRule | null, draft: RuleDraft | null) {
    setDialog((current) => ({ open: true, session: current.session + 1, rule, draft }));
    setShowGallery(false);
  }

  if (rulesQuery.isLoading) {
    return (
      <div className="space-y-3">
        <Skeleton className="h-24 w-full" />
        <Skeleton className="h-24 w-full" />
      </div>
    );
  }

  if (rulesQuery.isError) {
    return <ErrorState error={rulesQuery.error} onRetry={() => rulesQuery.refetch()} />;
  }

  const rules = rulesQuery.data ?? [];
  const gallery = (
    <AutomationTemplatesGallery
      prominent={rules.length === 0}
      onPick={(template) => openDialog(null, template.build())}
      onCreateFromScratch={() => openDialog(null, null)}
    />
  );

  return (
    <div className="space-y-4">
      {rules.length === 0 ? (
        gallery
      ) : (
        <>
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="max-w-xl space-y-0.5">
              <h3 className="text-base font-semibold text-foreground">Automações</h3>
              <p className="text-sm text-muted-foreground">
                Tarefas repetitivas feitas sozinhas: quando algo acontece, o TaskFlow faz o resto.
                Use o botão ao lado de cada uma para pausar ou voltar a ligar.
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button variant="outline" size="sm" onClick={() => setShowGallery((shown) => !shown)}>
                <Sparkles /> {showGallery ? "Esconder modelos" : "Ver modelos prontos"}
              </Button>
              <Button size="sm" onClick={() => openDialog(null, null)}>
                <Plus /> Criar automação
              </Button>
            </div>
          </div>
          {showGallery ? gallery : null}
          <AutomationRuleList
            workspaceId={workspaceId}
            rules={rules}
            lookups={lookups}
            onEdit={(rule) => openDialog(rule, null)}
          />
        </>
      )}

      <AutomationRuleFormDialog
        key={dialog.session}
        workspaceId={workspaceId}
        open={dialog.open}
        onOpenChange={(open) => setDialog((current) => ({ ...current, open }))}
        rule={dialog.rule}
        initialDraft={dialog.draft}
      />
    </div>
  );
}
