"use client";

import * as React from "react";
import { ArrowDown, ArrowUp, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { AssigneeSelect } from "@/features/items/components/assignee-select";
import { SectionSelect } from "@/features/items/components/section-select";
import {
  useCreateIntakeFormMutation,
  useUpdateIntakeFormMutation,
} from "@/features/intake-forms/hooks/use-intake-forms";
import type {
  IntakeFieldTarget,
  IntakeFieldType,
  IntakeForm,
  IntakeFormField,
} from "@/types/intake-form";

export const FIELD_TYPE_LABEL: Record<IntakeFieldType, string> = {
  TEXT: "Texto curto",
  LONG_TEXT: "Texto longo",
  EMAIL: "E-mail",
  NUMBER: "Número",
  DATE: "Data",
  SELECT: "Lista de opções",
};

const TARGET_LABEL: Record<IntakeFieldTarget | "none", string> = {
  none: "Vai para a descrição",
  title: "Vira o título do item",
  description: "Vira a descrição do item",
  dueDate: "Vira o prazo do item",
  priority: "Vira a prioridade do item",
};

// What each target accepts (backend `form-fields.ts`).
function targetsFor(type: IntakeFieldType): (IntakeFieldTarget | "none")[] {
  const targets: (IntakeFieldTarget | "none")[] = ["none", "description"];
  if (type === "TEXT" || type === "LONG_TEXT") targets.push("title");
  if (type === "DATE") targets.push("dueDate");
  if (type === "SELECT") targets.push("priority");
  return targets;
}

// "Nome do cliente" → "nome_do_cliente", unique among the other keys.
function keyFor(label: string, taken: Set<string>) {
  const base =
    label
      .normalize("NFD")
      .replace(/[̀-ͯ]/g, "")
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "_")
      .replace(/^_+|_+$/g, "")
      .replace(/^[^a-z]+/, "")
      .slice(0, 34) || "campo";
  let key = base;
  for (let n = 2; taken.has(key); n++) key = `${base}_${n}`;
  return key;
}

interface DraftField extends IntakeFormField {
  /** Local id for React keys — the real `key` is derived from the label on save. */
  uid: string;
  optionsText: string;
}

let uidCounter = 0;
const nextUid = () => `f${++uidCounter}`;

function toDraft(field: IntakeFormField): DraftField {
  return { ...field, uid: nextUid(), optionsText: (field.options ?? []).join("\n") };
}

const DEFAULT_FIELDS: IntakeFormField[] = [
  { key: "assunto", label: "Assunto", type: "TEXT", required: true, mapsTo: "title" },
  { key: "detalhes", label: "Conte mais detalhes", type: "LONG_TEXT", required: false, mapsTo: "description" },
  { key: "email", label: "Seu e-mail", type: "EMAIL", required: false },
];

export function IntakeFormDialog({
  folderId,
  form,
  open,
  onOpenChange,
}: {
  folderId: string;
  form?: IntakeForm;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const createMutation = useCreateIntakeFormMutation(folderId);
  const updateMutation = useUpdateIntakeFormMutation(folderId);
  const [name, setName] = React.useState(form?.name ?? "");
  const [description, setDescription] = React.useState(form?.description ?? "");
  const [sectionId, setSectionId] = React.useState<string | undefined>(form?.targetSectionId ?? undefined);
  const [assigneeId, setAssigneeId] = React.useState<string | undefined>(form?.defaultAssigneeId ?? undefined);
  const [fields, setFields] = React.useState<DraftField[]>(() => (form?.fields ?? DEFAULT_FIELDS).map(toDraft));

  const isPending = createMutation.isPending || updateMutation.isPending;
  const titleField = fields.find((field) => field.mapsTo === "title");
  const problems: string[] = [];
  if (!name.trim()) problems.push("Dê um nome ao formulário.");
  if (!titleField) problems.push("Escolha um campo que vire o título do item.");
  if (fields.some((field) => !field.label.trim())) problems.push("Todo campo precisa de uma pergunta.");
  if (fields.some((field) => field.type === "SELECT" && !field.optionsText.trim()))
    problems.push("Listas de opções precisam de pelo menos uma opção.");

  function patch(uid: string, change: Partial<DraftField>) {
    setFields((current) =>
      current.map((field) => {
        if (field.uid !== uid) {
          // Only one field per target.
          return change.mapsTo && change.mapsTo === field.mapsTo ? { ...field, mapsTo: undefined } : field;
        }
        const next = { ...field, ...change };
        if (next.mapsTo && !targetsFor(next.type).includes(next.mapsTo)) next.mapsTo = undefined;
        // The title answer is always required.
        if (next.mapsTo === "title") next.required = true;
        return next;
      })
    );
  }

  function move(index: number, delta: number) {
    setFields((current) => {
      const next = [...current];
      const [item] = next.splice(index, 1);
      next.splice(index + delta, 0, item);
      return next;
    });
  }

  function save() {
    const taken = new Set<string>();
    const payloadFields: IntakeFormField[] = fields.map((field) => {
      const key = keyFor(field.label, taken);
      taken.add(key);
      const options =
        field.type === "SELECT"
          ? field.optionsText.split("\n").map((o) => o.trim()).filter(Boolean)
          : undefined;
      return {
        key,
        label: field.label.trim(),
        type: field.type,
        required: field.required,
        ...(options ? { options } : {}),
        ...(field.mapsTo ? { mapsTo: field.mapsTo } : {}),
        ...(field.helpText?.trim() ? { helpText: field.helpText.trim() } : {}),
      };
    });
    const close = { onSuccess: () => onOpenChange(false) };
    if (form) {
      updateMutation.mutate(
        {
          formId: form.id,
          payload: {
            name: name.trim(),
            description: description.trim() || null,
            fields: payloadFields,
            targetSectionId: sectionId ?? null,
            defaultAssigneeId: assigneeId ?? null,
          },
        },
        close
      );
    } else {
      createMutation.mutate(
        {
          name: name.trim(),
          description: description.trim() || undefined,
          fields: payloadFields,
          targetSectionId: sectionId,
          defaultAssigneeId: assigneeId,
        },
        close
      );
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>{form ? "Editar formulário" : "Novo formulário"}</DialogTitle>
          <DialogDescription>
            Qualquer pessoa com o link preenche — sem precisar de conta — e cada resposta vira uma
            item nesta pasta.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-1.5 sm:col-span-2">
              <Label htmlFor="form-name">Nome</Label>
              <Input
                id="form-name"
                value={name}
                maxLength={120}
                onChange={(e) => setName(e.target.value)}
                placeholder="Ex.: Pedidos de orçamento"
              />
            </div>
            <div className="space-y-1.5 sm:col-span-2">
              <Label htmlFor="form-description">Texto de apresentação (opcional)</Label>
              <Textarea
                id="form-description"
                rows={2}
                maxLength={2000}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label>Os itens entram na coluna</Label>
              <SectionSelect
                folderId={folderId}
                value={sectionId}
                onChange={setSectionId}
                placeholder="A coluna padrão da pasta"
              />
            </div>
            <div className="space-y-1.5">
              <Label>Responsável pelos itens</Label>
              <AssigneeSelect folderId={folderId} value={assigneeId} onChange={setAssigneeId} />
            </div>
          </div>

          <div className="space-y-2">
            <p className="text-sm font-medium">Perguntas</p>
            {fields.map((field, index) => (
              <div key={field.uid} className="space-y-2 rounded-lg border border-border/60 p-3">
                <div className="flex items-center gap-2">
                  <Input
                    value={field.label}
                    maxLength={120}
                    onChange={(e) => patch(field.uid, { label: e.target.value })}
                    placeholder="Pergunta"
                    aria-label="Pergunta"
                  />
                  <Button variant="ghost" size="icon-sm" aria-label="Subir" disabled={index === 0} onClick={() => move(index, -1)}>
                    <ArrowUp />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    aria-label="Descer"
                    disabled={index === fields.length - 1}
                    onClick={() => move(index, 1)}
                  >
                    <ArrowDown />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    aria-label="Remover pergunta"
                    disabled={fields.length === 1}
                    className="text-destructive hover:text-destructive"
                    onClick={() => setFields((current) => current.filter((f) => f.uid !== field.uid))}
                  >
                    <Trash2 />
                  </Button>
                </div>
                <div className="grid gap-2 sm:grid-cols-[1fr_1fr_auto] sm:items-center">
                  <Select value={field.type} onValueChange={(v) => patch(field.uid, { type: v as IntakeFieldType })}>
                    <SelectTrigger className="w-full" aria-label="Tipo de resposta">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {(Object.keys(FIELD_TYPE_LABEL) as IntakeFieldType[]).map((type) => (
                        <SelectItem key={type} value={type}>
                          {FIELD_TYPE_LABEL[type]}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Select
                    value={field.mapsTo ?? "none"}
                    onValueChange={(v) =>
                      patch(field.uid, { mapsTo: v === "none" ? undefined : (v as IntakeFieldTarget) })
                    }
                  >
                    <SelectTrigger className="w-full" aria-label="Para onde vai a resposta">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {targetsFor(field.type).map((target) => (
                        <SelectItem key={target} value={target}>
                          {TARGET_LABEL[target]}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <label className="flex items-center gap-2 text-sm">
                    <Checkbox
                      checked={field.required}
                      disabled={field.mapsTo === "title"}
                      onCheckedChange={(checked) => patch(field.uid, { required: checked === true })}
                    />
                    Obrigatória
                  </label>
                </div>
                {field.type === "SELECT" ? (
                  <Textarea
                    rows={3}
                    value={field.optionsText}
                    onChange={(e) => patch(field.uid, { optionsText: e.target.value })}
                    placeholder={
                      field.mapsTo === "priority" ? "Baixa\nMédia\nAlta\nUrgente" : "Uma opção por linha"
                    }
                    aria-label="Opções"
                  />
                ) : null}
                <Input
                  value={field.helpText ?? ""}
                  maxLength={300}
                  onChange={(e) => patch(field.uid, { helpText: e.target.value })}
                  placeholder="Dica para quem preenche (opcional)"
                  aria-label="Dica"
                />
              </div>
            ))}
            <Button
              variant="outline"
              size="sm"
              disabled={fields.length >= 30}
              onClick={() =>
                setFields((current) => [
                  ...current,
                  toDraft({ key: "", label: "", type: "TEXT", required: false }),
                ])
              }
            >
              <Plus /> Adicionar pergunta
            </Button>
          </div>

          {problems.length > 0 ? (
            <ul className="list-disc space-y-0.5 pl-5 text-xs text-amber-700 dark:text-amber-400">
              {problems.map((problem) => (
                <li key={problem}>{problem}</li>
              ))}
            </ul>
          ) : null}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isPending}>
            Cancelar
          </Button>
          <Button onClick={save} disabled={problems.length > 0 || isPending}>
            {form ? "Salvar" : "Criar formulário"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
