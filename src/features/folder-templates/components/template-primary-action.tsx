"use client";

import * as React from "react";
import Link from "next/link";
import { Lock, Plus, RefreshCw, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/lib/auth/auth-context";
import { canInstantiateFolderTemplate } from "@/lib/permissions";
import { useCurrentWorkspace } from "@/features/workspaces/context/current-workspace-context";
import { CreateWorkspaceDialog } from "@/features/workspaces/components/create-workspace-dialog";
import { UseTemplateDialog } from "@/features/folder-templates/components/use-template-dialog";
import type { FolderTemplateDetail } from "@/types/folder-template";

function Note({ icon, children }: { icon: React.ReactNode; children: React.ReactNode }) {
  return (
    <div className="flex items-start gap-2 text-sm text-muted-foreground">
      <span className="mt-0.5 shrink-0 [&_svg]:size-4">{icon}</span>
      <div className="space-y-1">{children}</div>
    </div>
  );
}

function UseAction({
  template,
  applyToFolderId,
}: {
  template: FolderTemplateDetail;
  applyToFolderId?: string;
}) {
  const { workspace, isLoading } = useCurrentWorkspace();
  const { userId } = useAuth();
  const [useOpen, setUseOpen] = React.useState(false);
  const [createWorkspaceOpen, setCreateWorkspaceOpen] = React.useState(false);

  if (isLoading) return <Skeleton className="h-9 w-44" />;

  if (!workspace) {
    return (
      <div className="space-y-3">
        <Note icon={<Sparkles />}>
          <p>Para usar um modelo, você precisa de um workspace: é nele que a pasta é criada.</p>
        </Note>
        <Button size="lg" onClick={() => setCreateWorkspaceOpen(true)}>
          <Plus /> Criar workspace
        </Button>
        <CreateWorkspaceDialog open={createWorkspaceOpen} onOpenChange={setCreateWorkspaceOpen} />
      </div>
    );
  }

  // A workspace template can only be used inside its own workspace (API.md § 26.7).
  if (template.workspaceId && template.workspaceId !== workspace.id) {
    return (
      <Note icon={<Lock />}>
        <p>
          Este modelo pertence a outro workspace e só pode ser usado lá. Troque de workspace no
          seletor do topo da tela para usá-lo.
        </p>
      </Note>
    );
  }

  const myRole = workspace.members.find((member) => member.userId === userId)?.role;
  const allowed = canInstantiateFolderTemplate(myRole);

  return (
    <div className="space-y-3">
      <Button size="lg" disabled={!allowed} onClick={() => setUseOpen(true)}>
        <Sparkles /> {applyToFolderId ? "Aplicar à pasta" : "Usar este modelo"}
      </Button>
      {allowed ? (
        <p className="text-sm text-muted-foreground">
          A pasta será criada em <strong className="text-foreground">{workspace.name}</strong>.
        </p>
      ) : (
        // A template creates custom fields, which only OWNER/ADMIN may do —
        // stricter than creating a blank folder (API.md § 26.3).
        <Note icon={<Lock />}>
          <p>
            Só donos e administradores do workspace podem usar modelos, e em{" "}
            <strong className="text-foreground">{workspace.name}</strong> você não é nenhum dos
            dois.
          </p>
          <p>
            Troque de workspace no seletor do topo da tela, ou peça a um administrador para usar
            o modelo.{" "}
            <Link href="/workspaces" className="font-medium text-primary hover:underline">
              Ver meus workspaces
            </Link>
          </p>
        </Note>
      )}
      {template.updateAvailable ? (
        <Note icon={<RefreshCw />}>
          <p>
            Há uma versão nova deste modelo (v{template.version}). Você usou a v
            {template.myLastInstantiatedVersion}. Para trazer as novidades a uma pasta que já
            existe, use “Pasta existente”.
          </p>
        </Note>
      ) : null}
      {useOpen ? (
        <UseTemplateDialog
          source={{
            kind: "template",
            templateId: template.id,
            name: template.name,
            questions: template.preview,
          }}
          workspace={workspace}
          open
          onOpenChange={setUseOpen}
          applyToFolderId={applyToFolderId}
        />
      ) : null}
    </div>
  );
}

// The detail only answers for templates the user may see (404 otherwise), so
// what's left to check is the workspace and the role (API.md § 26.3).
export function TemplatePrimaryAction({
  template,
  applyToFolderId,
}: {
  template: FolderTemplateDetail;
  applyToFolderId?: string;
}) {
  return <UseAction template={template} applyToFolderId={applyToFolderId} />;
}
