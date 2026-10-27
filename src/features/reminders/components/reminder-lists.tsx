"use client";

import Link from "next/link";
import { BellRing, Repeat } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import {
  useCancelReminderMutation,
  useStopRecurringReminderMutation,
} from "@/features/reminders/hooks/use-reminders";
import type { RecurringReminder, UpcomingReminder } from "@/types/reminder";

/** A one-off reminder: the item it belongs to, when it goes off, and a way to drop it. */
export function UpcomingReminderRow({
  reminder,
  canStop = false,
}: {
  reminder: UpcomingReminder;
  canStop?: boolean;
}) {
  const cancelMutation = useCancelReminderMutation();
  return (
    <li className="flex flex-wrap items-center gap-x-3 gap-y-1 py-2.5">
      <BellRing className="size-4 shrink-0 text-primary" aria-hidden />
      <div className="min-w-0 flex-1">
        <Link
          href={`/folders/${reminder.folderId}/items?itemId=${reminder.itemId}`}
          className="block truncate text-sm font-medium hover:underline"
        >
          {reminder.title}
        </Link>
        <p className="text-xs text-muted-foreground">Aviso em {reminder.whenLabel}</p>
      </div>
      {canStop ? (
        <ConfirmDialog
          trigger={
            <Button variant="ghost" size="sm" disabled={cancelMutation.isPending}>
              Não avisar
            </Button>
          }
          title="Tirar este aviso?"
          description={`“${reminder.title}” continua salvo; só o aviso de ${reminder.whenLabel} deixa de tocar.`}
          confirmLabel="Tirar o aviso"
          isLoading={cancelMutation.isPending}
          onConfirm={() => cancelMutation.mutate(reminder.reminderId)}
        />
      ) : null}
    </li>
  );
}

/** A reminder that repeats: what, how often and when it comes next. */
export function RecurringReminderRow({
  reminder,
  canStop = false,
}: {
  reminder: RecurringReminder;
  canStop?: boolean;
}) {
  const stopMutation = useStopRecurringReminderMutation();
  return (
    <li className="flex flex-wrap items-center gap-x-3 gap-y-1 py-2.5">
      <Repeat className="size-4 shrink-0 text-primary" aria-hidden />
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium">{reminder.title}</p>
        <p className="text-xs text-muted-foreground">
          {reminder.scheduleLabel}
          {reminder.nextOccurrenceLabel ? ` · próximo: ${reminder.nextOccurrenceLabel}` : ""}
        </p>
      </div>
      {canStop ? (
        <ConfirmDialog
          trigger={
            <Button variant="ghost" size="sm" disabled={stopMutation.isPending}>
              Parar de lembrar
            </Button>
          }
          title="Parar este lembrete?"
          description={`Você não vai mais ser lembrado de “${reminder.title}” (${reminder.scheduleLabel}). O que ele já criou continua salvo.`}
          confirmLabel="Parar de lembrar"
          isLoading={stopMutation.isPending}
          onConfirm={() => stopMutation.mutate(reminder.recurrenceId)}
        />
      ) : null}
    </li>
  );
}
