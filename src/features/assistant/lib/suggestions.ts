import { ASSISTANT_SUGGESTIONS } from "@/features/assistant/context/assistant-chat-context";

// Starting points that follow what the assistant knows about the person
// (the profile summary it writes during onboarding): a teacher sees class
// suggestions, someone who forgets medicine sees a medicine reminder. The
// generic ones fill the rest, so there are always four.
const BY_TOPIC: { pattern: RegExp; suggestion: string }[] = [
  { pattern: /professor|aula|turma|escola/, suggestion: "Anota o conteúdo da aula de amanhã" },
  { pattern: /remedio|pressao|saude|consulta|medic/, suggestion: "Quais consultas eu tenho este mês?" },
  { pattern: /bolo|encomenda|venda|cliente|fiado/, suggestion: "Anota uma encomenda nova" },
  { pattern: /conta|divida|financ|gasto|parcela/, suggestion: "Quais contas vencem esta semana?" },
  { pattern: /facul|estud|prova|curso/, suggestion: "Quando é minha próxima prova?" },
  { pattern: /filho|filha|neto|neta|crianca/, suggestion: "Me lembra das coisas da escola das crianças" },
  { pattern: /motoboy|entrega|corrida|moto/, suggestion: "Anota quanto ganhei hoje nas entregas" },
];

function normalize(text: string): string {
  return text.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "");
}

export function suggestionsFor(profileSummary: string | null | undefined, limit = 4): string[] {
  const text = normalize(profileSummary ?? "");
  const personal = text ? BY_TOPIC.filter(({ pattern }) => pattern.test(text)).map(({ suggestion }) => suggestion) : [];
  return [...new Set([...personal.slice(0, 2), ...ASSISTANT_SUGGESTIONS])].slice(0, limit);
}
