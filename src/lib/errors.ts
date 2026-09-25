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
  PROJECT_NOT_FOUND: "Projeto não encontrado.",
  TASK_NOT_FOUND: "Tarefa não encontrada.",
  BULK_BATCH_TOO_LARGE: "Muitas tarefas de uma vez. Faça a ação em grupos menores.",
  ATTACHMENT_NOT_FOUND: "Anexo não encontrado.",
  INVALID_TASK_COVER: "Use uma imagem JPEG, PNG ou WebP de até 10MB.",
  TASK_COVER_NOT_FOUND: "Esta tarefa não tem capa.",
  SUBTASK_PROJECT_MISMATCH: "A subtarefa precisa pertencer ao mesmo projeto da tarefa pai.",
  TASK_HAS_PENDING_SUBTASKS:
    "Conclua ou finalize as subtarefas pendentes antes de concluir esta tarefa.",
  SECTION_NOT_FOUND: "Coluna não encontrada.",
  SECTION_PROJECT_MISMATCH: "A coluna precisa pertencer ao mesmo projeto da tarefa.",
  DEFAULT_SECTION_NOT_DELETABLE: "A coluna padrão do projeto não pode ser apagada.",
  SECTION_NOT_EMPTY: "Mova ou apague as tarefas desta coluna antes de excluí-la.",
  CANNOT_BE_OWN_PARENT: "Um item não pode ser pai dele mesmo.",
  CANNOT_MOVE_INTO_OWN_DESCENDANT:
    "Não é possível mover um item para dentro de um dos seus próprios descendentes.",
  PARENT_OUT_OF_SCOPE:
    "O destino precisa estar no mesmo escopo do item (workspace, projeto ou tarefa).",
  PARENT_PROJECT_ARCHIVED: "Não é possível colocar um projeto dentro de um projeto arquivado.",
  PROJECT_HAS_CHILDREN:
    "Este projeto tem sub-projetos. Mova ou arquive os sub-projetos primeiro.",
  SECTION_HAS_CHILDREN:
    "Esta coluna tem subseções. Mova ou apague as subseções antes de excluí-la.",
  COMMENT_HAS_CHILDREN: "Apague as respostas deste comentário antes de apagá-lo.",
  ASSIGNEE_NOT_PROJECT_MEMBER: "Esta pessoa não tem acesso ao projeto e não pode ser responsável pela tarefa.",
  MENTIONED_USER_NOT_PROJECT_MEMBER:
    "Alguém que você mencionou não tem acesso ao projeto. Remova a menção ou convide a pessoa primeiro.",
  CUSTOM_FIELD_NOT_FOUND: "Campo customizado não encontrado.",
  CUSTOM_FIELD_VALUE_INVALID: "Valor incompatível com o tipo deste campo.",
  SYNC_VERSION_CONFLICT: "Este item foi alterado por outra pessoa. Atualize e tente novamente.",
  CLIENT_NOT_FOUND: "Cliente não encontrado.",
  CANNOT_MODIFY_OWN_ACCOUNT: "Você não pode realizar esta ação na própria conta.",
  COMMENT_NOT_FOUND: "Comentário não encontrado.",
  COMMENT_CONTENT_INVALID: "Escreva um comentário de até 5000 caracteres.",
  COMMENT_AUTHOR_MISMATCH: "Você só pode apagar os seus próprios comentários.",
  INVALID_ANALYTICS_QUERY: "Não foi possível montar este gráfico com os dados disponíveis.",
  AI_ASSISTANT_RATE_LIMIT_EXCEEDED:
    "Você atingiu o limite de mensagens por enquanto, tente novamente mais tarde.",
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
    "Você atingiu o limite de perguntas por enquanto, tente novamente mais tarde.",
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
  TOKEN_QUOTA_EXCEEDED:
    "A cota de tokens de IA do seu plano foi atingida por enquanto. Tente novamente mais tarde ou troque de plano.",
  DASHBOARD_PAGE_NOT_FOUND: "Página não encontrada.",
  CHART_DEFINITION_NOT_FOUND: "Gráfico não encontrado.",
  PAGE_ACCESS_GRANT_NOT_FOUND: "Este acesso não existe mais.",
  INVALID_ACCESS_GRANT_TARGET: "Escolha um membro deste workspace ou informe um e-mail válido.",
  PAGE_ACCESS_TOKEN_INVALID: "Este link não é válido ou foi revogado.",
  INVALID_CHART_DEFINITION: "Este gráfico não pode ser montado com as opções escolhidas.",
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

export function getErrorCode(error: unknown): ErrorCode | null {
  if (axios.isAxiosError(error) && isDomainError(error.response?.data)) {
    return error.response.data.code;
  }
  return null;
}
