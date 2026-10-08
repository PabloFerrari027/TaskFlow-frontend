// Readable past-tense label per assistant tool, for lay users — the chat's
// "done" lines and the end-of-session summary. Falls back to a generic text,
// never the raw tool name. Keep in sync with the backend catalogs
// (`.claude/skills/taskflow-web-assistant/scripts/check-assistant-tools.mjs`).
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
  save_information: "Informação guardada",
  undo_saved_information: "Informação desfeita",
  relocate_information: "Informação mudada de lugar",
  organize_information: "Informações organizadas em uma pasta",
  revoke_session: "Sessão encerrada",
  // Read tools: also reported as executed, so they need a label too.
  list_workspaces: "Workspaces consultados",
  list_folders: "Pastas consultadas",
  list_items: "Itens consultados",
  list_sessions: "Sessões consultadas",
  find_information: "Informações procuradas",
  suggest_organization: "Sugestão de organização preparada",
};

export function toolLabel(tool: string): string {
  return TOOL_PAST_LABEL[tool] ?? "Ação concluída";
}
