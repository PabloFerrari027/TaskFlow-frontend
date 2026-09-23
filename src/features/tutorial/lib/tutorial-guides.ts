import type { LucideIcon } from "lucide-react";
import {
  BarChart3,
  Bot,
  Building2,
  Coins,
  Compass,
  CloudOff,
  FolderKanban,
  KeyRound,
  Kanban,
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
          "Se você ainda não tem workspace, o Dashboard mostra “Você ainda não tem um workspace”. Crie um pelo seletor no topo, em “Novo workspace”.",
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
        bullets: [
          "Dashboard: os projetos ativos do workspace atual.",
          "Projetos: todos os projetos do workspace, ativos e arquivados, em árvore ou tabela.",
          "Análises: números e gráficos do workspace, com perguntas em texto livre.",
          "Atividade: linha do tempo de tudo que aconteceu no workspace atual.",
          "Automações: regras automáticas do workspace atual (só Proprietário e Administrador veem este item).",
          "Desenvolvedores: chaves de API e webhooks do workspace atual (só Proprietário e Administrador veem este item).",
          "Assistente: liga ou desliga o assistente de IA do workspace atual.",
          "Workspaces: seus workspaces, membros e convites.",
          "Sessões e Segurança: seus dispositivos conectados, senha e vínculo com o Google.",
        ],
      },
    ],
    faq: [
      {
        question: "Criei um projeto mas ele não aparece.",
        answer:
          "Confira o workspace selecionado no topo: cada workspace tem seus próprios projetos. Projetos arquivados saem do Dashboard, mas continuam na página Projetos.",
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
          "Seletor de workspace: troca o workspace atual. Tudo que você vê (projetos, análises, atividade) é do workspace selecionado.",
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
        ],
      },
      {
        heading: "A página do workspace",
        intro:
          "Ao abrir um workspace você encontra duas seções, uma embaixo da outra:",
        bullets: [
          "Membros: quem faz parte, com o papel de cada um.",
          "Convites: convites enviados e o estado de cada um (pendente, aceito, revogado ou expirado), com a data de expiração.",
        ],
        callouts: [
          {
            kind: "note",
            text: "Atividade, Automações, Desenvolvedores e Assistente têm cada um sua própria página no menu lateral, sempre referentes ao workspace selecionado no topo — não ficam nesta página.",
          },
        ],
      },
      {
        heading: "Convidar pessoas",
        steps: [
          "Na seção Membros ou Convites da página do workspace, clique em “Convidar pessoa”.",
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
          "Em Projetos (ou no Dashboard), clique em “Novo projeto”.",
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
          "Projetos não são excluídos, apenas arquivados: eles saem do Dashboard e ficam marcados como Arquivado na página Projetos. Use “Arquivar projeto” no cabeçalho e confirme.",
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
          "Anexos.",
          "Coluna, status, responsável, prazo e prioridade, cada um com seu seletor. Ao trocar, o valor é salvo na hora.",
          "Participantes.",
          "Campos extras do projeto.",
          "Comentários e o histórico de atividade, sempre por último.",
        ],
      },
      {
        heading: "Status, prioridade e prazo",
        bullets: [
          "Status: A fazer, Em progresso ou Concluída.",
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
        heading: "Responsável e participantes",
        intro:
          "O responsável é quem executa a tarefa, e é uma pessoa só; ele pode ser retirado a qualquer momento. Participantes são pessoas que acompanham, sem serem o responsável: use “Adicionar participante” para incluir quem precisa ficar por dentro.",
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
        heading: "Sem exclusão",
        intro:
          "Tarefas não são excluídas. Use o status Concluída para tirá-las do seu foco, e os filtros para escondê-las quando quiser.",
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
    related: ["collaboration", "custom-fields", "task-views"],
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
        heading: "Atividade do workspace",
        intro:
          "Na página Atividade, no menu lateral, você vê tudo que acontece no workspace atual, em ordem cronológica e paginado. É a melhor forma de responder “quem mudou isso e quando?”.",
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
    related: ["tasks", "analytics"],
  },
  {
    id: "automations",
    group: "advanced",
    title: "Automações",
    summary: "Regras “quando isso acontecer, faça aquilo” que rodam sozinhas.",
    icon: Workflow,
    audience: "Proprietário e Administrador",
    href: "/automations",
    hrefLabel: "Abrir automações",
    sections: [
      {
        heading: "O que são",
        intro:
          "Uma automação observa um evento e executa uma ação, sem ninguém precisar confirmar. Ótimo para tirar trabalho repetitivo da equipe, e justamente por rodar sozinha exige cuidado. Fica na página Automações, no menu lateral (só aparece para Proprietário e Administrador).",
      },
      {
        heading: "Comece por um template",
        intro:
          "Sem regras ainda, a galeria de templates ocupa a tela. Escolha um e o formulário abre já preenchido, faltando só o que é do seu workspace (por exemplo, qual coluna). Esses campos ficam destacados em âmbar.",
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
          "Escolha o que observar: tarefa, comentário, coluna, projeto, campo extra ou o próprio workspace.",
          "Escolha o evento. Exemplos para tarefas: status alterado, responsável alterado, mudar de coluna, prazo alterado, prioridade alterada, ganhar ou perder participante.",
          "Opcional: adicione condições para a regra só valer em certos casos (por exemplo, “o novo status for Concluída”).",
          "Escolha a ação: mover a tarefa, mudar o status, atribuir a tarefa, mudar a prioridade, adicionar ou remover participante.",
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
          "Com regras existentes, a lista ocupa a tela e os templates ficam em “Nova a partir de um template”.",
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
            text: "Ainda não existe um teste de regra nem um histórico de execuções. Comece com regras simples e observe o resultado na página Atividade.",
          },
        ],
      },
    ],
    faq: [
      {
        question: "Não vejo a página Automações no menu.",
        answer:
          "Ela só aparece para Proprietários e Administradores do workspace atual.",
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
          "Toda criação, edição, giro de segredo e remoção — de chaves e de webhooks — fica registrada na página Atividade, com quem fez e quando.",
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
          "Convidar e remover membros do workspace.",
          "Arquivar projetos, revogar sessões e excluir workspaces (ações críticas).",
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
    id: "analytics",
    group: "advanced",
    title: "Análises e perguntas em texto livre",
    summary: "Entenda os números do workspace e pergunte o que quiser sobre eles.",
    icon: BarChart3,
    href: "/analytics",
    hrefLabel: "Abrir análises",
    sections: [
      {
        heading: "O painel",
        intro:
          "Tudo vale para o workspace atual. No topo, três indicadores: Tarefas no total, Tarefas concluídas e Projetos ativos. Abaixo, os gráficos:",
        bullets: [
          "Tarefas por status, por responsável e por projeto.",
          "Projetos por status.",
          "Tarefas atrasadas por projeto.",
          "Taxa de conclusão por projeto e Taxa de atraso por projeto (em porcentagem).",
          "Tempo médio de conclusão por projeto (em dias e horas).",
        ],
        callouts: [
          {
            kind: "note",
            text: "Onde não há dado suficiente, o painel mostra “Sem dados” em vez de zero. Zero e “sem informação” não são a mesma coisa.",
          },
        ],
      },
      {
        heading: "Perguntar em linguagem natural",
        steps: [
          "No campo “Pergunte em linguagem natural”, escreva sua dúvida, com até 500 caracteres. Por exemplo: “Quantas tarefas atrasadas temos, agrupadas por projeto?”.",
          "Clique em “Perguntar”.",
          "Leia a linha “Entendi como: …”. Ela mostra como o sistema interpretou a pergunta.",
          "O resultado aparece abaixo: cartões de número quando a pergunta não agrupa nada, ou um gráfico de barras (as 10 maiores) quando agrupa.",
        ],
        callouts: [
          {
            kind: "tip",
            text: "Se a interpretação estiver errada, reescreva com mais detalhe: cite o que contar (tarefas ou projetos), o filtro (atrasadas, concluídas) e o agrupamento (por projeto, por responsável).",
          },
        ],
      },
    ],
    faq: [
      {
        question: "Aparece “Sem dados” num gráfico.",
        answer:
          "Ainda não há informação suficiente para calcular aquele valor, por exemplo, taxas em projetos sem tarefas com prazo.",
      },
      {
        question: "Recebi uma mensagem de limite de uso ao perguntar.",
        answer:
          "As perguntas em texto livre têm um limite de uso. Aguarde um pouco e tente de novo.",
      },
      {
        question: "O sistema não conseguiu entender minha pergunta.",
        answer:
          "Reformule de forma mais direta, com o que contar, o filtro e o agrupamento. Perguntas fora de tarefas e projetos não são suportadas.",
      },
    ],
    related: ["board", "custom-fields", "plans"],
  },

  // ----------------------------------------------------------- account
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
    href: "/settings/security",
    hrefLabel: "Abrir segurança",
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
        intro: "Em Segurança, conforme a sua conta:",
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
          "Em Sessões você vê cada dispositivo conectado, com o atual marcado como “Sessão atual”.",
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
    summary: "O limite de uso do assistente e das análises em linguagem natural, e como trocar de plano.",
    icon: Coins,
    href: "/settings/plan",
    hrefLabel: "Abrir Plano",
    sections: [
      {
        heading: "O que é um plano",
        intro:
          "Um plano define quantos “tokens” — a unidade que mede o quanto o modelo de IA processou — você pode gastar por mês usando o chat do assistente e as perguntas em linguagem natural das Análises. É por pessoa, não por workspace: o mesmo plano vale em todos os workspaces em que você está.",
        callouts: [
          {
            kind: "note",
            text: "Nenhuma conta nasce com um plano. Enquanto você não escolher um, não existe limite algum — o assistente e as análises em linguagem natural funcionam livremente.",
          },
        ],
      },
      {
        heading: "Escolher ou trocar de plano",
        steps: [
          "Abra Configurações → Plano.",
          "Veja a lista de planos disponíveis, com o teto mensal de cada um.",
          "Clique em “Assinar este plano” no que quiser.",
        ],
        callouts: [
          {
            kind: "warning",
            text: "Não existe, hoje, uma tela que mostre qual é o seu plano atual — só é possível trocar. Se tiver dúvida se já escolheu algum antes, pode escolher de novo sem problema: a troca sempre substitui o que valia antes.",
          },
          {
            kind: "note",
            text: "Nesta versão não há cobrança: qualquer plano cadastrado pode ser escolhido livremente, mesmo o maior.",
          },
        ],
      },
      {
        heading: "Como o limite é dividido",
        intro:
          "O único número de um plano é o teto por mês. Os tetos por dia e por semana são calculados a partir dele (aproximadamente 1/30 por dia e 1/4 por semana) — a ideia é evitar gastar o mês inteiro num dia só, e suavizar picos de uso na semana.",
        bullets: [
          "As três contagens (dia, semana, mês) resetam sozinhas, num horário fixo internacional — o \"dia\" do sistema pode começar um pouco antes ou depois da meia-noite do seu fuso local.",
          "O que sobra de um dia (ou semana) não passa para o período seguinte — cada um reseta do zero.",
        ],
      },
      {
        heading: "O que acontece ao atingir o limite",
        intro:
          "Se você tentar usar o assistente ou perguntar algo em linguagem natural depois de atingir qualquer um dos tetos, a ação é recusada com um aviso de limite de tokens atingido. Não é uma falha do sistema — é o teto do seu plano funcionando como esperado.",
        bullets: [
          "O teto mais apertado (em geral o diário) costuma ser o primeiro a barrar.",
          "Espere o próximo período (o reset é automático, sem ação sua) ou troque para um plano com teto maior.",
        ],
      },
      {
        heading: "Para administradores da plataforma",
        intro:
          "Administradores da plataforma (papel diferente de Administrador de workspace) têm uma área própria, em Administração → Planos, para criar planos e ajustar o teto de um existente, e podem corrigir manualmente o plano de um cliente específico pela página de detalhe dele.",
        callouts: [
          {
            kind: "note",
            text: "O nome de um plano só pode ser definido na criação — não é possível renomear um plano existente.",
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
          "Você atingiu o teto de tokens de IA do seu plano (dia, semana ou mês). Espere o próximo período resetar sozinho, ou troque para um plano com um teto maior em Configurações → Plano.",
      },
      {
        question: "Preciso pagar para escolher um plano?",
        answer:
          "Não, nesta versão. Qualquer plano cadastrado pode ser escolhido livremente, sem cobrança.",
      },
    ],
    related: ["assistant", "analytics", "account"],
  },
];

export function getGuide(id: string) {
  return TUTORIAL_GUIDES.find((guide) => guide.id === id);
}
