import {
  BookOpen,
  CalendarClock,
  Columns3,
  CornerDownRight,
  Diamond,
  FolderTree,
  GitBranch,
  LayoutDashboard,
  ListChecks,
  ListTodo,
  Repeat,
  SlidersHorizontal,
  Timer,
  Workflow,
  Zap,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { TaskPriorityBadge, TASK_STATUS_LABEL } from "@/components/shared/status-badge";
import { MarkdownContent } from "@/components/shared/markdown-content";
import { CUSTOM_FIELD_TYPE_LABEL } from "@/features/custom-fields/schemas";
import {
  ENTITY_LABEL,
  findAction,
  findTriggerEvent,
} from "@/features/automations/lib/automation-catalog";
import { formatDueInDays, formatRelativeDay } from "@/features/project-templates/lib/template-labels";
import { describeSchedule } from "@/features/recurring-tasks/lib/schedule-text";
import { formatMinutes } from "@/lib/format";
import type {
  ProjectTemplateProjectBody,
  ProjectTemplateSkeleton,
  ProjectTemplateSkeletonAutomation,
  ProjectTemplateSkeletonTask,
} from "@/types/project-template";

// The skeleton points by array index (API.md § 26.1). The server rejects
// cycles on save; MAX_DEPTH only keeps a malformed one from looping the render.
const MAX_DEPTH = 20;

const VIEW_TYPE_LABEL: Record<string, string> = {
  LIST: "Lista",
  BOARD: "Quadro",
  CALENDAR: "Calendário",
  TIMELINE: "Cronograma",
  TABLE: "Tabela",
};

function groupBy<T>(items: T[], keyOf: (item: T) => number | null | undefined) {
  const map = new Map<number | null, number[]>();
  items.forEach((item, index) => {
    const key = keyOf(item) ?? null;
    map.set(key, [...(map.get(key) ?? []), index]);
  });
  return map;
}

function formatFieldValue(value: unknown): string {
  if (Array.isArray(value)) return value.join(", ");
  if (typeof value === "boolean") return value ? "Sim" : "Não";
  if (value === null || value === undefined) return "";
  return String(value);
}

interface BodyContext {
  body: ProjectTemplateProjectBody;
  childSectionsOf: Map<number | null, number[]>;
  rootTasksOf: Map<number | null, number[]>;
  subtasksOf: Map<number | null, number[]>;
  anchorLabel: string | null;
  moduleLabel: (key: string | undefined) => string | null;
}

function ModuleBadge({ label }: { label: string | null }) {
  if (!label) return null;
  return (
    <Badge variant="outline" className="font-normal" title="Parte opcional do modelo">
      Opcional: {label}
    </Badge>
  );
}

function TaskItem({ index, ctx, depth }: { index: number; ctx: BodyContext; depth: number }) {
  if (depth > MAX_DEPTH) return null;
  const task: ProjectTemplateSkeletonTask = ctx.body.tasks[index];
  const values = Object.entries(task.customFieldValues ?? {}).filter(
    ([, value]) => formatFieldValue(value) !== ""
  );
  const subtasks = (ctx.subtasksOf.get(index) ?? []).filter((subIndex) => subIndex > index);
  const blockers = (task.dependsOn ?? [])
    .map((blocker) => ctx.body.tasks[blocker]?.title)
    .filter(Boolean);
  const status = task.statusName ?? (task.status && task.status !== "TODO" ? TASK_STATUS_LABEL[task.status] : null);
  const hasMeta =
    task.priority ||
    task.dueInDays !== undefined ||
    task.startInDays !== undefined ||
    task.isMilestone ||
    task.estimateMinutes ||
    task.storyPoints ||
    status ||
    task.moduleKey ||
    values.length > 0;

  return (
    <li className="space-y-1.5">
      <div className="rounded-md border border-border/60 bg-background px-3 py-2">
        <p className="flex items-center gap-1.5 text-sm text-foreground">
          {task.isMilestone ? (
            <Diamond className="size-3.5 shrink-0 text-amber-600" aria-label="Marco" />
          ) : null}
          {task.title}
        </p>
        {hasMeta ? (
          <div className="mt-1.5 flex flex-wrap items-center gap-1.5 text-xs text-muted-foreground">
            {task.priority ? <TaskPriorityBadge priority={task.priority} /> : null}
            {status ? <Badge variant="secondary">{status}</Badge> : null}
            {task.startInDays !== undefined ? (
              <span className="inline-flex items-center gap-1">
                <CalendarClock className="size-3" aria-hidden />
                início: {formatRelativeDay(task.startInDays, ctx.anchorLabel)}
              </span>
            ) : null}
            {task.dueInDays !== undefined ? (
              <span className="inline-flex items-center gap-1">
                <CalendarClock className="size-3" aria-hidden />
                {formatDueInDays(task.dueInDays, ctx.anchorLabel)}
              </span>
            ) : null}
            {task.estimateMinutes ? (
              <span className="inline-flex items-center gap-1">
                <Timer className="size-3" aria-hidden />
                {formatMinutes(task.estimateMinutes)}
              </span>
            ) : null}
            {task.storyPoints ? <span>{task.storyPoints} pts</span> : null}
            <ModuleBadge label={ctx.moduleLabel(task.moduleKey)} />
            {values.map(([name, value]) => (
              <Badge key={name} variant="outline" className="font-normal">
                {name}: {formatFieldValue(value)}
              </Badge>
            ))}
          </div>
        ) : null}
        {blockers.length > 0 ? (
          <p className="mt-1 flex items-center gap-1 text-xs text-muted-foreground">
            <GitBranch className="size-3" aria-hidden /> Depois de: {blockers.join(", ")}
          </p>
        ) : null}
      </div>
      {subtasks.length > 0 ? (
        <ul className="ml-4 space-y-1.5" aria-label="Subtarefas">
          {subtasks.map((subIndex) => (
            <li key={subIndex} className="flex gap-1.5">
              <CornerDownRight className="mt-2.5 size-3.5 shrink-0 text-muted-foreground" aria-hidden />
              <ul className="min-w-0 flex-1">
                <TaskItem index={subIndex} ctx={ctx} depth={depth + 1} />
              </ul>
            </li>
          ))}
        </ul>
      ) : null}
    </li>
  );
}

function sortByPosition(indexes: number[], body: ProjectTemplateProjectBody) {
  return [...indexes].sort((a, b) => body.sections[a].position - body.sections[b].position);
}

function SectionItem({ index, ctx, depth }: { index: number; ctx: BodyContext; depth: number }) {
  if (depth > MAX_DEPTH) return null;
  const section = ctx.body.sections[index];
  const children = sortByPosition(ctx.childSectionsOf.get(index) ?? [], ctx.body);
  const tasks = ctx.rootTasksOf.get(index) ?? [];

  return (
    <li className="space-y-2 rounded-lg border border-border/60 bg-muted/30 p-3">
      <p className="flex flex-wrap items-center gap-2 text-sm font-medium text-foreground">
        <Columns3 className="size-4 text-muted-foreground" aria-hidden />
        {section.name}
        <ModuleBadge label={ctx.moduleLabel(section.moduleKey)} />
      </p>
      {tasks.length > 0 ? (
        <ul className="space-y-1.5">
          {tasks.map((taskIndex) => (
            <TaskItem key={taskIndex} index={taskIndex} ctx={ctx} depth={0} />
          ))}
        </ul>
      ) : null}
      {children.length > 0 ? (
        <ul className="ml-3 space-y-2 border-l border-border/60 pl-3" aria-label="Subcolunas">
          {children.map((childIndex) => (
            <SectionItem key={childIndex} index={childIndex} ctx={ctx} depth={depth + 1} />
          ))}
        </ul>
      ) : null}
    </li>
  );
}

function buildContext(
  body: ProjectTemplateProjectBody,
  anchorLabel: string | null,
  moduleLabel: BodyContext["moduleLabel"]
): BodyContext {
  const rootTasksOf = new Map<number | null, number[]>();
  // Only top-level tasks are listed under their column; subtasks go under
  // their parent task.
  body.tasks.forEach((task, index) => {
    if (task.parentTaskIndex !== undefined && task.parentTaskIndex !== null) return;
    rootTasksOf.set(task.sectionIndex, [...(rootTasksOf.get(task.sectionIndex) ?? []), index]);
  });
  return {
    body,
    childSectionsOf: groupBy(body.sections, (section) => section.parentIndex),
    rootTasksOf,
    subtasksOf: groupBy(body.tasks, (task) => task.parentTaskIndex),
    anchorLabel,
    moduleLabel,
  };
}

/** Columns, tasks and the project-level extras of one project (root or subproject). */
function ProjectBody({ ctx }: { ctx: BodyContext }) {
  const rootSections = sortByPosition(ctx.childSectionsOf.get(null) ?? [], ctx.body);
  const statuses = ctx.body.statuses ?? [];
  const forms = ctx.body.intakeForms ?? [];
  const views = ctx.body.savedViews ?? [];

  return (
    <div className="space-y-4">
      {rootSections.length === 0 ? (
        <p className="text-sm text-muted-foreground">Sem colunas.</p>
      ) : (
        <ul className="grid gap-3 md:grid-cols-2">
          {rootSections.map((index) => (
            <SectionItem key={index} index={index} ctx={ctx} depth={0} />
          ))}
        </ul>
      )}

      {statuses.length > 0 ? (
        <div className="space-y-1.5">
          <p className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
            <Workflow className="size-3.5" aria-hidden /> Etapas do fluxo
          </p>
          <div className="flex flex-wrap gap-1.5">
            {statuses.map((status) => (
              <Badge key={status.name} variant="outline" className="gap-1.5 font-normal">
                <span
                  aria-hidden
                  className="size-2 rounded-full bg-muted-foreground"
                  style={status.color ? { backgroundColor: status.color } : undefined}
                />
                {status.name}
                <span className="text-muted-foreground">· {TASK_STATUS_LABEL[status.category]}</span>
              </Badge>
            ))}
          </div>
        </div>
      ) : null}

      {ctx.body.blockedTaskCompletion === "BLOCK" ? (
        <p className="text-xs text-muted-foreground">
          Uma tarefa só pode ser concluída depois das tarefas de que depende.
        </p>
      ) : null}

      {forms.length > 0 || views.length > 0 ? (
        <div className="grid gap-3 sm:grid-cols-2">
          {forms.length > 0 ? (
            <div className="space-y-1">
              <p className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
                <ListTodo className="size-3.5" aria-hidden /> Formulários públicos
              </p>
              <ul className="space-y-0.5 text-sm text-foreground">
                {forms.map((form) => (
                  <li key={form.name} className="flex flex-wrap items-center gap-1.5">
                    {form.name}
                    <ModuleBadge label={ctx.moduleLabel(form.moduleKey)} />
                  </li>
                ))}
              </ul>
            </div>
          ) : null}
          {views.length > 0 ? (
            <div className="space-y-1">
              <p className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
                <SlidersHorizontal className="size-3.5" aria-hidden /> Visões salvas
              </p>
              <ul className="space-y-0.5 text-sm text-foreground">
                {views.map((view) => (
                  <li key={view.name} className="flex flex-wrap items-center gap-1.5">
                    {view.name}
                    <span className="text-xs text-muted-foreground">
                      ({VIEW_TYPE_LABEL[view.viewType] ?? view.viewType})
                    </span>
                    <ModuleBadge label={ctx.moduleLabel(view.moduleKey)} />
                  </li>
                ))}
              </ul>
            </div>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}

// "Quando uma tarefa tiver o status alterado: mover a tarefa". Only the event
// and the action — params hold symbolic refs that mean nothing before the
// project exists.
function describeAutomation(automation: ProjectTemplateSkeletonAutomation) {
  const { entityType, eventType } = automation.trigger;
  const event = findTriggerEvent(entityType, eventType);
  const action = findAction(automation.action.tool);
  if (!event || !action) return "Roda sozinha quando algo acontece no projeto.";
  const entity = ENTITY_LABEL[entityType as keyof typeof ENTITY_LABEL] ?? "algo";
  return `Quando ${entity} ${event.phrase}: ${action.label.replace(/:$/, "")}.`;
}

export function TemplateStructurePreview({ skeleton }: { skeleton: ProjectTemplateSkeleton }) {
  const modules = new Map((skeleton.modules ?? []).map((module) => [module.key, module.label]));
  const moduleLabel = (key: string | undefined) => (key ? (modules.get(key) ?? key) : null);
  const anchorLabel = skeleton.anchor?.label ?? null;
  const rootCtx = buildContext(skeleton, anchorLabel, moduleLabel);
  const automations = skeleton.automations ?? [];
  const recurrences = skeleton.recurrences ?? [];
  const dashboards = skeleton.dashboards ?? [];
  const subprojects = skeleton.subprojects ?? [];
  const projectName = (ref: number | null | undefined) =>
    ref === null || ref === undefined ? null : (subprojects[ref]?.name ?? null);

  return (
    <>
      {skeleton.guide ? (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BookOpen className="size-4" aria-hidden /> {skeleton.guideTitle ?? "Comece por aqui"}
            </CardTitle>
            <CardDescription>
              Este guia vira a primeira tarefa do projeto.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="max-h-80 overflow-y-auto rounded-md border border-border/60 p-3">
              <MarkdownContent content={skeleton.guide} />
            </div>
          </CardContent>
        </Card>
      ) : null}

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ListChecks className="size-4" aria-hidden /> Colunas e tarefas de exemplo
          </CardTitle>
          <CardDescription>
            {anchorLabel
              ? `Os prazos contam a partir da data que você escolher em “${anchorLabel}”.`
              : "O projeto criado já vem com estas colunas e tarefas. Os prazos contam a partir do dia em que você usar o modelo."}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ProjectBody ctx={rootCtx} />
        </CardContent>
      </Card>

      {subprojects.length > 0 ? (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FolderTree className="size-4" aria-hidden /> Subprojetos
            </CardTitle>
            <CardDescription>
              Criados dentro do projeto principal, cada um com a sua estrutura. Quem é convidado só
              para um subprojeto não vê o resto.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-5">
            {subprojects.map((subproject, index) => (
              <section key={index} className="space-y-2">
                <h4 className="flex flex-wrap items-center gap-2 text-sm font-semibold text-foreground">
                  {subproject.name}
                  <ModuleBadge label={moduleLabel(subproject.moduleKey)} />
                </h4>
                <ProjectBody ctx={buildContext(subproject, anchorLabel, moduleLabel)} />
              </section>
            ))}
          </CardContent>
        </Card>
      ) : null}

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <SlidersHorizontal className="size-4" aria-hidden /> Campos extras
          </CardTitle>
          <CardDescription>
            Informações a mais que cada tarefa do projeto pode guardar.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {skeleton.customFields.length === 0 ? (
            <p className="text-sm text-muted-foreground">Este modelo não traz campos extras.</p>
          ) : (
            <ul className="divide-y divide-border/60">
              {skeleton.customFields.map((field) => (
                <li key={field.name} className="space-y-1 py-2 text-sm">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-medium text-foreground">{field.name}</span>
                    <Badge variant="secondary">{CUSTOM_FIELD_TYPE_LABEL[field.type]}</Badge>
                    {field.defaultValue !== undefined && formatFieldValue(field.defaultValue) ? (
                      <span className="text-xs text-muted-foreground">
                        Padrão: {formatFieldValue(field.defaultValue)}
                      </span>
                    ) : null}
                  </div>
                  {field.description ? (
                    <p className="text-xs text-muted-foreground">{field.description}</p>
                  ) : null}
                  {field.options?.length ? (
                    <div className="flex flex-wrap gap-1">
                      {field.options.map((option) => (
                        <Badge key={option} variant="outline" className="gap-1 font-normal">
                          {field.optionColors?.[option] ? (
                            <span
                              aria-hidden
                              className="size-2 rounded-full"
                              style={{ backgroundColor: field.optionColors[option] }}
                            />
                          ) : null}
                          {option}
                        </Badge>
                      ))}
                    </div>
                  ) : null}
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Zap className="size-4" aria-hidden /> Automações
          </CardTitle>
          <CardDescription>
            Tarefas repetitivas que o projeto criado já faz sozinho.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {automations.length === 0 ? (
            <p className="text-sm text-muted-foreground">Este modelo não traz automações.</p>
          ) : (
            <ul className="divide-y divide-border/60">
              {automations.map((automation, index) => (
                <li key={index} className="space-y-0.5 py-2 text-sm">
                  <p className="flex flex-wrap items-center gap-2 font-medium text-foreground">
                    {automation.name}
                    {projectName(automation.projectRef) ? (
                      <span className="text-xs font-normal text-muted-foreground">
                        em {projectName(automation.projectRef)}
                      </span>
                    ) : null}
                    <ModuleBadge label={moduleLabel(automation.moduleKey)} />
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {describeAutomation(automation)}
                  </p>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>

      {recurrences.length > 0 ? (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Repeat className="size-4" aria-hidden /> Tarefas repetidas
            </CardTitle>
            <CardDescription>
              Tarefas que o projeto criado cadastra sozinho, nas datas abaixo, no seu fuso horário.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ul className="divide-y divide-border/60">
              {recurrences.map((recurrence, index) => (
                <li key={index} className="space-y-0.5 py-2 text-sm">
                  <p className="flex flex-wrap items-center gap-2 font-medium text-foreground">
                    {recurrence.title}
                    <ModuleBadge label={moduleLabel(recurrence.moduleKey)} />
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {describeSchedule(recurrence.schedule)}
                  </p>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      ) : null}

      {dashboards.length > 0 ? (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <LayoutDashboard className="size-4" aria-hidden /> Painéis
            </CardTitle>
            <CardDescription>Páginas com gráficos do projeto, criadas no workspace.</CardDescription>
          </CardHeader>
          <CardContent>
            <ul className="divide-y divide-border/60">
              {dashboards.map((dashboard, index) => (
                <li key={index} className="space-y-0.5 py-2 text-sm">
                  <p className="flex flex-wrap items-center gap-2 font-medium text-foreground">
                    {dashboard.name}
                    <ModuleBadge label={moduleLabel(dashboard.moduleKey)} />
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {dashboard.charts.map((chart) => chart.name).join(" · ")}
                  </p>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      ) : null}
    </>
  );
}
