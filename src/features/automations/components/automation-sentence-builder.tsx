"use client";

import * as React from "react";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { InlinePicker, ParamValueField } from "@/features/automations/components/inline-fields";
import { TriggerConditionPicker } from "@/features/automations/components/trigger-condition-picker";
import type {
  AutomationLookups,
  PickerOption,
} from "@/features/automations/hooks/use-automation-lookups";
import {
  ENTITY_LABEL,
  ENTITY_TYPES,
  actionsForEvent,
  eventsOfEntity,
  findAction,
  findTriggerEvent,
} from "@/features/automations/lib/automation-catalog";
import {
  emptyParam,
  nextConditionKey,
  withEntity,
  withEvent,
  withTool,
  type ConditionDraft,
  type RuleDraft,
} from "@/features/automations/lib/automation-draft";

const ENTITY_OPTIONS: PickerOption[] = ENTITY_TYPES.map((type) => ({
  value: type,
  label: ENTITY_LABEL[type],
}));

function Step({
  number,
  title,
  hint,
  children,
}: {
  number: number;
  title: string;
  hint: string;
  children: React.ReactNode;
}) {
  return (
    <section className="flex gap-3 rounded-lg border border-border/60 p-3">
      <span
        aria-hidden
        className="mt-0.5 flex size-6 shrink-0 items-center justify-center rounded-full bg-primary text-xs font-semibold text-primary-foreground"
      >
        {number}
      </span>
      <div className="min-w-0 flex-1 space-y-2">
        <div>
          <h4 className="text-sm font-semibold text-foreground">{title}</h4>
          <p className="text-xs text-muted-foreground">{hint}</p>
        </div>
        {children}
      </div>
    </section>
  );
}

const ROW_CLASS = "flex flex-wrap items-center gap-x-1.5 gap-y-2 text-sm leading-7";

/**
 * The rule as three labelled steps — 1. when it happens, 2. only if (optional),
 * 3. what to do. Read top to bottom they still form one sentence ("Quando
 * [uma tarefa] [tiver o status alterado]. Somente se [o novo status] [for]
 * [Concluída]. Então [mover a tarefa] para a seção [X]."), and every bracketed
 * part is an inline field, but each step says what it is for, so nobody has to
 * guess what a blank chip in the middle of a paragraph wants.
 */
export function AutomationSentenceBuilder({
  draft,
  onChange,
  lookups,
}: {
  draft: RuleDraft;
  onChange: (next: RuleDraft) => void;
  lookups: AutomationLookups;
}) {
  const event = findTriggerEvent(draft.entityType, draft.eventType);
  const spec = findAction(draft.tool);

  const eventOptions: PickerOption[] = eventsOfEntity(draft.entityType).map((item) => ({
    value: item.eventType,
    label: item.phrase,
  }));
  const actionOptions: PickerOption[] = actionsForEvent(event).map((action) => ({
    value: action.tool,
    label: action.label,
  }));
  const extraKeys = Object.keys(draft.extraParams).filter(
    (key) => !(key === "taskId" && spec?.needsTask)
  );

  function updateCondition(next: ConditionDraft) {
    onChange({
      ...draft,
      conditions: draft.conditions.map((c) => (c.key === next.key ? next : c)),
    });
  }

  return (
    <div className="space-y-3">
      <Step
        number={1}
        title="Quando isto acontecer"
        hint="Escolha o que faz a automação entrar em ação. Clique nos campos destacados."
      >
        <div className={ROW_CLASS}>
          <span>Quando</span>
          <InlinePicker
            value={draft.entityType}
            options={ENTITY_OPTIONS}
            placeholder="escolher"
            ariaLabel="O que muda"
            displayLabel={draft.entityType}
            onChange={(entityType) => onChange(withEntity(draft, entityType))}
          />
          <InlinePicker
            value={draft.eventType}
            options={eventOptions}
            placeholder="escolher o que acontece"
            ariaLabel="O que acontece"
            emptyText="Nada encontrado."
            onChange={(eventType) => onChange(withEvent(draft, eventType))}
          />
        </div>
      </Step>

      <Step
        number={2}
        title="Somente se… (opcional)"
        hint="Use para limitar a automação a certos casos. Sem nenhuma condição, ela age sempre que o passo 1 acontecer."
      >
        {draft.conditions.map((condition, index) => (
          <div key={condition.key} className={ROW_CLASS}>
            <TriggerConditionPicker
              lead={index === 0 ? "Somente se" : "e"}
              condition={condition}
              event={event}
              lookups={lookups}
              onChange={updateCondition}
              onRemove={() =>
                onChange({
                  ...draft,
                  conditions: draft.conditions.filter((c) => c.key !== condition.key),
                })
              }
            />
          </div>
        ))}
        <Button
          type="button"
          variant="outline"
          size="xs"
          disabled={!event}
          onClick={() =>
            onChange({
              ...draft,
              conditions: [
                ...draft.conditions,
                { key: nextConditionKey(), field: "", operator: "equals", value: "" },
              ],
            })
          }
        >
          <Plus /> {draft.conditions.length === 0 ? "Adicionar uma condição" : "Adicionar outra condição"}
        </Button>
      </Step>

      <Step
        number={3}
        title="Então faça isto"
        hint="Escolha o que a automação deve fazer sozinha."
      >
        <div className={ROW_CLASS}>
          <span>Então</span>
          <InlinePicker
            value={draft.tool}
            options={actionOptions}
            placeholder="escolher o que fazer"
            ariaLabel="O que fazer"
            displayLabel={draft.tool}
            onChange={(tool) => onChange(withTool(draft, tool))}
          />
          {spec?.params.map((param) => (
            <span key={param.key} className="inline-flex flex-wrap items-center gap-1.5">
              {param.lead ? <span>{param.lead}</span> : null}
              <ParamValueField
                param={param}
                draft={draft.params[param.key] ?? emptyParam()}
                event={event}
                lookups={lookups}
                onChange={(next) =>
                  onChange({ ...draft, params: { ...draft.params, [param.key]: next } })
                }
              />
            </span>
          ))}
        </div>
        {event && !event.taskIdField ? (
          <p className="text-xs text-muted-foreground">
            O que aconteceu no passo 1 não envolve uma tarefa específica, então aqui só dá para
            criar uma tarefa nova.
          </p>
        ) : null}
        {extraKeys.length > 0 ? (
          <p className="text-xs text-muted-foreground">
            Esta automação também usa {extraKeys.join(", ")} (definido fora deste editor) — será
            mantido como está.
          </p>
        ) : null}
      </Step>
    </div>
  );
}
