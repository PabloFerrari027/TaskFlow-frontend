"use client";

import * as React from "react";
import { Loader2, Plus, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useUpdateCustomFieldOptionsMutation } from "@/features/custom-fields/hooks/use-custom-fields";
import { OptionColorPicker } from "@/features/custom-fields/components/option-color-picker";
import {
  buildOptionColors,
  getOptionColor,
  suggestOptionColor,
} from "@/features/custom-fields/lib/option-colors";
import type { CustomFieldDefinition } from "@/types/custom-field";

interface EditOptionsDialogProps {
  projectId: string;
  definition: CustomFieldDefinition;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

interface OptionRow {
  value: string;
  color: string | null;
}

export function EditOptionsDialog({
  projectId,
  definition,
  open,
  onOpenChange,
}: EditOptionsDialogProps) {
  const updateMutation = useUpdateCustomFieldOptionsMutation(projectId);
  // Parent remounts this component (via `key={definition.id}`) whenever a
  // different definition is being edited, so a lazy initializer is enough —
  // no effect needed to resync `options` when `definition` changes. Each row
  // carries its color, so renaming an option keeps it.
  const [options, setOptions] = React.useState<OptionRow[]>(() => {
    const initial = definition.options ?? [];
    return initial.length > 0
      ? initial.map((value) => ({ value, color: getOptionColor(definition, value) }))
      : [{ value: "", color: suggestOptionColor(0) }];
  });

  const sanitized = options.map((option) => option.value.trim()).filter(Boolean);

  function updateOption(index: number, patch: Partial<OptionRow>) {
    setOptions((prev) => prev.map((option, i) => (i === index ? { ...option, ...patch } : option)));
  }

  function removeOption(index: number) {
    setOptions((prev) => prev.filter((_, i) => i !== index));
  }

  function handleSave() {
    if (sanitized.length === 0) return;
    updateMutation.mutate(
      {
        definitionId: definition.id,
        payload: { options: sanitized, optionColors: buildOptionColors(options) },
      },
      { onSuccess: () => onOpenChange(false) }
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Editar opções — {definition.name}</DialogTitle>
        </DialogHeader>

        <div className="space-y-2">
          {options.map((option, index) => (
            <div key={index} className="flex items-center gap-2">
              <OptionColorPicker
                value={option.color}
                onChange={(color) => updateOption(index, { color })}
              />
              <Input
                value={option.value}
                onChange={(event) => updateOption(index, { value: event.target.value })}
                placeholder={`Opção ${index + 1}`}
              />
              <Button
                type="button"
                variant="ghost"
                size="icon-xs"
                disabled={options.length === 1}
                onClick={() => removeOption(index)}
              >
                <X />
              </Button>
            </div>
          ))}
        </div>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() =>
            setOptions((prev) => [...prev, { value: "", color: suggestOptionColor(prev.length) }])
          }
        >
          <Plus /> Adicionar opção
        </Button>
        {sanitized.length === 0 ? (
          <p className="text-sm text-destructive">Informe ao menos uma opção.</p>
        ) : null}

        <DialogFooter>
          <Button
            onClick={handleSave}
            disabled={updateMutation.isPending || sanitized.length === 0}
          >
            {updateMutation.isPending ? <Loader2 className="animate-spin" /> : null}
            Salvar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
