import { AlertTriangle, ArrowRight } from "lucide-react";
import { useEntityNameLookup } from "@/features/assistant/hooks/use-entity-name-lookup";
import { fieldLabel, formatParamValue } from "@/features/assistant/lib/describe-params";
import type { PendingActionFieldDiff } from "@/features/assistant/types";

// Shared by PendingActionCard and ReauthDialog — the reauth modal repeats
// this instead of making the user look back at the card behind it.
//
// Every param is always listed (API.md § 16: the user confirms what the
// backend will run, never just the model's reply) — only its presentation is
// made readable: field names translated, enums by their label, ids by the
// name this client already has cached (else shortened, never dropped).
export function PendingActionDetails({
  workspaceId,
  humanDescription,
  params,
  diff,
  isCurrentSession,
}: {
  workspaceId: string;
  humanDescription: string;
  params: Record<string, unknown>;
  diff?: PendingActionFieldDiff[];
  isCurrentSession?: boolean;
}) {
  const lookup = useEntityNameLookup(workspaceId);
  const paramEntries = Object.entries(params);

  return (
    <div className="space-y-2">
      <p className="text-sm text-foreground">{humanDescription}</p>

      {diff && diff.length > 0 ? (
        <dl className="space-y-1 rounded-md border border-border/60 p-2 text-xs">
          {diff.map((change) => (
            <div key={change.field} className="flex flex-wrap items-center gap-1.5">
              <dt className="font-medium text-muted-foreground">{fieldLabel(change.field)}:</dt>
              <dd className="flex flex-wrap items-center gap-1.5 text-foreground">
                <span className="text-muted-foreground line-through">
                  {formatParamValue(change.field, change.from, lookup)}
                </span>
                <ArrowRight className="size-3 shrink-0 text-muted-foreground" aria-label="para" />
                <span className="font-medium">{formatParamValue(change.field, change.to, lookup)}</span>
              </dd>
            </div>
          ))}
        </dl>
      ) : null}

      {paramEntries.length > 0 ? (
        <dl className="space-y-0.5 rounded-md bg-muted/40 p-2 text-xs">
          {paramEntries.map(([key, value]) => (
            <div key={key} className="flex gap-1.5">
              <dt className="shrink-0 font-medium text-muted-foreground">{fieldLabel(key)}:</dt>
              <dd className="truncate text-foreground">{formatParamValue(key, value, lookup)}</dd>
            </div>
          ))}
        </dl>
      ) : null}

      {isCurrentSession ? (
        <div className="flex items-center gap-1.5 rounded-md bg-destructive/10 px-2 py-1.5 text-xs font-medium text-destructive">
          <AlertTriangle className="size-3.5 shrink-0" />
          Isso vai desconectar você agora.
        </div>
      ) : null}
    </div>
  );
}
