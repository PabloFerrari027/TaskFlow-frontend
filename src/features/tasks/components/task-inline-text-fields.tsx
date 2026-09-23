"use client";

import * as React from "react";
import { Loader2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { MarkdownContent } from "@/components/shared/markdown-content";
import { MarkdownTextarea } from "@/components/shared/markdown-textarea";
import { useAssignableMembers } from "@/features/tasks/hooks/use-assignable-members";
import { useUpdateTaskMutation } from "@/features/tasks/hooks/use-tasks";
import { extractMentionedUserIds } from "@/lib/mentions";
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
  mentionsOf,
}: {
  taskId: string;
  serverValue: string;
  field: "title" | "description";
  allowEmpty: boolean;
  silent?: boolean;
  // Saved together with the text: the mention set is derived from the `@` tokens in it.
  mentionsOf?: (text: string) => string[];
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
    updateMutation.mutate(
      { [field]: next, ...(mentionsOf ? { mentionedUserIds: mentionsOf(next) } : {}) },
      { onSettled: () => setDraft(null) }
    );
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
}: {
  projectId: string;
  taskId: string;
  description: string | null;
}) {
  const { userIds, names } = useAssignableMembers(projectId);
  const { value, isSaving, onChange, commit, revert } = useAutoSavedText({
    taskId,
    serverValue: description ?? "",
    field: "description",
    allowEmpty: true,
    // The PATCH replaces the whole mention set, so it follows the text.
    mentionsOf: (text) => extractMentionedUserIds(text, userIds, names),
  });

  const [editing, setEditing] = React.useState(false);
  const textareaRef = React.useRef<HTMLTextAreaElement | null>(null);

  // Entering edit mode puts the caret at the end, ready to keep typing.
  React.useEffect(() => {
    const el = textareaRef.current;
    if (!editing || !el) return;
    el.focus();
    el.setSelectionRange(el.value.length, el.value.length);
  }, [editing]);

  function startEditing() {
    // Dragging to select text to copy also ends in a click — don't hijack it.
    if (window.getSelection()?.toString()) return;
    setEditing(true);
  }

  if (!editing) {
    const hasText = value.trim().length > 0;
    return (
      <div
        role="button"
        tabIndex={0}
        aria-label="Editar descrição da tarefa"
        onClick={startEditing}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            setEditing(true);
          }
        }}
        className={cn(
          INLINE_FIELD_CLASS,
          "mt-2 min-h-20 cursor-text rounded-lg border py-1.5 text-sm outline-none focus-visible:ring-3 focus-visible:ring-ring/50",
          isSaving && "opacity-60"
        )}
      >
        {hasText ? (
          <MarkdownContent
            content={value}
            mentionedUserIds={extractMentionedUserIds(value, userIds, names)}
            names={names}
          />
        ) : (
          <span className="text-muted-foreground">Adicionar descrição…</span>
        )}
      </div>
    );
  }

  return (
    <div className="mt-2">
      <MarkdownTextarea
        ref={textareaRef}
        projectId={projectId}
        aria-label="Descrição da tarefa"
        placeholder="Adicionar descrição… use @ para mencionar e a barra para formatar"
        value={value}
        onChange={onChange}
        onBlur={() => {
          commit();
          setEditing(false);
        }}
        onKeyDown={(e) => {
          if (e.key === "Escape") {
            revert();
            setEditing(false);
          } else if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) {
            e.preventDefault();
            e.currentTarget.blur(); // blur saves and leaves edit mode
          }
        }}
        className={cn(INLINE_FIELD_CLASS, "min-h-28 border-input")}
      />
      <p className="mt-1 px-1 text-xs text-muted-foreground">
        Ctrl+Enter salva · Esc cancela · Markdown suportado
      </p>
    </div>
  );
}
