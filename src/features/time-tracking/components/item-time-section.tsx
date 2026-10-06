"use client";

import * as React from "react";
import { Play, Plus, Square, Timer, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { MemberAvatar } from "@/components/shared/member-avatar";
import { Pager } from "@/components/shared/pager";
import { formatClock, formatDateTime, formatMinutes } from "@/lib/format";
import { useAuth } from "@/lib/auth/auth-context";
import {
  useDeleteTimeEntryMutation,
  useElapsedSeconds,
  useLogTimeEntryMutation,
  useRunningTimerQuery,
  useStartTimerMutation,
  useStopTimerMutation,
  useItemTimeEntriesQuery,
} from "@/features/time-tracking/hooks/use-time-tracking";

function nowInputs() {
  const now = new Date();
  const pad = (n: number) => String(n).padStart(2, "0");
  return {
    date: `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`,
    time: `${pad(now.getHours())}:${pad(now.getMinutes())}`,
  };
}

function LogTimeForm({ itemId, onDone }: { itemId: string; onDone: () => void }) {
  const logMutation = useLogTimeEntryMutation(itemId);
  const [when, setWhen] = React.useState(nowInputs);
  const [hours, setHours] = React.useState("");
  const [minutes, setMinutes] = React.useState("");
  const [note, setNote] = React.useState("");

  const total = Math.round(Number(hours || 0) * 60 + Number(minutes || 0));
  const valid = Number.isFinite(total) && total >= 1 && total <= 1440 && !!when.date && !!when.time;

  return (
    <form
      className="space-y-3 rounded-lg border border-border/60 p-3"
      onSubmit={(event) => {
        event.preventDefault();
        if (!valid) return;
        // The person types their own local start time.
        const startedAt = new Date(`${when.date}T${when.time}:00`).toISOString();
        logMutation.mutate(
          { startedAt, durationMinutes: total, note: note.trim() || undefined },
          { onSuccess: onDone }
        );
      }}
    >
      <div className="grid gap-2 sm:grid-cols-2">
        <div className="space-y-1">
          <Label htmlFor="log-date">Dia</Label>
          <Input
            id="log-date"
            type="date"
            value={when.date}
            onChange={(e) => setWhen({ ...when, date: e.target.value })}
          />
        </div>
        <div className="space-y-1">
          <Label htmlFor="log-time">Começou às</Label>
          <Input
            id="log-time"
            type="time"
            value={when.time}
            onChange={(e) => setWhen({ ...when, time: e.target.value })}
          />
        </div>
      </div>
      <div className="space-y-1">
        <Label>Quanto tempo</Label>
        <div className="flex items-center gap-2">
          <Input
            type="number"
            min={0}
            max={24}
            className="w-20"
            aria-label="Horas"
            value={hours}
            onChange={(e) => setHours(e.target.value)}
          />
          <span className="text-sm text-muted-foreground">h</span>
          <Input
            type="number"
            min={0}
            max={59}
            className="w-20"
            aria-label="Minutos"
            value={minutes}
            onChange={(e) => setMinutes(e.target.value)}
          />
          <span className="text-sm text-muted-foreground">min</span>
        </div>
      </div>
      <Input
        placeholder="O que foi feito? (opcional)"
        maxLength={500}
        value={note}
        onChange={(e) => setNote(e.target.value)}
      />
      <div className="flex justify-end gap-2">
        <Button type="button" variant="ghost" size="sm" onClick={onDone}>
          Cancelar
        </Button>
        <Button type="submit" size="sm" disabled={!valid || logMutation.isPending}>
          Registrar
        </Button>
      </div>
    </form>
  );
}

/** Time spent on an item: start/stop the timer, log time by hand, see everyone's entries. */
export function ItemTimeSection({
  itemId,
  estimateMinutes,
}: {
  itemId: string;
  estimateMinutes: number | null;
}) {
  const { userId } = useAuth();
  const [page, setPage] = React.useState(1);
  const [logging, setLogging] = React.useState(false);
  const runningQuery = useRunningTimerQuery();
  const entriesQuery = useItemTimeEntriesQuery(itemId, page);
  const startMutation = useStartTimerMutation();
  const stopMutation = useStopTimerMutation();
  const deleteMutation = useDeleteTimeEntryMutation();

  const running = runningQuery.data;
  const runningHere = running?.itemId === itemId ? running : null;
  const elapsed = useElapsedSeconds(runningHere);
  const result = entriesQuery.data;
  const totalMinutes = (result?.totalSeconds ?? 0) / 60;

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <Timer className="size-4 text-muted-foreground" />
          <h3 className="text-sm font-medium text-foreground">Tempo</h3>
        </div>
        <div className="flex gap-2">
          {runningHere ? (
            <Button
              size="sm"
              variant="outline"
              disabled={stopMutation.isPending}
              onClick={() => stopMutation.mutate()}
            >
              <Square className="fill-current" /> Parar ({formatClock(elapsed)})
            </Button>
          ) : (
            <Button
              size="sm"
              variant="outline"
              disabled={startMutation.isPending}
              onClick={() => startMutation.mutate({ itemId })}
              title={running ? "O cronômetro do outro item será parado e salvo" : undefined}
            >
              <Play /> Iniciar cronômetro
            </Button>
          )}
          <Button size="sm" variant="ghost" onClick={() => setLogging((v) => !v)}>
            <Plus /> Registrar à mão
          </Button>
        </div>
      </div>

      <p className="text-sm">
        <span className="font-medium">{formatMinutes(totalMinutes)}</span>{" "}
        <span className="text-muted-foreground">
          {estimateMinutes ? `de ${formatMinutes(estimateMinutes)} estimados` : "registrados no total"}
        </span>
      </p>
      {estimateMinutes ? (
        <div className="h-1.5 overflow-hidden rounded-full bg-muted" aria-hidden>
          <div
            className={totalMinutes > estimateMinutes ? "h-full bg-destructive" : "h-full bg-primary"}
            style={{ width: `${Math.min(100, (totalMinutes / estimateMinutes) * 100)}%` }}
          />
        </div>
      ) : null}

      {logging ? <LogTimeForm itemId={itemId} onDone={() => setLogging(false)} /> : null}

      {entriesQuery.isLoading ? (
        <Skeleton className="h-10 w-full" />
      ) : result && result.data.length > 0 ? (
        <>
          <ul className="divide-y">
            {result.data.map((entry) => (
              <li key={entry.id} className="flex items-center gap-2 py-2 text-sm">
                <MemberAvatar userId={entry.userId} />
                <div className="min-w-0 flex-1">
                  <p>
                    <span className="font-medium">
                      {entry.running ? "rodando…" : formatMinutes(entry.durationSeconds / 60)}
                    </span>{" "}
                    <span className="text-xs text-muted-foreground">
                      {formatDateTime(entry.startedAt)}
                    </span>
                  </p>
                  {entry.note ? (
                    <p className="truncate text-xs text-muted-foreground">{entry.note}</p>
                  ) : null}
                </div>
                {entry.userId === userId && !entry.running ? (
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    aria-label="Apagar registro"
                    title="Apagar registro"
                    disabled={deleteMutation.isPending}
                    onClick={() => deleteMutation.mutate(entry.id)}
                  >
                    <Trash2 />
                  </Button>
                ) : null}
              </li>
            ))}
          </ul>
          <Pager meta={result.meta} isLoading={entriesQuery.isFetching} onPageChange={setPage} />
        </>
      ) : null}
    </div>
  );
}
