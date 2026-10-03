import type {
  ProjectTemplateLanguage,
  ProjectTemplateLevel,
  ProjectTemplateSummary,
} from "@/types/project-template";

export const TEMPLATE_LEVEL_LABEL: Record<ProjectTemplateLevel, string> = {
  BEGINNER: "Iniciante",
  INTERMEDIATE: "Intermediário",
  ADVANCED: "Avançado",
};

export const TEMPLATE_LANGUAGE_LABEL: Record<ProjectTemplateLanguage, string> = {
  "pt-BR": "Português",
  en: "Inglês",
  es: "Espanhol",
};

export function plural(count: number, singular: string, pluralForm: string) {
  return `${count} ${count === 1 ? singular : pluralForm}`;
}

// "4 colunas · 5 campos · 7 tarefas de exemplo" — zero counts are left out,
// except columns, which every template has.
export function formatTemplateCounts(
  template: Pick<
    ProjectTemplateSummary,
    | "sectionCount"
    | "customFieldCount"
    | "taskCount"
    | "recurrenceCount"
    | "subprojectCount"
    | "automationCount"
    | "dashboardCount"
  >
) {
  const parts = [plural(template.sectionCount, "coluna", "colunas")];
  if (template.customFieldCount > 0) {
    parts.push(plural(template.customFieldCount, "campo", "campos"));
  }
  if (template.taskCount > 0) {
    parts.push(plural(template.taskCount, "tarefa de exemplo", "tarefas de exemplo"));
  }
  if (template.recurrenceCount) {
    parts.push(plural(template.recurrenceCount, "tarefa repetida", "tarefas repetidas"));
  }
  if (template.automationCount) {
    parts.push(plural(template.automationCount, "automação", "automações"));
  }
  if (template.subprojectCount) {
    parts.push(plural(template.subprojectCount, "subprojeto", "subprojetos"));
  }
  if (template.dashboardCount) {
    parts.push(plural(template.dashboardCount, "painel", "painéis"));
  }
  return parts.join(" · ");
}

// "Por TaskFlow" on system templates, "Salvo por Ana" on workspace ones.
export function getAuthorLabel(template: Pick<ProjectTemplateSummary, "isSystemDefault" | "author">) {
  if (template.isSystemDefault || !template.author) return "Por TaskFlow";
  return `Salvo por ${template.author.name ?? "alguém do workspace"}`;
}

export function isWorkspaceTemplate(template: Pick<ProjectTemplateSummary, "isSystemDefault">) {
  return !template.isSystemDefault;
}

// With an anchor ("Data do evento") the days count from that date and may be
// negative; without one, from the day the project is created.
export function formatRelativeDay(days: number, anchorLabel?: string | null) {
  const base = anchorLabel ? anchorLabel.toLowerCase() : null;
  if (days === 0) return base ? `no dia (${base})` : "no dia em que o projeto for criado";
  const amount = plural(Math.abs(days), "dia", "dias");
  if (base) return `${amount} ${days < 0 ? "antes" : "depois"} (${base})`;
  return `${amount} após criar`;
}

export function formatDueInDays(days: number, anchorLabel?: string | null) {
  return `prazo: ${formatRelativeDay(days, anchorLabel)}`;
}
