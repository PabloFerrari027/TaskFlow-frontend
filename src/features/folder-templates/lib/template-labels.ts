import type {
  FolderTemplateLanguage,
  FolderTemplateLevel,
  FolderTemplateSummary,
} from "@/types/folder-template";

export const TEMPLATE_LEVEL_LABEL: Record<FolderTemplateLevel, string> = {
  BEGINNER: "Iniciante",
  INTERMEDIATE: "Intermediário",
  ADVANCED: "Avançado",
};

export const TEMPLATE_LANGUAGE_LABEL: Record<FolderTemplateLanguage, string> = {
  "pt-BR": "Português",
  en: "Inglês",
  es: "Espanhol",
};

export function plural(count: number, singular: string, pluralForm: string) {
  return `${count} ${count === 1 ? singular : pluralForm}`;
}

// "4 colunas · 5 campos · 7 itens de exemplo" — zero counts are left out,
// except columns, which every template has.
export function formatTemplateCounts(
  template: Pick<
    FolderTemplateSummary,
    | "sectionCount"
    | "customFieldCount"
    | "itemCount"
    | "recurrenceCount"
    | "subfolderCount"
    | "automationCount"
    | "dashboardCount"
  >
) {
  const parts = [plural(template.sectionCount, "coluna", "colunas")];
  if (template.customFieldCount > 0) {
    parts.push(plural(template.customFieldCount, "campo", "campos"));
  }
  if (template.itemCount > 0) {
    parts.push(plural(template.itemCount, "item de exemplo", "itens de exemplo"));
  }
  if (template.recurrenceCount) {
    parts.push(plural(template.recurrenceCount, "item repetido", "itens repetidos"));
  }
  if (template.automationCount) {
    parts.push(plural(template.automationCount, "automação", "automações"));
  }
  if (template.subfolderCount) {
    parts.push(plural(template.subfolderCount, "subpasta", "subpastas"));
  }
  if (template.dashboardCount) {
    parts.push(plural(template.dashboardCount, "painel", "painéis"));
  }
  return parts.join(" · ");
}

// "Por TaskFlow" on system templates, "Salvo por Ana" on workspace ones.
export function getAuthorLabel(template: Pick<FolderTemplateSummary, "isSystemDefault" | "author">) {
  if (template.isSystemDefault || !template.author) return "Por TaskFlow";
  return `Salvo por ${template.author.name ?? "alguém do workspace"}`;
}

export function isWorkspaceTemplate(template: Pick<FolderTemplateSummary, "isSystemDefault">) {
  return !template.isSystemDefault;
}

// With an anchor ("Data do evento") the days count from that date and may be
// negative; without one, from the day the folder is created.
export function formatRelativeDay(days: number, anchorLabel?: string | null) {
  const base = anchorLabel ? anchorLabel.toLowerCase() : null;
  if (days === 0) return base ? `no dia (${base})` : "no dia em que a pasta for criada";
  const amount = plural(Math.abs(days), "dia", "dias");
  if (base) return `${amount} ${days < 0 ? "antes" : "depois"} (${base})`;
  return `${amount} após criar`;
}

export function formatDueInDays(days: number, anchorLabel?: string | null) {
  return `prazo: ${formatRelativeDay(days, anchorLabel)}`;
}
