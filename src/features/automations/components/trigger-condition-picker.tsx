"use client";

import { X } from "lucide-react";
import {
  InlineMultiPicker,
  InlinePicker,
  InlineTextField,
} from "@/features/automations/components/inline-fields";
import type {
  AutomationLookups,
  PickerOption,
} from "@/features/automations/hooks/use-automation-lookups";
import {
  COMMON_OPERATORS,
  OPERATOR_LABEL,
  payloadFieldsOf,
  type TriggerEventSpec,
} from "@/features/automations/lib/automation-catalog";
import {
  coerceConditionValue,
  type ConditionDraft,
} from "@/features/automations/lib/automation-draft";
import { Button } from "@/components/ui/button";
import type { AnalyticsOperator } from "@/types/analytics";

// One extra condition, chained onto the sentence with "e": "…e o novo status
// for Concluída". Uses the same filter shape/operators as analytics
// (`AnalyticsFilter`) — that is what the API validates against — but there is
// no analytics filter component to reuse: the analytics screens build their
// queries in code, never from user-picked filters.
export function TriggerConditionPicker({
  condition,
  event,
  lookups,
  onChange,
  onRemove,
}: {
  condition: ConditionDraft;
  event: TriggerEventSpec | undefined;
  lookups: AutomationLookups;
  onChange: (next: ConditionDraft) => void;
  onRemove: () => void;
}) {
  const fields = payloadFieldsOf(event);
  const field = fields.find((spec) => spec.field === condition.field);
  const kind = field?.kind ?? "text";

  const fieldOptions: PickerOption[] = fields.map((spec) => ({
    value: spec.field,
    label: `${spec.article} ${spec.label}`,
  }));
  // A rule made elsewhere may already use an operator we don't advertise.
  const operators: AnalyticsOperator[] = COMMON_OPERATORS.includes(condition.operator)
    ? COMMON_OPERATORS
    : [...COMMON_OPERATORS, condition.operator];
  const operatorOptions: PickerOption[] = operators.map((operator) => ({
    value: operator,
    label: OPERATOR_LABEL[operator],
  }));

  const options = lookups.optionsFor(kind);
  const isList = condition.operator === "in" || condition.operator === "between";
  const listValue = Array.isArray(condition.value) ? condition.value : [];
  const scalarValue = typeof condition.value === "string" ? condition.value : "";

  function renderValue() {
    if (condition.operator === "in" && options) {
      return (
        <InlineMultiPicker
          value={listValue}
          options={options}
          placeholder="valor"
          ariaLabel="Valores da condição"
          labelFor={(value) => lookups.labelFor(kind, value)}
          onChange={(value) => onChange({ ...condition, value })}
        />
      );
    }
    if (isList || !options) {
      return (
        <InlineTextField
          value={isList ? listValue.join(",") : scalarValue}
          placeholder="valor"
          ariaLabel="Valor da condição"
          hint={isList ? "Separe os valores por vírgula." : undefined}
          onChange={(text) =>
            onChange({ ...condition, value: isList ? text.split(",") : text })
          }
        />
      );
    }
    return (
      <InlinePicker
        value={scalarValue}
        options={options}
        placeholder="valor"
        ariaLabel="Valor da condição"
        displayLabel={scalarValue ? lookups.labelFor(kind, scalarValue) : undefined}
        onChange={(value) => onChange({ ...condition, value })}
      />
    );
  }

  return (
    <>
      <span>e</span>
      <InlinePicker
        value={condition.field}
        options={fieldOptions}
        placeholder="campo"
        displayLabel={condition.field}
        ariaLabel="Campo da condição"
        onChange={(nextField) => onChange({ ...condition, field: nextField, value: "" })}
      />
      <InlinePicker
        value={condition.operator}
        options={operatorOptions}
        placeholder="operador"
        ariaLabel="Operador da condição"
        onChange={(operator) => {
          const next = operator as AnalyticsOperator;
          onChange({
            ...condition,
            operator: next,
            value: coerceConditionValue(next, condition.value),
          });
        }}
      />
      {renderValue()}
      <Button
        type="button"
        variant="ghost"
        size="icon-xs"
        aria-label="Remover condição"
        onClick={onRemove}
      >
        <X />
      </Button>
    </>
  );
}
