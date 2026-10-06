import type { NotificationType } from "@/types/notification";

// Settings copy: what each kind of notice is about, in plain words.
export const NOTIFICATION_TYPE_LABEL: Record<NotificationType, { title: string; description: string }> = {
  MENTION: { title: "Menções", description: "Quando alguém cita você com @ num item ou comentário." },
  ITEM_ASSIGNED: { title: "Itens para você", description: "Quando você vira responsável por um item." },
  ITEM_COMMENTED: { title: "Comentários", description: "Quando comentam num item em que você está." },
  ITEM_STATUS_CHANGED: {
    title: "Mudanças de status",
    description: "Quando um item seu muda de status.",
  },
  ITEM_DUE_SOON: { title: "Prazo chegando", description: "Um lembrete antes do prazo dos seus itens." },
  ITEM_OVERDUE: { title: "Prazo vencido", description: "Quando um item seu passa do prazo." },
  ITEM_UNBLOCKED: {
    title: "Item liberado",
    description: "Quando os itens dos quais o seu depende terminam e você já pode começar.",
  },
  APPROVAL_REQUESTED: {
    title: "Pedidos de aprovação",
    description: "Quando alguém pede para você aprovar um item.",
  },
  APPROVAL_DECIDED: {
    title: "Respostas de aprovação",
    description: "Quando um pedido de aprovação seu é aprovado ou recusado.",
  },
};
