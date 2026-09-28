import type {
  ProjectTemplateStatus,
  ProjectTemplateSummary,
} from "@/types/project-template";

export function plural(count: number, singular: string, pluralForm: string) {
  return `${count} ${count === 1 ? singular : pluralForm}`;
}

// "4 colunas · 5 campos · 7 tarefas de exemplo" — zero counts are left out,
// except columns, which every template has.
export function formatTemplateCounts(
  template: Pick<ProjectTemplateSummary, "sectionCount" | "customFieldCount" | "taskCount">
) {
  const parts = [plural(template.sectionCount, "coluna", "colunas")];
  if (template.customFieldCount > 0) {
    parts.push(plural(template.customFieldCount, "campo", "campos"));
  }
  if (template.taskCount > 0) {
    parts.push(plural(template.taskCount, "tarefa de exemplo", "tarefas de exemplo"));
  }
  return parts.join(" · ");
}

export function getAuthorLabel(template: Pick<ProjectTemplateSummary, "isSystemDefault" | "author">) {
  if (template.isSystemDefault || !template.author) return "TaskFlow";
  return template.author.name ?? "Usuário da comunidade";
}

export const TEMPLATE_STATUS_LABEL: Record<ProjectTemplateStatus, string> = {
  PUBLISHED: "No hub",
  UNPUBLISHED: "Fora do hub",
  REMOVED: "Removido pela moderação",
};

export function formatDueInDays(days: number) {
  if (days === 0) return "prazo: no dia em que o projeto for criado";
  return `prazo: ${plural(days, "dia", "dias")} após criar`;
}
