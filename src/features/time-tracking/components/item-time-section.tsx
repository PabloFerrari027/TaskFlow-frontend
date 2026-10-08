"use client";

import * as React from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { Loader2, Play, Plus, Square, Timer, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
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
import {
  logTimeEntrySchema,
  toLogTimeEntryRequest,
  type LogTimeEntryFormValues,
} from "@/features/time-tracking/schemas";

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
  const form = useForm<LogTimeEntryFormValues>({
    resolver: zodResolver(logTimeEntrySchema),
    defaultValues: { ...nowInputs(), hours: "", minutes: "", note: "" },
  });

  return (
    <Form {...form}>
      <form
        className="space-y-3 rounded-lg border border-border/60 p-3"
        onSubmit={form.handleSubmit((values) =>
          logMutation.mutate(toLogTimeEntryRequest(values), { onSuccess: onDone })
        )}
      >
        <div className="grid gap-2 sm:grid-cols-2">
          <FormField
            control={form.control}
            name="date"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Dia</FormLabel>
                <FormControl>
                  <Input type="date" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="time"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Começou às</FormLabel>
                <FormControl>
                  <Input type="time" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
        <FormField
          control={form.control}
          name="hours"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Quanto tempo</FormLabel>
              <div className="flex items-center gap-2">
                <FormControl>
                  <Input type="number" min={0} max={24} className="w-20" aria-label="Horas" {...field} />
                </FormControl>
                <span className="text-sm text-muted-foreground">h</span>
                <Input
                  type="number"
                  min={0}
                  max={59}
                  className="w-20"
                  aria-label="Minutos"
                  {...form.register("minutes")}
                />
                <span className="text-sm text-muted-foreground">min</span>
              </div>
              {/* Duration errors (both inputs) are reported on `hours`. */}
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="note"
          render={({ field }) => (
            <FormItem>
              <FormControl>
                <Input placeholder="O que foi feito? (opcional)" maxLength={500} {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <div className="flex justify-end gap-2">
          <Button type="button" variant="ghost" size="sm" onClick={onDone}>
            Cancelar
          </Button>
          <Button type="submit" size="sm" disabled={logMutation.isPending}>
            {logMutation.isPending ? <Loader2 className="animate-spin" /> : null}
            Registrar
          </Button>
        </div>
      </form>
    </Form>
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
