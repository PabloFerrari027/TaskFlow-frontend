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
  { action: "Gerenciar pessoas e convites de um projeto", roles: MANAGERS },
  { action: "Criar, editar e arquivar campos extras", roles: MANAGERS },
  { action: "Arquivar projetos", roles: MANAGERS },
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
    definition: "O espaço da sua equipe ou empresa: reúne pessoas, projetos e configurações.",
  },
  {
    term: "Projeto e sub-projeto",
    definition: "Um conjunto de trabalho com seu próprio quadro. Um projeto pode conter sub-projetos.",
  },
  {
    term: "Coluna e subcoluna",
    definition: "Uma etapa do quadro de um projeto. Uma subcoluna fica dentro de uma coluna.",
  },
  {
    term: "Tarefa e subtarefa",
    definition: "Uma unidade de trabalho. Uma subtarefa é uma tarefa que faz parte de outra.",
  },
  {
    term: "Status",
    definition: "O andamento da tarefa: A fazer, Em progresso ou Concluída. Independe da coluna.",
  },
  {
    term: "Responsável",
    definition: "A pessoa que executa a tarefa. É uma só por tarefa.",
  },
  {
    term: "Participante",
    definition: "Alguém que acompanha a tarefa sem ser o responsável.",
  },
  {
    term: "Menção",
    definition: "Uma pessoa escolhida no seletor para ser avisada sobre um comentário ou uma tarefa.",
  },
  {
    term: "Campo extra",
    definition: "Um campo próprio que você acrescenta às tarefas de um projeto.",
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
    definition: "Tirar do dia a dia sem excluir. Vale para projetos e campos extras.",
  },
  {
    term: "Convite",
    definition: "Um link enviado por e-mail para alguém entrar em um workspace ou projeto, com data de expiração.",
  },
  {
    term: "Sessão",
    definition: "Um dispositivo conectado à sua conta. Você pode revogar as que não reconhece.",
  },
  {
    term: "Sincronização",
    definition: "O envio das alterações feitas offline para o servidor quando a conexão volta.",
  },
];
