import {
  CalendarClock,
  Columns3,
  CornerDownRight,
  ListChecks,
  Repeat,
  SlidersHorizontal,
  Zap,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { TaskPriorityBadge } from "@/components/shared/status-badge";
import { CUSTOM_FIELD_TYPE_LABEL } from "@/features/custom-fields/schemas";
import {
  ENTITY_LABEL,
  findAction,
  findTriggerEvent,
} from "@/features/automations/lib/automation-catalog";
import { formatDueInDays } from "@/features/project-templates/lib/template-labels";
import { describeSchedule } from "@/features/recurring-tasks/lib/schedule-text";
import type {
  ProjectTemplateSkeleton,
  ProjectTemplateSkeletonAutomation,
  ProjectTemplateSkeletonTask,
} from "@/types/project-template";

// The skeleton points by array index (API.md § 26.1). The server rejects
// cycles on save; MAX_DEPTH only keeps a malformed one from looping the render.
const MAX_DEPTH = 20;

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

function TaskItem({
  index,
  tasks,
  subtasksOf,
  depth,
}: {
  index: number;
  tasks: ProjectTemplateSkeletonTask[];
  subtasksOf: Map<number | null, number[]>;
  depth: number;
}) {
  if (depth > MAX_DEPTH) return null;
  const task = tasks[index];
  const values = Object.entries(task.customFieldValues ?? {}).filter(
    ([, value]) => formatFieldValue(value) !== ""
  );
  const subtasks = (subtasksOf.get(index) ?? []).filter((subIndex) => subIndex > index);

  return (
    <li className="space-y-1.5">
      <div className="rounded-md border border-border/60 bg-background px-3 py-2">
        <p className="text-sm text-foreground">{task.title}</p>
        {task.priority || task.dueInDays !== undefined || values.length > 0 ? (
          <div className="mt-1.5 flex flex-wrap items-center gap-1.5 text-xs text-muted-foreground">
            {task.priority ? <TaskPriorityBadge priority={task.priority} /> : null}
            {task.dueInDays !== undefined ? (
              <span className="inline-flex items-center gap-1">
                <CalendarClock className="size-3" aria-hidden />
                {formatDueInDays(task.dueInDays)}
              </span>
            ) : null}
            {values.map(([name, value]) => (
              <Badge key={name} variant="outline" className="font-normal">
                {name}: {formatFieldValue(value)}
              </Badge>
            ))}
          </div>
        ) : null}
      </div>
      {subtasks.length > 0 ? (
        <ul className="ml-4 space-y-1.5" aria-label="Subtarefas">
          {subtasks.map((subIndex) => (
            <li key={subIndex} className="flex gap-1.5">
              <CornerDownRight className="mt-2.5 size-3.5 shrink-0 text-muted-foreground" aria-hidden />
              <ul className="min-w-0 flex-1">
                <TaskItem index={subIndex} tasks={tasks} subtasksOf={subtasksOf} depth={depth + 1} />
              </ul>
            </li>
          ))}
        </ul>
      ) : null}
    </li>
  );
}

function SectionItem({
  index,
  skeleton,
  childSectionsOf,
  rootTasksOf,
  subtasksOf,
  depth,
}: {
  index: number;
  skeleton: ProjectTemplateSkeleton;
  childSectionsOf: Map<number | null, number[]>;
  rootTasksOf: Map<number | null, number[]>;
  subtasksOf: Map<number | null, number[]>;
  depth: number;
}) {
  if (depth > MAX_DEPTH) return null;
  const section = skeleton.sections[index];
  const children = sortByPosition(childSectionsOf.get(index) ?? [], skeleton);
  const tasks = rootTasksOf.get(index) ?? [];

  return (
    <li className="space-y-2 rounded-lg border border-border/60 bg-muted/30 p-3">
      <p className="flex items-center gap-2 text-sm font-medium text-foreground">
        <Columns3 className="size-4 text-muted-foreground" aria-hidden />
        {section.name}
      </p>
      {tasks.length > 0 ? (
        <ul className="space-y-1.5">
          {tasks.map((taskIndex) => (
            <TaskItem
              key={taskIndex}
              index={taskIndex}
              tasks={skeleton.tasks}
              subtasksOf={subtasksOf}
              depth={0}
            />
          ))}
        </ul>
      ) : null}
      {children.length > 0 ? (
        <ul className="ml-3 space-y-2 border-l border-border/60 pl-3" aria-label="Subcolunas">
          {children.map((childIndex) => (
            <SectionItem
              key={childIndex}
              index={childIndex}
              skeleton={skeleton}
              childSectionsOf={childSectionsOf}
              rootTasksOf={rootTasksOf}
              subtasksOf={subtasksOf}
              depth={depth + 1}
            />
          ))}
        </ul>
      ) : null}
    </li>
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

function sortByPosition(indexes: number[], skeleton: ProjectTemplateSkeleton) {
  return [...indexes].sort(
    (a, b) => skeleton.sections[a].position - skeleton.sections[b].position
  );
}

export function TemplateStructurePreview({ skeleton }: { skeleton: ProjectTemplateSkeleton }) {
  const childSectionsOf = groupBy(skeleton.sections, (section) => section.parentIndex);
  const subtasksOf = groupBy(skeleton.tasks, (task) => task.parentTaskIndex);
  // Only top-level tasks are listed under their column; subtasks go under
  // their parent task.
  const rootTasksOf = new Map<number | null, number[]>();
  skeleton.tasks.forEach((task, index) => {
    if (task.parentTaskIndex !== undefined && task.parentTaskIndex !== null) return;
    rootTasksOf.set(task.sectionIndex, [...(rootTasksOf.get(task.sectionIndex) ?? []), index]);
  });
  const rootSections = sortByPosition(childSectionsOf.get(null) ?? [], skeleton);
  const automations = skeleton.automations ?? [];
  const recurrences = skeleton.recurrences ?? [];

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ListChecks className="size-4" aria-hidden /> Colunas e tarefas de exemplo
          </CardTitle>
          <CardDescription>
            O projeto criado já vem com estas colunas e tarefas. Os prazos contam a partir do dia
            em que você usar o modelo.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {rootSections.length === 0 ? (
            <p className="text-sm text-muted-foreground">Este modelo não traz colunas.</p>
          ) : (
            <ul className="grid gap-3 md:grid-cols-2">
              {rootSections.map((index) => (
                <SectionItem
                  key={index}
                  index={index}
                  skeleton={skeleton}
                  childSectionsOf={childSectionsOf}
                  rootTasksOf={rootTasksOf}
                  subtasksOf={subtasksOf}
                  depth={0}
                />
              ))}
            </ul>
          )}
        </CardContent>
      </Card>

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
                <li key={field.name} className="flex flex-wrap items-center gap-2 py-2 text-sm">
                  <span className="font-medium text-foreground">{field.name}</span>
                  <Badge variant="secondary">{CUSTOM_FIELD_TYPE_LABEL[field.type]}</Badge>
                  {field.options?.length ? (
                    <span className="text-xs text-muted-foreground">
                      Opções: {field.options.join(", ")}
                    </span>
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
                  <p className="font-medium text-foreground">{automation.name}</p>
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
                  <p className="font-medium text-foreground">{recurrence.title}</p>
                  <p className="text-xs text-muted-foreground">
                    {describeSchedule(recurrence.schedule)}
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
