"use client";

import * as React from "react";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { parseOptionsText } from "@/features/custom-fields/schemas";
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
  // no effect needed to resync `text` when `definition` changes.
  const [text, setText] = React.useState(() => (definition.options ?? []).join("\n"));

  function handleSave() {
    const options = parseOptionsText(text);
    if (options.length === 0) return;
    updateMutation.mutate(
      { definitionId: definition.id, payload: { options } },
      { onSuccess: () => onOpenChange(false) }
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Editar opções — {definition.name}</DialogTitle>
        </DialogHeader>

        <Textarea
          rows={5}
          value={text}
          onChange={(event) => setText(event.target.value)}
          placeholder={"Baixa\nMédia\nAlta"}
        />
        <p className="text-xs text-muted-foreground">Uma opção por linha.</p>

        <DialogFooter>
          <Button onClick={handleSave} disabled={updateMutation.isPending}>
            {updateMutation.isPending ? <Loader2 className="animate-spin" /> : null}
            Salvar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
