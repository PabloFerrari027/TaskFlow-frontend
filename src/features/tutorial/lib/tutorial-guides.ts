import type { LucideIcon } from "lucide-react";
import {
  BadgeCheck,
  BarChart3,
  Bell,
  Bot,
  CalendarRange,
  FileInput,
  Repeat,
  Timer,
  Building2,
  Coins,
  Compass,
  CloudOff,
  FolderKanban,
  House,
  KeyRound,
  Kanban,
  LayoutTemplate,
  ListChecks,
  MessageSquare,
  Rocket,
  SlidersHorizontal,
  Table2,
  Webhook,
  Workflow,
} from "lucide-react";

export type GuideGroup = "start" | "daily" | "advanced" | "account";

export const GUIDE_GROUP_LABEL: Record<GuideGroup, string> = {
  start: "Comece por aqui",
  daily: "Trabalho do dia a dia",
  advanced: "Recursos avançados",
  account: "Conta e funcionamento",
};

export const GUIDE_GROUP_ORDER: GuideGroup[] = [
  "start",
  "daily",
  "advanced",
  "account",
];

export interface GuideCallout {
  kind: "tip" | "warning" | "note";
  text: string;
}

export interface GuideSection {
  heading: string;
  intro?: string;
  steps?: string[];
  bullets?: string[];
  callouts?: GuideCallout[];
}

export interface GuideFaq {
  question: string;
  answer: string;
}

export interface TutorialGuide {
  id: string;
  group: GuideGroup;
  title: string;
  summary: string;
  icon: LucideIcon;
  // Who can use the feature, when it isn't everyone.
  audience?: string;
  sections: GuideSection[];
  faq?: GuideFaq[];
  // Ids of other guides worth reading next.
  related?: string[];
  // Where the feature lives; omitted when it depends on a workspace or project
  // id and so has no single URL.
  href?: string;
  hrefLabel?: string;
}

// The board's "seções" are called "colunas" everywhere in the UI, so the
// guides do too. Labels in quotes ("Novo projeto", "Mover para…") are the real
// button/menu texts — revisit them when the interface wording changes.
export const TUTORIAL_GUIDES: TutorialGuide[] = [
  // ------------------------------------------------------------- start
  {
    id: "overview",
    group: "start",
    title: "Visão geral e seu primeiro projeto",
    summary: "Como o TaskFlow se organiza e como sair do zero até a primeira tarefa.",
    icon: Rocket,
    sections: [
      {
        heading: "Como tudo se encaixa",
        intro:
          "O TaskFlow tem poucas peças, sempre na mesma ordem de dentro para fora:",
        bullets: [
          "Workspace: o espaço da sua equipe ou empresa. Reúne pessoas, projetos e configurações.",
          "Projeto: um trabalho com começo e fim (ou uma área contínua). Pode ter sub-projetos.",
          "Coluna: uma etapa do quadro do projeto, como “A fazer” ou “Em andamento”. Pode ter subcolunas.",
          "Tarefa: uma unidade de trabalho, com responsável, prazo, prioridade e status. Pode ter subtarefas.",
        ],
        callouts: [
          {
            kind: "note",
            text: "Status e coluna são coisas diferentes. O status (A fazer, Em progresso, Concluída) é um campo da tarefa; a coluna é onde ela aparece no quadro. Mudar um não muda o outro sozinho, a não ser que você crie uma automação para ligá-los (veja o guia de Automações).",
          },
        ],
      },
      {
        heading: "Do zero à primeira tarefa",
        steps: [
          "Se você ainda não tem workspace, a página Projetos mostra “Você ainda não tem um workspace”. Crie um pelo seletor no topo, em “Novo workspace”.",
          "Abra Projetos no menu lateral e clique em “Novo projeto”. Dê um nome e, se quiser, uma descrição.",
          "Entre no projeto. A aba Tarefas mostra o quadro. Clique em “Adicionar coluna” e crie as etapas do seu fluxo, por exemplo “A fazer”, “Em andamento” e “Concluído”.",
          "Clique em “Nova tarefa”, escreva o título e escolha coluna, responsável, prazo e prioridade. Só o título é obrigatório.",
          "Arraste a tarefa de uma coluna para outra conforme ela avança. Clique nela para abrir o detalhe.",
          "Para trazer a equipe, abra Workspaces, entre no seu workspace e use a seção Convites.",
        ],
        callouts: [
          {
            kind: "tip",
            text: "Não precisa configurar tudo antes de começar. Crie o projeto, uma coluna e uma tarefa, e refine o resto conforme a necessidade aparecer.",
          },
        ],
      },
      {
        heading: "O que cada item do menu mostra",
        intro:
          "O menu lateral é dividido em grupos (Trabalho, Equipe, Ajuda e Conta), do que você usa todo dia para o que usa de vez em quando.",
        bullets: [
          "Início: seu resumo do dia, com as tarefas atribuídas a você, o que está atrasado e os projetos recentes. É a primeira tela depois do login.",
          "Projetos: todos os projetos do workspace, ativos e arquivados, em árvore ou tabela.",
          "Desenvolvedores: chaves de API e webhooks do workspace atual (só Proprietário e Administrador veem este item).",
          "Assistente: liga ou desliga o assistente de IA do workspace atual.",
          "Workspaces: seus workspaces, membros, convites e a atividade do workspace atual.",
          "Perfil: foto, senha, vínculo com o Google e dispositivos conectados.",
        ],
      },
    ],
    faq: [
      {
        question: "Criei um projeto mas ele não aparece.",
        answer:
          "Confira o workspace selecionado no topo: cada workspace tem seus próprios projetos. Projetos arquivados ficam na aba Arquivados da página Projetos.",
      },
      {
        question: "Preciso criar as colunas antes das tarefas?",
        answer:
          "Não necessariamente. Um projeto novo já tem uma coluna padrão, e as tarefas novas entram nela quando você não escolhe outra. Crie colunas quando quiser separar as etapas.",
      },
    ],
    related: ["navigation", "board", "tasks"],
    href: "/projects",
    hrefLabel: "Ir para Projetos",
  },
  {
    id: "navigation",
    group: "start",
    title: "Navegando pelo sistema",
    summary: "Menu lateral, barra superior, workspace atual e preferências que ficam salvas.",
    icon: Compass,
    sections: [
      {
        heading: "Barra superior",
        bullets: [
          "Botão de menu: esconde ou mostra o menu lateral no computador. No celular, o menu abre como uma gaveta.",
          "Seletor de workspace: troca o workspace atual. Tudo que você vê (projetos, atividade) é do workspace selecionado.",
          "Ícone do assistente: abre o chat de IA (precisa estar ativado no workspace).",
          "Ícone de sincronização: só aparece quando você está offline, sincronizando ou com alterações pendentes.",
          "Tema: alterna entre claro, escuro e o padrão do sistema.",
          "Seu avatar: abre o menu da conta, com Tutorial, o tour guiado e “Sair”.",
        ],
      },
      {
        heading: "O que fica salvo neste navegador",
        intro:
          "Algumas escolhas ficam guardadas só no navegador que você está usando. Elas não vão para o servidor nem acompanham você em outro dispositivo:",
        bullets: [
          "O workspace atual.",
          "Se o menu lateral está escondido.",
          "O modo de visualização de projetos e de tarefas (cartões ou tabela).",
          "A largura de cada coluna do quadro.",
          "Se você já fez o tour guiado.",
        ],
        callouts: [
          {
            kind: "note",
            text: "Se você entrar de outro navegador e ver tudo “diferente” (outro workspace, outra visualização), é isso. Basta escolher de novo.",
          },
        ],
      },
      {
        heading: "Links compartilháveis",
        intro:
          "Quando você abre uma tarefa no painel lateral do quadro, o endereço da página ganha um identificador da tarefa. Copie a URL e envie para alguém do projeto: ao abrir, a tarefa já vem aberta. Recarregar a página também mantém o painel aberto.",
      },
    ],
    faq: [
      {
        question: "Sumiu o menu lateral.",
        answer:
          "Você o escondeu pelo botão de menu no canto superior esquerdo. Clique nele de novo para mostrar.",
      },
      {
        question: "Não vejo o item “Clientes” no menu.",
        answer:
          "Ele só aparece para administradores da plataforma. Para os demais usuários é normal não existir.",
      },
    ],
    related: ["overview", "offline"],
  },

  // ------------------------------------------------------------- daily
  {
    id: "home",
    group: "daily",
    title: "Início: seu resumo do dia",
    summary: "O que está com você, o que atrasou e por onde começar, numa tela só.",
    icon: House,
    sections: [
      {
        heading: "O que a tela mostra",
        intro:
          "A tela Início reúne as tarefas em que você é o responsável, no workspace selecionado no topo:",
        bullets: [
          "Com você: quantas tarefas atribuídas a você ainda não foram concluídas.",
          "Atrasadas: tarefas suas em aberto cujo prazo já passou.",
          "Vencem em breve: tarefas suas em aberto com prazo nos próximos 7 dias.",
          "Seu progresso: a porcentagem de todas as tarefas já atribuídas a você que estão concluídas.",
          "Onde estão suas tarefas: os projetos em que há tarefas suas em aberto, com os atrasados primeiro. Clique num projeto para ir direto ao quadro.",
          "Continue de onde parou: os projetos ativos alterados mais recentemente.",
        ],
        callouts: [
          {
            kind: "note",
            text: "Só contam as tarefas em que você é o responsável. Ser participante ou ter sido mencionado numa tarefa não a coloca aqui.",
          },
          {
            kind: "note",
            text: "As tarefas de um sub-projeto aparecem somadas no projeto principal acima dele, igual à aba Estatísticas.",
          },
        ],
      },
      {
        heading: "Concluindo tarefas",
        intro:
          "Quando você muda o status de uma tarefa para Concluída, o TaskFlow comemora com uma pequena animação. Se o seu sistema estiver configurado para reduzir movimentos, a animação não aparece.",
      },
    ],
    faq: [
      {
        question: "Os números não batem com o que vejo num projeto.",
        answer:
          "Confira o workspace selecionado no topo: a tela Início só conta o workspace atual. Os números também podem levar alguns segundos para atualizar depois de uma alteração.",
      },
    ],
    related: ["tasks", "project-stats"],
    href: "/home",
    hrefLabel: "Ir para o Início",
  },
  {
    id: "workspaces",
    group: "daily",
    title: "Workspaces, pessoas e papéis",
    summary: "Criar workspaces, convidar pessoas e entender o que cada papel pode fazer.",
    icon: Building2,
    href: "/workspaces",
    hrefLabel: "Abrir workspaces",
    sections: [
      {
        heading: "Criar e alternar",
        steps: [
          "No seletor do topo, escolha “Novo workspace” e dê um nome.",
          "Para trocar de workspace, abra o mesmo seletor e clique no desejado. O item marcado é o atual.",
          "Em Workspaces, cada card é um workspace. Clicar num card também o define como atual.",
          "As configurações mostradas abaixo dos cards são sempre as do workspace atual: ao trocar no seletor, elas mudam junto.",
        ],
      },
      {
        heading: "Configurações do workspace",
        intro:
          "Na página Workspaces, abaixo dos cards, ficam as seções do workspace atual, uma embaixo da outra:",
        bullets: [
          "Membros: quem faz parte, com o papel de cada um.",
          "Convites: convites enviados e o estado de cada um (pendente, aceito, revogado ou expirado), com a data de expiração.",
          "Atividade: a linha do tempo de tudo que aconteceu no workspace, de todos os projetos.",
        ],
        callouts: [
          {
            kind: "note",
            text: "Desenvolvedores e Assistente têm cada um sua própria página no menu lateral, sempre referentes ao workspace selecionado no topo — não ficam nesta página.",
          },
        ],
      },
      {
        heading: "Convidar pessoas",
        steps: [
          "Na seção Membros ou Convites da página Workspaces, clique em “Convidar pessoa”.",
          "Informe o e-mail e escolha o papel: Administrador, Membro ou Convidado.",
          "A pessoa recebe um link. Ao abrir, ela vê um resumo do convite e precisa entrar (ou criar conta) para aceitar.",
          "Acompanhe na seção Convites. Se enviou para o e-mail errado, use “Revogar” e convide de novo.",
        ],
        callouts: [
          {
            kind: "note",
            text: "Convites têm data de expiração. Depois dela o convite aparece como expirado e é preciso enviar outro.",
          },
        ],
      },
      {
        heading: "Papéis",
        intro:
          "Existem quatro papéis: Proprietário, Administrador, Membro e Convidado. A tabela completa do que cada um pode fazer está em “Papéis e permissões”, logo abaixo dos guias. Em resumo, Proprietário e Administrador gerenciam o workspace; só o Proprietário controla o assistente, exclui o workspace e concede o papel de Proprietário.",
        callouts: [
          {
            kind: "warning",
            text: "O último Proprietário de um workspace não pode ser removido nem rebaixado. Promova outra pessoa a Proprietário antes de sair.",
          },
          {
            kind: "tip",
            text: "Prefira o papel Convidado para clientes e pessoas externas, e Membro para a equipe. Reserve Administrador para quem realmente gerencia pessoas e configurações.",
          },
        ],
      },
      {
        heading: "Excluir um workspace",
        intro:
          "Só o Proprietário pode, e apenas quando o workspace está vazio, sem outros membros além dele. Remova as demais pessoas primeiro.",
      },
    ],
    faq: [
      {
        question: "A pessoa aceitou o convite mas não vê os projetos.",
        answer:
          "Peça que ela confira o workspace selecionado no seletor do topo. Quem entra num workspace passa a ver os projetos dele automaticamente. Para projetos específicos, o convite pode ter sido feito no nível do projeto (veja o guia de Projetos).",
      },
      {
        question: "Não consigo mudar o papel de alguém para Proprietário.",
        answer:
          "Somente um Proprietário pode conceder ou retirar o papel de Proprietário. Administradores gerenciam os outros papéis, mas não este.",
      },
      {
        question: "Não vejo o botão de convidar.",
        answer:
          "Convidar exige o papel de Proprietário ou Administrador. Peça a alguém com esse papel.",
      },
    ],
    related: ["projects", "automations", "assistant"],
  },
  {
    id: "projects",
    group: "daily",
    title: "Projetos e sub-projetos",
    summary: "Criar, organizar em hierarquia, dar acesso e arquivar projetos.",
    icon: FolderKanban,
    href: "/projects",
    hrefLabel: "Abrir projetos",
    sections: [
      {
        heading: "Criar e editar",
        steps: [
          "Em Projetos, clique em “Novo projeto”.",
          "Para mudar nome e descrição depois, abra o projeto e use “Editar nome e descrição”.",
        ],
      },
      {
        heading: "Sub-projetos e hierarquia",
        intro:
          "Um projeto pode conter outros projetos, útil para separar fases ou frentes de trabalho.",
        bullets: [
          "“Criar sub-projeto” está no menu de ações do projeto (na lista) e no cabeçalho do próprio projeto.",
          "“Mover para…” reposiciona um projeto dentro de outro. A lista de destinos não oferece o próprio projeto, os sub-projetos dele nem projetos arquivados.",
          "Dentro de um sub-projeto aparece um caminho no topo (breadcrumb) para voltar aos projetos acima.",
        ],
      },
      {
        heading: "Cartões ou tabela",
        intro:
          "Na página Projetos, o seletor “Modo de visualização dos projetos” alterna entre a árvore de cartões e a tabela. A tabela mostra Projeto, Descrição, Status e Atualizado, deixa expandir e recolher sub-projetos e permite editar direto nas células.",
      },
      {
        heading: "Quem tem acesso",
        intro: "Na aba Pessoas do projeto:",
        bullets: [
          "Quem já é membro do workspace tem acesso automaticamente. Por isso a lista pode aparecer vazia: ela mostra só quem foi adicionado especificamente ao projeto.",
          "Para dar acesso a alguém de fora do workspace, use a aba Convites e “Convidar pessoa”, escolhendo Membro ou Convidado.",
          "“Remover do projeto” tira o acesso; você pode convidar de novo depois.",
        ],
        callouts: [
          {
            kind: "note",
            text: "Não existe papel de administrador dentro de um projeto. Gerenciar pessoas, campos extras e arquivamento depende do papel da pessoa no workspace (Proprietário ou Administrador).",
          },
        ],
      },
      {
        heading: "Arquivar",
        intro:
          "Projetos não são excluídos, apenas arquivados: eles passam para a aba Arquivados da página Projetos. Use “Arquivar projeto” no cabeçalho e confirme.",
        callouts: [
          {
            kind: "warning",
            text: "Um projeto que ainda tem sub-projetos não pode ser arquivado. Mova ou arquive os sub-projetos primeiro.",
          },
        ],
      },
    ],
    faq: [
      {
        question: "Não consigo escolher um projeto como destino em “Mover para…”.",
        answer:
          "O destino não pode ser o próprio projeto, um sub-projeto dele (criaria um ciclo) nem um projeto arquivado.",
      },
      {
        question: "Como apago um projeto?",
        answer:
          "Não é possível excluir projetos. Arquive-o para tirá-lo do dia a dia.",
      },
    ],
    related: ["board", "workspaces", "custom-fields"],
  },
  {
    id: "templates",
    group: "daily",
    title: "Modelos de projeto",
    summary: "Começar um projeto já organizado e salvar seus projetos como modelo.",
    icon: LayoutTemplate,
    audience:
      "Qualquer pessoa pode ver os modelos. Para usar um modelo ou salvar um projeto como modelo, é preciso ser Proprietário ou Administrador do workspace.",
    href: "/templates",
    hrefLabel: "Abrir modelos",
    sections: [
      {
        heading: "O que é um modelo",
        intro:
          "Um modelo é um projeto pronto para copiar. Em vez de montar colunas e campos do zero, você escolhe um modelo e o TaskFlow cria o projeto já organizado. Existem dois tipos, e os dois são grátis:",
        bullets: [
          "Modelos do TaskFlow: vêm prontos com o sistema e aparecem para todo mundo.",
          "Modelos do workspace: salvos a partir de projetos do seu workspace. Só as pessoas desse workspace veem e usam.",
        ],
      },
      {
        heading: "Usar um modelo",
        steps: [
          "Abra Modelos no menu lateral (ou “Começar de um modelo”, na página Projetos).",
          "No alto aparecem os modelos do seu workspace. Mais abaixo, os do TaskFlow, com busca (por nome, descrição ou tag), filtro por categoria e nível, e ordem por destaques, mais usados ou mais recentes.",
          "Abra um modelo para ver a prévia: o guia, as colunas, as etapas, as tarefas de exemplo (com marcos e dependências), os campos, as automações, os formulários, as visões, os painéis e os subprojetos.",
          "Clique em “Usar este modelo”, dê um nome ao projeto e responda o que o modelo perguntar (veja abaixo).",
          "Acompanhe a barra de progresso. Quando terminar, você vai direto para o projeto criado.",
        ],
        callouts: [
          {
            kind: "tip",
            text: "Também dá para escolher um modelo direto em “Novo projeto” ou “Criar sub-projeto”: os modelos aparecem logo abaixo do nome, começando pelos do seu workspace.",
          },
          {
            kind: "note",
            text: "O projeto é criado no workspace que estiver selecionado no topo da tela. Só Proprietário e Administrador desse workspace podem usar modelos, porque o modelo cria campos extras e automações. Se o botão aparecer desativado, troque de workspace ou peça a um administrador.",
          },
          {
            kind: "tip",
            text: "Se algo der errado no meio da criação, nada fica pela metade: ou o projeto é criado inteiro, ou nada é criado.",
          },
        ],
      },
      {
        heading: "O que o modelo pergunta",
        intro: "Alguns modelos pedem informações antes de criar o projeto:",
        bullets: [
          "Personalize: textos que entram nos nomes das colunas e tarefas, como o nome do cliente. Os marcados com * são obrigatórios.",
          "Data de referência (por exemplo, “Data do evento”): os prazos são contados a partir dela, inclusive para trás (“14 dias antes”). Sem ela, o modelo usa a primeira data em que nenhuma tarefa nasce atrasada.",
          "Partes opcionais: blocos que você liga ou desliga, como uma fase de testes. O que estiver desligado não é criado.",
          "Quem faz o quê: escolha a pessoa de cada papel (por exemplo, Designer). Ela vira a responsável pelas tarefas desse papel. Sem ninguém, as tarefas ficam sem responsável.",
        ],
      },
      {
        heading: "Aplicar um modelo num projeto que já existe",
        steps: [
          "No cabeçalho do projeto, clique em “Aplicar um modelo” e escolha o modelo. Ou, na página do modelo, clique em “Usar este modelo” e escolha a aba “Projeto existente”.",
          "Responda o que o modelo perguntar e clique em “Aplicar ao projeto”.",
        ],
        bullets: [
          "Colunas e tarefas entram depois das que o projeto já tem.",
          "Um campo extra com o mesmo nome e o mesmo tipo é reaproveitado. Se o nome for igual mas o tipo for outro, nada é aplicado e o aviso diz qual campo conflita.",
          "Subprojetos do modelo viram subprojetos deste projeto.",
        ],
        callouts: [
          {
            kind: "tip",
            text: "Quando um modelo que você já usou ganha uma versão nova, a página dele avisa. Aplicar de novo num projeto existente é o jeito de trazer as novidades.",
          },
        ],
      },
      {
        heading: "O que vem no projeto criado",
        bullets: [
          "As colunas do modelo, inclusive as subcolunas. A primeira coluna do modelo vira a coluna padrão do projeto.",
          "As etapas do fluxo (por exemplo, “Em revisão”), quando o modelo tem as suas.",
          "Os campos extras, com descrição, valor padrão e cores das opções.",
          "As tarefas de exemplo, com subtarefas, prioridade, etapa, responsável (pelo papel), início, prazo, estimativa, marcos e dependências.",
          "Um guia de uso como primeira tarefa (“Comece por aqui”), quando o modelo tem.",
          "Automações, tarefas repetidas, formulários públicos, visões salvas, painéis e subprojetos, quando o modelo tem.",
        ],
        callouts: [
          {
            kind: "note",
            text: "Depois de criado, o projeto é todo seu: dá para mudar qualquer coisa. Mudar o projeto não muda o modelo, e mudanças no modelo não mudam projetos já criados.",
          },
        ],
      },
      {
        heading: "Criar ou adaptar um modelo com IA",
        steps: [
          "Em Modelos, no quadro do seu workspace, clique em “Criar com IA” e descreva o que você quer organizar. Ou, na página de um modelo, clique em “Adaptar com IA” e diga o que mudar.",
          "Confira o rascunho: a prévia mostra tudo o que ele vai criar. Nada foi salvo ainda.",
          "Clique em “Criar projeto” para usar o rascunho agora, ou em “Salvar como modelo” para guardá-lo no workspace.",
        ],
        callouts: [
          {
            kind: "note",
            text: "A IA cria colunas, campos, tarefas e um guia, mas não automações, painéis, papéis nem subprojetos. O pedido usa a cota de IA do seu plano.",
          },
        ],
      },
      {
        heading: "Salvar um projeto seu como modelo",
        steps: [
          "Abra o projeto e clique em “Salvar como modelo”, no cabeçalho.",
          "Escolha o que levar e, se quiser, escreva um guia de uso.",
          "Dê um nome, uma descrição e escolha a categoria. Clique em “Salvar modelo”.",
        ],
        bullets: [
          "Sempre vão: as colunas (com as subcolunas), os campos extras, as etapas, os formulários e as visões compartilhadas.",
          "Você escolhe se vão: as tarefas (e se mantêm a etapa), os subprojetos, as tarefas repetidas, as automações do projeto e os gráficos de até 5 painéis.",
          "Nunca vão: responsáveis, comentários, anexos e as pessoas do projeto.",
        ],
        callouts: [
          {
            kind: "note",
            text: "O modelo é privado: só as pessoas do workspace veem e usam. Ele é uma cópia congelada do projeto. Para atualizá-lo, publique uma versão nova (veja abaixo).",
          },
        ],
      },
      {
        heading: "Editar, versões, imagens e excluir",
        intro:
          "Abra um modelo do seu workspace. Proprietários e Administradores veem o quadro “Gerenciar este modelo”:",
        bullets: [
          "“Editar modelo” muda nome, descrição, categoria, tags, nível, idioma e duração.",
          "“Publicar versão nova” lê o projeto de origem de novo, como ele está agora. Escreva o que mudou: aparece no histórico de versões. Quem já usou o modelo é avisado de que há uma versão nova.",
          "Capa e imagens: a capa aparece no cartão do modelo; as imagens (até 6), na página dele. JPEG, PNG ou WebP de até 5MB.",
          "“Excluir” apaga o modelo para todo o workspace. Projetos já criados com ele continuam iguais.",
        ],
        callouts: [
          {
            kind: "note",
            text: "Os modelos do TaskFlow são mantidos pela equipe do TaskFlow e não podem ser editados nem excluídos por você.",
          },
        ],
      },
    ],
    faq: [
      {
        question: "O botão “Usar este modelo” está desativado.",
        answer:
          "No workspace selecionado você não é Proprietário nem Administrador. Troque de workspace no topo da tela ou peça a um administrador para usar o modelo.",
      },
      {
        question: "Outras pessoas veem os modelos que eu salvo?",
        answer:
          "Só as pessoas do mesmo workspace. Quem é de fora não vê nem consegue usar.",
      },
      {
        question: "Mudei meu projeto. O modelo que salvei muda junto?",
        answer:
          "Não. O modelo guarda a estrutura do dia em que foi salvo. Use “Publicar versão nova” na página do modelo para atualizá-lo.",
      },
      {
        question: "Dá para aplicar um modelo num projeto que já existe?",
        answer:
          "Sim. Use “Aplicar um modelo” no cabeçalho do projeto, ou a aba “Projeto existente” ao usar o modelo. O conteúdo entra depois do que o projeto já tem.",
      },
    ],
    related: ["projects", "custom-fields", "board"],
  },
  {
    id: "board",
    group: "daily",
    title: "O quadro e as colunas",
    summary: "Organizar o fluxo em colunas e subcolunas, arrastar tarefas e ajustar o quadro.",
    icon: Kanban,
    sections: [
      {
        heading: "Colunas",
        intro:
          "A aba Tarefas de um projeto mostra o quadro: uma coluna por etapa, cada uma com suas tarefas.",
        steps: [
          "Clique em “Adicionar coluna” e dê um nome.",
          "No menu “Ações da coluna” (os três pontos no topo dela) você encontra: Renomear coluna, Criar subcoluna, Colocar dentro de outra coluna, Mover para a esquerda, Mover para a direita e Apagar coluna.",
        ],
        callouts: [
          {
            kind: "warning",
            text: "Só é possível apagar uma coluna vazia, sem tarefas e sem subcolunas. A coluna padrão do projeto não pode ser apagada.",
          },
        ],
      },
      {
        heading: "Arrastar tarefas",
        bullets: [
          "Arraste uma tarefa para outra coluna para movê-la.",
          "Solte entre duas tarefas para escolher a posição exata. O sistema decide se entra acima ou abaixo pela posição do cursor sobre a tarefa.",
          "Também funciona dentro da mesma coluna, para reordenar.",
        ],
        callouts: [
          {
            kind: "note",
            text: "Arrastar só funciona entre colunas do mesmo nível. Para levar uma tarefa entre uma coluna e uma subcoluna, abra a tarefa e troque o campo Coluna nela; a lista mostra o caminho, como “Pai / Filha”.",
          },
        ],
      },
      {
        heading: "Subcolunas",
        intro:
          "Uma subcoluna fica dentro da coluna pai e serve para separar melhor as tarefas dela (por exemplo, “Em andamento” dividida em “Design” e “Código”). No quadro elas aparecem recolhidas na coluna pai, com um contador de subcolunas; expanda para ver.",
      },
      {
        heading: "Ajustes de visualização",
        bullets: [
          "Arraste a borda direita de uma coluna para mudar a largura. Cada coluna lembra a sua neste navegador.",
          "O seletor “Modo de visualização das tarefas” alterna entre cartões e tabela (veja o guia de Tabela e filtros).",
          "Colunas com muitas tarefas são paginadas. Use os controles no rodapé da coluna.",
        ],
      },
    ],
    faq: [
      {
        question: "Não consigo soltar a tarefa na coluna que quero.",
        answer:
          "Provavelmente a coluna está em outro nível (é uma subcoluna, ou a tarefa está em uma). Abra a tarefa e troque a coluna pelo campo Coluna.",
      },
      {
        question: "A ordem que defini não foi mantida ao reordenar sem internet.",
        answer:
          "Sem conexão, mover entre colunas funciona, mas reordenar dentro da mesma coluna só assenta na posição exata quando o sistema sincroniza de volta. Ao reconectar ela se acerta.",
      },
      {
        question: "Não consigo apagar uma coluna.",
        answer:
          "Ela precisa estar vazia. Mova ou apague as tarefas e subcolunas dela primeiro. A coluna padrão nunca pode ser apagada.",
      },
    ],
    related: ["tasks", "task-views", "automations"],
  },
  {
    id: "tasks",
    group: "daily",
    title: "Tarefas em detalhe",
    summary: "Criar tarefas e usar todos os campos: status, prioridade, prazo, subtarefas e anexos.",
    icon: ListChecks,
    sections: [
      {
        heading: "Criar",
        intro:
          "“Nova tarefa” aparece na barra do quadro (cai na coluna padrão) e no rodapé de cada coluna (cai naquela coluna). O formulário tem:",
        bullets: [
          "Título (obrigatório).",
          "Descrição (opcional).",
          "Menções (opcional): quem deve ser avisado.",
          "Coluna e Responsável.",
          "Prazo (opcional) e Prioridade (opcional).",
        ],
        callouts: [
          {
            kind: "tip",
            text: "Na visualização em tabela, a última linha aceita um título direto: digite e pressione Enter para criar a tarefa sem abrir formulário.",
          },
        ],
      },
      {
        heading: "O painel da tarefa",
        intro:
          "Clicar numa tarefa abre um painel lateral sem tirar você do quadro. Existe também a página cheia da tarefa, com o mesmo conteúdo. Nele, de cima para baixo:",
        bullets: [
          "Título e descrição, editáveis no próprio lugar.",
          "Subtarefas: use “Adicionar” para criar; clicar numa subtarefa abre o painel dela.",
          "Dependências, Aprovações, Tempo e Anexos.",
          "Coluna, etapa, responsáveis, prazo, início, marco, estimativa e prioridade, cada um com seu seletor. Ao trocar, o valor é salvo na hora.",
          "Participantes.",
          "Campos extras do projeto.",
          "Comentários e o histórico de atividade, sempre por último.",
        ],
      },
      {
        heading: "Etapa, prioridade e prazo",
        bullets: [
          "Etapa: por onde a tarefa está passando. Toda etapa é de um de três tipos — a fazer, em andamento ou concluída — e cada projeto pode criar as suas (ex.: “Em revisão”) na aba Configurações.",
          "Prioridade: Baixa, Média, Alta ou Urgente.",
          "Prazo: aparece como etiqueta colorida. Vermelho para atrasada, âmbar para vence hoje ou em breve, cinza para o restante. Uma tarefa concluída deixa de contar como atrasada.",
        ],
        callouts: [
          {
            kind: "warning",
            text: "Depois de definidos, prazo e prioridade só podem ser trocados por outro valor. O sistema não permite deixá-los em branco de novo.",
          },
        ],
      },
      {
        heading: "Início, marco e estimativa",
        bullets: [
          "Começa em: a data em que o trabalho começa (opcional, nunca depois do prazo). Com início e prazo, a tarefa vira uma barra no Cronograma. Dá para tirar a data depois.",
          "Marco: marque quando a tarefa é um ponto importante (uma entrega, uma aprovação) e não um período de trabalho.",
          "Tempo estimado (horas e minutos) e Pontos de esforço: quanto a tarefa deve dar de trabalho. O tempo registrado aparece comparado com a estimativa.",
        ],
      },
      {
        heading: "Responsável e participantes",
        intro:
          "Responsáveis são quem executa a tarefa — pode ser mais de uma pessoa. O primeiro da lista é o principal (aparece no cartão); a estrela torna outra pessoa a principal. Participantes são pessoas que acompanham, sem serem responsáveis: use “Adicionar participante” para incluir quem precisa ficar por dentro.",
      },
      {
        heading: "Subtarefas",
        intro:
          "Divida uma tarefa grande em partes com o botão “Adicionar” da seção Subtarefas. Cada subtarefa é uma tarefa completa, com seu próprio status, responsável e prazo, e a lista já deixa o status editável ali mesmo.",
        callouts: [
          {
            kind: "warning",
            text: "Não é possível concluir uma tarefa que ainda tem subtarefas pendentes. Conclua ou finalize as subtarefas antes.",
          },
        ],
      },
      {
        heading: "Anexos",
        bullets: [
          "Envie arquivos pela seção Anexos, com até 20 MB cada.",
          "Cada anexo tem um botão de download.",
        ],
      },
      {
        heading: "Apagar e restaurar",
        intro:
          "Selecione tarefas no quadro e use “Apagar”: elas vão para a Lixeira do projeto junto com as subtarefas. O aviso que aparece tem o botão “Desfazer”, e na aba Lixeira dá para restaurar por 30 dias. Depois disso, a tarefa é apagada de vez.",
      },
    ],
    faq: [
      {
        question: "Não consigo concluir a tarefa.",
        answer:
          "Provavelmente ela tem subtarefas pendentes. O aviso é “Conclua ou finalize as subtarefas pendentes antes de concluir esta tarefa”.",
      },
      {
        question: "Quero tirar o prazo (ou a prioridade) de uma tarefa.",
        answer:
          "Não dá para remover: depois de definidos, só podem ser substituídos por outro valor.",
      },
      {
        question: "O arquivo não sobe.",
        answer:
          "O limite é de 20 MB por arquivo. Se for maior, comprima ou divida antes de enviar.",
      },
      {
        question: "Editei a tarefa e apareceu um aviso de que ela foi alterada por outra pessoa.",
        answer:
          "Duas pessoas editaram ao mesmo tempo. Atualize a tela para ver a versão mais recente e refaça a sua alteração.",
      },
    ],
    related: ["collaboration", "custom-fields", "task-views", "dependencies", "time-tracking"],
  },
  {
    id: "task-views",
    group: "daily",
    title: "Tabela e filtros de tarefas",
    summary: "Editar tarefas em lote na tabela e encontrar qualquer coisa com os filtros.",
    icon: Table2,
    sections: [
      {
        heading: "Visualização em tabela",
        intro:
          "Use o seletor “Modo de visualização das tarefas” para trocar cartões por uma tabela no estilo planilha, com as colunas Tarefa, Status, Prioridade, Responsável e Prazo.",
        bullets: [
          "Status, Prioridade, Responsável e Prazo são editáveis direto na célula: cada alteração é salva sozinha, sem botão “Salvar”.",
          "Clique no título para abrir a tarefa.",
          "Crie tarefas na última linha: digite o título e pressione Enter.",
        ],
      },
      {
        heading: "Barra de filtros",
        intro: "Combine quantos filtros quiser. Todos se aplicam ao mesmo tempo:",
        bullets: [
          "Busca: procura no título e na descrição. Não diferencia maiúsculas nem acentos (“acao” encontra “Ação”).",
          "Status e Prioridade: escolha um ou mais valores. Em Prioridade também há a opção de tarefas sem prioridade.",
          "Responsável: escolha pessoas ou tarefas sem responsável.",
          "Prazo: Atrasadas (não concluídas), Vencem hoje, Próximos 7 dias ou Sem prazo.",
        ],
      },
      {
        heading: "Mais filtros",
        intro: "O botão “Mais filtros” abre opções avançadas. Ele mostra quantas estão ativas:",
        bullets: [
          "Prazo entre, Criada entre e Atualizada entre: intervalos de datas (você pode preencher só um dos lados).",
          "Participante, Mencionado(a) na descrição e Criada por: filtram por pessoa.",
          "Anexos e Descrição: mostram só tarefas que têm (ou não têm) anexo ou descrição.",
          "Tipo: tarefas, subtarefas, ou ambas.",
        ],
        callouts: [
          {
            kind: "tip",
            text: "“Limpar filtros” aparece assim que há algum filtro ativo e volta tudo ao padrão de uma vez.",
          },
        ],
      },
      {
        heading: "Visões salvas",
        intro:
          "Usa sempre os mesmos filtros? Monte-os e escolha “Visões” → “Salvar filtros atuais como visão…”. Depois é um clique para voltar a eles.",
        bullets: [
          "Marque “Compartilhar com o projeto” para que todas as pessoas do projeto vejam a visão.",
          "Com uma visão aberta, “Atualizar” guarda nela os filtros de agora.",
          "Alguns filtros avançados (datas de criação/atualização, participante, menção, anexos, descrição) ainda não ficam salvos — o aviso diz quais.",
        ],
      },
    ],
    faq: [
      {
        question: "O filtro não acha uma tarefa que sei que existe.",
        answer:
          "Veja se há filtros ativos (o botão “Mais filtros” indica a quantidade) e se o intervalo de datas não está restringindo demais. “Limpar filtros” resolve rápido.",
      },
      {
        question: "Uma tarefa com prazo vencido não aparece em “Atrasadas”.",
        answer:
          "Tarefas concluídas não contam como atrasadas, mesmo com o prazo no passado.",
      },
    ],
    related: ["board", "tasks"],
  },
  {
    id: "project-stats",
    group: "daily",
    title: "Estatísticas do projeto",
    summary: "Entenda em números como o projeto está andando: o que já foi feito, o que atrasou e quem está com mais tarefas.",
    icon: BarChart3,
    sections: [
      {
        heading: "Onde ficam",
        intro:
          "Dentro do projeto, na aba Estatísticas, logo depois de Tarefas. Qualquer pessoa do projeto vê essa aba, inclusive em projetos arquivados. Ela só mostra números: nada ali altera as tarefas.",
        callouts: [
          {
            kind: "note",
            text: "Os números incluem os sub-projetos. Se “Site” tem o sub-projeto “Blog”, as tarefas do Blog também entram nas estatísticas do Site.",
          },
        ],
      },
      {
        heading: "Os números do topo",
        bullets: [
          "Total de tarefas: todas as tarefas do projeto, concluídas ou não.",
          "Tarefas em aberto: as que ainda não foram concluídas (estão em “A fazer” ou “Em progresso”).",
          "Taxa de conclusão: quanto do total já foi concluído. Se 3 de 10 tarefas estão concluídas, a taxa é de 30%.",
          "Taxa de atraso: das tarefas que têm prazo, quantas passaram do prazo sem ser concluídas.",
          "Tempo médio de conclusão: quanto tempo, em média, uma tarefa leva desde que foi criada até ser concluída.",
          "Urgentes em aberto: tarefas com prioridade Urgente que ainda não foram concluídas.",
        ],
      },
      {
        heading: "O que conta como atrasada",
        intro:
          "Uma tarefa está atrasada quando o prazo dela já passou e ela ainda não foi concluída. Tarefas sem prazo nunca contam como atrasadas e também ficam fora da conta da taxa de atraso: não é justo cobrar prazo de quem nunca teve um.",
        callouts: [
          {
            kind: "tip",
            text: "Se a taxa de atraso aparece como “Sem dados”, nenhuma tarefa do projeto tem prazo ainda. Defina prazos nas tarefas para acompanhar esse número.",
          },
        ],
      },
      {
        heading: "Tempo médio de conclusão",
        intro:
          "Só entram na conta as tarefas concluídas depois que o TaskFlow passou a guardar a data de conclusão. Tarefas concluídas antes disso não têm essa data e ficam de fora. Se nenhuma tarefa tiver a data, o número aparece como “Sem dados”, e não como zero.",
      },
      {
        heading: "Os gráficos",
        bullets: [
          "Tarefas por status: como as tarefas se dividem entre A fazer, Em progresso e Concluída.",
          "Tarefas por prioridade: quantas tarefas há em cada nível, de Baixa a Urgente.",
          "Tarefas criadas ao longo do tempo: quantas tarefas foram criadas em cada semana, nas últimas 12 semanas. As semanas começam na segunda-feira.",
          "Tarefas por responsável: quantas tarefas estão com cada pessoa. As que ninguém assumiu aparecem como “Sem responsável”.",
        ],
        callouts: [
          {
            kind: "tip",
            text: "Passe o mouse (ou toque) sobre uma barra, fatia ou ponto para ver o número exato.",
          },
        ],
      },
    ],
    faq: [
      {
        question: "O total não bate com o que vejo no quadro.",
        answer:
          "As estatísticas somam também as tarefas dos sub-projetos, que não aparecem no quadro deste projeto. Confira também se há filtros ativos no quadro.",
      },
      {
        question: "Mudei uma tarefa e o número não mudou.",
        answer:
          "Os números se atualizam sozinhos logo depois de uma mudança, inclusive as feitas por outras pessoas. Se algo parecer desatualizado, recarregue a página.",
      },
      {
        question: "Aparece “Sem dados” em vez de um número.",
        answer:
          "Significa que ainda não há informação suficiente para calcular aquele número, por exemplo nenhuma tarefa com prazo ou nenhuma tarefa concluída. Não é o mesmo que zero.",
      },
    ],
    related: ["tasks", "task-views", "projects"],
  },
  {
    id: "dependencies",
    group: "daily",
    title: "Dependências e cronograma",
    summary: "Diga que uma tarefa só começa depois de outra e veja tudo numa linha do tempo.",
    icon: CalendarRange,
    sections: [
      {
        heading: "Ligar tarefas",
        steps: [
          "Abra a tarefa que precisa esperar.",
          "Em Dependências, use “Esta tarefa depende de…” e busque a outra tarefa pelo nome.",
          "Pronto: enquanto a outra não terminar, aparece o aviso “Ainda falta terminar…”.",
        ],
        callouts: [
          {
            kind: "note",
            text: "Quando todas as tarefas de que ela depende terminam, o responsável recebe a notificação “Tarefa liberada”.",
          },
        ],
      },
      {
        heading: "Concluir antes da hora",
        intro:
          "Na aba Configurações do projeto você escolhe o que acontece se alguém concluir uma tarefa que ainda depende de outras: deixar e avisar, ou não deixar.",
      },
      {
        heading: "Cronograma",
        bullets: [
          "A aba Cronograma mostra as tarefas com datas como barras, do início ao prazo.",
          "As setas ligam o que precisa terminar antes. Marcos aparecem como losangos.",
          "As cores dizem a situação: a fazer, em andamento, concluída ou atrasada. A linha azul é hoje.",
          "Clique numa barra para abrir a tarefa. Use Dias, Semanas ou Meses para mudar o zoom.",
        ],
      },
    ],
    related: ["tasks"],
  },
  {
    id: "recurring-tasks",
    group: "daily",
    title: "Tarefas repetidas",
    summary: "Deixe o TaskFlow cadastrar sozinho o que se repete: contas, relatórios, compras.",
    icon: Repeat,
    sections: [
      {
        heading: "Criar uma repetição",
        steps: [
          "No projeto, abra a aba Repetições e clique em “Nova repetição”.",
          "Dê o título da tarefa e, se quiser, coluna, responsável, prioridade e prazo (em dias depois de criada).",
          "Escolha quando repete: todo dia, toda semana (e em quais dias), todo mês (e em qual dia) ou todo ano — e o horário.",
          "Confira as próximas datas que aparecem embaixo e salve.",
        ],
        callouts: [
          {
            kind: "tip",
            text: "Use “Inserir no título” para colocar a data, o dia da semana, o mês ou o ano no nome da tarefa: “Compras — 05/10/2026”.",
          },
          {
            kind: "note",
            text: "Dia 31 em “todo mês” significa “último dia do mês”: em fevereiro cai no dia 28 (ou 29).",
          },
        ],
      },
      {
        heading: "Pausar e retomar",
        intro:
          "A chave de cada repetição pausa e liga de novo. Se quem criou perder o acesso ao projeto, ou o projeto for arquivado, ela é pausada sozinha e o motivo aparece na lista.",
      },
    ],
    faq: [
      {
        question: "A tarefa não apareceu no horário exato.",
        answer: "Ela é criada até 1 minuto depois do horário escolhido.",
      },
      {
        question: "Apaguei a repetição. As tarefas somem?",
        answer: "Não. Só param de ser criadas novas; as que já existem continuam no projeto.",
      },
    ],
    related: ["templates"],
  },
  {
    id: "time-tracking",
    group: "daily",
    title: "Controle de tempo",
    summary: "Marque quanto tempo cada tarefa levou, com cronômetro ou à mão.",
    icon: Timer,
    sections: [
      {
        heading: "Cronômetro",
        bullets: [
          "Na seção Tempo da tarefa, clique em “Iniciar cronômetro”.",
          "Enquanto ele roda, um contador verde fica no topo da tela, em qualquer página. Clique no quadrado para parar e salvar.",
          "Só existe um cronômetro por pessoa: iniciar em outra tarefa para o anterior e salva o tempo dele.",
        ],
      },
      {
        heading: "Registrar à mão",
        intro:
          "Esqueceu de ligar o cronômetro? Use “Registrar à mão”: dia, hora de início e quanto tempo (até 24 horas por registro).",
      },
      {
        heading: "Relatório",
        intro:
          "Na aba Estatísticas do projeto, “Tempo registrado” mostra o total por pessoa ou por tarefa, no período que você escolher.",
      },
    ],
    related: ["tasks", "project-stats"],
  },
  {
    id: "approvals",
    group: "daily",
    title: "Aprovações",
    summary: "Peça o “ok” de alguém numa tarefa e acompanhe a resposta.",
    icon: BadgeCheck,
    sections: [
      {
        heading: "Pedir",
        steps: [
          "Abra a tarefa e, em Aprovações, clique em “Pedir aprovação”.",
          "Escolha a pessoa (pode ser um convidado, como um cliente) e deixe um recado se quiser.",
          "Ela recebe uma notificação. Enquanto não responder, você pode cancelar o pedido.",
        ],
      },
      {
        heading: "Responder",
        intro:
          "Os pedidos para você aparecem na própria tarefa e no Início, em “Aguardando sua aprovação”. Aprove ou recuse, com um comentário opcional — quem pediu é avisado.",
        callouts: [
          {
            kind: "tip",
            text: "Combine com uma automação: “quando uma aprovação for respondida com aprovada, mudar o status para Concluída”. Há um modelo pronto em Automações.",
          },
        ],
      },
    ],
    related: ["automations", "notifications"],
  },
  {
    id: "notifications",
    group: "daily",
    title: "Notificações e busca",
    summary: "Saiba o que mudou para você e encontre qualquer coisa no workspace.",
    icon: Bell,
    sections: [
      {
        heading: "O sino",
        bullets: [
          "O número vermelho no sino, no topo da tela, é quantos avisos você ainda não leu.",
          "Clique num aviso para ir direto à tarefa. “Marcar todas como lidas” limpa o contador.",
          "Você é avisado quando: é mencionado, vira responsável, comentam numa tarefa sua, uma tarefa sua muda de status, o prazo chega ou vence, uma tarefa é liberada, e em pedidos e respostas de aprovação.",
        ],
      },
      {
        heading: "Escolher o que receber",
        intro:
          "Em Conta → Notificações (ou na engrenagem do sino), ligue ou desligue cada tipo de aviso, no app, por e-mail e pelo WhatsApp. O WhatsApp usa o número que você vinculou ao assistente, na página Assistente. Sem número vinculado, nada é enviado por lá.",
      },
      {
        heading: "Busca",
        intro:
          "Clique em “Buscar” no topo ou aperte Ctrl+K (⌘K no Mac). Digite parte das palavras — sem se preocupar com acentos — e escolha uma tarefa, um comentário ou um projeto.",
      },
    ],
    href: "/settings/notifications",
    hrefLabel: "Abrir as preferências",
    related: ["collaboration"],
  },
  {
    id: "intake-forms",
    group: "advanced",
    title: "Formulários e importação",
    summary: "Receba pedidos de quem não usa o TaskFlow e traga tarefas de planilhas.",
    icon: FileInput,
    sections: [
      {
        heading: "Formulários de pedidos",
        steps: [
          "No projeto, abra Configurações → Formulários de pedidos → “Novo formulário”.",
          "Monte as perguntas. Uma delas vira o título da tarefa; as outras podem virar descrição, prazo ou prioridade.",
          "Copie o link e mande para quem quiser — não precisa ter conta.",
          "Cada resposta vira uma tarefa na coluna escolhida.",
        ],
        callouts: [
          {
            kind: "warning",
            text: "Quem tem o link consegue enviar. Se ele foi parar onde não devia, use “Trocar link”: o antigo para de funcionar na hora.",
          },
        ],
      },
      {
        heading: "Importar uma planilha",
        steps: [
          "Em Configurações → Importar e exportar, escolha um arquivo CSV (até 2 MB). Exportações do Asana, Jira e Trello funcionam direto.",
          "Confira de qual coluna vem cada informação — o TaskFlow já sugere sozinho.",
          "Veja quantas linhas estão prontas e quais têm problema (com o número da linha).",
          "Importe tudo, ou marque para importar só as linhas sem problema.",
        ],
      },
      {
        heading: "Exportar",
        intro:
          "Escolha Planilha (CSV, só as tarefas) ou Cópia completa (JSON, com colunas, comentários e dependências), clique em “Preparar arquivo” e depois em “Baixar”.",
      },
    ],
    related: ["projects"],
  },
  {
    id: "collaboration",
    group: "daily",
    title: "Comentários, menções e atividade",
    summary: "Converse dentro da tarefa, avise pessoas e acompanhe o que mudou.",
    icon: MessageSquare,
    sections: [
      {
        heading: "Comentar",
        steps: [
          "Abra a tarefa e escreva no campo de comentário, na parte de baixo do painel.",
          "Para avisar alguém, escolha as pessoas no seletor de menção antes de enviar.",
          "Envie. O comentário entra na lista da tarefa.",
        ],
        callouts: [
          {
            kind: "note",
            text: "A menção é uma escolha explícita no seletor, não um “@nome” digitado no texto. É por isso que o texto do comentário não muda quando você marca alguém.",
          },
        ],
      },
      {
        heading: "Respostas em thread",
        intro:
          "Use “Responder” num comentário para abrir uma conversa encadeada. O recuo visual para no terceiro nível para não estreitar demais o texto, mas você pode continuar respondendo indefinidamente.",
      },
      {
        heading: "Editar e reagir",
        bullets: [
          "Use o lápis para corrigir um comentário seu. Ele passa a mostrar “editado”.",
          "Use a carinha para reagir com um emoji. Clique de novo no emoji para tirar a sua reação; passe o mouse para ver quem reagiu.",
        ],
      },
      {
        heading: "Apagar comentários",
        bullets: [
          "Você apaga os seus. Proprietários e Administradores do workspace apagam os de qualquer pessoa.",
          "Um comentário que já tem respostas não pode ser apagado (o botão fica desabilitado).",
        ],
      },
      {
        heading: "Histórico de atividade",
        intro:
          "Sob os comentários, a linha do tempo da tarefa registra cada mudança: status, responsável, movimentação de coluna e novos comentários. Os comentários aparecem nos dois lugares de propósito: acima com o texto completo, e aqui como parte do resumo cronológico.",
      },
      {
        heading: "Atividade do projeto e do workspace",
        intro:
          "A mesma linha do tempo existe em dois tamanhos, sempre em ordem cronológica e paginada. É a melhor forma de responder “quem mudou isso e quando?”.",
        bullets: [
          "Do projeto: na aba Atividade, dentro do projeto. Mostra só o que mudou nele: tarefas, comentários, colunas e campos extras.",
          "Do workspace: na página Workspaces, na seção Atividade. Mostra tudo, de todos os projetos, mais o que é do workspace (membros, automações, chaves de API).",
        ],
      },
    ],
    faq: [
      {
        question: "Marquei alguém, mas o comentário não mostra o nome dele.",
        answer:
          "É esperado: a menção fica registrada à parte do texto. Quem foi marcado é avisado pelo sistema.",
      },
      {
        question: "Por que não consigo apagar um comentário meu?",
        answer:
          "Se ele tiver respostas, só é possível apagar depois de apagar as respostas.",
      },
    ],
    related: ["tasks", "workspaces"],
  },

  // ---------------------------------------------------------- advanced
  {
    id: "custom-fields",
    group: "advanced",
    title: "Campos extras",
    summary: "Acrescente informações próprias às tarefas de um projeto, do jeito da sua equipe.",
    icon: SlidersHorizontal,
    audience: "Criar e editar: Proprietário e Administrador. Preencher: quem edita tarefas.",
    sections: [
      {
        heading: "Criar um campo",
        steps: [
          "No projeto, abra a aba Campos extras e clique em “Novo campo”.",
          "Dê um nome (mínimo de 2 caracteres) e escolha o tipo.",
          "Nos tipos de seleção, informe pelo menos uma opção.",
        ],
      },
      {
        heading: "Qual tipo escolher",
        bullets: [
          "Texto: informação livre, como um link ou um número de pedido.",
          "Número: valores que você quer comparar, como estimativa em horas.",
          "Data: uma data além do prazo, como “data de entrega ao cliente”.",
          "Seleção única: uma escolha entre opções fixas, como “Cliente” ou “Tipo de demanda”.",
          "Seleção múltipla: várias opções ao mesmo tempo, como etiquetas.",
          "Caixa de seleção: sim ou não, como “Aprovado pelo cliente”.",
          "Pessoas: uma ou mais pessoas, além do responsável.",
        ],
      },
      {
        heading: "Preencher, editar e arquivar",
        bullets: [
          "Os valores são preenchidos no painel de cada tarefa, na área de campos personalizados.",
          "Nos campos de seleção, edite as opções quando quiser.",
          "Campos não são excluídos, são arquivados.",
        ],
        callouts: [
          {
            kind: "note",
            text: "Preencher um campo extra exige conexão. Diferente de título ou status, esses valores não entram na fila offline.",
          },
        ],
      },
    ],
    faq: [
      {
        question: "Não vejo a aba Campos extras, ou o botão “Novo campo”.",
        answer:
          "Gerenciar campos exige o papel de Proprietário ou Administrador no workspace.",
      },
      {
        question: "O campo que criei não aparece na tarefa.",
        answer:
          "Os campos são por projeto. Confira se a tarefa é do mesmo projeto em que o campo foi criado.",
      },
    ],
    related: ["tasks"],
  },
  {
    id: "automations",
    group: "advanced",
    title: "Automações",
    summary: "Regras “quando isso acontecer, faça aquilo” que rodam sozinhas.",
    icon: Workflow,
    audience: "Proprietário e Administrador",
    href: "/projects",
    hrefLabel: "Ir para Projetos",
    sections: [
      {
        heading: "O que são",
        intro:
          "Uma automação observa um evento e executa uma ação, sem ninguém precisar confirmar. Ótimo para tirar trabalho repetitivo da equipe, e justamente por rodar sozinha exige cuidado. Fica na aba Automações de cada projeto (só aparece para Proprietário e Administrador).",
      },
      {
        heading: "Comece por um template",
        intro:
          "Sem regras no projeto ainda, a galeria de modelos ocupa a aba. Escolha um e o formulário abre já preenchido, faltando só o que é do seu workspace (por exemplo, qual coluna). Esses campos ficam destacados em âmbar.",
        bullets: [
          "Mover para a coluna de concluídas: quando o status virar Concluída, a tarefa vai para a coluna que você escolher.",
          "Devolver ao Backlog ao reabrir: quando uma tarefa concluída for reaberta, ela volta para a coluna que você escolher.",
          "Atribuir a quem marcar como Urgente: a tarefa fica com quem mudou a prioridade para Urgente.",
          "Iniciar a tarefa ao atribuir: ao definir um responsável, o status vira Em progresso.",
        ],
      },
      {
        heading: "Montar uma regra",
        intro:
          "A regra é construída como uma frase: “Quando [uma tarefa] [tiver o status alterado] e [o novo status] [for] [Concluída], então [mover a tarefa] para a coluna [Concluída]”. Cada trecho entre colchetes é um campo que você clica para escolher.",
        steps: [
          "Escolha o que observar: tarefa, comentário, coluna ou campo extra.",
          "Escolha o evento. Exemplos para tarefas: status alterado, responsável alterado, mudar de coluna, prazo alterado, prioridade alterada, ganhar ou perder participante.",
          "Opcional: adicione condições para a regra só valer em certos casos (por exemplo, “o novo status for Concluída”).",
          "Escolha a ação: mover a tarefa, mudar a etapa (uma das etapas do projeto ou a padrão de A fazer, Em andamento ou Concluída), atribuir a tarefa, mudar a prioridade, adicionar ou remover participante, ou pedir a aprovação de alguém (com uma nota opcional).",
          "Preencha os valores da ação e confira a frase de prévia no topo do formulário, que muda a cada escolha.",
          "Salve. O nome é opcional: se você deixar em branco, a própria frase vira o nome.",
        ],
      },
      {
        heading: "Valor fixo ou valor do evento",
        intro:
          "Em cada parâmetro da ação você escolhe entre um “Valor fixo” (sempre o mesmo) e um “Valor do evento” (algo que veio do que aconteceu). Assim, uma regra pode atribuir a tarefa a “quem fez a alteração” em vez de sempre à mesma pessoa. Não é preciso digitar nenhuma sintaxe: você escolhe o campo do evento numa lista compatível.",
      },
      {
        heading: "Gerenciar regras",
        bullets: [
          "Ligue e desligue uma regra pelo botão ao lado dela, sem apagar.",
          "“Excluir automação” remove de vez.",
          "Com regras existentes, a lista ocupa a aba e os modelos ficam em “Ver modelos prontos”.",
        ],
      },
      {
        heading: "Automações de um projeto",
        intro:
          "Dentro de cada projeto há a aba Automações. Ali você vê só o que age naquele projeto e pode ligar, pausar, editar ou excluir sem sair dele.",
        bullets: [
          "“Automações deste projeto”: as que valem só para ele. Uma automação criada por essa aba já nasce limitada ao projeto.",
          "“Automações de todo o workspace”: as que valem para todos os projetos, e por isso também agem neste. Mudar uma delas muda o que acontece em todos os projetos.",
          "Se, ao montar a regra, ela deixar de estar limitada ao projeto, um aviso em âmbar mostra isso e oferece “Limitar a este projeto”.",
          "“Automações antigas do workspace”: regras criadas antes, que reagem a algo fora dos projetos (como alguém entrar no workspace). Não dá mais para criar ou editar regras assim, só pausar ou excluir.",
        ],
      },
      {
        heading: "Regra desativada",
        intro:
          "Uma regra pausada aparece como “Desativada”, com uma explicação ao passar o mouse. Ela pode ter sido pausada por alguém, ou pelo sistema se agiu vezes demais em pouco tempo, ou se quem a criou deixou de ser Proprietário ou Administrador. Para retomar, basta ligá-la de novo.",
        callouts: [
          {
            kind: "warning",
            text: "Cuidado com regras que desfazem o trabalho uma da outra. Duas regras sobre o mesmo evento, uma movendo para Concluídas e outra devolvendo ao Backlog, só convivem bem se as condições de cada uma forem diferentes (como fazem os templates).",
          },
          {
            kind: "note",
            text: "Ainda não existe um teste de regra nem um histórico de execuções. Comece com regras simples e observe o resultado na aba Atividade do projeto.",
          },
        ],
      },
    ],
    faq: [
      {
        question: "Não vejo a aba Automações no projeto.",
        answer:
          "Ela só aparece para Proprietários e Administradores do workspace do projeto.",
      },
      {
        question: "Uma regra parou de funcionar.",
        answer:
          "Veja se ela está marcada como Desativada. Se estiver, ligue-a novamente. Se o problema voltar, revise as condições e se a coluna ou o projeto escolhidos ainda existem.",
      },
      {
        question: "Ao salvar, aparece um erro dizendo que a automação é inválida.",
        answer:
          "O servidor valida cada regra. Pode ser que um evento, uma condição ou uma ação escolhida deixou de ser suportado. Escolha outra combinação ou comece de um template.",
      },
    ],
    related: ["board", "tasks", "workspaces", "developers"],
  },
  {
    id: "developers",
    group: "advanced",
    title: "Chaves de API e webhooks",
    summary: "Conecte um sistema seu ao workspace: chaves de API e avisos automáticos por webhook.",
    icon: Webhook,
    audience: "Proprietário e Administrador",
    href: "/developers",
    hrefLabel: "Abrir desenvolvedores",
    sections: [
      {
        heading: "Pra que serve, e quando ignorar",
        intro:
          "Isso é para quando existe (ou vai existir) um sistema seu — um site, uma planilha automatizada, um bot — que precisa conversar com o TaskFlow sem uma pessoa clicando na tela. Se sua equipe só usa a interface do TaskFlow no dia a dia, pode pular esta seção sem perder nada: nada aqui muda o funcionamento normal do workspace.",
        bullets: [
          "Chave de API: uma senha especial para um programa se identificar como o workspace, no lugar de uma pessoa.",
          "Webhook: um aviso automático que o TaskFlow manda para um endereço seu toda vez que algo escolhido acontece — por exemplo, uma tarefa mudar de status.",
        ],
        callouts: [
          {
            kind: "note",
            text: "As duas coisas ficam na página “Desenvolvedores”, no menu lateral, visível só para Proprietário e Administrador — os demais papéis nem veem o item no menu.",
          },
        ],
      },
      {
        heading: "Chaves de API",
        intro:
          "Uma chave pertence ao workspace, não a uma pessoa: se quem criou sair do workspace, ela continua funcionando normalmente.",
        steps: [
          "Na página Desenvolvedores → Chaves de API, clique em “Nova chave”.",
          "Dê um nome que ajude a lembrar pra que ela serve (por exemplo, “Integração com planilha de vendas”) e escolha os escopos: o que essa chave poderá fazer.",
          "Copie o valor completo da chave imediatamente — ele só aparece uma vez, na tela de criação. Depois disso, nem você consegue vê-lo de novo, só um trecho mascarado para reconhecer qual é qual.",
        ],
        bullets: [
          "Revogar uma chave é definitivo: não existe “reativar”, só criar outra.",
          "Prefira uma chave por sistema conectado. Se um deles vazar ou precisar ser desligado, você revoga só aquela, sem afetar as demais integrações.",
          "Uma chave também pode ter data de validade opcional, para expirar sozinha.",
        ],
        callouts: [
          {
            kind: "note",
            text: "Uma chave já consegue chamar a API de verdade: seu sistema envia “Authorization: Bearer” com o valor completo da chave, no lugar do login de uma pessoa. Cada chave só consegue fazer o que os escopos escolhidos permitem — o resto é recusado.",
          },
          {
            kind: "tip",
            text: "Perdeu o valor de uma chave sem anotar? Não tem como recuperar — a saída é “girar” a chave (gera um valor novo e invalida o antigo na hora, sem aviso prévio) ou criar uma nova.",
          },
        ],
      },
      {
        heading: "Webhooks",
        intro:
          "Um webhook é o oposto de ficar checando o TaskFlow toda hora: você cadastra um endereço seu (precisa ser https e público na internet — não funciona com endereços locais) e uma lista de eventos, e o TaskFlow avisa sozinho, na hora, sempre que um deles acontecer.",
        steps: [
          "Na página Desenvolvedores → Webhooks, clique em “Novo webhook”.",
          "Informe a URL (https://…) que vai receber os avisos e escolha os eventos, como “tarefa mudou de status” ou “membro adicionado ao workspace”.",
          "Use o botão de “ping” para mandar um evento de teste e confirmar que seu sistema está recebendo e respondendo corretamente, antes de contar com eventos de verdade.",
        ],
        bullets: [
          "Cada tentativa de entrega falhada é repetida automaticamente algumas vezes, com um intervalo crescente entre elas.",
          "Um histórico de entregas fica disponível por webhook, para conferir o que foi enviado e o que respondeu cada tentativa.",
        ],
        callouts: [
          {
            kind: "warning",
            text: "Depois de muitas falhas seguidas, o TaskFlow pausa o webhook sozinho (proteção contra ficar tentando pra sempre num endereço quebrado) e avisa por e-mail quem o criou. Corrija o problema do seu lado e reative manualmente na lista de webhooks — reativar também zera o contador de falhas.",
          },
        ],
      },
      {
        heading: "Segurança e histórico",
        intro:
          "Toda criação, edição, giro de segredo e remoção — de chaves e de webhooks — fica registrada na seção Atividade da página Workspaces, com quem fez e quando.",
        bullets: [
          "Só Proprietário e Administrador conseguem ver ou gerenciar qualquer uma das duas coisas, mesmo para apenas listar — mais restrito que a maioria das outras configurações, porque ambas dão acesso de longa duração ao workspace inteiro.",
        ],
      },
    ],
    faq: [
      {
        question: "Criei uma chave, mas minha chamada à API retorna 401 ou 403.",
        answer:
          "Confira se está enviando o valor completo da chave em “Authorization: Bearer …” (começa com tfk_live_ ou tfk_test_) e se ela não foi revogada nem expirou. Um erro de permissão costuma ser escopo insuficiente para aquela ação — revise os escopos da chave.",
      },
      {
        question: "Meu webhook parou de receber eventos.",
        answer:
          "Confira se ele não foi pausado automaticamente por falhas repetidas (a lista mostra o status). Se estiver pausado, corrija o endereço/servidor do seu lado e reative manualmente.",
      },
      {
        question: "Não vejo a página Desenvolvedores no menu.",
        answer:
          "Ela só aparece para Proprietário e Administrador do workspace atual — para os demais papéis, é esperado não existir.",
      },
    ],
    related: ["workspaces", "automations", "plans"],
  },
  {
    id: "assistant",
    group: "advanced",
    title: "Assistente de IA",
    summary: "Consulte e altere dados conversando, sempre com a sua confirmação.",
    icon: Bot,
    audience: "Ativação: Proprietário. Uso: quem estiver no workspace.",
    href: "/assistant",
    hrefLabel: "Abrir assistente",
    sections: [
      {
        heading: "Ativar",
        steps: [
          "O Proprietário abre a página Assistente, no menu lateral.",
          "Liga a opção. Todo workspace novo nasce com o assistente desligado.",
        ],
        callouts: [
          {
            kind: "note",
            text: "Enquanto estiver desligado, o campo de mensagem fica desabilitado com uma nota explicando o motivo.",
          },
        ],
      },
      {
        heading: "Conversar",
        intro:
          "Clique no ícone do assistente na barra superior. Peça o que precisa em linguagem natural. Ele consegue, por exemplo:",
        bullets: [
          "Criar e atualizar workspaces, projetos e tarefas.",
          "Atribuir tarefas, mudar o status, mover entre colunas e adicionar ou remover participantes.",
          "Pedir a aprovação de uma tarefa a alguém.",
          "Convidar e remover membros do workspace.",
          "Arquivar projetos, revogar sessões e excluir workspaces (ações críticas).",
        ],
      },
      {
        heading: "Arquivos e áudio",
        bullets: [
          "Use o clipe para enviar imagens, PDFs, planilhas e outros documentos, ou o microfone para falar em vez de digitar.",
          "O assistente só lê o conteúdo de um arquivo quando você pede (“leia”, “resuma”, “qual o total da nota?”). Sem esse pedido, ele só sabe o nome e o tipo do arquivo.",
          "Para guardar um arquivo numa tarefa, diga onde: “anexe na tarefa Contrato” ou “crie a tarefa Nota fiscal com este arquivo”. Dá para pedir isso numa mensagem seguinte, por até 30 minutos depois do envio.",
        ],
        callouts: [
          {
            kind: "note",
            text: "Arquivos muito grandes (acima de 5MB, ou PDFs com mais de 20 páginas) não são lidos, mas ainda podem ser anexados a uma tarefa.",
          },
        ],
      },
      {
        heading: "Nada acontece sem a sua confirmação",
        intro:
          "Quando o assistente quer fazer uma alteração, ele não executa: mostra um cartão de ação pendente com a descrição e os parâmetros exatos. Você decide:",
        bullets: [
          "Confirmar: executa a ação.",
          "Cancelar: descarta.",
        ],
        callouts: [
          {
            kind: "warning",
            text: "Escrever “sim” ou “pode fazer” no chat não confirma nada. Só o botão “Confirmar” do cartão executa. Confira sempre os detalhes do cartão, não apenas a frase que a IA escreveu.",
          },
        ],
      },
      {
        heading: "Ações críticas",
        intro:
          "Ações de maior risco (excluir workspace, remover membro, arquivar projeto e revogar sessão) pedem uma confirmação extra de identidade numa janela que não fecha ao clicar fora:",
        bullets: [
          "Com senha: digite sua senha atual.",
          "Com Google: use “Confirmar com Google”. Se sua conta tem os dois, você escolhe.",
          "Se errar a credencial, a janela deixa tentar de novo sem fechar. “Cancelar” dela só volta ao cartão; a ação continua pendente até você cancelá-la no cartão.",
        ],
        callouts: [
          {
            kind: "note",
            text: "Se você pedir para revogar a sua própria sessão e confirmar, você é desconectado e levado ao login.",
          },
        ],
      },
      {
        heading: "Resumo e privacidade da conversa",
        bullets: [
          "O cabeçalho mostra quantas ações você confirmou na conversa. “Encerrar e revisar” mostra a lista antes de fechar.",
          "A conversa não é guardada em lugar nenhum: ao fechar o painel, ela é descartada.",
        ],
      },
      {
        heading: "Pelo WhatsApp",
        intro:
          "Na página Assistente, em “Assistente no WhatsApp”, você vincula o seu número e passa a falar com o assistente sem abrir o TaskFlow:",
        steps: [
          "Informe o seu número (com DDD) e o workspace em que o assistente vai trabalhar.",
          "Clique em “Enviar código pelo WhatsApp”. Chega um código de 6 dígitos no seu WhatsApp.",
          "Digite o código na página e clique em Confirmar.",
          "Mande um “oi” para o número do TaskFlow (o botão “Abrir conversa” já abre o chat).",
        ],
        bullets: [
          "Mande texto, áudio, foto ou documento. Toda alteração pede confirmação com os botões Confirmar e Cancelar da própria conversa.",
          "Ações críticas (excluir, arquivar, remover membro, encerrar sessão) não podem ser confirmadas pelo WhatsApp: faça-as aqui no app.",
          "“nova” recomeça a conversa; “ajuda” lista os comandos; “/desvincular” desvincula o número.",
          "Para trocar de workspace, escolha outro no cartão do WhatsApp. Para parar, clique em Desvincular.",
          "Diferente do painel do app, as conversas pelo WhatsApp ficam guardadas: veja em “Conversas pelo WhatsApp”, na mesma página.",
        ],
        callouts: [
          {
            kind: "note",
            text: "O código vale 10 minutos. Depois de 5 códigos errados, peça outro.",
          },
        ],
      },
      {
        heading: "Proteção automática",
        intro:
          "Se o sistema perceber conteúdo suspeito repetidamente, ou várias falhas de reautenticação em pouco tempo, ele desliga o assistente do workspace sozinho. Depois disso, só um Proprietário pode reativá-lo.",
      },
    ],
    faq: [
      {
        question: "O campo de mensagem está desabilitado.",
        answer:
          "O assistente está desligado neste workspace. Peça a um Proprietário para ligá-lo na página Assistente.",
      },
      {
        question: "O assistente estava funcionando e parou.",
        answer:
          "A proteção automática pode tê-lo desligado. Um Proprietário precisa ativar de novo na página Assistente.",
      },
      {
        question: "Uma ação pendente deixou de responder ao Confirmar.",
        answer:
          "Ações pendentes expiram depois de um tempo. Peça a alteração de novo ao assistente.",
      },
    ],
    related: ["workspaces", "account", "plans"],
  },
  {
    id: "offline",
    group: "account",
    title: "Offline e tempo real",
    summary: "O que continua funcionando sem internet e como as mudanças chegam a todos.",
    icon: CloudOff,
    sections: [
      {
        heading: "O que funciona sem conexão",
        intro: "Sem internet você ainda pode alterar coisas que já existem:",
        bullets: [
          "Editar tarefas (título, descrição, status, coluna, responsável, prazo, prioridade).",
          "Editar projetos e colunas, e arquivar projetos.",
          "Editar opções e arquivar campos extras.",
          "Apagar colunas e comentários.",
        ],
      },
      {
        heading: "O que exige conexão",
        bullets: [
          "Criar qualquer coisa nova (tarefa, projeto, coluna, comentário…).",
          "Preencher valores de campos extras.",
          "Alterar menções.",
          "Mover projetos de lugar na hierarquia.",
          "Anexos e convites.",
        ],
      },
      {
        heading: "Como a fila funciona",
        steps: [
          "Ao editar offline, o aviso diz que a alteração foi salva no seu navegador e será sincronizada.",
          "O ícone de sincronização aparece na barra superior, com o número de alterações pendentes.",
          "Duas edições seguidas na mesma coisa viram uma só na fila.",
          "Ao voltar a conexão, tudo é enviado sozinho. O sistema também verifica a cada 30 segundos. Você pode forçar pelo ícone.",
        ],
        callouts: [
          {
            kind: "warning",
            text: "Se outra pessoa alterou a mesma coisa enquanto você estava offline, a versão do servidor prevalece e você recebe o aviso “Uma edição feita offline foi sobrescrita pela versão mais recente do servidor”. O servidor também pode rejeitar uma alteração, e nesse caso o aviso diz o motivo.",
          },
          {
            kind: "note",
            text: "A fila fica guardada no navegador. Não limpe os dados do site enquanto houver alterações pendentes.",
          },
        ],
      },
      {
        heading: "Tempo real",
        intro:
          "Com você online, alterações feitas por outras pessoas (ou por você em outro dispositivo) aparecem em poucos segundos, sem recarregar. Se a conexão em tempo real cair, o sistema reconecta sozinho e atualiza o que faltou.",
      },
    ],
    faq: [
      {
        question: "O ícone de sincronização sumiu.",
        answer:
          "Ele só aparece quando há algo a mostrar: você está offline, sincronizando ou com pendências. Sem isso, tudo está em dia.",
      },
      {
        question: "Minha edição offline não apareceu para os outros.",
        answer:
          "Ela só é enviada ao voltar a conexão. Confira o ícone de sincronização: se ainda houver pendências, use-o para forçar o envio.",
      },
    ],
    related: ["navigation", "tasks"],
  },
  {
    id: "account",
    group: "account",
    title: "Conta, senha e sessões",
    summary: "Entrar com segurança, trocar a senha e encerrar dispositivos.",
    icon: KeyRound,
    href: "/settings/profile#seguranca",
    hrefLabel: "Abrir perfil",
    sections: [
      {
        heading: "Criar conta e entrar",
        steps: [
          "Ao criar a conta, você recebe um código de 6 dígitos por e-mail e precisa confirmá-lo antes de entrar.",
          "No login com senha, o sistema pede um segundo código, também enviado por e-mail.",
          "Entrando com o Google, o segundo código não é pedido.",
          "A senha precisa ter pelo menos 8 caracteres. Se esquecer, use “Esqueci minha senha” na tela de login.",
        ],
      },
      {
        heading: "Segurança",
        intro: "Em Perfil, na seção de segurança, conforme a sua conta:",
        bullets: [
          "Com senha: altere informando a senha atual e a nova.",
          "Só com Google (sem senha): defina uma primeira senha, confirmando com o Google.",
          "Com senha e sem Google vinculado: vincule sua conta Google para poder entrar pelos dois caminhos. Não há como desvincular depois.",
        ],
        callouts: [
          {
            kind: "note",
            text: "Alterar ou definir a senha, ou vincular o Google, encerra as suas outras sessões. A sessão em que você está continua ativa.",
          },
        ],
      },
      {
        heading: "Sessões",
        intro:
          "Na seção Sessões, em Perfil, você vê cada dispositivo conectado, com o atual marcado como “Sessão atual”.",
        bullets: [
          "“Revogar” encerra uma sessão específica.",
          "“Encerrar todas” desconecta você de todos os dispositivos, inclusive este.",
        ],
        callouts: [
          {
            kind: "tip",
            text: "Viu um dispositivo que não reconhece? Revogue a sessão e troque a senha em seguida.",
          },
        ],
      },
    ],
    faq: [
      {
        question: "Não chegou o código por e-mail.",
        answer:
          "Confira a caixa de spam. Se você tentou entrar antes de confirmar o e-mail do cadastro, o sistema leva você de volta à tela de confirmação.",
      },
      {
        question: "Fui desconectado sozinho.",
        answer:
          "Isso acontece se a sessão foi revogada (por você, em outro dispositivo, ou ao trocar a senha) ou expirou. Basta entrar de novo.",
      },
    ],
    related: ["assistant", "navigation", "plans"],
  },
  {
    id: "plans",
    group: "account",
    title: "Plano e uso de IA",
    summary: "O limite de uso do assistente e como trocar de plano.",
    icon: Coins,
    href: "/settings/plan",
    hrefLabel: "Abrir Plano",
    sections: [
      {
        heading: "O que é um plano",
        intro:
          "Um plano define quantos “tokens” — a unidade que mede o quanto o modelo de IA processou — você pode gastar usando a IA do TaskFlow, como o chat do assistente. Cada plano tem um preço por mês (ainda só informativo: não há cobrança). O plano é por pessoa, não por workspace: o mesmo plano vale em todos os workspaces em que você está.",
        callouts: [
          {
            kind: "note",
            text: "Nenhuma conta nasce com um plano escolhido. Enquanto você não escolher um, vale o limite do plano FREE, marcado como “Padrão” na lista — nunca fica sem limite.",
          },
        ],
      },
      {
        heading: "Escolher ou trocar de plano",
        steps: [
          "Abra Configurações → Plano.",
          "No topo aparece o seu plano atual, com o preço que você paga (já com desconto, se tiver).",
          "Na lista, cada plano mostra o limite por mês, quanto isso dá por semana e por dia, e o preço. O seu está marcado como “Seu plano”.",
          "Clique em “Escolher este plano” no que quiser. Se tiver um cupom, digite-o e clique em “Aplicar” para ver o preço com desconto.",
          "Clique em “Trocar de plano” para confirmar.",
        ],
        callouts: [
          {
            kind: "note",
            text: "Ainda não há cobrança: qualquer plano da lista pode ser escolhido livremente, mesmo o maior.",
          },
        ],
      },
      {
        heading: "Cupons de desconto",
        bullets: [
          "Um cupom dá desconto no preço mensal de um plano pago, por um mês, por alguns meses ou enquanto você ficar no plano.",
          "Para usar no plano que você já tem, clique em “Tenho um cupom”, no quadro do seu plano. Para usar ao trocar, digite o cupom na janela de troca.",
          "Cada pessoa usa cada cupom uma vez. Um cupom novo substitui o desconto que você tinha.",
          "O desconto vale só para o plano em que foi aplicado: trocar para outro plano encerra o desconto.",
          "O preço com desconto fica guardado como estava no dia do resgate, mesmo que o preço do plano mude depois.",
        ],
      },
      {
        heading: "Como o limite é dividido",
        intro:
          "O único número de um plano é o limite por mês. Os limites por dia e por semana são calculados a partir dele: o mensal dividido por 30 dá o do dia, e dividido por 4 dá o da semana. A ideia é evitar gastar o mês inteiro num dia só e suavizar picos de uso na semana. Por exemplo, um plano de 1 milhão de tokens por mês permite cerca de 33 mil por dia e 250 mil por semana.",
        bullets: [
          "As três contagens recomeçam sozinhas no horário UTC, um relógio internacional fixo: a do dia à meia-noite UTC (21h no horário de Brasília), a da semana na segunda-feira às 00:00 UTC e a do mês no dia 1º às 00:00 UTC.",
          "O que sobra de um dia, semana ou mês não passa para o período seguinte — cada um recomeça do zero.",
          "Os três limites valem ao mesmo tempo: mesmo com saldo no mês, o limite do dia pode barrar primeiro.",
        ],
      },
      {
        heading: "Ver seu consumo",
        intro:
          "Em Configurações → Plano, abaixo da lista de planos, você vê quantos tokens já gastou hoje, nesta semana e neste mês, contados das mesmas viradas em UTC que o limite usa. Logo depois vem o histórico detalhado de cada uso, que também aparece na página Assistente.",
        callouts: [
          {
            kind: "note",
            text: "Cada número vem com uma barra que mostra quanto do limite do seu plano já foi usado. Eles se atualizam a cada poucos minutos; use o botão “Atualizar” para ver na hora.",
          },
          {
            kind: "note",
            text: "No histórico, os totais do topo somam o período inteiro escolhido. A lista abaixo deles é dividida em páginas — somar só uma página dá menos do que o total.",
          },
          {
            kind: "note",
            text: "“Verificação de segurança” é uma checagem automática que o assistente faz no conteúdo da conversa. Ela também usa a IA, então aparece no histórico e conta para o limite.",
          },
        ],
      },
      {
        heading: "O que acontece ao atingir o limite",
        intro:
          "Se você tentar usar o assistente depois de atingir qualquer um dos limites (dia, semana ou mês), a mensagem é recusada com um aviso de que o limite de IA do seu plano foi atingido. Não é uma falha do sistema — é o limite funcionando como esperado, e nenhum token é gasto na tentativa.",
        bullets: [
          "O aviso não diz qual dos três limites foi atingido — em geral é o do dia, o mais apertado.",
          "O uso volta sozinho quando o período recomeçar, sem nenhuma ação sua. Se precisar de mais, troque para um plano com limite maior.",
          "Um aviso diferente, de “muitas perguntas em pouco tempo”, não tem a ver com o plano: é um limite de frequência que protege o sistema. Basta esperar um pouco e tentar de novo.",
        ],
      },
      {
        heading: "Para administradores da plataforma",
        intro:
          "Administradores da plataforma (papel diferente de Administrador de workspace) têm uma área própria, em Administração → Planos, para criar planos e ajustar o teto e o preço de um existente, e podem corrigir manualmente o plano de um cliente específico pela página de detalhe dele. Em Administração → Cupons, criam e acompanham os cupons de desconto.",
        callouts: [
          {
            kind: "note",
            text: "O nome de um plano só pode ser definido na criação — não é possível renomear um plano existente. Ao digitar o limite mensal, a tela já mostra quanto ele dá por semana e por dia.",
          },
          {
            kind: "warning",
            text: "O plano FREE, marcado como “Padrão da plataforma”, é o que vale para toda conta que nunca escolheu nem recebeu um plano. Mudar o limite dele afeta todas essas contas de uma vez.",
          },
          {
            kind: "note",
            text: "Na página do cliente, dá para atribuir um plano e ver o histórico de uso de IA dele. Trocar o plano de alguém para outro encerra o desconto que a pessoa tinha.",
          },
          {
            kind: "note",
            text: "Cupons: o código e os termos do desconto não mudam depois de criados. Para mudá-los, desative o cupom e crie outro. Só dá para apagar um cupom que ninguém usou; os outros são desativados, o que não cancela descontos já resgatados. O ícone de pessoas mostra quem usou cada cupom.",
          },
        ],
      },
    ],
    faq: [
      {
        question: "Já escolhi um plano, por que não vejo qual é na tela?",
        answer:
          "É uma limitação de verdade, não um esquecimento da interface: não existe hoje uma forma de consultar o plano já escolhido, só de trocar.",
      },
      {
        question: "Recebi um aviso de limite de tokens atingido.",
        answer:
          "Você atingiu o limite de IA do seu plano (do dia, da semana ou do mês). Ele libera sozinho quando o período recomeçar; se precisar de mais, troque para um plano com limite maior em Configurações → Plano.",
      },
      {
        question: "Preciso pagar para escolher um plano?",
        answer:
          "Não. O plano é só um limite de uso de IA, e qualquer plano da lista pode ser escolhido livremente.",
      },
      {
        question: "Por que o meu “dia” de uso não começa à meia-noite?",
        answer:
          "Os limites usam o horário UTC, igual para todo mundo, para que a virada seja previsível. No horário de Brasília, o dia de uso recomeça às 21h.",
      },
    ],
    related: ["assistant", "account"],
  },
];

export function getGuide(id: string) {
  return TUTORIAL_GUIDES.find((guide) => guide.id === id);
}
