import { z } from "zod";

// Same limits as the backend's LogTimeEntryDto / TimeEntry: 1–1440 minutes,
// a note of up to 500 characters, and an entry can't end in the future.
// The inputs are strings (date/time/number fields); `toLogTimeEntryRequest`
// turns valid values into the API payload.
export const logTimeEntrySchema = z
  .object({
    date: z.string().min(1, "Informe o dia."),
    time: z.string().min(1, "Informe a hora em que começou."),
    hours: z.string(),
    minutes: z.string(),
    note: z.string().max(500, "A observação pode ter até 500 caracteres."),
  })
  .superRefine((values, ctx) => {
    const total = durationMinutes(values);
    if (!Number.isFinite(total) || total < 1) {
      ctx.addIssue({ code: "custom", path: ["hours"], message: "Informe quanto tempo levou (pelo menos 1 minuto)." });
      return;
    }
    if (total > 1440) {
      ctx.addIssue({ code: "custom", path: ["hours"], message: "Um registro pode ter no máximo 24 horas." });
      return;
    }
    if (values.date && values.time) {
      const end = startDate(values).getTime() + total * 60_000;
      if (end > Date.now()) {
        ctx.addIssue({ code: "custom", path: ["time"], message: "O registro não pode terminar no futuro." });
      }
    }
  });

export type LogTimeEntryFormValues = z.infer<typeof logTimeEntrySchema>;

function durationMinutes(values: Pick<LogTimeEntryFormValues, "hours" | "minutes">) {
  return Math.round(Number(values.hours || 0) * 60 + Number(values.minutes || 0));
}

// The person types their own local start time.
function startDate(values: Pick<LogTimeEntryFormValues, "date" | "time">) {
  return new Date(`${values.date}T${values.time}:00`);
}

export function toLogTimeEntryRequest(values: LogTimeEntryFormValues) {
  return {
    startedAt: startDate(values).toISOString(),
    durationMinutes: durationMinutes(values),
    note: values.note.trim() || undefined,
  };
}
