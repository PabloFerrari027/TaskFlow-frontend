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
  // e.g. "the workspace has at least one item"). When one of them can't find
  // its target, the whole section is skipped.
  section?: string;
  // Skip the step instead of showing it centered when the target never
  // appears — for targets that exist only once the workspace has data.
  skipIfMissing?: boolean;
  // "open": pressing Next follows the link that the spotlighted element
  // points to (`href`, or `data-tour-href`) before moving on, so the tour can
  // walk into a folder, an item or a workspace.
  advance?: "open";
}

// Shell steps (topbar + sidebar) work from any page and are dropped when their
// target isn't on screen (e.g. the sidebar on mobile, or hidden by the user) —
// see `TutorialTour`. The rest walk through the real pages, in the order a new
// person would use them. Steps that target user data (folders, items,
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
      "Este tour leva cerca de 3 minutos e passa pelas telas reais do sistema: o menu, suas pastas, o quadro de itens, um item por dentro e os workspaces. Nada é criado ou alterado durante o tour.",
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
      "Um workspace é o espaço de uma equipe ou empresa: reúne pastas, itens e pessoas. Tudo o que você vê (pastas, atividade) pertence ao workspace selecionado aqui.",
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
      "Pastas: a página inicial, com todas as pastas do workspace, ativas e arquivadas.",
      "Workspaces: membros, convites, atividade e automações.",
      "Perfil: sua conta, sua senha e seus dispositivos.",
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
      "Este botão esconde e mostra o menu lateral. O navegador lembra a sua escolha, junto com o workspace atual e a forma de visualizar pastas e itens.",
  },
  {
    id: "assistant",
    chapter: "Navegação",
    target: "assistant",
    placement: "bottom",
    title: "Assistente de IA",
    description:
      "Peça em linguagem natural para consultar ou alterar itens, pastas e pessoas. Um Proprietário do workspace precisa ativá-lo na página Assistente.",
    details: [
      "Exemplo: “crie um item Revisar contrato na pasta Jurídica”.",
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

  // ------------------------------------------------------------ new folder
  {
    id: "new-folder",
    chapter: "Pastas",
    route: "/folders",
    target: "new-folder",
    placement: "bottom",
    skipIfMissing: true,
    title: "Crie uma pasta",
    description:
      "Uma pasta é um trabalho com começo e fim, ou uma área contínua da equipe. A página Pastas mostra todas as pastas do workspace, e é daqui que você cria a primeira.",
    details: [
      "Clique em “Nova pasta”, dê um nome e, se quiser, uma descrição.",
      "Uma pasta pode ter subpastas, para separar fases ou frentes de trabalho.",
      "Pastas não são excluídas: quando terminam, são arquivadas.",
    ],
  },
  {
    id: "folder-card",
    chapter: "Pastas",
    route: "/folders",
    section: "folder",
    target: "folder-card",
    placement: "bottom",
    skipIfMissing: true,
    advance: "open",
    title: "Abra uma pasta",
    description:
      "Cada cartão é uma pasta. Clicar num cartão abre o quadro de itens dela. Ao avançar, o tour abre esta primeira pasta para você ver o quadro por dentro.",
  },

  // ----------------------------------------------------------------- board
  {
    id: "folder-tabs",
    chapter: "O quadro",
    section: "folder",
    target: "folder-tabs",
    placement: "bottom",
    skipIfMissing: true,
    title: "As abas da pasta",
    description:
      "Cada pasta tem várias abas, e uma frase logo abaixo explica a que está aberta. Você está em Itens, o quadro de trabalho.",
    details: [
      "Itens: o quadro, com uma coluna por etapa do fluxo.",
      "Estatísticas: os números da pasta, como quanto já foi feito e o que está atrasado.",
      "Pessoas: quem tem acesso à pasta.",
      "Convites: convide alguém por e-mail e acompanhe o aceite.",
      "Campos extras: campos próprios em cada item, como cliente ou valor.",
      "Atividade: tudo que mudou na pasta, com quem fez e quando.",
    ],
  },
  {
    id: "board-toolbar",
    chapter: "O quadro",
    section: "folder",
    target: "board-toolbar",
    placement: "bottom",
    skipIfMissing: true,
    title: "Crie itens e colunas",
    description: "A barra do quadro reúne as ações mais usadas:",
    details: [
      "“Novo item” cria na coluna padrão. Cada coluna também tem o seu próprio botão.",
      "“Adicionar coluna” cria uma etapa do fluxo, como “A fazer”, “Em andamento” e “Concluído”.",
      "O seletor à direita troca os cartões por uma tabela no estilo planilha, onde status, prioridade, responsável e prazo se editam direto na célula.",
    ],
  },
  {
    id: "board-filters",
    chapter: "O quadro",
    section: "folder",
    target: "board-filters",
    placement: "bottom",
    skipIfMissing: true,
    title: "Encontre qualquer item",
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
    section: "folder",
    target: "board-columns",
    placement: "top",
    skipIfMissing: true,
    title: "Colunas e cartões",
    description:
      "Cada coluna é uma etapa do trabalho, e cada cartão é um item. À medida que o trabalho avança, o item anda pelo quadro.",
    details: [
      "Arraste um cartão para outra coluna para movê-lo, ou solte entre dois cartões para escolher a posição.",
      "Nos três pontos de cada coluna: renomear, criar subcoluna, mover e apagar (só colunas vazias).",
      "Arraste a borda direita de uma coluna para mudar a largura.",
    ],
  },

  // ------------------------------------------------------------------ item
  {
    id: "item-card",
    chapter: "O item",
    section: "item",
    target: "item-card",
    placement: "right",
    skipIfMissing: true,
    advance: "open",
    title: "Abra um item",
    description:
      "O cartão mostra o essencial: título, prioridade, prazo, responsável e status, que dá para trocar direto nele. Clicar abre o detalhe num painel lateral. Ao avançar, o tour abre a página completa deste primeiro item.",
    details: [
      "Para agir em vários itens de uma vez, marque a caixinha no canto do cartão ou use Ctrl/Shift + clique.",
    ],
  },
  {
    id: "item-main",
    chapter: "O item",
    section: "item",
    target: "item-main",
    placement: "bottom",
    skipIfMissing: true,
    title: "Título e descrição",
    description:
      "Edite direto no lugar: as alterações são salvas ao sair do campo, sem botão “Salvar”.",
    details: [
      "Itens grandes se dividem em subitens, logo abaixo. Cada subitem tem seu próprio status, responsável e prazo, e o item só pode ser concluído quando todos terminarem.",
      "Anexe arquivos de até 20 MB na seção Anexos.",
    ],
  },
  {
    id: "item-fields",
    chapter: "O item",
    section: "item",
    target: "item-fields",
    placement: "left",
    skipIfMissing: true,
    title: "Status, responsável e prazo",
    description:
      "Cada campo é salvo assim que você escolhe um valor.",
    details: [
      "Coluna e Status (A fazer, Em andamento, Concluída) são coisas diferentes: um não muda o outro sozinho.",
      "Responsável é quem executa. Participantes só acompanham.",
      "Prioridade vai de Baixa a Urgente. Depois de definidos, prazo e prioridade só podem ser trocados por outro valor, não removidos.",
      "Logo abaixo ficam os campos extras criados na pasta.",
    ],
  },
  {
    id: "item-comments",
    chapter: "O item",
    section: "item",
    target: "item-comments",
    placement: "top",
    skipIfMissing: true,
    title: "Comentários e histórico",
    description: "A conversa sobre o item fica junto dele.",
    details: [
      "Para avisar alguém, escolha as pessoas no seletor de menção antes de enviar.",
      "“Responder” abre uma conversa encadeada dentro do comentário.",
      "Logo abaixo, o histórico registra cada mudança: status, responsável, coluna e comentários.",
    ],
  },

  // -------------------------------------------------------------- folders
  {
    id: "folder-list",
    chapter: "Pastas",
    route: "/folders",
    target: "folder-list-controls",
    placement: "bottom",
    skipIfMissing: true,
    title: "Todas as pastas",
    description:
      "As pastas arquivadas continuam aqui, numa aba própria.",
    details: [
      "As abas separam pastas Ativas e Arquivadas.",
      "O seletor à direita alterna entre a árvore de cartões e uma tabela, onde nome, descrição e status se editam na célula.",
      "No menu de ações de cada pasta: criar subpasta, mover para dentro de outra e arquivar.",
    ],
  },

  // ------------------------------------------------------------ workspaces
  {
    id: "workspace-cards",
    chapter: "Workspaces",
    route: "/workspaces",
    section: "workspace",
    target: "workspace-cards",
    placement: "bottom",
    skipIfMissing: true,
    title: "Seus workspaces",
    description:
      "Cada cartão é um workspace do qual você faz parte, com o seu papel nele. Clicar no cartão o define como o atual — o mesmo que trocar no seletor do topo — e as configurações logo abaixo passam a ser as dele.",
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
      "Abaixo dos cartões ficam as configurações do workspace atual: quem faz parte (com o papel de cada um: Proprietário, Administrador, Membro ou Convidado) e, logo abaixo, os convites por e-mail, com o status de cada um (pendente, aceito, revogado ou expirado).",
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
      "Desenvolvedores e Assistente têm cada um a própria página no menu lateral, sempre falando do workspace atual (o que está selecionado no topo). A atividade do workspace fica nesta página, logo abaixo dos convites.",
    details: [
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
      "Um bom começo: crie uma pasta, uma coluna e um item. O resto você refina conforme precisar.",
      "Dúvidas sobre dados e privacidade? Veja Privacidade e FAQ, no menu lateral.",
    ],
  },
];
