import type { ProjectTemplateSummary } from "@/types/project-template";

export function plural(count: number, singular: string, pluralForm: string) {
  return `${count} ${count === 1 ? singular : pluralForm}`;
}

// "4 colunas · 5 campos · 7 tarefas de exemplo" — zero counts are left out,
// except columns, which every template has.
export function formatTemplateCounts(
  template: Pick<
    ProjectTemplateSummary,
    "sectionCount" | "customFieldCount" | "taskCount" | "recurrenceCount"
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

export function formatDueInDays(days: number) {
  if (days === 0) return "prazo: no dia em que o projeto for criado";
  return `prazo: ${plural(days, "dia", "dias")} após criar`;
}
