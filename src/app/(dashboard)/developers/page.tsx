"use client";

import { Code2, Lock } from "lucide-react";
import { PageHeader } from "@/components/shared/page-header";
import { EmptyState } from "@/components/shared/empty-state";
import { useCurrentWorkspace } from "@/features/workspaces/context/current-workspace-context";
import { useAuth } from "@/lib/auth/auth-context";
import { canManageDeveloperPlatform } from "@/lib/permissions";
import { DevelopersSection } from "@/features/developers/components/developers-section";
import type { WorkspaceRole } from "@/types/workspace";

export default function DevelopersPage() {
  const { workspace, workspaceId, isLoading } = useCurrentWorkspace();
  const { userId } = useAuth();

  const myRole = workspace?.members.find((m) => m.userId === userId)?.role as
    | WorkspaceRole
    | undefined;
  const canManage = canManageDeveloperPlatform(myRole);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Desenvolvedores"
        description="Chaves de API e webhooks para integrar este workspace com outros sistemas."
      />

      {!isLoading && !workspaceId ? (
        <EmptyState
          icon={<Code2 className="size-6" />}
          title="Você ainda não tem um workspace"
          description="Crie um workspace para gerar chaves de API e webhooks aqui."
        />
      ) : workspaceId && !canManage ? (
        <EmptyState
          icon={<Lock className="size-6" />}
          title="Acesso restrito"
          description="Somente Proprietário e Administrador podem ver e gerenciar chaves de API e webhooks."
        />
      ) : workspaceId ? (
        <DevelopersSection key={workspaceId} workspaceId={workspaceId} />
      ) : null}
    </div>
  );
}
