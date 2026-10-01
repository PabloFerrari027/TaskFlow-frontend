import type { RecurrenceSchedule } from "@/types/recurrence";

export const WEEKDAYS = [
  { value: 0, short: "D", long: "domingo" },
  { value: 1, short: "S", long: "segunda" },
  { value: 2, short: "T", long: "terça" },
  { value: 3, short: "Q", long: "quarta" },
  { value: 4, short: "Q", long: "quinta" },
  { value: 5, short: "S", long: "sexta" },
  { value: 6, short: "S", long: "sábado" },
];

export const MONTH_NAMES = [
  "janeiro", "fevereiro", "março", "abril", "maio", "junho",
  "julho", "agosto", "setembro", "outubro", "novembro", "dezembro",
];

export const OCCURRENCE_PLACEHOLDERS = [
  { token: "{{occurrence.date}}", label: "Data", example: "05/10/2026" },
  { token: "{{occurrence.weekday}}", label: "Dia da semana", example: "segunda-feira" },
  { token: "{{occurrence.month}}", label: "Mês", example: "outubro" },
  { token: "{{occurrence.year}}", label: "Ano", example: "2026" },
];

export function browserTimezone() {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone || "America/Sao_Paulo";
  } catch {
    return "America/Sao_Paulo";
  }
}

function joinList(items: string[]) {
  if (items.length <= 1) return items.join("");
  return `${items.slice(0, -1).join(", ")} e ${items[items.length - 1]}`;
}

/** "Toda semana, na segunda e na quarta, às 09:00" — the schedule in one sentence. */
export function describeSchedule(schedule: RecurrenceSchedule) {
  const n = schedule.interval ?? 1;
  const at = `às ${schedule.time}`;
  switch (schedule.frequency) {
    case "DAILY":
      return n === 1 ? `Todo dia ${at}` : `A cada ${n} dias ${at}`;
    case "WEEKLY": {
      const days = [...(schedule.daysOfWeek ?? [])]
        .sort((a, b) => a - b)
        .map((d) => WEEKDAYS[d]?.long ?? "");
      const lead = n === 1 ? "Toda semana" : `A cada ${n} semanas`;
      return `${lead}${days.length ? `, ${joinList(days)}` : ""}, ${at}`;
    }
    case "MONTHLY": {
      const day = schedule.dayOfMonth === 31 ? "no último dia" : `no dia ${schedule.dayOfMonth ?? 1}`;
      return `${n === 1 ? "Todo mês" : `A cada ${n} meses`}, ${day}, ${at}`;
    }
    case "YEARLY": {
      const month = MONTH_NAMES[(schedule.month ?? 1) - 1];
      return `${n === 1 ? "Todo ano" : `A cada ${n} anos`}, em ${schedule.dayOfMonth ?? 1} de ${month}, ${at}`;
    }
  }
}

const occurrenceFormatter = new Intl.DateTimeFormat("pt-BR", {
  weekday: "short",
  day: "2-digit",
  month: "2-digit",
  hour: "2-digit",
  minute: "2-digit",
});

/** An occurrence instant shown in the viewer's own clock: "sáb., 03/10, 09:00". */
export function formatOccurrence(iso: string) {
  return occurrenceFormatter.format(new Date(iso));
}
