"use client";

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

/**
 * The rule as one editable sentence — "Quando [uma tarefa] [tiver o status
 * alterado] e [o novo status] [for] [Concluída], então [mover a tarefa] para a
 * seção [Concluída]." — instead of a stack of technical dropdowns. Every
 * bracketed part is an inline field; the order of the sentence is the order of
 * filling it in.
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
      <div className="flex flex-wrap items-center gap-x-1.5 gap-y-2 text-sm leading-7">
        <span>Quando</span>
        <InlinePicker
          value={draft.entityType}
          options={ENTITY_OPTIONS}
          placeholder="algo"
          ariaLabel="Tipo de item"
          displayLabel={draft.entityType}
          onChange={(entityType) => onChange(withEntity(draft, entityType))}
        />
        <InlinePicker
          value={draft.eventType}
          options={eventOptions}
          placeholder="o que acontecer"
          ariaLabel="Evento"
          emptyText="Nenhum evento encontrado."
          onChange={(eventType) => onChange(withEvent(draft, eventType))}
        />

        {draft.conditions.map((condition) => (
          <TriggerConditionPicker
            key={condition.key}
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
        ))}
        <Button
          type="button"
          variant="ghost"
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
          <Plus /> e se…
        </Button>

        <span>, então</span>
        <InlinePicker
          value={draft.tool}
          options={actionOptions}
          placeholder="fazer o quê"
          ariaLabel="Ação"
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
        <span>.</span>
      </div>

      {event && !event.taskIdField ? (
        <p className="text-xs text-muted-foreground">
          Este evento não envolve uma tarefa específica, então só dá para criar uma tarefa nova.
        </p>
      ) : null}
      {extraKeys.length > 0 ? (
        <p className="text-xs text-muted-foreground">
          Esta regra também usa {extraKeys.join(", ")} (definido fora deste editor) — será
          mantido como está.
        </p>
      ) : null}
    </div>
  );
}
