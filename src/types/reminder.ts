/** A one-off personal reminder that is still to go off ("me avisa às 19h da prova"). */
export interface UpcomingReminder {
  reminderId: string;
  itemId: string;
  folderId: string;
  title: string;
  at: string;
  /** Already in words: "quarta-feira, 04/11 às 19h". */
  whenLabel: string;
}

/** A reminder that repeats ("todo dia às 8h"). */
export interface RecurringReminder {
  recurrenceId: string;
  title: string;
  scheduleLabel: string;
  nextOccurrenceLabel: string | null;
}

/** `GET /workspaces/:workspaceId/reminders` — only the person's own reminders. */
export interface MyReminders {
  upcoming: UpcomingReminder[];
  recurring: RecurringReminder[];
}
