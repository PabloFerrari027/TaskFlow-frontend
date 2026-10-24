"use client";

import * as React from "react";
import { LayoutTemplate } from "lucide-react";
import { EmptyState } from "@/components/shared/empty-state";
import { ErrorState } from "@/components/shared/error-state";
import { useAuth } from "@/lib/auth/auth-context";
import { cn } from "@/lib/utils";
import { canInstantiateFolderTemplate } from "@/lib/permissions";
import { useCurrentWorkspace } from "@/features/workspaces/context/current-workspace-context";
import { ApplyBlueprintDialog } from "@/features/workspace-blueprints/components/apply-blueprint-dialog";
import {
  AudienceChips,
  BlueprintGrid,
  BlueprintGridSkeleton,
  BlueprintTile,
} from "@/features/workspace-blueprints/components/blueprint-picker";
import { useWorkspaceBlueprintsQuery } from "@/features/workspace-blueprints/hooks/use-workspace-blueprints";
import type {
  WorkspaceBlueprintAudience,
  WorkspaceBlueprintSummary,
} from "@/types/workspace-blueprint";

// The workspace blueprint gallery (API.md § 26.10): sets of folders by
// profile, applied to the current workspace.
export function WorkspaceBlueprintsSection() {
  const { workspace } = useCurrentWorkspace();
  const { userId } = useAuth();
  const blueprintsQuery = useWorkspaceBlueprintsQuery();
  const [audience, setAudience] = React.useState<WorkspaceBlueprintAudience | null>(null);
  const [selected, setSelected] = React.useState<WorkspaceBlueprintSummary | null>(null);

  // Applying takes OWNER/ADMIN (API.md § 26.10); anyone can look.
  const canApply = canInstantiateFolderTemplate(
    workspace?.members.find((member) => member.userId === userId)?.role
  );
  const blueprints = blueprintsQuery.data ?? [];
  const visible = audience
    ? blueprints.filter((blueprint) => blueprint.audience === audience)
    : blueprints;

  return (
    <section className="space-y-4">
      <div className="space-y-1">
        <h2 className="text-lg font-semibold tracking-tight">Modelos de workspace</h2>
        <p className="text-sm text-muted-foreground">
          Um conjunto de pastas para o seu tipo de trabalho, já ligadas entre si por automações,
          painéis e rotinas. Ao usar, as pastas são criadas no workspace atual — nada do que já
          existe muda.
        </p>
      </div>

      {blueprintsQuery.isLoading ? (
        <BlueprintGridSkeleton />
      ) : blueprintsQuery.isError ? (
        <ErrorState error={blueprintsQuery.error} onRetry={() => blueprintsQuery.refetch()} />
      ) : blueprints.length === 0 ? (
        <EmptyState
          icon={<LayoutTemplate className="size-6" />}
          title="Nenhum modelo de workspace por enquanto"
          description="Você ainda pode começar com os modelos de pasta abaixo."
        />
      ) : (
        <div className={cn("space-y-3", blueprintsQuery.isPlaceholderData && "opacity-60")}>
          <AudienceChips blueprints={blueprints} value={audience} onChange={setAudience} />
          <BlueprintGrid>
            {visible.map((blueprint) => (
              <BlueprintTile key={blueprint.key} blueprint={blueprint} onSelect={setSelected} />
            ))}
          </BlueprintGrid>
        </div>
      )}

      {selected && workspace ? (
        <ApplyBlueprintDialog
          key={selected.key}
          blueprint={selected}
          workspace={workspace}
          canApply={canApply}
          open
          onOpenChange={(open) => {
            if (!open) setSelected(null);
          }}
        />
      ) : null}
    </section>
  );
}
