import { AlertTriangle } from "lucide-react";

// Shared by PendingActionCard and ReauthDialog — the reauth modal repeats
// this instead of making the user look back at the card behind it.
export function PendingActionDetails({
  humanDescription,
  params,
  isCurrentSession,
}: {
  humanDescription: string;
  params: Record<string, unknown>;
  isCurrentSession?: boolean;
}) {
  const paramEntries = Object.entries(params);

  return (
    <div className="space-y-2">
      <p className="text-sm text-foreground">{humanDescription}</p>

      {paramEntries.length > 0 ? (
        <dl className="space-y-0.5 rounded-md bg-muted/40 p-2 text-xs">
          {paramEntries.map(([key, value]) => (
            <div key={key} className="flex gap-1.5">
              <dt className="shrink-0 font-medium text-muted-foreground">{key}:</dt>
              <dd className="truncate text-foreground">{String(value)}</dd>
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
