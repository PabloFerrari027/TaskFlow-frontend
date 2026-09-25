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
  type PayloadFieldSpec,
} from "@/features/automations/lib/automation-catalog";
import {
  coerceConditionValue,
  type ConditionDraft,
} from "@/features/automations/lib/automation-draft";
import { Button } from "@/components/ui/button";
import type { AnalyticsOperator } from "@/types/analytics";

// One extra condition, on its own row in step 2: "Somente se o novo status
// for Concluída". Uses the same filter shape/operators as analytics
// (`AnalyticsFilter`) — that is what the API validates against — so it is
// also the filter picker of the dashboard-page chart builder: the one place
// a user picks an `AnalyticsFilter` by hand, whatever screen they're on.
export function TriggerConditionPicker({
  lead,
  condition,
  fields,
  lookups,
  onChange,
  onRemove,
}: {
  // Connector before the condition: "Somente se" for the first, "e" after.
  lead: string;
  condition: ConditionDraft;
  // The fields a condition can test — a trigger event's payload fields in
  // automations, or a chart entity's filterable fields in dashboard pages.
  fields: PayloadFieldSpec[];
  lookups: AutomationLookups;
  onChange: (next: ConditionDraft) => void;
  onRemove: () => void;
}) {
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
      <span>{lead}</span>
      <InlinePicker
        value={condition.field}
        options={fieldOptions}
        placeholder="escolher o quê"
        displayLabel={condition.field}
        ariaLabel="Campo da condição"
        onChange={(nextField) => onChange({ ...condition, field: nextField, value: "" })}
      />
      <InlinePicker
        value={condition.operator}
        options={operatorOptions}
        placeholder="escolher"
        ariaLabel="Comparação da condição"
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
