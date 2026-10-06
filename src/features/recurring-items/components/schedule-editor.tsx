"use client";

import { CalendarClock, Loader2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { getErrorMessage } from "@/lib/errors";
import { useDebouncedValue } from "@/lib/use-debounced-value";
import { useRecurrencePreviewQuery } from "@/features/recurring-items/hooks/use-recurring-items";
import {
  describeSchedule,
  formatOccurrence,
  MONTH_NAMES,
  WEEKDAYS,
} from "@/features/recurring-items/lib/schedule-text";
import type { RecurrenceFrequency, RecurrenceSchedule } from "@/types/recurrence";

const FREQUENCIES: { value: RecurrenceFrequency; label: string; unit: [string, string] }[] = [
  { value: "DAILY", label: "Todo dia", unit: ["dia", "dias"] },
  { value: "WEEKLY", label: "Toda semana", unit: ["semana", "semanas"] },
  { value: "MONTHLY", label: "Todo mês", unit: ["mês", "meses"] },
  { value: "YEARLY", label: "Todo ano", unit: ["ano", "anos"] },
];

const MAX_INTERVAL: Record<RecurrenceFrequency, number> = { DAILY: 365, WEEKLY: 52, MONTHLY: 24, YEARLY: 10 };

/** Whether the schedule has what its frequency needs — the preview only runs then. */
export function isScheduleComplete(schedule: RecurrenceSchedule) {
  if (!/^\d{2}:\d{2}$/.test(schedule.time)) return false;
  if (schedule.frequency === "WEEKLY") return (schedule.daysOfWeek?.length ?? 0) > 0;
  if (schedule.frequency === "MONTHLY") return !!schedule.dayOfMonth;
  if (schedule.frequency === "YEARLY") return !!schedule.dayOfMonth && !!schedule.month;
  return true;
}

export function ScheduleEditor({
  folderId,
  value,
  onChange,
}: {
  folderId: string;
  value: RecurrenceSchedule;
  onChange: (schedule: RecurrenceSchedule) => void;
}) {
  const set = (patch: Partial<RecurrenceSchedule>) => onChange({ ...value, ...patch });
  const frequency = FREQUENCIES.find((f) => f.value === value.frequency)!;
  const interval = value.interval ?? 1;
  const debounced = useDebouncedValue(value, 400);
  const previewQuery = useRecurrencePreviewQuery(
    folderId,
    isScheduleComplete(debounced) ? debounced : null
  );

  function changeFrequency(next: RecurrenceFrequency) {
    const today = new Date();
    onChange({
      ...value,
      frequency: next,
      interval: 1,
      daysOfWeek: next === "WEEKLY" ? (value.daysOfWeek?.length ? value.daysOfWeek : [today.getDay()]) : undefined,
      dayOfMonth: next === "MONTHLY" || next === "YEARLY" ? (value.dayOfMonth ?? today.getDate()) : undefined,
      month: next === "YEARLY" ? (value.month ?? today.getMonth() + 1) : undefined,
    });
  }

  function toggleDay(day: number) {
    const days = new Set(value.daysOfWeek ?? []);
    if (days.has(day)) days.delete(day);
    else days.add(day);
    set({ daysOfWeek: [...days].sort((a, b) => a - b) });
  }

  return (
    <div className="space-y-4">
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label>Repete</Label>
          <Select value={value.frequency} onValueChange={(v) => changeFrequency(v as RecurrenceFrequency)}>
            <SelectTrigger className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {FREQUENCIES.map((f) => (
                <SelectItem key={f.value} value={f.value}>
                  {f.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="recurrence-time">Horário</Label>
          <Input
            id="recurrence-time"
            type="time"
            value={value.time}
            onChange={(e) => set({ time: e.target.value })}
          />
        </div>
      </div>

      <div className="flex items-center gap-2 text-sm">
        <span>A cada</span>
        <Input
          type="number"
          min={1}
          max={MAX_INTERVAL[value.frequency]}
          className="w-20"
          aria-label="Intervalo"
          value={interval}
          onChange={(e) => {
            const n = Math.round(Number(e.target.value));
            if (Number.isFinite(n)) set({ interval: Math.min(MAX_INTERVAL[value.frequency], Math.max(1, n)) });
          }}
        />
        <span>{interval === 1 ? frequency.unit[0] : frequency.unit[1]}</span>
      </div>

      {value.frequency === "WEEKLY" ? (
        <div className="space-y-1.5">
          <Label>Em quais dias</Label>
          <div className="flex flex-wrap gap-1" role="group" aria-label="Dias da semana">
            {WEEKDAYS.map((day) => {
              const selected = value.daysOfWeek?.includes(day.value) ?? false;
              return (
                <button
                  key={day.value}
                  type="button"
                  aria-pressed={selected}
                  aria-label={day.long}
                  title={day.long}
                  onClick={() => toggleDay(day.value)}
                  className={cn(
                    "size-9 rounded-full border text-sm font-medium transition-colors",
                    selected ? "border-primary bg-primary text-primary-foreground" : "border-border hover:bg-muted"
                  )}
                >
                  {day.short}
                </button>
              );
            })}
          </div>
        </div>
      ) : null}

      {value.frequency === "MONTHLY" || value.frequency === "YEARLY" ? (
        <div className="grid gap-3 sm:grid-cols-2">
          {value.frequency === "YEARLY" ? (
            <div className="space-y-1.5">
              <Label>Mês</Label>
              <Select value={String(value.month ?? 1)} onValueChange={(v) => set({ month: Number(v) })}>
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {MONTH_NAMES.map((name, index) => (
                    <SelectItem key={name} value={String(index + 1)}>
                      {name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          ) : null}
          <div className="space-y-1.5">
            <Label>Dia</Label>
            <Select value={String(value.dayOfMonth ?? 1)} onValueChange={(v) => set({ dayOfMonth: Number(v) })}>
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Array.from({ length: 31 }, (_, i) => i + 1).map((day) => (
                  <SelectItem key={day} value={String(day)}>
                    {day === 31 && value.frequency === "MONTHLY" ? "31 (último dia do mês)" : day}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {value.frequency === "MONTHLY" && (value.dayOfMonth ?? 0) > 28 ? (
              <p className="text-xs text-muted-foreground">
                Nos meses mais curtos, cai no último dia do mês.
              </p>
            ) : null}
          </div>
        </div>
      ) : null}

      <div className="grid gap-3 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label htmlFor="recurrence-start">Começa em</Label>
          <Input
            id="recurrence-start"
            type="date"
            value={value.startDate ?? ""}
            onChange={(e) => set({ startDate: e.target.value || undefined })}
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="recurrence-end">Termina em (opcional)</Label>
          <Input
            id="recurrence-end"
            type="date"
            value={value.endDate ?? ""}
            min={value.startDate}
            onChange={(e) => set({ endDate: e.target.value || null })}
          />
        </div>
      </div>

      <div className="rounded-lg border border-border/60 bg-muted/30 p-3">
        <p className="flex items-center gap-2 text-sm font-medium">
          <CalendarClock className="size-4 text-muted-foreground" />
          {isScheduleComplete(value) ? describeSchedule(value) : "Escolha pelo menos um dia"}
        </p>
        {previewQuery.isError ? (
          <p className="mt-1 text-xs text-destructive">{getErrorMessage(previewQuery.error)}</p>
        ) : previewQuery.data ? (
          <p className={cn("mt-1 text-xs text-muted-foreground", previewQuery.isFetching && "opacity-60")}>
            {previewQuery.data.upcomingOccurrences.length > 0
              ? `Próximas: ${previewQuery.data.upcomingOccurrences.map(formatOccurrence).join(" · ")}`
              : "Nenhuma ocorrência futura com essas datas."}
          </p>
        ) : previewQuery.isFetching ? (
          <p className="mt-1 flex items-center gap-1 text-xs text-muted-foreground">
            <Loader2 className="size-3 animate-spin" /> Calculando as próximas datas…
          </p>
        ) : null}
      </div>
    </div>
  );
}
