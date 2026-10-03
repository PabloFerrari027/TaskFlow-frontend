import type {
  AssistantChannelId,
  ChannelConversationEndReason,
} from "@/types/assistant-channel";

export const CHANNEL_LABEL: Record<AssistantChannelId, string> = {
  whatsapp: "WhatsApp",
};

export function channelLabel(channel: string) {
  return (CHANNEL_LABEL as Record<string, string>)[channel] ?? channel;
}

export const END_REASON_LABEL: Record<ChannelConversationEndReason, string> = {
  new_command: "Encerrada com “nova”",
  workspace_switch: "Workspace trocado",
  unlinked: "Número desvinculado",
  relinked: "Número vinculado de novo",
  idle: "Encerrada por inatividade",
};

/** "5511999998888" → "+55 11 99999-8888" (Brazilian numbers; others get only the "+"). */
export function formatPhone(digits: string) {
  const clean = digits.replace(/\D/g, "");
  const br = /^55(\d{2})(\d{4,5})(\d{4})$/.exec(clean);
  if (br) return `+55 ${br[1]} ${br[2]}-${br[3]}`;
  return clean ? `+${clean}` : digits;
}

/** wa.me link that opens a chat with TaskFlow's number. */
export function whatsappChatUrl(contact: string, text?: string) {
  const url = `https://wa.me/${contact.replace(/\D/g, "")}`;
  return text ? `${url}?text=${encodeURIComponent(text)}` : url;
}
