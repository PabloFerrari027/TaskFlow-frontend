import { useQueries } from "@tanstack/react-query";
import { AlertTriangle, ArrowRight } from "lucide-react";
import { queryKeys } from "@/lib/query-keys";
import { foldersService } from "@/features/folders/api/folders-service";
import { itemsService } from "@/features/items/api/items-service";
import { useEntityNameLookup } from "@/features/assistant/hooks/use-entity-name-lookup";
import { fieldLabel, formatParamValue, unnamedIds } from "@/features/assistant/lib/describe-params";
import type { PendingActionFieldDiff } from "@/features/assistant/types";

// Shared by PendingActionCard and ReauthDialog — the reauth modal repeats
// this instead of making the user look back at the card behind it.
//
// Every param is always listed (API.md § 16: the user confirms what the
// backend will run, never just the model's reply) — only its presentation is
// made readable: field names translated, enums by their label, ids by the
// name this client has cached, or fetches for an item/folder it hasn't loaded
// (a code like "4ff890cf" only if that fails, never dropped). A field that
// the diff already shows is not listed again, and a diff line where nothing
// changes is left out.
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
  const changes = (diff ?? []).filter(
    (change) => formatParamValue(change.field, change.from, lookup) !== formatParamValue(change.field, change.to, lookup)
  );
  const shownInDiff = new Set((diff ?? []).map((change) => change.field));
  const paramEntries = Object.entries(params).filter(([key]) => !shownInDiff.has(key));

  // Fetched into the same cache the lookup reads: the names show up on the next render.
  const missing = unnamedIds(
    [...Object.entries(params), ...(diff ?? []).flatMap((change) => [[change.field, change.from], [change.field, change.to]] as Array<[string, unknown]>)],
    lookup
  );
  useQueries({
    queries: missing.map(({ kind, id }) =>
      kind === "item"
        ? { queryKey: queryKeys.items.detail(id), queryFn: () => itemsService.get(id), retry: false, staleTime: 60_000 }
        : { queryKey: queryKeys.folders.detail(id), queryFn: () => foldersService.get(id), retry: false, staleTime: 60_000 }
    ),
  });

  return (
    <div className="space-y-2">
      <p className="text-sm text-foreground">{humanDescription}</p>

      {changes.length > 0 ? (
        <dl className="space-y-1 rounded-md border border-border/60 p-2 text-xs">
          {changes.map((change) => (
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
