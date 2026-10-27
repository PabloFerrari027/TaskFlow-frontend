"use client";

import Link from "next/link";
import { Bell } from "lucide-react";
import { Card, CardAction, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useMyRemindersQuery } from "@/features/reminders/hooks/use-reminders";
import {
  RecurringReminderRow,
  UpcomingReminderRow,
} from "@/features/reminders/components/reminder-lists";

const SHOWN = 4;

/** "Meus lembretes" on the home page: the next one-off reminders first, then the repeating ones. */
export function MyRemindersCard() {
  const remindersQuery = useMyRemindersQuery();

  if (remindersQuery.isLoading) return <Skeleton className="h-40 w-full" />;
  if (remindersQuery.isError) return null;

  const upcoming = remindersQuery.data?.upcoming ?? [];
  const recurring = remindersQuery.data?.recurring ?? [];
  const total = upcoming.length + recurring.length;
  const shownUpcoming = upcoming.slice(0, SHOWN);
  const shownRecurring = recurring.slice(0, Math.max(0, SHOWN - shownUpcoming.length));

  return (
    <Card data-tour="home-reminders">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Bell className="size-4" aria-hidden /> Meus lembretes
        </CardTitle>
        {total === 0 ? (
          <CardDescription>
            Nenhum lembrete. Peça ao assistente: “me lembra de tomar o remédio todo dia às 8h”.
          </CardDescription>
        ) : null}
        {total > 0 ? (
          <CardAction>
            <Link href="/reminders" className="text-sm font-medium text-primary hover:underline">
              Ver todos{total > SHOWN ? ` (${total})` : ""}
            </Link>
          </CardAction>
        ) : null}
      </CardHeader>
      {total > 0 ? (
        <CardContent>
          <ul className="divide-y">
            {shownUpcoming.map((reminder) => (
              <UpcomingReminderRow key={reminder.reminderId} reminder={reminder} />
            ))}
            {shownRecurring.map((reminder) => (
              <RecurringReminderRow key={reminder.recurrenceId} reminder={reminder} />
            ))}
          </ul>
        </CardContent>
      ) : null}
    </Card>
  );
}
