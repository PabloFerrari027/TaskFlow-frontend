"use client";

import * as React from "react";
import Link from "next/link";
import { Ban, Loader2, Lock, Plus, ShoppingCart, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/lib/auth/auth-context";
import { formatPriceCents } from "@/lib/format";
import { canInstantiateProjectTemplate } from "@/lib/permissions";
import { useCurrentWorkspace } from "@/features/workspaces/context/current-workspace-context";
import { CreateWorkspaceDialog } from "@/features/workspaces/components/create-workspace-dialog";
import { UseTemplateDialog } from "@/features/project-templates/components/use-template-dialog";
import { useCheckoutProjectTemplateMutation } from "@/features/project-templates/hooks/use-project-templates";
import type { ProjectTemplateDetail } from "@/types/project-template";

function Note({ icon, children }: { icon: React.ReactNode; children: React.ReactNode }) {
  return (
    <div className="flex items-start gap-2 text-sm text-muted-foreground">
      <span className="mt-0.5 shrink-0 [&_svg]:size-4">{icon}</span>
      <div className="space-y-1">{children}</div>
    </div>
  );
}

function BuyAction({ template }: { template: ProjectTemplateDetail }) {
  const checkoutMutation = useCheckoutProjectTemplateMutation();
  // After success the browser is already on its way to the payment page.
  const isRedirecting = checkoutMutation.isPending || checkoutMutation.isSuccess;

  return (
    <div className="space-y-3">
      <Button
        size="lg"
        disabled={isRedirecting}
        onClick={() => checkoutMutation.mutate(template.id)}
      >
        {isRedirecting ? <Loader2 className="animate-spin" /> : <ShoppingCart />}
        {isRedirecting ? "Abrindo o pagamento…" : `Comprar por ${formatPriceCents(template.priceCents)}`}
      </Button>
      <Note icon={<Lock />}>
        <p>
          O pagamento é feito numa página segura de pagamentos. Depois de confirmado, você vê o
          conteúdo completo e pode usar o modelo quantas vezes quiser.
        </p>
      </Note>
    </div>
  );
}

function UseAction({ template }: { template: ProjectTemplateDetail }) {
  const { workspace, isLoading } = useCurrentWorkspace();
  const { userId } = useAuth();
  const [useOpen, setUseOpen] = React.useState(false);
  const [createWorkspaceOpen, setCreateWorkspaceOpen] = React.useState(false);

  if (isLoading) return <Skeleton className="h-9 w-44" />;

  if (!workspace) {
    return (
      <div className="space-y-3">
        <Note icon={<Sparkles />}>
          <p>Para usar um modelo, você precisa de um workspace: é nele que o projeto é criado.</p>
        </Note>
        <Button size="lg" onClick={() => setCreateWorkspaceOpen(true)}>
          <Plus /> Criar workspace
        </Button>
        <CreateWorkspaceDialog open={createWorkspaceOpen} onOpenChange={setCreateWorkspaceOpen} />
      </div>
    );
  }

  const myRole = workspace.members.find((member) => member.userId === userId)?.role;
  const allowed = canInstantiateProjectTemplate(myRole);

  return (
    <div className="space-y-3">
      <Button size="lg" disabled={!allowed} onClick={() => setUseOpen(true)}>
        <Sparkles /> Usar este modelo
      </Button>
      {allowed ? (
        <p className="text-sm text-muted-foreground">
          O projeto será criado em <strong className="text-foreground">{workspace.name}</strong>.
        </p>
      ) : (
        // A template creates custom fields, which only OWNER/ADMIN may do —
        // stricter than creating a blank project (API.md § 26.3).
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
      {useOpen ? (
        <UseTemplateDialog template={template} workspace={workspace} open onOpenChange={setUseOpen} />
      ) : null}
    </div>
  );
}

export function TemplatePrimaryAction({ template }: { template: ProjectTemplateDetail }) {
  if (template.access === "PURCHASE_REQUIRED") return <BuyAction template={template} />;

  if (!template.canInstantiate) {
    return (
      <Note icon={<Ban />}>
        <p>
          {template.status === "REMOVED"
            ? "Este modelo foi tirado do hub pela moderação e não pode mais ser usado."
            : "Este modelo não pode ser usado no momento."}
        </p>
      </Note>
    );
  }

  return <UseAction template={template} />;
}
