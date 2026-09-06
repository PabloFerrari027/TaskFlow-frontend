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
import type { CustomFieldDefinition } from "@/types/custom-field";

interface EditOptionsDialogProps {
  projectId: string;
  definition: CustomFieldDefinition;
  open: boolean;
  onOpenChange: (open: boolean) => void;
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
  // no effect needed to resync `options` when `definition` changes.
  const [options, setOptions] = React.useState(() => {
    const initial = definition.options ?? [];
    return initial.length > 0 ? initial : [""];
  });

  const sanitized = options.map((option) => option.trim()).filter(Boolean);

  function updateOption(index: number, value: string) {
    setOptions((prev) => prev.map((option, i) => (i === index ? value : option)));
  }

  function removeOption(index: number) {
    setOptions((prev) => prev.filter((_, i) => i !== index));
  }

  function handleSave() {
    if (sanitized.length === 0) return;
    updateMutation.mutate(
      { definitionId: definition.id, payload: { options: sanitized } },
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
              <Input
                value={option}
                onChange={(event) => updateOption(index, event.target.value)}
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
          onClick={() => setOptions((prev) => [...prev, ""])}
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
