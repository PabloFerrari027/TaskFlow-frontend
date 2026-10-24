"use client";

import * as React from "react";
import { Check } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { plural } from "@/features/folder-templates/lib/template-labels";
import { getAudienceInfo } from "@/features/workspace-blueprints/lib/audiences";
import { useWorkspaceBlueprintsQuery } from "@/features/workspace-blueprints/hooks/use-workspace-blueprints";
import {
  WORKSPACE_BLUEPRINT_AUDIENCES,
  type WorkspaceBlueprintAudience,
  type WorkspaceBlueprintSummary,
} from "@/types/workspace-blueprint";

export function formatBlueprintCounts(blueprint: WorkspaceBlueprintSummary) {
  const parts = [plural(blueprint.folders.length, "pasta", "pastas")];
  if (blueprint.connectionCount > 0) {
    parts.push(plural(blueprint.connectionCount, "ligação", "ligações"));
  }
  return parts.join(" · ");
}

export function BlueprintTile({
  blueprint,
  selected = false,
  onSelect,
}: {
  blueprint: WorkspaceBlueprintSummary;
  selected?: boolean;
  onSelect: (blueprint: WorkspaceBlueprintSummary) => void;
}) {
  const audience = getAudienceInfo(blueprint.audience);

  return (
    <button
      type="button"
      aria-pressed={selected}
      disabled={!blueprint.available}
      onClick={() => onSelect(blueprint)}
      className={cn(
        "group relative flex min-h-36 w-full min-w-0 flex-col rounded-xl border bg-card p-3.5 text-left transition-all outline-none",
        // Keeps the cursor over the button once it lifts (no hover flicker).
        "after:absolute after:inset-x-0 after:-bottom-1 after:h-1",
        "hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-md focus-visible:ring-[3px] focus-visible:ring-ring/50",
        "disabled:pointer-events-none disabled:opacity-50",
        selected && "border-primary bg-primary/5 ring-1 ring-primary"
      )}
      title={blueprint.tagline}
    >
      <div className="flex items-start justify-between gap-2">
        <span
          aria-hidden
          className={cn(
            "flex size-10 items-center justify-center rounded-lg text-xl transition-transform group-hover:scale-110",
            selected ? "bg-primary/15" : "bg-muted"
          )}
        >
          {audience.icon}
        </span>
        {selected ? (
          <span className="flex size-5 items-center justify-center rounded-full bg-primary text-primary-foreground">
            <Check className="size-3" strokeWidth={3} />
          </span>
        ) : !blueprint.available ? (
          <span className="rounded-full bg-muted px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground">
            Indisponível
          </span>
        ) : null}
      </div>
      <p className="mt-3 line-clamp-1 text-sm leading-snug font-medium">{blueprint.name}</p>
      <p className="mt-0.5 line-clamp-2 text-xs leading-snug text-muted-foreground">
        {blueprint.tagline}
      </p>
      <p className="mt-auto pt-2 text-[11px] text-muted-foreground/80">
        {formatBlueprintCounts(blueprint)}
      </p>
    </button>
  );
}

export function BlueprintGrid({ children }: { children: React.ReactNode }) {
  return (
    <div className="grid grid-cols-1 gap-3 min-[420px]:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
      {children}
    </div>
  );
}

export function BlueprintGridSkeleton({ count = 8 }: { count?: number }) {
  return (
    <BlueprintGrid>
      {Array.from({ length: count }).map((_, i) => (
        <Skeleton key={i} className="h-36 w-full rounded-xl" />
      ))}
    </BlueprintGrid>
  );
}

// Only the audiences the catalog has, in the API's order.
export function AudienceChips({
  blueprints,
  value,
  onChange,
}: {
  blueprints: WorkspaceBlueprintSummary[];
  value: WorkspaceBlueprintAudience | null;
  onChange: (audience: WorkspaceBlueprintAudience | null) => void;
}) {
  const present = new Set(blueprints.map((blueprint) => blueprint.audience));
  const audiences = WORKSPACE_BLUEPRINT_AUDIENCES.filter((audience) => present.has(audience));
  if (audiences.length < 2) return null;

  const chip = (selected: boolean) =>
    cn(
      "inline-flex shrink-0 items-center gap-1 rounded-full border px-3 py-1 text-xs font-medium transition-colors",
      selected
        ? "border-primary bg-primary text-primary-foreground"
        : "bg-card text-muted-foreground hover:border-primary/40 hover:text-foreground"
    );

  return (
    <div className="flex flex-wrap gap-1.5" role="group" aria-label="Filtrar por perfil">
      <button type="button" className={chip(value === null)} onClick={() => onChange(null)}>
        Todos
      </button>
      {audiences.map((audience) => {
        const info = getAudienceInfo(audience);
        return (
          <button
            key={audience}
            type="button"
            aria-pressed={value === audience}
            className={chip(value === audience)}
            onClick={() => onChange(value === audience ? null : audience)}
          >
            <span aria-hidden>{info.icon}</span> {info.label}
          </button>
        );
      })}
    </div>
  );
}

interface BlueprintPickerProps {
  selectedKey: string | null;
  onSelect: (blueprint: WorkspaceBlueprintSummary) => void;
  disabled?: boolean;
}

/** The whole catalog, filtered by audience on the client (it is small and fixed). */
export function BlueprintPicker({ selectedKey, onSelect, disabled }: BlueprintPickerProps) {
  const blueprintsQuery = useWorkspaceBlueprintsQuery();
  const [audience, setAudience] = React.useState<WorkspaceBlueprintAudience | null>(null);

  // Nothing to suggest (or it failed): a blank workspace still works.
  if (blueprintsQuery.isError || (blueprintsQuery.data && blueprintsQuery.data.length === 0)) {
    return null;
  }

  const blueprints = blueprintsQuery.data ?? [];
  const visible = audience
    ? blueprints.filter((blueprint) => blueprint.audience === audience)
    : blueprints;

  return (
    <div className={cn("space-y-3", disabled && "pointer-events-none opacity-60")}>
      {blueprintsQuery.isLoading ? (
        <BlueprintGridSkeleton count={4} />
      ) : (
        <>
          <AudienceChips blueprints={blueprints} value={audience} onChange={setAudience} />
          <BlueprintGrid>
            {visible.map((blueprint) => (
              <BlueprintTile
                key={blueprint.key}
                blueprint={blueprint}
                selected={blueprint.key === selectedKey}
                onSelect={onSelect}
              />
            ))}
          </BlueprintGrid>
        </>
      )}
    </div>
  );
}
