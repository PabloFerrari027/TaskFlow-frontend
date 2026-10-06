"use client";

import * as React from "react";
import { Plus, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { ErrorState } from "@/components/shared/error-state";
import { AutomationRuleFormDialog } from "@/features/automations/components/automation-rule-form-dialog";
import { AutomationRuleList } from "@/features/automations/components/automation-rule-list";
import { AutomationTemplatesGallery } from "@/features/automations/components/automation-templates-gallery";
import { useAutomationLookups } from "@/features/automations/hooks/use-automation-lookups";
import { useAutomationRulesQuery } from "@/features/automations/hooks/use-automation-rules";
import { emptyDraft, type RuleDraft } from "@/features/automations/lib/automation-draft";
import {
  isOutsideFolders,
  folderRelation,
  scopeDraftToFolder,
} from "@/features/automations/lib/folder-scope";
import { useSectionsQuery } from "@/features/sections/hooks/use-sections";
import type { AutomationRule } from "@/types/automation";
import type { Folder } from "@/types/folder";

interface DialogState {
  open: boolean;
  // Bumped per open so the form remounts with a fresh draft.
  session: number;
  rule: AutomationRule | null;
  draft: RuleDraft | null;
  // Workspace-wide rules are edited as such — no "limit to this folder" nudge.
  scoped: boolean;
}

// Folder "Automações" tab. Rules live in the workspace; this shows the ones
// that name this folder, plus the unlimited ones that also act on it, and
// creates new rules already limited to the folder.
export function FolderAutomationsSection({ folder }: { folder: Folder }) {
  const workspaceId = folder.workspaceId;
  const rulesQuery = useAutomationRulesQuery(workspaceId);
  const sectionsQuery = useSectionsQuery(folder.id);
  const lookups = useAutomationLookups(workspaceId);
  const [showGallery, setShowGallery] = React.useState(false);
  const [dialog, setDialog] = React.useState<DialogState>({
    open: false,
    session: 0,
    rule: null,
    draft: null,
    scoped: true,
  });

  const { folderRules, workspaceRules, outsideRules } = React.useMemo(() => {
    const sectionIds = new Set((sectionsQuery.data ?? []).map((section) => section.id));
    const own: AutomationRule[] = [];
    const wide: AutomationRule[] = [];
    const outside: AutomationRule[] = [];
    for (const rule of rulesQuery.data ?? []) {
      if (isOutsideFolders(rule)) {
        outside.push(rule);
        continue;
      }
      const relation = folderRelation(rule, folder.id, sectionIds);
      if (relation === "folder") own.push(rule);
      else if (relation === "workspace") wide.push(rule);
    }
    return { folderRules: own, workspaceRules: wide, outsideRules: outside };
  }, [folder.id, rulesQuery.data, sectionsQuery.data]);

  function openDialog(rule: AutomationRule | null, draft: RuleDraft | null, scoped = true) {
    setDialog((current) => ({ open: true, session: current.session + 1, rule, draft, scoped }));
    setShowGallery(false);
  }

  function openNew(draft: RuleDraft) {
    openDialog(null, scopeDraftToFolder(draft, folder.id));
  }

  if (rulesQuery.isLoading || sectionsQuery.isLoading) {
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

  const gallery = (
    <AutomationTemplatesGallery
      prominent={folderRules.length === 0}
      onPick={(template) => openNew(template.build())}
      onCreateFromScratch={() => openNew(emptyDraft())}
    />
  );

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Automações desta pasta</CardTitle>
          <CardDescription>
            Itens repetitivos feitas sozinhas nesta pasta: quando algo acontece, o TaskFlow faz
            o resto. Use o botão ao lado de cada uma para pausar ou voltar a ligar.
          </CardDescription>
          {folderRules.length > 0 ? (
            <CardAction className="flex flex-wrap gap-2">
              <Button variant="outline" size="sm" onClick={() => setShowGallery((shown) => !shown)}>
                <Sparkles /> {showGallery ? "Esconder modelos" : "Ver modelos prontos"}
              </Button>
              <Button size="sm" onClick={() => openNew(emptyDraft())}>
                <Plus /> Criar automação
              </Button>
            </CardAction>
          ) : null}
        </CardHeader>
        <CardContent className="space-y-4">
          {folderRules.length === 0 || showGallery ? gallery : null}
          {folderRules.length > 0 ? (
            <AutomationRuleList
              workspaceId={workspaceId}
              rules={folderRules}
              lookups={lookups}
              onEdit={(rule) => openDialog(rule, null)}
            />
          ) : null}
        </CardContent>
      </Card>

      {workspaceRules.length > 0 ? (
        <Card>
          <CardHeader>
            <CardTitle>Automações de todo o workspace</CardTitle>
            <CardDescription>
              Estas não são limitadas a uma pasta, então também agem aqui. Alterar ou pausar uma
              delas muda o que acontece em todas as pastas.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <AutomationRuleList
              workspaceId={workspaceId}
              rules={workspaceRules}
              lookups={lookups}
              onEdit={(rule) => openDialog(rule, null, false)}
            />
          </CardContent>
        </Card>
      ) : null}

      {outsideRules.length > 0 ? (
        <Card>
          <CardHeader>
            <CardTitle>Automações antigas do workspace</CardTitle>
            <CardDescription>
              Estas reagem a coisas que acontecem fora das pastas, como alguém entrar no
              workspace. Não dá mais para criar ou editar automações assim, mas estas continuam
              funcionando até você pausar ou excluir.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <AutomationRuleList workspaceId={workspaceId} rules={outsideRules} lookups={lookups} />
          </CardContent>
        </Card>
      ) : null}

      <AutomationRuleFormDialog
        key={dialog.session}
        workspaceId={workspaceId}
        open={dialog.open}
        onOpenChange={(open) => setDialog((current) => ({ ...current, open }))}
        rule={dialog.rule}
        initialDraft={dialog.draft}
        folder={dialog.scoped ? { id: folder.id, name: folder.name } : null}
      />
    </div>
  );
}
