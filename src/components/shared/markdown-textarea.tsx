"use client";

import * as React from "react";
import {
  Bold,
  Code,
  Heading2,
  Italic,
  Link as LinkIcon,
  List,
  ListChecks,
  ListOrdered,
  Quote,
  Strikethrough,
  type LucideIcon,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { MentionTextarea } from "@/components/shared/mention-textarea";
import {
  applyMarkdownAction,
  continueList,
  indentListLines,
  linkSelectionToUrl,
  type MarkdownAction,
  type TextEdit,
} from "@/lib/markdown-format";
import { cn } from "@/lib/utils";

interface ToolbarItem {
  action: MarkdownAction;
  label: string;
  shortcut: string;
  icon: LucideIcon;
}

// Grouped like most editors: inline styles · block styles · lists · link.
const TOOLBAR_GROUPS: ToolbarItem[][] = [
  [
    { action: "bold", label: "Negrito", shortcut: "Ctrl+B", icon: Bold },
    { action: "italic", label: "Itálico", shortcut: "Ctrl+I", icon: Italic },
    { action: "strike", label: "Tachado", shortcut: "Ctrl+Shift+X", icon: Strikethrough },
    { action: "code", label: "Código", shortcut: "Ctrl+E", icon: Code },
  ],
  [
    { action: "heading", label: "Título", shortcut: "Ctrl+Shift+2", icon: Heading2 },
    { action: "quote", label: "Citação", shortcut: "Ctrl+Shift+.", icon: Quote },
  ],
  [
    { action: "bullet", label: "Lista", shortcut: "Ctrl+Shift+8", icon: List },
    { action: "numbered", label: "Lista numerada", shortcut: "Ctrl+Shift+7", icon: ListOrdered },
    { action: "task", label: "Lista de tarefas", shortcut: "Ctrl+Shift+9", icon: ListChecks },
  ],
  [{ action: "link", label: "Link", shortcut: "Ctrl+K", icon: LinkIcon }],
];

const KEY_ACTIONS: Record<string, MarkdownAction> = { b: "bold", i: "italic", e: "code", k: "link" };
// Shift combos are matched on the physical key: the character Shift+7 types
// differs between keyboard layouts.
const SHIFT_CODE_ACTIONS: Record<string, MarkdownAction> = {
  Digit7: "numbered",
  Digit8: "bullet",
  Digit9: "task",
  Period: "quote",
};
const HEADING_LEVELS: Record<string, 1 | 2 | 3> = { Digit1: 1, Digit2: 2, Digit3: 3 };

type MarkdownTextareaProps = React.ComponentProps<typeof MentionTextarea> & {
  toolbarClassName?: string;
};

/**
 * `MentionTextarea` with a Markdown formatting toolbar. The text stays plain
 * Markdown (that's what the API stores); the buttons and shortcuts just
 * insert or toggle the syntax around the selection. Also behaves like a
 * proper editor: Enter continues lists, Tab nests them, pasting a URL over a
 * selection links it, and Ctrl+Z undoes a formatting step.
 */
export function MarkdownTextarea({
  value,
  onChange,
  onKeyDown,
  onPaste,
  disabled,
  className,
  toolbarClassName,
  ref,
  ...props
}: MarkdownTextareaProps) {
  const innerRef = React.useRef<HTMLTextAreaElement | null>(null);

  function setRefs(node: HTMLTextAreaElement | null) {
    innerRef.current = node;
    if (typeof ref === "function") ref(node);
    else if (ref) ref.current = node;
  }

  /**
   * Writes the edit through `execCommand("insertText")` so it lands on the
   * browser's undo stack (setting `value` from React wipes it). Falls back to
   * a plain `onChange` where that isn't supported.
   */
  function applyEdit(el: HTMLTextAreaElement, edit: TextEdit) {
    const prev = el.value;
    const next = edit.value;

    if (prev !== next) {
      let head = 0;
      while (head < prev.length && head < next.length && prev[head] === next[head]) head++;
      let tail = 0;
      while (
        tail < prev.length - head &&
        tail < next.length - head &&
        prev[prev.length - 1 - tail] === next[next.length - 1 - tail]
      ) {
        tail++;
      }

      el.focus();
      el.setSelectionRange(head, prev.length - tail);
      const inserted = next.slice(head, next.length - tail);
      const done = inserted
        ? document.execCommand("insertText", false, inserted)
        : document.execCommand("delete");
      if (!done || el.value !== next) onChange(next);
    }

    el.setSelectionRange(edit.start, edit.end);
    requestAnimationFrame(() => {
      el.focus();
      el.setSelectionRange(edit.start, edit.end);
    });
  }

  function apply(action: MarkdownAction, level?: 1 | 2 | 3) {
    const el = innerRef.current;
    if (!el || disabled) return;
    applyEdit(el, applyMarkdownAction(action, el.value, el.selectionStart, el.selectionEnd, { level }));
  }

  function handleKeyDown(event: React.KeyboardEvent<HTMLTextAreaElement>) {
    const el = event.currentTarget;
    const mod = event.ctrlKey || event.metaKey;

    if (mod && !event.altKey) {
      if (!event.shiftKey) {
        const action = KEY_ACTIONS[event.key.toLowerCase()];
        if (action) {
          event.preventDefault();
          apply(action);
          return;
        }
      } else {
        if (event.key.toLowerCase() === "x") {
          event.preventDefault();
          apply("strike");
          return;
        }
        const action = SHIFT_CODE_ACTIONS[event.code];
        if (action) {
          event.preventDefault();
          apply(action);
          return;
        }
        const level = HEADING_LEVELS[event.code];
        if (level) {
          event.preventDefault();
          apply("heading", level);
          return;
        }
      }
    }

    if (!mod && !event.altKey && !event.nativeEvent.isComposing) {
      if (event.key === "Enter" && !event.shiftKey && el.selectionStart === el.selectionEnd) {
        const edit = continueList(el.value, el.selectionStart);
        if (edit) {
          event.preventDefault();
          applyEdit(el, edit);
          return;
        }
      }
      if (event.key === "Tab") {
        const edit = indentListLines(el.value, el.selectionStart, el.selectionEnd, event.shiftKey);
        if (edit) {
          event.preventDefault();
          applyEdit(el, edit);
          return;
        }
      }
    }

    onKeyDown?.(event);
  }

  function handlePaste(event: React.ClipboardEvent<HTMLTextAreaElement>) {
    const el = event.currentTarget;
    const edit = linkSelectionToUrl(
      el.value,
      el.selectionStart,
      el.selectionEnd,
      event.clipboardData.getData("text/plain"),
    );
    if (edit) {
      event.preventDefault();
      applyEdit(el, edit);
      return;
    }
    onPaste?.(event);
  }

  return (
    <div className="space-y-1.5">
      <div
        role="toolbar"
        aria-label="Formatação"
        className={cn(
          "flex flex-wrap items-center gap-0.5 rounded-lg border border-border/60 bg-muted/30 p-1",
          toolbarClassName,
        )}
      >
        {TOOLBAR_GROUPS.map((group, index) => (
          <React.Fragment key={group[0].action}>
            {index > 0 ? <span aria-hidden className="mx-1 h-5 w-px bg-border" /> : null}
            {group.map(({ action, label, shortcut, icon: Icon }) => (
              <Button
                key={action}
                type="button"
                size="icon"
                variant="ghost"
                title={`${label} (${shortcut})`}
                aria-label={label}
                aria-keyshortcuts={shortcut.replace("Ctrl", "Control")}
                disabled={disabled}
                // Keep the caret/selection (and focus) in the textarea.
                onMouseDown={(event) => event.preventDefault()}
                onClick={() => apply(action)}
                className="[&_svg:not([class*='size-'])]:size-4.5"
              >
                <Icon />
              </Button>
            ))}
          </React.Fragment>
        ))}
      </div>

      <MentionTextarea
        {...props}
        ref={setRefs}
        value={value}
        onChange={onChange}
        disabled={disabled}
        className={className}
        onKeyDown={handleKeyDown}
        onPaste={handlePaste}
      />
    </div>
  );
}
