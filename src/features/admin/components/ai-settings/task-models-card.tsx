"use client";

import * as React from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useSetTaskModelMutation } from "@/features/admin/hooks/use-ai-settings";
import type { AiReasoningEffort, AiSettings, AiTask } from "@/types/ai-settings";

const DEFAULT = "__default";
const OTHER = "__other";

// Sugestões — qualquer "fornecedor:modelo" vale em "Outro modelo…". Só aparecem as de fornecedor com chave.
const CHAT_MODELS = [
  "openai:gpt-5.4-nano",
  "openai:gpt-4o-mini",
  "openai:gpt-4.1-mini",
  "openai:gpt-4.1",
  "gemini:gemini-flash-lite-latest",
  "gemini:gemini-flash-latest",
];
const TRANSCRIPTION_MODELS = ["openai:gpt-4o-mini-transcribe", "openai:gpt-4o-transcribe", "gemini:gemini-flash-latest"];

const EFFORT_LABEL: Record<string, string> = { low: "baixo", medium: "médio", high: "alto" };

/** Mesma regra do servidor (`supportsReasoningEffort`): só os modelos que pensam antes de responder usam o esforço. */
const REASONING_MODEL = /^openai:(?:od|gpt-5)/;

function suggestionsFor(task: AiTask, providers: string[]): string[] {
  const list = task.task === "speech-to-text" ? TRANSCRIPTION_MODELS : CHAT_MODELS;
  return list.filter((model) => providers.includes(model.split(":")[0]));
}

function TaskModelRow({ task, planId, providers }: { task: AiTask; planId: string; providers: string[] }) {
  const choice = task.byPlan[planId] ?? null;
  const mutation = useSetTaskModelMutation();
  const suggestions = suggestionsFor(task, providers);
  const current = choice?.model ?? null;
  const isOther = current !== null && !suggestions.includes(current);
  const [editingOther, setEditingOther] = React.useState(false);
  const [otherValue, setOtherValue] = React.useState(isOther ? current : "");
  const effort = (choice?.reasoningEffort as AiReasoningEffort | null) ?? null;

  function save(model: string | null, reasoningEffort: AiReasoningEffort | null = effort) {
    mutation.mutate({ planId, task: task.task, model, reasoningEffort: model === null ? null : reasoningEffort });
  }

  const selectValue = editingOther || isOther ? OTHER : (current ?? DEFAULT);

  return (
    <div className="grid gap-3 py-4 sm:grid-cols-[1fr_minmax(0,22rem)] sm:items-start">
      <div className="min-w-0">
        <p className="text-sm font-medium text-foreground">{task.label}</p>
        <p className="text-xs text-muted-foreground">{task.description}</p>
      </div>
      <div className="space-y-2">
        <Select
          value={selectValue}
          disabled={mutation.isPending}
          onValueChange={(value) => {
            if (value === OTHER) {
              setEditingOther(true);
              return;
            }
            setEditingOther(false);
            save(value === DEFAULT ? null : value);
          }}
        >
          <SelectTrigger className="w-full" aria-label={`Modelo de ${task.label}`}>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={DEFAULT}>Padrão: {task.serverDefault.model}</SelectItem>
            {suggestions.map((model) => (
              <SelectItem key={model} value={model}>
                {model}
              </SelectItem>
            ))}
            <SelectItem value={OTHER}>{isOther ? current : "Outro modelo…"}</SelectItem>
          </SelectContent>
        </Select>

        {editingOther ? (
          <form
            className="flex gap-2"
            onSubmit={(event) => {
              event.preventDefault();
              if (!otherValue.trim()) return;
              save(otherValue.trim());
              setEditingOther(false);
            }}
          >
            <Input
              autoFocus
              value={otherValue}
              onChange={(event) => setOtherValue(event.target.value)}
              placeholder="fornecedor:modelo, ex.: openai:gpt-4.1"
              aria-label={`Outro modelo para ${task.label}`}
            />
            <Button type="submit" size="sm" disabled={!otherValue.trim() || mutation.isPending}>
              Salvar
            </Button>
          </form>
        ) : null}

        {current !== null && REASONING_MODEL.test(current) ? (
          <Select value={effort ?? DEFAULT} disabled={mutation.isPending} onValueChange={(value) => save(current, value === DEFAULT ? null : (value as AiReasoningEffort))}>
            <SelectTrigger className="w-full" aria-label={`Raciocínio de ${task.label}`}>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={DEFAULT}>
                Raciocínio: padrão{task.serverDefault.reasoningEffort ? ` (${EFFORT_LABEL[task.serverDefault.reasoningEffort] ?? task.serverDefault.reasoningEffort})` : ""}
              </SelectItem>
              <SelectItem value="low">Raciocínio: baixo (mais barato)</SelectItem>
              <SelectItem value="medium">Raciocínio: médio</SelectItem>
              <SelectItem value="high">Raciocínio: alto (mais caro)</SelectItem>
            </SelectContent>
          </Select>
        ) : null}
      </div>
    </div>
  );
}

export function TaskModelsCard({ settings, planId }: { settings: AiSettings; planId: string }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Modelos</CardTitle>
        <CardDescription>
          Qual modelo faz cada trabalho neste plano. Vale a partir da próxima mensagem. Um nome de
          modelo errado faz aquela tarefa falhar, então teste depois de trocar. Nos modelos que pensam
          antes de responder (gpt-5), dá para escolher quanto raciocínio usar.
        </CardDescription>
      </CardHeader>
      <CardContent className="divide-y">
        {settings.tasks.map((task) => (
          <TaskModelRow key={`${task.task}-${planId}`} task={task} planId={planId} providers={settings.providers} />
        ))}
      </CardContent>
    </Card>
  );
}
