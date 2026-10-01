import type { NotificationType } from "@/types/notification";

// Settings copy: what each kind of notice is about, in plain words.
export const NOTIFICATION_TYPE_LABEL: Record<NotificationType, { title: string; description: string }> = {
  MENTION: { title: "Menções", description: "Quando alguém cita você com @ numa tarefa ou comentário." },
  TASK_ASSIGNED: { title: "Tarefas para você", description: "Quando você vira responsável por uma tarefa." },
  TASK_COMMENTED: { title: "Comentários", description: "Quando comentam numa tarefa em que você está." },
  TASK_STATUS_CHANGED: {
    title: "Mudanças de status",
    description: "Quando uma tarefa sua muda de status.",
  },
  TASK_DUE_SOON: { title: "Prazo chegando", description: "Um lembrete antes do prazo das suas tarefas." },
  TASK_OVERDUE: { title: "Prazo vencido", description: "Quando uma tarefa sua passa do prazo." },
  TASK_UNBLOCKED: {
    title: "Tarefa liberada",
    description: "Quando as tarefas das quais a sua depende terminam e você já pode começar.",
  },
  APPROVAL_REQUESTED: {
    title: "Pedidos de aprovação",
    description: "Quando alguém pede para você aprovar uma tarefa.",
  },
  APPROVAL_DECIDED: {
    title: "Respostas de aprovação",
    description: "Quando um pedido de aprovação seu é aprovado ou recusado.",
  },
};
