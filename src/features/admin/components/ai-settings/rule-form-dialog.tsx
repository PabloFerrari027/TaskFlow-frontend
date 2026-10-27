"use client";

import * as React from "react";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import type { AiRuleInput } from "@/types/ai-settings";

const TITLE_MAX = 120;
const TEXT_MAX = 2000;

interface RuleFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Nome do grupo, para o título "Nova frase em …". */
  groupName: string;
  initial?: AiRuleInput;
  isSaving: boolean;
  onSave: (input: AiRuleInput) => void;
}

/** Criar ou editar uma frase que o assistente lê em toda mensagem. */
export function RuleFormDialog({ open, onOpenChange, groupName, initial, isSaving, onSave }: RuleFormDialogProps) {
  const [title, setTitle] = React.useState(initial?.title ?? "");
  const [text, setText] = React.useState(initial?.text ?? "");
  const editing = Boolean(initial);
  const valid = title.trim().length > 0 && text.trim().length > 0;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent size="lg">
        <DialogHeader>
          <DialogTitle>{editing ? "Editar frase" : `Nova frase em ${groupName}`}</DialogTitle>
          <DialogDescription>
            O assistente lê esta frase em toda mensagem, nos planos em que ela estiver ligada. Escreva
            como uma instrução direta. Cada frase a mais gasta um pouco mais de tokens.
          </DialogDescription>
        </DialogHeader>
        <form
          id="ai-rule-form"
          className="space-y-4"
          onSubmit={(event) => {
            event.preventDefault();
            if (valid) onSave({ title: title.trim(), text: text.trim() });
          }}
        >
          <div className="space-y-1.5">
            <Label htmlFor="ai-rule-title">Nome</Label>
            <Input id="ai-rule-title" value={title} maxLength={TITLE_MAX} onChange={(event) => setTitle(event.target.value)} placeholder="Ex.: No máximo um emoji" />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="ai-rule-text">O que o assistente deve fazer</Label>
            <Textarea
              id="ai-rule-text"
              value={text}
              maxLength={TEXT_MAX}
              rows={6}
              onChange={(event) => setText(event.target.value)}
              placeholder="Ex.: Use no máximo um emoji por resposta."
            />
            <p className="text-right text-xs text-muted-foreground">
              {text.length}/{TEXT_MAX}
            </p>
          </div>
        </form>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button type="submit" form="ai-rule-form" disabled={!valid || isSaving}>
            {isSaving ? <Loader2 className="animate-spin" /> : null}
            {editing ? "Salvar" : "Criar frase"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
