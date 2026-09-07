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
  ATTACHMENT_NOT_FOUND: "Anexo não encontrado.",
  SUBTASK_PROJECT_MISMATCH: "A subtarefa precisa pertencer ao mesmo projeto da tarefa pai.",
  TASK_HAS_PENDING_SUBTASKS:
    "Conclua ou finalize as subtarefas pendentes antes de concluir esta tarefa.",
  SECTION_NOT_FOUND: "Coluna não encontrada.",
  SECTION_PROJECT_MISMATCH: "A coluna precisa pertencer ao mesmo projeto da tarefa.",
  DEFAULT_SECTION_NOT_DELETABLE: "A coluna padrão do projeto não pode ser apagada.",
  SECTION_NOT_EMPTY: "Mova ou apague as tarefas desta coluna antes de excluí-la.",
  ASSIGNEE_NOT_PROJECT_MEMBER: "Esta pessoa não tem acesso ao projeto e não pode ser responsável pela tarefa.",
  CUSTOM_FIELD_NOT_FOUND: "Campo customizado não encontrado.",
  CUSTOM_FIELD_VALUE_INVALID: "Valor incompatível com o tipo deste campo.",
  SYNC_VERSION_CONFLICT: "Este item foi alterado por outra pessoa. Atualize e tente novamente.",
  CLIENT_NOT_FOUND: "Cliente não encontrado.",
  CANNOT_MODIFY_OWN_ACCOUNT: "Você não pode realizar esta ação na própria conta.",
  COMMENT_NOT_FOUND: "Comentário não encontrado.",
  COMMENT_CONTENT_INVALID: "Escreva um comentário de até 5000 caracteres.",
  COMMENT_AUTHOR_MISMATCH: "Você só pode apagar os seus próprios comentários.",
  INVALID_ANALYTICS_QUERY: "Não foi possível montar este gráfico com os dados disponíveis.",
};

const DEFAULT_MESSAGE = "Algo deu errado. Tente novamente em instantes.";
const NETWORK_MESSAGE =
  "Não foi possível conectar ao servidor. Verifique sua conexão e tente novamente.";

export function getErrorMessage(error: unknown): string {
  if (axios.isAxiosError(error)) {
    if (!error.response) return NETWORK_MESSAGE;

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
