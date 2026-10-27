"use client";

import { Bell } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { PageHeader } from "@/components/shared/page-header";
import { EmptyState } from "@/components/shared/empty-state";
import { ErrorState } from "@/components/shared/error-state";
import { useMyRemindersQuery } from "@/features/reminders/hooks/use-reminders";
import {
  RecurringReminderRow,
  UpcomingReminderRow,
} from "@/features/reminders/components/reminder-lists";

// Every reminder of the person, from every folder, in one place.
export default function RemindersPage() {
  const remindersQuery = useMyRemindersQuery();
  const upcoming = remindersQuery.data?.upcoming ?? [];
  const recurring = remindersQuery.data?.recurring ?? [];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Meus lembretes"
        description="Os avisos que você pediu, de todas as pastas. Só você vê esta lista."
      />

      {remindersQuery.isLoading ? (
        <Skeleton className="h-48 w-full" />
      ) : remindersQuery.isError ? (
        <ErrorState error={remindersQuery.error} onRetry={() => remindersQuery.refetch()} />
      ) : upcoming.length + recurring.length === 0 ? (
        <EmptyState
          icon={<Bell className="size-6" />}
          title="Nenhum lembrete ainda"
          description="Peça ao assistente, do seu jeito: “me lembra de pagar a luz todo dia 10” ou “me avisa às 19h da prova”."
        />
      ) : (
        <div className="grid gap-6 lg:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Próximos avisos</CardTitle>
              <CardDescription>Avisos que tocam uma vez, do mais próximo ao mais distante.</CardDescription>
            </CardHeader>
            <CardContent>
              {upcoming.length === 0 ? (
                <p className="text-sm text-muted-foreground">Nenhum aviso marcado.</p>
              ) : (
                <ul className="divide-y">
                  {upcoming.map((reminder) => (
                    <UpcomingReminderRow key={reminder.reminderId} reminder={reminder} canStop />
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Lembretes que se repetem</CardTitle>
              <CardDescription>Voltam sozinhos nos dias e horários combinados.</CardDescription>
            </CardHeader>
            <CardContent>
              {recurring.length === 0 ? (
                <p className="text-sm text-muted-foreground">Nenhum lembrete que se repete.</p>
              ) : (
                <ul className="divide-y">
                  {recurring.map((reminder) => (
                    <RecurringReminderRow key={reminder.recurrenceId} reminder={reminder} canStop />
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
