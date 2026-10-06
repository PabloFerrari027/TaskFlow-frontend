import type { WorkspaceRole } from "@/types/workspace";

export const ROLE_COLUMNS: { role: WorkspaceRole; label: string }[] = [
  { role: "OWNER", label: "Proprietário" },
  { role: "ADMIN", label: "Administrador" },
  { role: "MEMBER", label: "Membro" },
  { role: "GUEST", label: "Convidado" },
];

export interface RolePermission {
  action: string;
  // Roles allowed to do it. Mirrors src/lib/permissions.ts (and the comment
  // deletion rule in features/comments) — update both together.
  roles: WorkspaceRole[];
}

const MANAGERS: WorkspaceRole[] = ["OWNER", "ADMIN"];

export const ROLE_PERMISSIONS: RolePermission[] = [
  { action: "Convidar pessoas e gerenciar membros do workspace", roles: MANAGERS },
  { action: "Gerenciar pessoas e convites de uma pasta", roles: MANAGERS },
  { action: "Criar, editar e arquivar campos extras", roles: MANAGERS },
  { action: "Criar pastas a partir de um modelo", roles: MANAGERS },
  { action: "Publicar uma pasta como modelo", roles: MANAGERS },
  { action: "Arquivar pastas", roles: MANAGERS },
  { action: "Criar e gerenciar automações", roles: MANAGERS },
  { action: "Apagar comentários de outras pessoas", roles: MANAGERS },
  { action: "Ligar ou desligar o assistente de IA", roles: ["OWNER"] },
  { action: "Conceder ou retirar o papel de Proprietário", roles: ["OWNER"] },
  { action: "Excluir o workspace (vazio)", roles: ["OWNER"] },
];

export interface GlossaryTerm {
  term: string;
  definition: string;
}

export const GLOSSARY: GlossaryTerm[] = [
  {
    term: "Workspace",
    definition: "O espaço da sua equipe ou empresa: reúne pessoas, pastas e configurações.",
  },
  {
    term: "Pasta e subpasta",
    definition: "Um conjunto de trabalho com seu próprio quadro. Uma pasta pode conter subpastas.",
  },
  {
    term: "Modelo",
    definition:
      "Uma pasta pronta para copiar: já vem com colunas, campos extras e, às vezes, itens de exemplo. Pode ser grátis ou pago.",
  },
  {
    term: "Coluna e subcoluna",
    definition: "Uma etapa do quadro de uma pasta. Uma subcoluna fica dentro de uma coluna.",
  },
  {
    term: "Item e subitem",
    definition: "Uma unidade de trabalho. Um subitem é um item que faz parte de outro.",
  },
  {
    term: "Status",
    definition: "O andamento do item: A fazer, Em progresso ou Concluída. Independe da coluna.",
  },
  {
    term: "Responsável",
    definition: "A pessoa que executa o item. É uma só por item.",
  },
  {
    term: "Participante",
    definition: "Alguém que acompanha o item sem ser o responsável.",
  },
  {
    term: "Menção",
    definition: "Uma pessoa escolhida no seletor para ser avisada sobre um comentário ou um item.",
  },
  {
    term: "Campo extra",
    definition: "Um campo próprio que você acrescenta aos itens de uma pasta.",
  },
  {
    term: "Automação",
    definition: "Uma regra “quando isso acontecer, faça aquilo” que roda sem confirmação.",
  },
  {
    term: "Ação pendente",
    definition: "Uma alteração proposta pelo assistente de IA que só acontece depois do seu Confirmar.",
  },
  {
    term: "Arquivar",
    definition: "Tirar do dia a dia sem excluir. Vale para pastas e campos extras.",
  },
  {
    term: "Convite",
    definition: "Um link enviado por e-mail para alguém entrar em um workspace ou pasta, com data de expiração.",
  },
  {
    term: "Sessão",
    definition: "Um dispositivo conectado à sua conta. Você pode revogar as que não reconhece.",
  },
  {
    term: "Sincronização",
    definition: "O envio das alterações feitas offline para o servidor quando a conexão volta.",
  },
  {
    term: "Chave de API",
    definition: "Uma senha especial para um sistema seu se identificar como o workspace, sem uma pessoa envolvida.",
  },
  {
    term: "Webhook",
    definition: "Um aviso automático que o TaskFlow manda para um endereço seu quando algo escolhido acontece.",
  },
  {
    term: "Token",
    definition: "A unidade que mede o quanto o modelo de IA processou numa chamada do assistente.",
  },
  {
    term: "Plano",
    definition: "O teto de tokens de IA por mês de uma conta. Sem um plano escolhido, não há limite.",
  },
];
