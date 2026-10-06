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
  create_folder: "Pasta criada",
  update_folder: "Pasta atualizada",
  archive_folder: "Pasta arquivada",
  create_item: "Item criado",
  update_item: "Item atualizado",
  assign_item: "Item atribuído",
  move_item: "Item movido",
  change_item_status: "Status do item alterado",
  add_item_participant: "Participante adicionado",
  remove_item_participant: "Participante removido",
  request_item_approval: "Aprovação pedida",
  attach_files_to_item: "Arquivos anexados",
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
