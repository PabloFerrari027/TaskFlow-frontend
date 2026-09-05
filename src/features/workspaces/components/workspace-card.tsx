"use client";

import Link from "next/link";
import { Building2, Check, Users } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { WorkspaceRoleBadge } from "@/components/shared/status-badge";
import { useAuth } from "@/lib/auth/auth-context";
import type { Workspace } from "@/types/workspace";

export function WorkspaceCard({
  workspace,
  isCurrent,
  onSelect,
}: {
  workspace: Workspace;
  isCurrent: boolean;
  onSelect: () => void;
}) {
  const { userId } = useAuth();
  const myRole = workspace.members.find((m) => m.userId === userId)?.role;

  return (
    <Card className="gap-3 p-5">
      <div className="flex items-start justify-between gap-2">
        <div className="flex size-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
          <Building2 className="size-4.5" />
        </div>
        {isCurrent ? (
          <span className="flex items-center gap-1 text-xs font-medium text-primary">
            <Check className="size-3.5" /> Atual
          </span>
        ) : null}
      </div>

      <div>
        <h3 className="truncate font-medium text-foreground">{workspace.name}</h3>
        <div className="mt-1 flex items-center gap-3 text-xs text-muted-foreground">
          <span className="flex items-center gap-1">
            <Users className="size-3.5" />
            {workspace.members.length} membro(s)
          </span>
          {myRole ? <WorkspaceRoleBadge role={myRole} /> : null}
        </div>
      </div>

      <div className="flex gap-2 pt-1">
        {!isCurrent ? (
          <Button size="sm" variant="outline" onClick={onSelect}>
            Selecionar
          </Button>
        ) : null}
        <Button size="sm" variant={isCurrent ? "outline" : "ghost"} asChild>
          <Link href={`/workspaces/${workspace.id}`}>Configurações</Link>
        </Button>
      </div>
    </Card>
  );
}
