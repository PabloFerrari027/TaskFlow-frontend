import axios from "axios";
import type { ErrorCode } from "@/types/common";
import { isDomainError } from "@/types/common";

const ERROR_MESSAGES: Record<ErrorCode, string> = {
  INVALID_CREDENTIALS: "E-mail ou senha inválidos.",
  USER_ALREADY_EXISTS: "Já existe uma conta com este e-mail.",
  CHALLENGE_NOT_FOUND: "Sessão de verificação não encontrada. Faça login novamente.",
  CHALLENGE_EXPIRED: "O código expirou. Faça login novamente para receber um novo.",
  CHALLENGE_INVALID_CODE: "Código incorreto. Verifique e tente novamente.",
  CHALLENGE_MAX_ATTEMPTS_EXCEEDED:
    "Número máximo de tentativas excedido. Faça login novamente.",
  SESSION_NOT_FOUND: "Sua sessão não foi encontrada. Faça login novamente.",
  SESSION_EXPIRED: "Sua sessão expirou. Faça login novamente.",
  USER_NOT_FOUND: "Usuário não encontrado.",
  USER_ALREADY_CLOSED: "Esta conta já foi encerrada.",
  INVALID_USER_PHOTO: "Use uma imagem JPEG, PNG ou WebP de até 5MB.",
  USER_PHOTO_NOT_FOUND: "Este usuário não tem foto de perfil.",
  EMAIL_NOT_VERIFIED: "Confirme seu e-mail antes de entrar.",
  EMAIL_ALREADY_VERIFIED: "Este e-mail já foi verificado.",
  EMAIL_VERIFICATION_NOT_FOUND:
    "Nenhuma verificação pendente encontrada. Solicite um novo código.",
  EMAIL_VERIFICATION_EXPIRED: "O código expirou. Solicite um novo código.",
  EMAIL_VERIFICATION_INVALID_CODE: "Código incorreto. Verifique e tente novamente.",
  EMAIL_VERIFICATION_MAX_ATTEMPTS_EXCEEDED:
    "Número máximo de tentativas excedido. Solicite um novo código.",
  TOO_MANY_VERIFICATION_REQUESTS:
    "Muitas solicitações de código. Aguarde alguns minutos e tente novamente.",
  WORKSPACE_NOT_FOUND: "Workspace não encontrado.",
  FORBIDDEN_WORKSPACE_ACTION: "Você não tem permissão para realizar esta ação.",
  MEMBER_ALREADY_EXISTS: "Este usuário já é membro.",
  MEMBER_NOT_FOUND: "Membro não encontrado.",
  LAST_OWNER_CANNOT_BE_REMOVED:
    "Não é possível remover ou rebaixar o único proprietário do workspace.",
  WORKSPACE_NOT_EMPTY:
    "Remova os demais membros antes de excluir o workspace.",
  INVITATION_NOT_FOUND: "Convite não encontrado.",
  INVITATION_ALREADY_PROCESSED: "Este convite já foi processado.",
  INVITATION_EXPIRED: "Este convite expirou.",
  INVITATION_EMAIL_MISMATCH:
    "Este convite foi enviado para outro e-mail. Entre com a conta correta.",
  FOLDER_NOT_FOUND: "Pasta não encontrada.",
  ITEM_NOT_FOUND: "Item não encontrado.",
  BULK_BATCH_TOO_LARGE: "Muitos itens de uma vez. Faça a ação em grupos menores.",
  ATTACHMENT_NOT_FOUND: "Anexo não encontrado.",
  INVALID_ITEM_COVER: "Use uma imagem JPEG, PNG ou WebP de até 10MB.",
  ITEM_COVER_NOT_FOUND: "Este item não tem capa.",
  SUBITEM_FOLDER_MISMATCH: "O subitem precisa pertencer à mesma pasta do item pai.",
  ITEM_HAS_PENDING_SUBITEMS:
    "Conclua ou finalize os subitens pendentes antes de concluir este item.",
  SECTION_NOT_FOUND: "Coluna não encontrada.",
  SECTION_FOLDER_MISMATCH: "A coluna precisa pertencer à mesma pasta do item.",
  DEFAULT_SECTION_NOT_DELETABLE: "A coluna padrão da pasta não pode ser apagada.",
  SECTION_NOT_EMPTY: "Mova ou apague os itens desta coluna antes de excluí-la.",
  CANNOT_BE_OWN_PARENT: "Um item não pode ser pai dele mesmo.",
  CANNOT_MOVE_INTO_OWN_DESCENDANT:
    "Não é possível mover um item para dentro de um dos seus próprios descendentes.",
  PARENT_OUT_OF_SCOPE:
    "O destino precisa estar no mesmo escopo do item (workspace, pasta ou item).",
  PARENT_FOLDER_ARCHIVED: "Não é possível colocar uma pasta dentro de uma pasta arquivada.",
  FOLDER_HAS_CHILDREN:
    "Esta pasta tem subpastas. Mova ou arquive as subpastas primeiro.",
  SECTION_HAS_CHILDREN:
    "Esta coluna tem subseções. Mova ou apague as subseções antes de excluí-la.",
  COMMENT_HAS_CHILDREN: "Apague as respostas deste comentário antes de apagá-lo.",
  ASSIGNEE_NOT_FOLDER_MEMBER: "Esta pessoa não tem acesso à pasta e não pode ser responsável pelo item.",
  MENTIONED_USER_NOT_FOLDER_MEMBER:
    "Alguém que você mencionou não tem acesso à pasta. Remova a menção ou convide a pessoa primeiro.",
  CUSTOM_FIELD_NOT_FOUND: "Campo customizado não encontrado.",
  CUSTOM_FIELD_VALUE_INVALID: "Valor incompatível com o tipo deste campo.",
  SYNC_VERSION_CONFLICT: "Este item foi alterado por outra pessoa. Atualize e tente novamente.",
  CLIENT_NOT_FOUND: "Cliente não encontrado.",
  CANNOT_MODIFY_OWN_ACCOUNT: "Você não pode realizar esta ação na própria conta.",
  COMMENT_NOT_FOUND: "Comentário não encontrado.",
  COMMENT_CONTENT_INVALID: "Escreva um comentário de até 5000 caracteres.",
  COMMENT_AUTHOR_MISMATCH: "Você só pode apagar os seus próprios comentários.",
  INVALID_ANALYTICS_QUERY: "Não foi possível montar este gráfico com os dados disponíveis.",
  // Frequency limits, not the plan's token quota (API.md § 1.4) — the wording
  // keeps the two apart.
  AI_ASSISTANT_RATE_LIMIT_EXCEEDED:
    "Muitas perguntas em pouco tempo. Aguarde um pouco e tente de novo — isso não tem a ver com o limite do seu plano.",
  AI_ASSISTANT_TRANSLATION_FAILED: "Não consegui falar com o assistente agora, tente novamente.",
  PENDING_ACTION_NOT_FOUND: "Essa ação não está mais disponível.",
  PENDING_ACTION_EXPIRED: "Essa ação expirou. Peça de novo pelo chat.",
  REAUTHENTICATION_REQUIRED: "Senha incorreta ou reautenticação necessária.",
  ASSISTANT_DISABLED_FOR_WORKSPACE:
    "O assistente está desligado neste workspace. Peça a um OWNER para habilitá-lo.",
  ASSISTANT_ATTACHMENT_TOO_LARGE: "Um dos arquivos excede o limite de 20MB.",
  ASSISTANT_ATTACHMENTS_TOO_LARGE:
    "A soma dos anexos excede o limite permitido. Envie menos arquivos ou arquivos menores.",
  ASSISTANT_TOO_MANY_ATTACHMENTS: "Você pode anexar no máximo 6 arquivos por mensagem.",
  ASSISTANT_AUDIO_TOO_LONG: "O áudio é muito longo. Envie uma gravação de até 10 minutos.",
  ASSISTANT_TRANSCRIPTION_FAILED:
    "Não consegui transcrever o áudio agora. Tente enviar de novo.",
  ASSISTANT_EMPTY_TRANSCRIPTION:
    "Não entendi nenhuma fala no áudio. Grave de novo ou escreva sua mensagem.",
  AI_TRANSLATION_FAILED: "Não consegui processar sua pergunta agora, tente novamente.",
  AI_INSUFFICIENT_CREDITS:
    "A IA está indisponível no momento por falta de créditos do serviço. Avise o administrador da plataforma.",
  AI_RATE_LIMIT_EXCEEDED:
    "Muitas perguntas em pouco tempo. Aguarde um pouco e tente de novo — isso não tem a ver com o limite do seu plano.",
  ACCOUNT_HAS_NO_PASSWORD:
    "Sua conta ainda não tem senha. Defina uma senha em vez de alterá-la.",
  CURRENT_PASSWORD_INCORRECT: "A senha atual está incorreta.",
  ACCOUNT_ALREADY_HAS_PASSWORD:
    "Sua conta já tem uma senha. Use a opção de alterar senha.",
  NO_IDENTITY_METHOD_AVAILABLE:
    "Sua conta não tem um método disponível para confirmar sua identidade.",
  INVALID_GOOGLE_TOKEN:
    "Não foi possível confirmar sua identidade com o Google, tente novamente.",
  GOOGLE_ACCOUNT_ALREADY_LINKED:
    "Essa conta Google já está vinculada a outra conta TaskFlow.",
  INVALID_PASSWORD_RESET_TOKEN:
    "Este link de redefinição é inválido, expirou ou já foi usado. Peça um novo.",
  TOO_MANY_PASSWORD_RESET_REQUESTS:
    "Muitos pedidos de redefinição. Aguarde alguns minutos e tente novamente.",
  INVALID_AUTOMATION_TRIGGER:
    "O evento ou as condições escolhidos não podem disparar uma automação.",
  INVALID_AUTOMATION_ACTION:
    "A ação escolhida não pode rodar neste evento ou tem valores inválidos.",
  AUTOMATION_RULE_NOT_FOUND: "Automação não encontrada.",
  AI_USAGE_INVALID_RANGE: "O período escolhido é inválido. Use no máximo 90 dias.",
  API_KEY_NOT_FOUND: "Chave de API não encontrada.",
  INVALID_API_KEY_SCOPE: "Um dos escopos escolhidos não é válido.",
  WEBHOOK_ENDPOINT_NOT_FOUND: "Endpoint de webhook não encontrado.",
  WEBHOOK_DELIVERY_NOT_FOUND: "Entrega não encontrada.",
  WEBHOOK_ENDPOINT_URL_NOT_ALLOWED:
    "Essa URL não pode ser usada: precisa ser https:// e não pode apontar para um endereço privado ou local.",
  INVALID_WEBHOOK_EVENT: "Um dos eventos escolhidos não é válido.",
  PLAN_NOT_FOUND: "Plano não encontrado.",
  PLAN_NAME_ALREADY_EXISTS: "Já existe um plano com este nome.",
  // The API doesn't say whether the day, week or month cap was hit (§ 23), so
  // the message doesn't name one.
  TOKEN_QUOTA_EXCEEDED:
    "O limite de uso de IA do seu plano foi atingido. Ele libera sozinho quando o período de uso reiniciar; se precisar de mais, dá para trocar de plano em Configurações → Plano.",
  DASHBOARD_PAGE_NOT_FOUND: "Página não encontrada.",
  CHART_DEFINITION_NOT_FOUND: "Gráfico não encontrado.",
  PAGE_ACCESS_GRANT_NOT_FOUND: "Este acesso não existe mais.",
  INVALID_ACCESS_GRANT_TARGET: "Escolha um membro deste workspace ou informe um e-mail válido.",
  ACCESS_GRANT_EMAIL_RATE_LIMIT:
    "Você convidou muitas pessoas por e-mail em pouco tempo. Tente novamente em 1 hora.",
  PAGE_ACCESS_TOKEN_INVALID: "Este link não é válido ou foi revogado.",
  INVALID_CHART_DEFINITION: "Este gráfico não pode ser montado com as opções escolhidas.",
  FOLDER_TEMPLATE_NOT_FOUND: "Este modelo não está mais disponível.",
  INVALID_FOLDER_TEMPLATE_SKELETON: "O modelo tem um problema que impede salvá-lo.",
  INVALID_FOLDER_TEMPLATE_CATEGORY: "Escolha uma das categorias da lista.",
  ACCOUNT_ALREADY_HAS_GOOGLE:
    "Sua conta já tem uma conta Google vinculada.",
  INVALID_USER_NAME:
    "O nome precisa ter entre 1 e 100 caracteres.",
  TOO_MANY_PASSWORD_ATTEMPTS:
    "Muitas tentativas de senha. Aguarde alguns minutos e tente novamente.",
  REALTIME_TICKET_INVALID:
    "A conexão em tempo real expirou. Recarregue a página.",
  SYNC_BATCH_TOO_LARGE:
    "Muitas alterações pendentes de uma vez. Tente sincronizar novamente.",
  UNSUPPORTED_DERIVED_METRIC:
    "Este indicador não está disponível.",
  INVALID_ITEM_SCHEDULE:
    "A data de início precisa ser antes do prazo (ou no mesmo dia).",
  ITEM_NOT_IN_TRASH:
    "Este item não está na lixeira.",
  ITEM_PARENT_IN_TRASH:
    "O item principal deste subitem também está na lixeira. Restaure-o primeiro.",
  INVALID_ITEM_DEPENDENCY:
    "Essa ligação não pode ser feita. Escolha outro item da mesma pasta.",
  ITEM_DEPENDENCY_CYCLE:
    "Isso criaria um ciclo: um item acabaria esperando por ele mesmo.",
  ITEM_DEPENDENCY_NOT_FOUND:
    "Essa ligação entre itens não existe mais.",
  ITEM_HAS_OPEN_BLOCKERS:
    "Este item ainda depende de outros que não foram concluídos.",
  WORKFLOW_STATUS_NOT_FOUND:
    "Esta etapa não existe mais.",
  INVALID_WORKFLOW_STATUS:
    "Confira o nome e a cor da etapa.",
  LAST_STATUS_OF_CATEGORY:
    "A pasta precisa de pelo menos uma etapa de cada tipo (a fazer, em andamento e concluída).",
  COMMENT_EDIT_NOT_ALLOWED:
    "Só quem escreveu o comentário pode editá-lo.",
  INVALID_COMMENT_REACTION:
    "Escolha um único emoji para reagir.",
  NOTIFICATION_NOT_FOUND:
    "Esta notificação não existe mais.",
  INVALID_SEARCH_QUERY:
    "Digite pelo menos uma palavra para buscar.",
  INVALID_ITEM_RECURRENCE:
    "Confira a repetição: dias, horário, datas e os campos escolhidos.",
  ITEM_RECURRENCE_NOT_FOUND:
    "Este item repetido não existe mais.",
  ITEM_RECURRENCE_LIMIT_REACHED:
    "A pasta já tem 50 itens repetidos, que é o máximo.",
  TIME_ENTRY_NOT_FOUND:
    "Este registro de tempo não existe mais.",
  INVALID_TIME_ENTRY:
    "Confira o horário de início e a duração (até 24 horas).",
  NO_RUNNING_TIMER:
    "Não há nenhum cronômetro rodando.",
  SAVED_VIEW_NOT_FOUND:
    "Esta visão salva não existe mais.",
  INVALID_SAVED_VIEW:
    "Não foi possível salvar a visão com essas opções.",
  INTAKE_FORM_NOT_FOUND:
    "Este formulário não existe ou o link foi trocado.",
  INVALID_INTAKE_FORM:
    "O formulário tem um problema. Confira os campos.",
  INVALID_FORM_SUBMISSION:
    "Confira as respostas do formulário.",
  ITEM_APPROVAL_NOT_FOUND:
    "Este pedido de aprovação não existe mais.",
  INVALID_ITEM_APPROVAL:
    "Este pedido de aprovação não pode ser feito.",
  ITEM_APPROVAL_CLOSED:
    "Este pedido de aprovação já foi respondido ou cancelado.",
  INVALID_IMPORT_FILE:
    "Não foi possível ler o arquivo. Use uma planilha CSV ou um arquivo JSON exportado do TaskFlow.",
  IMPORT_HAS_ERRORS:
    "Algumas linhas têm problemas. Corrija o arquivo ou importe só as linhas válidas.",
  DATA_EXPORT_NOT_FOUND:
    "Esta exportação não existe mais.",
  DATA_EXPORT_NOT_READY:
    "A exportação ainda não está pronta para baixar.",
  INVALID_TEMPLATE_INSTANTIATION:
    "Confira as escolhas do modelo: campos obrigatórios, pessoas e datas.",
  TEMPLATE_INSTANTIATION_NOT_FOUND:
    "Não encontramos a criação desta pasta.",
  INVALID_TEMPLATE_MEDIA:
    "Use uma imagem JPEG, PNG ou WebP.",
  INVALID_FOLDER_TEMPLATE_LISTING:
    "Confira as informações do modelo.",
  TEMPLATE_AI_RATE_LIMIT_EXCEEDED:
    "Muitos pedidos à IA em pouco tempo. Aguarde um pouco e tente de novo.",
  TEMPLATE_AI_GENERATION_FAILED:
    "A IA não conseguiu montar um modelo agora. Tente de novo.",
  COUPON_NOT_FOUND: "Cupom não encontrado.",
  COUPON_CODE_ALREADY_EXISTS: "Já existe um cupom com este código.",
  INVALID_COUPON: "Confira as regras do cupom.",
  COUPON_EXPIRED: "Este cupom expirou.",
  COUPON_NOT_YET_VALID: "Este cupom ainda não está valendo.",
  COUPON_NOT_APPLICABLE_TO_PLAN: "Este cupom não vale para este plano.",
  COUPON_REDEMPTION_LIMIT_REACHED: "Este cupom já atingiu o limite de usos.",
  COUPON_ALREADY_REDEEMED: "Você já usou este cupom.",
  COUPON_HAS_REDEMPTIONS: "Este cupom já foi usado e não pode ser apagado. Desative-o.",
  ASSISTANT_CHANNEL_NOT_FOUND: "Este canal não existe.",
  ASSISTANT_CHANNEL_UNAVAILABLE: "Este canal está indisponível no momento.",
  INVALID_CHANNEL_ADDRESS: "Número inválido. Use o número com DDD (e o código do país, se não for do Brasil).",
  ASSISTANT_CHANNEL_WORKSPACE_NOT_FOUND: "Workspace não encontrado.",
  TOO_MANY_CHANNEL_VERIFICATION_REQUESTS:
    "Muitos códigos pedidos em pouco tempo. Aguarde um pouco e tente de novo.",
  CHANNEL_DELIVERY_FAILED:
    "Não conseguimos enviar o código para este número. Confira se ele tem WhatsApp.",
  CHANNEL_VERIFICATION_NOT_FOUND: "O código expirou ou já foi usado. Peça um novo.",
  CHANNEL_VERIFICATION_INVALID_CODE: "Código incorreto. Confira e tente de novo.",
  CHANNEL_VERIFICATION_MAX_ATTEMPTS_EXCEEDED: "Tentativas esgotadas. Peça um novo código.",
  ASSISTANT_CHANNEL_LINK_NOT_FOUND: "Nenhum número vinculado a este canal.",
  ASSISTANT_CHANNEL_CONVERSATION_NOT_FOUND: "Conversa não encontrada.",
  ITEM_NOT_MOVABLE_TO_FOLDER:
    "Só dá para levar para outra pasta (do mesmo workspace) um item solto: sem ser subitem, sem subitens, sem dependências e sem campos personalizados preenchidos.",
  CAPTURE_NOT_FOUND: "Não há nada recente para desfazer ou mudar de lugar. Pode ter passado tempo demais.",
  CAPTURE_DESTINATION_NOT_FOUND: "Não encontramos uma pasta com esse nome.",
  CAPTURE_NOTHING_TO_SAVE: "Não há nada escrito para guardar.",
  INVALID_ASSISTANT_PREFERRED_NAME:
    "Use só o seu nome, com até 40 letras (espaços, apóstrofos, hífens e pontos valem).",
  BILLING_NOT_CONFIGURED: "Pagamentos estão indisponíveis no momento. Tente mais tarde.",
  INVALID_BILLING_WEBHOOK: "Não foi possível confirmar o pagamento.",
  PLAN_REQUIRES_CHECKOUT: "Este plano é pago. Assine pelo botão de pagamento.",
  PLAN_NOT_PURCHASABLE: "Este plano é gratuito e não precisa de pagamento.",
  SUBSCRIPTION_ALREADY_ACTIVE: "Você já tem uma assinatura ativa. Troque de plano por ela.",
  NO_ACTIVE_SUBSCRIPTION: "Você não tem uma assinatura ativa.",
  ALREADY_ON_PLAN: "Sua assinatura já está neste plano.",
  CHECKOUT_ALREADY_COMPLETED: "Seu pagamento anterior acabou de ser aprovado. A assinatura está sendo ativada.",
  CHECKOUT_IN_PROGRESS: "Já estamos abrindo um pagamento para você. Aguarde um instante e tente de novo.",
  SUBSCRIPTION_NOT_SCHEDULED_TO_CANCEL: "Sua assinatura não está marcada para cancelar.",
  BILLING_ACCOUNT_NOT_FOUND: "Você ainda não tem dados de cobrança. Assine um plano primeiro.",
  // Sent as the final `error` frame of the assistant's chat stream, whose
  // server-side messages are in English.
  REQUEST_TIMEOUT: "O assistente demorou demais para responder. Tente de novo.",
  INTERNAL_ERROR: "Algo deu errado. Tente novamente em instantes.",
};

const DEFAULT_MESSAGE = "Algo deu errado. Tente novamente em instantes.";
const NETWORK_MESSAGE =
  "Não foi possível conectar ao servidor. Verifique sua conexão e tente novamente.";

const RATE_LIMIT_MESSAGE = "Muitas requisições em pouco tempo. Aguarde alguns segundos e tente novamente.";

export function getMessageForCode(code: ErrorCode): string {
  return ERROR_MESSAGES[code];
}

// A per-item error of a bulk call carries a plain `code` string, which may be
// one this client doesn't know (e.g. `INTERNAL_ERROR`) — fall back to the
// server's own message, then to the generic one.
export function getBulkItemErrorMessage(error: { code: string; message?: string }): string {
  return ERROR_MESSAGES[error.code as ErrorCode] ?? error.message ?? DEFAULT_MESSAGE;
}

export function getErrorMessage(error: unknown): string {
  if (axios.isAxiosError(error)) {
    if (!error.response) return NETWORK_MESSAGE;

    if (error.response.status === 429 && !isDomainError(error.response.data)) {
      return RATE_LIMIT_MESSAGE;
    }

    const data: unknown = error.response.data;
    if (isDomainError(data)) {
      return ERROR_MESSAGES[data.code] ?? data.message ?? DEFAULT_MESSAGE;
    }

    if (
      typeof data === "object" &&
      data !== null &&
      "message" in data &&
      (data as Record<string, unknown>).message
    ) {
      const message = (data as Record<string, unknown>).message;
      if (Array.isArray(message)) return message.join(" ");
      if (typeof message === "string") return message;
    }
  }

  if (error instanceof Error) return error.message;
  return DEFAULT_MESSAGE;
}

// The server's own text, untranslated — for the few errors whose message
// carries detail no pt-BR mapping can (e.g. which skeleton item is invalid).
export function getServerErrorMessage(error: unknown): string | null {
  if (axios.isAxiosError(error) && isDomainError(error.response?.data)) {
    return error.response.data.message || null;
  }
  return null;
}

// Pages backed by an OWNER/ADMIN- or SUPER_ADMIN-only endpoint redirect to
// /403 on this, so components don't reach for axios themselves.
export function isForbiddenError(error: unknown): boolean {
  return axios.isAxiosError(error) && error.response?.status === 403;
}

export function getErrorCode(error: unknown): ErrorCode | null {
  if (axios.isAxiosError(error) && isDomainError(error.response?.data)) {
    return error.response.data.code;
  }
  return null;
}
