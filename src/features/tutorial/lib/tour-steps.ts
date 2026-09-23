export type TourPlacement = "bottom" | "top" | "right" | "left";

export interface TourStep {
  id: string;
  // Small label above the title, grouping steps into themes.
  chapter: string;
  title: string;
  description: string;
  // Short, concrete things to try or know — rendered as a bullet list.
  details?: string[];
  // Value of the `data-tour` attribute on the element to spotlight. Omitted
  // for steps shown centered on screen (welcome / wrap-up).
  target?: string;
  // Preferred side for the card; the overlay falls back to whichever side fits.
  placement?: TourPlacement;
  // Page the step lives on. The tour navigates there first. Steps without a
  // route stay wherever the previous step left the user (they are reached by
  // an earlier step's `advance`), and going back returns to the page they
  // were first shown on.
  route?: string;
  // Steps that only make sense together (they need the same optional data,
  // e.g. "the workspace has at least one task"). When one of them can't find
  // its target, the whole section is skipped.
  section?: string;
  // Skip the step instead of showing it centered when the target never
  // appears — for targets that exist only once the workspace has data.
  skipIfMissing?: boolean;
  // "open": pressing Next follows the link that the spotlighted element
  // points to (`href`, or `data-tour-href`) before moving on, so the tour can
  // walk into a project, a task or a workspace.
  advance?: "open";
}

// Shell steps (topbar + sidebar) work from any page and are dropped when their
// target isn't on screen (e.g. the sidebar on mobile, or hidden by the user) —
// see `TutorialTour`. The rest walk through the real pages, in the order a new
// person would use them. Steps that target user data (projects, tasks,
// workspaces) are skipped, together with the rest of their section, for an
// empty account.
//
// Labels in quotes are the real button texts — revisit them when the interface
// wording changes.
export const TOUR_STEPS: TourStep[] = [
  {
    id: "welcome",
    chapter: "Boas-vindas",
    title: "Bem-vindo ao TaskFlow!",
    description:
      "Este tour leva cerca de 3 minutos e passa pelas telas reais do sistema: o menu, seus projetos, o quadro de tarefas, uma tarefa por dentro, as análises e os workspaces. Nada é criado ou alterado durante o tour.",
    details: [
      "Use as setas → e ← do teclado para avançar e voltar, ou Esc para sair.",
      "Ao terminar, você volta para a página em que estava.",
      "Dá para refazê-lo quando quiser, pelo menu da sua conta.",
    ],
  },

  // ------------------------------------------------------------ navigation
  {
    id: "workspace",
    chapter: "Navegação",
    target: "workspace-switcher",
    placement: "bottom",
    title: "Seu workspace",
    description:
      "Um workspace é o espaço de uma equipe ou empresa: reúne projetos, tarefas e pessoas. Tudo o que você vê (projetos, análises, atividade) pertence ao workspace selecionado aqui.",
    details: [
      "Clique para trocar de workspace ou criar um novo.",
      "Se algo parecer ter sumido, confira primeiro se o workspace certo está selecionado.",
    ],
  },
  {
    id: "sidebar",
    chapter: "Navegação",
    target: "sidebar",
    placement: "right",
    skipIfMissing: true,
    title: "Menu de navegação",
    description: "É por aqui que você circula entre as áreas do sistema:",
    details: [
      "Dashboard: os projetos ativos do workspace.",
      "Projetos: todos os projetos, ativos e arquivados.",
      "Análises: números e gráficos, com perguntas em texto livre.",
      "Workspaces: membros, convites, atividade e automações.",
      "Perfil, Sessões e Segurança: sua conta e seus dispositivos.",
    ],
  },
  {
    id: "sidebar-toggle",
    chapter: "Navegação",
    target: "sidebar-toggle",
    placement: "bottom",
    skipIfMissing: true,
    title: "Mais espaço para o quadro",
    description:
      "Este botão esconde e mostra o menu lateral. O navegador lembra a sua escolha, junto com o workspace atual e a forma de visualizar projetos e tarefas.",
  },
  {
    id: "assistant",
    chapter: "Navegação",
    target: "assistant",
    placement: "bottom",
    title: "Assistente de IA",
    description:
      "Peça em linguagem natural para consultar ou alterar tarefas, projetos e pessoas. Um Proprietário do workspace precisa ativá-lo na página Assistente.",
    details: [
      "Exemplo: “crie uma tarefa Revisar contrato no projeto Jurídico”.",
      "Toda alteração aparece antes num cartão de ação pendente. Só o botão “Confirmar” executa; escrever “sim” no chat não basta.",
      "Ações críticas, como remover membros ou excluir o workspace, pedem também a sua senha ou o Google.",
    ],
  },
  {
    id: "theme",
    chapter: "Navegação",
    target: "theme-toggle",
    placement: "bottom",
    title: "Tema e sincronização",
    description:
      "Alterne entre tema claro, escuro ou o padrão do seu sistema. Ao lado dele, um ícone de sincronização aparece só quando você está offline ou com alterações pendentes: edições feitas sem internet ficam guardadas no navegador e são enviadas quando a conexão volta.",
  },
  {
    id: "user-menu",
    chapter: "Navegação",
    target: "user-menu",
    placement: "bottom",
    title: "Sua conta",
    description: "Ao clicar no seu avatar você encontra:",
    details: [
      "Meu perfil: nome e foto.",
      "Tutorial: guias completos de cada área, com perguntas frequentes.",
      "Privacidade e FAQ: como seus dados são tratados.",
      "Refazer tour guiado: este tour de novo.",
      "Sair.",
    ],
  },

  // ------------------------------------------------------------- dashboard
  {
    id: "new-project",
    chapter: "Projetos",
    route: "/dashboard",
    target: "new-project",
    placement: "bottom",
    skipIfMissing: true,
    title: "Crie um projeto",
    description:
      "Um projeto é um trabalho com começo e fim, ou uma área contínua da equipe. O Dashboard mostra os projetos ativos do workspace, e é daqui que você cria o primeiro.",
    details: [
      "Clique em “Novo projeto”, dê um nome e, se quiser, uma descrição.",
      "Um projeto pode ter sub-projetos, para separar fases ou frentes de trabalho.",
      "Projetos não são excluídos: quando terminam, são arquivados.",
    ],
  },
  {
    id: "project-card",
    chapter: "Projetos",
    route: "/dashboard",
    section: "project",
    target: "project-card",
    placement: "bottom",
    skipIfMissing: true,
    advance: "open",
    title: "Abra um projeto",
    description:
      "Cada cartão é um projeto ativo. Clicar num cartão abre o quadro de tarefas dele. Ao avançar, o tour abre este primeiro projeto para você ver o quadro por dentro.",
  },

  // ----------------------------------------------------------------- board
  {
    id: "project-tabs",
    chapter: "O quadro",
    section: "project",
    target: "project-tabs",
    placement: "bottom",
    skipIfMissing: true,
    title: "As abas do projeto",
    description:
      "Cada projeto tem quatro abas, e uma frase logo abaixo explica a que está aberta. Você está em Tarefas, o quadro de trabalho.",
    details: [
      "Tarefas: o quadro, com uma coluna por etapa do fluxo.",
      "Pessoas: quem tem acesso ao projeto.",
      "Convites: convide alguém por e-mail e acompanhe o aceite.",
      "Campos extras: campos próprios em cada tarefa, como cliente ou valor.",
    ],
  },
  {
    id: "board-toolbar",
    chapter: "O quadro",
    section: "project",
    target: "board-toolbar",
    placement: "bottom",
    skipIfMissing: true,
    title: "Crie tarefas e colunas",
    description: "A barra do quadro reúne as ações mais usadas:",
    details: [
      "“Nova tarefa” cria na coluna padrão. Cada coluna também tem o seu próprio botão.",
      "“Adicionar coluna” cria uma etapa do fluxo, como “A fazer”, “Em andamento” e “Concluído”.",
      "O seletor à direita troca os cartões por uma tabela no estilo planilha, onde status, prioridade, responsável e prazo se editam direto na célula.",
    ],
  },
  {
    id: "board-filters",
    chapter: "O quadro",
    section: "project",
    target: "board-filters",
    placement: "bottom",
    skipIfMissing: true,
    title: "Encontre qualquer tarefa",
    description:
      "Todos os filtros valem ao mesmo tempo, então dá para combinar quantos quiser.",
    details: [
      "Busca no título e na descrição, sem diferenciar maiúsculas nem acentos.",
      "Status, prioridade, responsável e prazo (atrasadas, vencem hoje, próximos 7 dias).",
      "“Mais filtros”: intervalos de datas, participante, quem criou, anexos e outros.",
      "“Limpar filtros” aparece assim que houver algum ativo.",
    ],
  },
  {
    id: "board-columns",
    chapter: "O quadro",
    section: "project",
    target: "board-columns",
    placement: "top",
    skipIfMissing: true,
    title: "Colunas e cartões",
    description:
      "Cada coluna é uma etapa do trabalho, e cada cartão é uma tarefa. À medida que o trabalho avança, a tarefa anda pelo quadro.",
    details: [
      "Arraste um cartão para outra coluna para movê-lo, ou solte entre dois cartões para escolher a posição.",
      "Nos três pontos de cada coluna: renomear, criar subcoluna, mover e apagar (só colunas vazias).",
      "Arraste a borda direita de uma coluna para mudar a largura.",
    ],
  },

  // ------------------------------------------------------------------ task
  {
    id: "task-card",
    chapter: "A tarefa",
    section: "task",
    target: "task-card",
    placement: "right",
    skipIfMissing: true,
    advance: "open",
    title: "Abra uma tarefa",
    description:
      "O cartão mostra o essencial: título, prioridade, prazo, responsável e status, que dá para trocar direto nele. Clicar abre o detalhe num painel lateral. Ao avançar, o tour abre a página completa desta primeira tarefa.",
    details: [
      "Para agir em várias tarefas de uma vez, marque a caixinha no canto do cartão ou use Ctrl/Shift + clique.",
    ],
  },
  {
    id: "task-main",
    chapter: "A tarefa",
    section: "task",
    target: "task-main",
    placement: "bottom",
    skipIfMissing: true,
    title: "Título e descrição",
    description:
      "Edite direto no lugar: as alterações são salvas ao sair do campo, sem botão “Salvar”.",
    details: [
      "Tarefas grandes se dividem em subtarefas, logo abaixo. Cada subtarefa tem seu próprio status, responsável e prazo, e a tarefa só pode ser concluída quando todas terminarem.",
      "Anexe arquivos de até 20 MB na seção Anexos.",
    ],
  },
  {
    id: "task-fields",
    chapter: "A tarefa",
    section: "task",
    target: "task-fields",
    placement: "left",
    skipIfMissing: true,
    title: "Status, responsável e prazo",
    description:
      "Cada campo é salvo assim que você escolhe um valor.",
    details: [
      "Coluna e Status (A fazer, Em progresso, Concluída) são coisas diferentes: um não muda o outro sozinho.",
      "Responsável é quem executa. Participantes só acompanham.",
      "Prioridade vai de Baixa a Urgente. Depois de definidos, prazo e prioridade só podem ser trocados por outro valor, não removidos.",
      "Logo abaixo ficam os campos extras criados no projeto.",
    ],
  },
  {
    id: "task-comments",
    chapter: "A tarefa",
    section: "task",
    target: "task-comments",
    placement: "top",
    skipIfMissing: true,
    title: "Comentários e histórico",
    description: "A conversa sobre a tarefa fica junto dela.",
    details: [
      "Para avisar alguém, escolha as pessoas no seletor de menção antes de enviar.",
      "“Responder” abre uma conversa encadeada dentro do comentário.",
      "Logo abaixo, o histórico registra cada mudança: status, responsável, coluna e comentários.",
    ],
  },

  // -------------------------------------------------------------- projects
  {
    id: "project-list",
    chapter: "Projetos",
    route: "/projects",
    target: "project-list-controls",
    placement: "bottom",
    skipIfMissing: true,
    title: "Todos os projetos",
    description:
      "A página Projetos lista tudo do workspace, inclusive o que já saiu do Dashboard.",
    details: [
      "As abas separam projetos Ativos e Arquivados.",
      "O seletor à direita alterna entre a árvore de cartões e uma tabela, onde nome, descrição e status se editam na célula.",
      "No menu de ações de cada projeto: criar sub-projeto, mover para dentro de outro e arquivar.",
    ],
  },

  // ------------------------------------------------------------- analytics
  {
    id: "analytics-question",
    chapter: "Análises",
    route: "/analytics",
    target: "analytics-question",
    placement: "bottom",
    skipIfMissing: true,
    title: "Pergunte em texto livre",
    description:
      "Escreva uma dúvida sobre as tarefas e os projetos e o sistema monta o resultado para você.",
    details: [
      "Exemplo: “Quantas tarefas atrasadas temos, agrupadas por projeto?”.",
      "A linha “Entendi como: …” mostra como a pergunta foi interpretada. Se estiver errada, reescreva citando o que contar, o filtro e o agrupamento.",
    ],
  },
  {
    id: "analytics-charts",
    chapter: "Análises",
    route: "/analytics",
    target: "analytics-charts",
    placement: "top",
    skipIfMissing: true,
    title: "Os gráficos do workspace",
    description:
      "Três indicadores no topo (tarefas no total, concluídas e projetos ativos) e, aqui, os gráficos.",
    details: [
      "Tarefas por status, por responsável e por projeto.",
      "Tarefas atrasadas, taxa de conclusão, taxa de atraso e tempo médio de conclusão por projeto.",
      "O seletor “Mostrando dados de” limita parte deles a um projeto.",
      "“Sem dados” significa que ainda não há informação suficiente, o que é diferente de zero.",
    ],
  },

  // ------------------------------------------------------------ workspaces
  {
    id: "workspace-cards",
    chapter: "Workspaces",
    route: "/workspaces",
    section: "workspace",
    target: "workspace-settings",
    placement: "bottom",
    skipIfMissing: true,
    advance: "open",
    title: "Seus workspaces",
    description:
      "Cada cartão é um workspace do qual você faz parte, com o seu papel nele. Clicar no cartão o define como o atual, e “Configurações” abre a página dele. Ao avançar, o tour abre a do primeiro.",
  },
  {
    id: "workspace-members-section",
    chapter: "Workspaces",
    section: "workspace",
    target: "workspace-members-section",
    placement: "bottom",
    skipIfMissing: true,
    title: "Membros e convites",
    description:
      "A página do workspace mostra direto quem faz parte (com o papel de cada um: Proprietário, Administrador, Membro ou Convidado) e, logo abaixo, os convites por e-mail, com o status de cada um (pendente, aceito, revogado ou expirado).",
  },
  {
    id: "workspace-more-in-sidebar",
    chapter: "Workspaces",
    section: "workspace",
    target: "sidebar-toggle",
    placement: "bottom",
    skipIfMissing: true,
    title: "O resto fica no menu lateral",
    description:
      "Atividade, Automações, Desenvolvedores e Assistente têm cada um a própria página no menu lateral, sempre falando do workspace atual (o que está selecionado no topo).",
    details: [
      "Atividade: a linha do tempo de tudo o que aconteceu no workspace.",
      "Automações: regras “quando isso acontecer, faça aquilo” (só Proprietário e Administrador veem esta página).",
      "Desenvolvedores: chaves de API e webhooks (só Proprietário e Administrador veem esta página).",
      "Assistente: liga ou desliga a IA (só o Proprietário pode alterar).",
    ],
  },

  {
    id: "done",
    chapter: "Pronto",
    title: "Tudo pronto!",
    description:
      "Você já conhece o caminho principal do TaskFlow. Para um passo a passo de cada área, com perguntas frequentes e dicas, abra a página Tutorial.",
    details: [
      "Um bom começo: crie um projeto, uma coluna e uma tarefa. O resto você refina conforme precisar.",
      "Dúvidas sobre dados e privacidade? Veja Privacidade e FAQ, no menu lateral.",
    ],
  },
];
