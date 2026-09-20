"use client";

import * as React from "react";
import { Loader2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { MentionPicker } from "@/components/shared/mention-picker";
import { useUpdateTaskMutation } from "@/features/tasks/hooks/use-tasks";
import { cn } from "@/lib/utils";

// Look-alike-plain-text styling: the field reads like the static heading or
// paragraph it replaces until hovered or focused, so no "edit" affordance is
// needed to discover it.
const INLINE_FIELD_CLASS =
  "border-transparent bg-transparent px-2 hover:border-input focus-visible:border-ring dark:bg-transparent";

/**
 * Local draft on top of the server value: `null` means "not being edited, show
 * what the server has". The draft is only dropped once the save settles, so
 * the field doesn't flash the old value between blur and the response, and a
 * failed save falls back to the server value instead of a lie.
 */
function useAutoSavedText({
  taskId,
  serverValue,
  field,
  allowEmpty,
  silent,
}: {
  taskId: string;
  serverValue: string;
  field: "title" | "description";
  allowEmpty: boolean;
  silent?: boolean;
}) {
  const updateMutation = useUpdateTaskMutation(taskId, { silent });
  const [draft, setDraft] = React.useState<string | null>(null);

  function commit() {
    if (draft === null || updateMutation.isPending) return;
    const next = draft.trim();
    if (next === serverValue.trim() || (!allowEmpty && !next)) {
      setDraft(null);
      return;
    }
    updateMutation.mutate({ [field]: next }, { onSettled: () => setDraft(null) });
  }

  return {
    value: draft ?? serverValue,
    isSaving: updateMutation.isPending,
    onChange: setDraft,
    commit,
    revert: () => setDraft(null),
  };
}

export function TaskTitleField({ taskId, title }: { taskId: string; title: string }) {
  const { value, isSaving, onChange, commit, revert } = useAutoSavedText({
    taskId,
    serverValue: title,
    field: "title",
    allowEmpty: false,
  });

  return (
    <div className="relative flex-1">
      <Input
        aria-label="Título da tarefa"
        value={value}
        disabled={isSaving}
        onChange={(e) => onChange(e.target.value)}
        onBlur={commit}
        onKeyDown={(e) => {
          if (e.key === "Enter") e.currentTarget.blur();
          if (e.key === "Escape") {
            revert();
            e.currentTarget.blur();
          }
        }}
        className={cn(INLINE_FIELD_CLASS, "h-auto py-1 text-xl font-semibold md:text-xl")}
      />
      {isSaving ? (
        <Loader2 className="absolute top-1/2 right-2 size-4 -translate-y-1/2 animate-spin text-muted-foreground" />
      ) : null}
    </div>
  );
}

// Every title input of the table carries this attribute so Enter/arrows can hop
// between rows like a spreadsheet column.
const TITLE_CELL_ATTR = "data-task-title-cell";

function focusSiblingTitleCell(input: HTMLInputElement, offset: 1 | -1) {
  const cells = Array.from(
    input.closest("table")?.querySelectorAll<HTMLInputElement>(`input[${TITLE_CELL_ATTR}]`) ?? []
  );
  cells[cells.indexOf(input) + offset]?.focus();
}

/**
 * The title as a table cell. Unlike `TaskTitleField` it stays enabled while
 * saving (a disabled input drops focus and would break Tab/Enter navigation)
 * and saves silently — see `useUpdateTaskMutation`'s `silent` option.
 */
export function TaskTitleCell({ taskId, title }: { taskId: string; title: string }) {
  const { value, isSaving, onChange, commit, revert } = useAutoSavedText({
    taskId,
    serverValue: title,
    field: "title",
    allowEmpty: false,
    silent: true,
  });

  return (
    <div className="relative">
      <Input
        {...{ [TITLE_CELL_ATTR]: "" }}
        aria-label="Título da tarefa"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onBlur={commit}
        onKeyDown={(e) => {
          const input = e.currentTarget;
          if (e.key === "Enter") {
            // Blur first so the draft is committed, then move down a row.
            input.blur();
            focusSiblingTitleCell(input, 1);
          } else if (e.key === "ArrowDown") {
            e.preventDefault();
            focusSiblingTitleCell(input, 1);
          } else if (e.key === "ArrowUp") {
            e.preventDefault();
            focusSiblingTitleCell(input, -1);
          } else if (e.key === "Escape") {
            revert();
            input.blur();
          }
        }}
        className={cn(INLINE_FIELD_CLASS, "h-8 pr-7 shadow-none")}
      />
      {isSaving ? (
        <Loader2 className="absolute top-1/2 right-2 size-3.5 -translate-y-1/2 animate-spin text-muted-foreground" />
      ) : null}
    </div>
  );
}

export function TaskDescriptionField({
  projectId,
  taskId,
  description,
  mentionedUserIds,
}: {
  projectId: string;
  taskId: string;
  description: string | null;
  mentionedUserIds: string[];
}) {
  const { value, isSaving, onChange, commit, revert } = useAutoSavedText({
    taskId,
    serverValue: description ?? "",
    field: "description",
    allowEmpty: true,
  });
  const mentionMutation = useUpdateTaskMutation(taskId);

  return (
    <>
      <Textarea
        aria-label="Descrição da tarefa"
        placeholder="Adicionar descrição…"
        value={value}
        disabled={isSaving}
        onChange={(e) => onChange(e.target.value)}
        onBlur={commit}
        onKeyDown={(e) => {
          if (e.key === "Escape") {
            revert();
            e.currentTarget.blur();
          }
        }}
        className={cn(INLINE_FIELD_CLASS, "mt-2 min-h-20 text-muted-foreground focus:text-foreground")}
      />
      {/* Saved on each change (the PATCH replaces the whole mention set), not
          on blur like the text — picking someone is a discrete action. */}
      <MentionPicker
        projectId={projectId}
        value={mentionedUserIds}
        disabled={mentionMutation.isPending}
        onChange={(next) => mentionMutation.mutate({ mentionedUserIds: next })}
        className="mt-1 px-2"
      />
    </>
  );
}
