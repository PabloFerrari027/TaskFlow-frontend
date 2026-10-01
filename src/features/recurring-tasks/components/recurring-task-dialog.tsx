"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import { TASK_PRIORITY_LABEL } from "@/components/shared/status-badge";
import { AssigneeSelect } from "@/features/tasks/components/assignee-select";
import { SectionSelect } from "@/features/tasks/components/section-select";
import { NO_PRIORITY_VALUE } from "@/features/tasks/schemas";
import {
  isScheduleComplete,
  ScheduleEditor,
} from "@/features/recurring-tasks/components/schedule-editor";
import {
  useCreateRecurringTaskMutation,
  useUpdateRecurringTaskMutation,
} from "@/features/recurring-tasks/hooks/use-recurring-tasks";
import {
  browserTimezone,
  OCCURRENCE_PLACEHOLDERS,
} from "@/features/recurring-tasks/lib/schedule-text";
import type { RecurrenceSchedule, TaskRecurrence } from "@/types/recurrence";
import type { TaskPriority } from "@/types/task";

function todayInput() {
  const now = new Date();
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;
}

function initialSchedule(recurrence?: TaskRecurrence): RecurrenceSchedule {
  if (recurrence) {
    const s = recurrence.schedule;
    return {
      frequency: s.frequency,
      interval: s.interval,
      daysOfWeek: s.frequency === "WEEKLY" ? s.daysOfWeek : undefined,
      dayOfMonth: s.dayOfMonth ?? undefined,
      month: s.month ?? undefined,
      time: s.time,
      timezone: s.timezone,
      startDate: s.startDate,
      endDate: s.endDate,
    };
  }
  return {
    frequency: "WEEKLY",
    interval: 1,
    daysOfWeek: [new Date().getDay()],
    time: "09:00",
    timezone: browserTimezone(),
    startDate: todayInput(),
    endDate: null,
  };
}

export function RecurringTaskDialog({
  projectId,
  recurrence,
  open,
  onOpenChange,
}: {
  projectId: string;
  /** Editing this one; omitted = creating. */
  recurrence?: TaskRecurrence;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const createMutation = useCreateRecurringTaskMutation(projectId);
  const updateMutation = useUpdateRecurringTaskMutation(projectId);
  const titleRef = React.useRef<HTMLInputElement>(null);

  const [title, setTitle] = React.useState(recurrence?.title ?? "");
  const [description, setDescription] = React.useState(recurrence?.description ?? "");
  const [sectionId, setSectionId] = React.useState<string | undefined>(recurrence?.sectionId ?? undefined);
  const [assigneeId, setAssigneeId] = React.useState<string | undefined>(recurrence?.assigneeId ?? undefined);
  const [priority, setPriority] = React.useState<TaskPriority | undefined>(recurrence?.priority ?? undefined);
  const [dueInDays, setDueInDays] = React.useState<string>(
    recurrence?.dueInDays === null || recurrence?.dueInDays === undefined ? "" : String(recurrence.dueInDays)
  );
  const [schedule, setSchedule] = React.useState<RecurrenceSchedule>(() => initialSchedule(recurrence));

  const isPending = createMutation.isPending || updateMutation.isPending;
  const due = dueInDays.trim() === "" ? null : Math.round(Number(dueInDays));
  const dueValid = due === null || (Number.isFinite(due) && due >= 0 && due <= 365);
  const canSave = title.trim().length > 0 && dueValid && isScheduleComplete(schedule) && !isPending;

  function insertPlaceholder(token: string) {
    const input = titleRef.current;
    const start = input?.selectionStart ?? title.length;
    const end = input?.selectionEnd ?? title.length;
    const next = `${title.slice(0, start)}${token}${title.slice(end)}`;
    setTitle(next);
    requestAnimationFrame(() => {
      input?.focus();
      input?.setSelectionRange(start + token.length, start + token.length);
    });
  }

  function save() {
    // The schedule always carries the viewer's timezone (API.md § 27).
    const fullSchedule = { ...schedule, timezone: schedule.timezone ?? browserTimezone() };
    const close = { onSuccess: () => onOpenChange(false) };
    if (recurrence) {
      updateMutation.mutate(
        {
          recurrenceId: recurrence.id,
          payload: {
            title: title.trim(),
            description: description.trim() || null,
            sectionId: sectionId ?? null,
            assigneeId: assigneeId ?? null,
            priority: priority ?? null,
            dueInDays: due,
            schedule: fullSchedule,
          },
        },
        close
      );
    } else {
      createMutation.mutate(
        {
          title: title.trim(),
          description: description.trim() || undefined,
          sectionId,
          assigneeId,
          priority,
          dueInDays: due ?? undefined,
          schedule: fullSchedule,
        },
        close
      );
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>{recurrence ? "Editar tarefa repetida" : "Nova tarefa repetida"}</DialogTitle>
          <DialogDescription>
            O TaskFlow cria esta tarefa sozinho, nas datas que você escolher — por exemplo, “Pagar o
            aluguel” todo dia 5.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="recurrence-title">Título da tarefa</Label>
            <Input
              id="recurrence-title"
              ref={titleRef}
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Ex.: Compras do mercado"
            />
            <div className="flex flex-wrap items-center gap-1 text-xs text-muted-foreground">
              <span>Inserir no título:</span>
              {OCCURRENCE_PLACEHOLDERS.map((p) => (
                <button
                  key={p.token}
                  type="button"
                  onClick={() => insertPlaceholder(p.token)}
                  className="rounded-full border px-2 py-0.5 hover:bg-muted"
                  title={`Vira, por exemplo, “${p.example}”`}
                >
                  {p.label}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="recurrence-description">Descrição (opcional)</Label>
            <Textarea
              id="recurrence-description"
              rows={2}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label>Coluna</Label>
              <SectionSelect
                projectId={projectId}
                value={sectionId}
                onChange={setSectionId}
                placeholder="A coluna padrão do projeto"
              />
            </div>
            <div className="space-y-1.5">
              <Label>Responsável</Label>
              <AssigneeSelect projectId={projectId} value={assigneeId} onChange={setAssigneeId} />
            </div>
            <div className="space-y-1.5">
              <Label>Prioridade</Label>
              <Select
                value={priority ?? NO_PRIORITY_VALUE}
                onValueChange={(v) => setPriority(v === NO_PRIORITY_VALUE ? undefined : (v as TaskPriority))}
              >
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={NO_PRIORITY_VALUE}>Sem prioridade</SelectItem>
                  {(Object.keys(TASK_PRIORITY_LABEL) as TaskPriority[]).map((p) => (
                    <SelectItem key={p} value={p}>
                      {TASK_PRIORITY_LABEL[p]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="recurrence-due">Prazo (dias depois de criada)</Label>
              <Input
                id="recurrence-due"
                type="number"
                min={0}
                max={365}
                placeholder="Sem prazo"
                value={dueInDays}
                onChange={(e) => setDueInDays(e.target.value)}
                aria-invalid={!dueValid}
              />
              <p className="text-xs text-muted-foreground">0 = vence no mesmo dia.</p>
            </div>
          </div>

          <Separator />

          <ScheduleEditor projectId={projectId} value={schedule} onChange={setSchedule} />
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isPending}>
            Cancelar
          </Button>
          <Button onClick={save} disabled={!canSave}>
            {recurrence ? "Salvar" : "Criar repetição"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
