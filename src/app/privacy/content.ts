// Conteúdo da página /privacy. Fica separado do JSX para que o texto jurídico
// possa ser revisado/editado sem mexer no layout.

// TODO: confirmar o canal oficial de privacidade antes de publicar.
export const PRIVACY_CONTACT_EMAIL = "privacidade@taskflow.app";

export const LAST_UPDATED = "20 de setembro de 2026";

export const SECTIONS = [
  { id: "resumo", label: "Resumo" },
  { id: "dados-coletados", label: "Dados que coletamos" },
  { id: "como-usamos", label: "Como usamos seus dados" },
  { id: "assistente-ia", label: "Assistente de IA e análises" },
  { id: "compartilhamento", label: "Compartilhamento" },
  { id: "navegador", label: "Armazenamento no navegador" },
  { id: "seguranca", label: "Segurança" },
  { id: "retencao", label: "Retenção e exclusão" },
  { id: "direitos", label: "Seus direitos" },
  { id: "faq", label: "Perguntas frequentes" },
  { id: "contato", label: "Contato e alterações" },
] as const;

export const SUMMARY_POINTS = [
  {
    title: "Só o necessário",
    description:
      "Coletamos os dados que o TaskFlow precisa para funcionar: sua conta, seu conteúdo de trabalho e informações de segurança da sessão.",
  },
  {
    title: "Nada de rastreamento",
    description:
      "Não usamos cookies de publicidade nem ferramentas de rastreamento de terceiros no aplicativo.",
  },
  {
    title: "Você no controle",
    description:
      "Você pode ver e encerrar suas sessões, alterar sua senha e exercer seus direitos previstos na LGPD a qualquer momento.",
  },
] as const;

export interface DataCategory {
  category: string;
  data: string;
  purpose: string;
}

export const DATA_CATEGORIES: DataCategory[] = [
  {
    category: "Conta",
    data: "Nome, e-mail e senha (armazenada de forma protegida, nunca em texto puro).",
    purpose: "Criar e identificar sua conta, autenticar você e enviar códigos de verificação.",
  },
  {
    category: "Login com Google",
    data: "Token de identidade fornecido pelo Google, com e-mail e nome do perfil.",
    purpose: "Permitir entrar ou vincular sua conta sem senha. Não acessamos seus e-mails, contatos ou arquivos do Google.",
  },
  {
    category: "Sessões e segurança",
    data: "Informações do dispositivo, endereço IP e datas de criação e último uso de cada sessão.",
    purpose: "Exibir suas sessões ativas, permitir revogá-las e proteger sua conta contra acessos indevidos.",
  },
  {
    category: "Conteúdo de trabalho",
    data: "Workspaces, projetos, seções, tarefas, campos personalizados, comentários, menções e convites que você cria ou recebe.",
    purpose: "Entregar a funcionalidade principal do produto e permitir a colaboração com sua equipe.",
  },
  {
    category: "Histórico de atividade",
    data: "Registro de quem alterou o quê e quando dentro de um workspace ou tarefa.",
    purpose: "Dar transparência à equipe e permitir acompanhar o que mudou.",
  },
  {
    category: "Assistente e consultas analíticas",
    data: "Mensagens que você envia ao assistente e perguntas feitas em linguagem natural na tela de análises.",
    purpose: "Gerar respostas, sugerir ações e montar métricas a partir das suas perguntas.",
  },
];

export const USAGE_PURPOSES = [
  "Prestar o serviço: autenticar você, exibir seus projetos e tarefas e sincronizar alterações entre dispositivos e integrantes da equipe.",
  "Proteger sua conta: verificação em duas etapas por e-mail, controle de sessões e confirmação extra em ações sensíveis.",
  "Enviar comunicações necessárias ao serviço, como códigos de verificação, redefinição de senha e convites.",
  "Notificar você quando for mencionado ou convidado para um projeto ou workspace.",
  "Gerar análises e métricas sobre o seu próprio trabalho.",
  "Manter e melhorar o produto, corrigir falhas e prevenir fraudes e abusos.",
  "Cumprir obrigações legais e regulatórias, quando aplicável.",
];

export const NOT_DONE = [
  "Não vendemos seus dados pessoais.",
  "Não usamos o conteúdo dos seus projetos para publicidade.",
  "Não lemos seu conteúdo de trabalho para fins que não sejam operar, proteger e dar suporte ao serviço.",
];

export const AI_POINTS = [
  "O assistente e as consultas em linguagem natural só processam o que você digita quando decide usá-los, além do contexto necessário do workspace atual para responder.",
  "A conversa com o assistente não é salva: ela existe apenas enquanto a janela está aberta e some ao fechá-la.",
  "O assistente nunca altera seus dados sozinho. Toda ação que modifica algo aparece com uma descrição e os parâmetros exatos, e só é executada depois da sua confirmação. Ações críticas ainda pedem que você confirme sua identidade novamente.",
  "As respostas são geradas automaticamente e podem conter erros. Revise sempre a ação proposta antes de confirmar.",
];

export const SHARING_POINTS = [
  {
    title: "Integrantes do seu workspace e projetos",
    description:
      "Seu nome, e-mail, comentários, menções e atividades ficam visíveis para as pessoas com quem você colabora, de acordo com o papel de cada uma.",
  },
  {
    title: "Google",
    description:
      "Se você escolher entrar com Google, a validação da identidade é feita pelo próprio Google, sujeita à política de privacidade dele.",
  },
  {
    title: "Prestadores de serviço",
    description:
      "Empresas que nos ajudam a operar o TaskFlow, como hospedagem, envio de e-mails e processamento do assistente de IA, apenas na medida necessária para prestar o serviço.",
  },
  {
    title: "Autoridades",
    description:
      "Quando houver obrigação legal ou ordem de autoridade competente.",
  },
];

export interface BrowserStorageItem {
  name: string;
  description: string;
}

export const BROWSER_STORAGE: BrowserStorageItem[] = [
  {
    name: "Sessão de login",
    description: "Mantém você conectado neste dispositivo até você sair ou a sessão expirar.",
  },
  {
    name: "Preferências de interface",
    description: "Tema, barra lateral recolhida, modo de visualização (quadro ou tabela), largura de colunas e workspace atual.",
  },
  {
    name: "Modo offline",
    description: "Um identificador do dispositivo e uma fila com alterações feitas sem conexão, enviadas assim que você voltar a ficar online.",
  },
];

export const SECURITY_POINTS = [
  "Verificação em duas etapas por código enviado ao seu e-mail no login com senha.",
  "Lista de sessões ativas, com opção de encerrar qualquer uma delas.",
  "Confirmação de identidade adicional antes de ações críticas feitas pelo assistente.",
  "Controle de acesso por papéis em workspaces e projetos.",
  "Comunicação entre o aplicativo e a API protegida por conexão criptografada (HTTPS).",
];

export const RIGHTS = [
  "Confirmar que tratamos seus dados e acessá-los.",
  "Corrigir dados incompletos, inexatos ou desatualizados.",
  "Solicitar anonimização, bloqueio ou eliminação de dados desnecessários ou tratados em desconformidade.",
  "Solicitar a portabilidade dos seus dados.",
  "Saber com quem compartilhamos seus dados.",
  "Revogar consentimentos dados anteriormente.",
  "Reclamar à Autoridade Nacional de Proteção de Dados (ANPD).",
];

export interface FaqItem {
  question: string;
  answer: string;
}

export const FAQ: FaqItem[] = [
  {
    question: "Quais dados pessoais o TaskFlow coleta?",
    answer:
      "Nome, e-mail, informações de sessão (dispositivo e IP) e o conteúdo que você cria no produto, como projetos, tarefas e comentários. A tabela na seção “Dados que coletamos” detalha cada categoria e sua finalidade.",
  },
  {
    question: "Vocês vendem ou compartilham meus dados com anunciantes?",
    answer:
      "Não. Não vendemos dados pessoais e não usamos o conteúdo dos seus projetos para publicidade. O compartilhamento acontece apenas com as pessoas do seu workspace, com prestadores de serviço necessários à operação e quando a lei exige.",
  },
  {
    question: "Quem consegue ver minhas tarefas e projetos?",
    answer:
      "Somente os integrantes dos workspaces e projetos dos quais você faz parte, conforme o papel de cada um. Ninguém fora deles enxerga o seu conteúdo.",
  },
  {
    question: "Como funciona o login com Google? Vocês acessam minha conta do Google?",
    answer:
      "Usamos apenas o token de identidade que o Google fornece para confirmar quem você é, com seu e-mail e nome de perfil. Não temos acesso a e-mails, contatos, arquivos ou outros dados da sua conta Google.",
  },
  {
    question: "O assistente de IA guarda minhas conversas?",
    answer:
      "Não. A conversa fica apenas na janela aberta e é descartada quando você a fecha. Além disso, o assistente nunca executa uma alteração sem a sua confirmação explícita.",
  },
  {
    question: "Vocês usam cookies?",
    answer:
      "Não usamos cookies de publicidade nem rastreadores de terceiros. O aplicativo guarda no próprio navegador (armazenamento local) a sua sessão de login e preferências de interface, necessários para o funcionamento. Veja a seção “Armazenamento no navegador”.",
  },
  {
    question: "Como vejo em quais dispositivos minha conta está conectada?",
    answer:
      "Em Configurações > Sessões você vê todos os dispositivos conectados, com IP e último uso, e pode encerrar qualquer sessão que não reconheça. Se suspeitar de acesso indevido, altere também sua senha em Configurações > Segurança.",
  },
  {
    question: "Como posso corrigir ou excluir meus dados?",
    answer: `Você pode editar seu conteúdo diretamente no produto. Para corrigir dados da conta, solicitar a exclusão ou exercer qualquer outro direito da LGPD, escreva para ${PRIVACY_CONTACT_EMAIL}. Responderemos dentro do prazo legal.`,
  },
  {
    question: "Por quanto tempo vocês guardam meus dados?",
    answer:
      "Enquanto sua conta estiver ativa e pelo tempo necessário para cumprir obrigações legais. Depois disso, os dados são eliminados ou anonimizados, salvo quando a lei exigir a sua guarda.",
  },
  {
    question: "Meus dados estão seguros?",
    answer:
      "Adotamos medidas como verificação em duas etapas, controle de sessões, controle de acesso por papéis e conexões criptografadas. Nenhum sistema é totalmente imune a incidentes; se houver um que afete seus dados, avisaremos você e a ANPD conforme a lei.",
  },
  {
    question: "Vou ser avisado se esta política mudar?",
    answer:
      "Sim. Publicamos a versão atualizada nesta página com a nova data e, em mudanças relevantes, avisamos por e-mail ou dentro do aplicativo.",
  },
];
