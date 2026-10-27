// The few questions the welcome tour asks so the assistant already knows the
// person when the chat opens (its "profile summary", the same text the
// assistant writes itself during onboarding). Plain choices plus an "outro"
// field; every question can be skipped. The summary is put together here,
// word for word from the answers — no AI call, no tokens.

export type ProfileQuestionId = "routine" | "organize" | "forgets" | "style";

export interface ProfileOption {
  id: string;
  label: string;
  // How the choice reads inside the summary sentence.
  phrase: string;
  // The catalog template that fits, when this is what they want to organize
  // — an exact name, never a loose search ("saúde" once brought a mood diary).
  templateName?: string;
}

export interface ProfileQuestion {
  id: ProfileQuestionId;
  title: string;
  hint: string;
  multiple: boolean;
  options: ProfileOption[];
  // Placeholder of the "outro" field; omitted where free text makes no sense.
  otherPlaceholder?: string;
}

export const PROFILE_QUESTIONS: ProfileQuestion[] = [
  {
    id: "routine",
    title: "O que você faz no dia a dia?",
    hint: "Pode marcar mais de um.",
    multiple: true,
    options: [
      { id: "job", label: "Trabalho fora", phrase: "trabalha fora" },
      { id: "own", label: "Trabalho por conta / tenho um negócio", phrase: "trabalha por conta ou tem um negócio" },
      { id: "study", label: "Estudo", phrase: "estuda" },
      { id: "home", label: "Cuido da casa e da família", phrase: "cuida da casa e da família" },
      { id: "retired", label: "Sou aposentado(a)", phrase: "é aposentado(a)" },
    ],
    otherPlaceholder: "Ex.: sou professora e faço bolos por encomenda",
  },
  {
    id: "organize",
    title: "O que você quer organizar aqui?",
    hint: "Pode marcar mais de um.",
    multiple: true,
    options: [
      { id: "money", label: "Contas e dinheiro", phrase: "contas e dinheiro", templateName: "Controle de Gastos Mensal" },
      { id: "health", label: "Saúde e remédios", phrase: "saúde e remédios", templateName: "Controle de Medicamentos e Consultas" },
      { id: "studies", label: "Estudos e provas", phrase: "estudos e provas" },
      { id: "sales", label: "Clientes, vendas ou encomendas", phrase: "clientes, vendas ou encomendas", templateName: "Funil de Vendas (CRM Simples)" },
      { id: "family", label: "Casa e família", phrase: "casa e família", templateName: "Tarefas Domésticas da Família" },
      { id: "team", label: "Trabalho com a equipe", phrase: "trabalho com a equipe" },
    ],
    otherPlaceholder: "Ex.: a reforma da casa",
  },
  {
    id: "forgets",
    title: "O que você costuma esquecer?",
    hint: "Assim eu sei quando te lembrar.",
    multiple: true,
    options: [
      { id: "bills", label: "Pagar contas", phrase: "pagar contas" },
      { id: "medicine", label: "Tomar remédio", phrase: "tomar remédio" },
      { id: "appointments", label: "Consultas e compromissos", phrase: "consultas e compromissos" },
      { id: "deadlines", label: "Prazos de trabalho ou escola", phrase: "prazos de trabalho ou escola" },
      { id: "dates", label: "Aniversários e datas", phrase: "aniversários e datas" },
    ],
    otherPlaceholder: "Ex.: regar as plantas",
  },
  {
    id: "style",
    title: "Como prefere que eu responda?",
    hint: "Dá para mudar depois, é só pedir no chat.",
    multiple: false,
    options: [
      { id: "SHORT", label: "Curto e direto", phrase: "respostas curtas e diretas" },
      { id: "DETAILED", label: "Explicado com calma", phrase: "respostas explicadas com calma" },
    ],
  },
];

export interface ProfileAnswer {
  optionIds: string[];
  other: string;
}

export type ProfileAnswers = Partial<Record<ProfileQuestionId, ProfileAnswer>>;

function question(id: ProfileQuestionId) {
  return PROFILE_QUESTIONS.find((q) => q.id === id)!;
}

// "a", "a e b", "a, b e c".
function joinPt(parts: string[]): string {
  if (parts.length <= 1) return parts[0] ?? "";
  return `${parts.slice(0, -1).join(", ")} e ${parts[parts.length - 1]}`;
}

function phrases(answers: ProfileAnswers, id: ProfileQuestionId): string[] {
  const answer = answers[id];
  if (!answer) return [];
  const chosen = question(id)
    .options.filter((option) => answer.optionIds.includes(option.id))
    .map((option) => option.phrase);
  const other = answer.other.trim();
  return other ? [...chosen, other] : chosen;
}

/** The profile summary from the answers, or null when nothing was answered. */
export function summaryFromAnswers(answers: ProfileAnswers): string | null {
  const sentences = [
    phrases(answers, "routine").length ? `No dia a dia: ${joinPt(phrases(answers, "routine"))}.` : null,
    phrases(answers, "organize").length ? `Quer organizar: ${joinPt(phrases(answers, "organize"))}.` : null,
    phrases(answers, "forgets").length ? `Costuma esquecer: ${joinPt(phrases(answers, "forgets"))}.` : null,
    phrases(answers, "style").length ? `Prefere ${phrases(answers, "style")[0]}.` : null,
  ].filter((sentence): sentence is string => sentence !== null);
  return sentences.length > 0 ? sentences.join(" ") : null;
}

/** "SHORT" / "DETAILED" when the style question was answered. */
export function responseLengthFromAnswers(answers: ProfileAnswers): "SHORT" | "DETAILED" | null {
  const id = answers.style?.optionIds[0];
  return id === "SHORT" || id === "DETAILED" ? id : null;
}

/** Catalog templates to offer, in the order the person picked what to organize. */
export function templateNamesFromAnswers(answers: ProfileAnswers): string[] {
  const picked = answers.organize?.optionIds ?? [];
  return question("organize")
    .options.filter((option) => picked.includes(option.id) && option.templateName)
    .map((option) => option.templateName as string);
}
