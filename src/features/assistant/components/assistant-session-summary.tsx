"use client";

import { Button } from "@/components/ui/button";
import { formatTime } from "@/lib/format";
import type { ConfirmedActionSummary } from "@/features/assistant/types";

// Readable past-tense label per tool — falls back to the raw name for any
// tool this map hasn't been updated for yet.
const TOOL_PAST_LABEL: Record<string, string> = {
  create_workspace: "Workspace criado",
  update_workspace: "Workspace atualizado",
  invite_workspace_member: "Membro convidado",
  delete_workspace: "Workspace apagado",
  remove_workspace_member: "Membro removido",
  create_project: "Projeto criado",
  update_project: "Projeto atualizado",
  archive_project: "Projeto arquivado",
  create_task: "Tarefa criada",
  update_task: "Tarefa atualizada",
  assign_task: "Tarefa atribuída",
  move_task: "Tarefa movida",
  change_task_status: "Status da tarefa alterado",
  add_task_participant: "Participante adicionado",
  remove_task_participant: "Participante removido",
  revoke_session: "Sessão encerrada",
};

function toolLabel(tool: string): string {
  return TOOL_PAST_LABEL[tool] ?? tool;
}

// Shown when the user clicks "Encerrar e revisar" — a deliberate pause
// before the Sheet actually closes, listing every action confirmed this
// session so nothing that happened gets lost once the conversation resets.
export function AssistantSessionSummary({
  confirmedActions,
  onClose,
}: {
  confirmedActions: ConfirmedActionSummary[];
  onClose: () => void;
}) {
  return (
    <div className="flex flex-1 flex-col overflow-hidden">
      <div className="flex-1 space-y-3 overflow-y-auto p-4">
        <p className="text-sm text-muted-foreground">
          Resumo das ações confirmadas nesta conversa antes de encerrar.
        </p>
        <ul className="space-y-2">
          {confirmedActions.map((action, index) => (
            <li key={index} className="space-y-0.5 rounded-lg border border-border/60 p-3">
              <div className="flex items-center justify-between gap-2">
                <p className="text-sm font-medium text-foreground">{toolLabel(action.tool)}</p>
                <span className="shrink-0 text-xs text-muted-foreground">
                  {formatTime(action.confirmedAt)}
                </span>
              </div>
              <p className="text-xs text-muted-foreground">{action.humanDescription}</p>
            </li>
          ))}
        </ul>
      </div>
      <div className="border-t border-border/60 p-4">
        <Button className="w-full" onClick={onClose}>
          Fechar
        </Button>
      </div>
    </div>
  );
}
