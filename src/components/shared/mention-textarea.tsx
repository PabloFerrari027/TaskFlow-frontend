"use client";

import * as React from "react";
import { createPortal } from "react-dom";
import { MemberAvatar } from "@/components/shared/member-avatar";
import { Textarea } from "@/components/ui/textarea";
import { useAuth } from "@/lib/auth/auth-context";
import { shortenId } from "@/lib/format";
import { mentionToken } from "@/lib/mentions";
import { cn } from "@/lib/utils";
import { useAssignableMembers } from "@/features/tasks/hooks/use-assignable-members";

// An `@` at the start of a word, followed by the (possibly empty) query being
// typed — up to three words, so full names can be searched.
const TRIGGER = /(^|\s)@([^\s@]*(?: [^\s@]*){0,2})$/;

type ListPosition = {
  host: HTMLElement;
  style: React.CSSProperties;
};

type MentionTextareaProps = Omit<React.ComponentProps<typeof Textarea>, "onChange" | "value"> & {
  projectId: string;
  value: string;
  onChange: (value: string) => void;
};

/**
 * Textarea with inline `@` mentions: typing `@` opens a member list, and
 * picking one writes `@Name` into the text. Which users end up notified is
 * derived from the tokens left in the text (see `extractMentionedUserIds`).
 *
 * The list is portaled out of the field: cards and dialogs clip overflow, which
 * used to hide it.
 */
export function MentionTextarea({
  projectId,
  value,
  onChange,
  className,
  ref,
  onKeyDown,
  onBlur,
  ...props
}: MentionTextareaProps) {
  const { userId: currentUserId } = useAuth();
  const { userIds, names } = useAssignableMembers(projectId);
  const innerRef = React.useRef<HTMLTextAreaElement | null>(null);
  const [query, setQuery] = React.useState<string | null>(null);
  const [active, setActive] = React.useState(0);
  const [position, setPosition] = React.useState<ListPosition | null>(null);
  const listId = React.useId();

  function setRefs(node: HTMLTextAreaElement | null) {
    innerRef.current = node;
    if (typeof ref === "function") ref(node);
    else if (ref) ref.current = node;
  }

  const labelOf = React.useCallback(
    (userId: string) => {
      const name = names.get(userId);
      if (name) return userId === currentUserId ? `${name} (você)` : name;
      return userId === currentUserId ? "Você" : `Usuário ${shortenId(userId)}…`;
    },
    [names, currentUserId],
  );

  const options = React.useMemo(() => {
    if (query === null) return [];
    const q = query.toLowerCase();
    return userIds
      .filter((id) => {
        const name = names.get(id)?.toLowerCase();
        if (name) return name.includes(q);
        if (id === currentUserId && "você".startsWith(q)) return true;
        return id.toLowerCase().startsWith(q);
      })
      .slice(0, 6);
  }, [query, userIds, names, currentUserId]);

  const open = query !== null && options.length > 0;

  // Below the field, in a portal. Inside a dialog it's hosted by the dialog
  // (its transform would break `fixed`), elsewhere by the body.
  React.useLayoutEffect(() => {
    if (!open) return;

    function place() {
      const el = innerRef.current;
      if (!el) return;
      const rect = el.getBoundingClientRect();
      const dialog = el.closest<HTMLElement>('[role="dialog"]');

      if (dialog) {
        const host = dialog.getBoundingClientRect();
        setPosition({
          host: dialog,
          style: {
            position: "absolute",
            top: rect.bottom - host.top + dialog.scrollTop + 4,
            left: rect.left - host.left + dialog.scrollLeft,
          },
        });
        return;
      }

      const fitsBelow = window.innerHeight - rect.bottom >= 240;
      setPosition({
        host: document.body,
        style: {
          position: "fixed",
          left: rect.left,
          ...(fitsBelow
            ? { top: rect.bottom + 4 }
            : { bottom: window.innerHeight - rect.top + 4 }),
        },
      });
    }

    place();
    window.addEventListener("resize", place);
    window.addEventListener("scroll", place, true);
    return () => {
      window.removeEventListener("resize", place);
      window.removeEventListener("scroll", place, true);
    };
  }, [open, value]);

  function detectTrigger(text: string, caret: number) {
    const match = TRIGGER.exec(text.slice(0, caret));
    setQuery(match ? match[2] : null);
    setActive(0);
  }

  function select(userId: string) {
    const el = innerRef.current;
    if (!el) return;
    const caret = el.selectionStart;
    const match = TRIGGER.exec(value.slice(0, caret));
    if (!match) return;

    const start = caret - match[2].length - 1; // position of the `@`
    const inserted = `${mentionToken(userId, names)} `;
    const next = value.slice(0, start) + inserted + value.slice(caret);
    const nextCaret = start + inserted.length;

    onChange(next);
    setQuery(null);
    requestAnimationFrame(() => {
      el.focus();
      el.setSelectionRange(nextCaret, nextCaret);
    });
  }

  function handleKeyDown(event: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (open) {
      if (event.key === "ArrowDown") {
        event.preventDefault();
        setActive((i) => (i + 1) % options.length);
        return;
      }
      if (event.key === "ArrowUp") {
        event.preventDefault();
        setActive((i) => (i - 1 + options.length) % options.length);
        return;
      }
      if (event.key === "Enter" || event.key === "Tab") {
        event.preventDefault();
        select(options[active]);
        return;
      }
      if (event.key === "Escape") {
        // Don't let a surrounding dialog / inline field treat it as "cancel".
        event.preventDefault();
        event.stopPropagation();
        setQuery(null);
        return;
      }
    }
    onKeyDown?.(event);
  }

  return (
    <div className="relative">
      <Textarea
        {...props}
        ref={setRefs}
        value={value}
        className={className}
        role="combobox"
        aria-expanded={open}
        aria-controls={open ? listId : undefined}
        aria-autocomplete="list"
        onChange={(event) => {
          onChange(event.target.value);
          detectTrigger(event.target.value, event.target.selectionStart);
        }}
        onKeyDown={handleKeyDown}
        // Caret moves without typing (arrows, click) can enter/leave a mention.
        onKeyUp={(event) => {
          if (event.key === "ArrowLeft" || event.key === "ArrowRight") {
            detectTrigger(value, event.currentTarget.selectionStart);
          }
        }}
        onClick={(event) => detectTrigger(value, event.currentTarget.selectionStart)}
        onBlur={(event) => {
          setQuery(null);
          onBlur?.(event);
        }}
      />

      {open && position
        ? createPortal(
            <ul
              id={listId}
              role="listbox"
              style={position.style}
              className="pointer-events-auto z-100 w-64 overflow-hidden rounded-lg border border-border bg-popover p-1 shadow-md"
            >
              {options.map((userId, index) => (
                <li
                  key={userId}
                  role="option"
                  aria-selected={index === active}
                  // Keep focus in the textarea so its blur doesn't close the list first.
                  onMouseDown={(event) => {
                    event.preventDefault();
                    select(userId);
                  }}
                  onMouseEnter={() => setActive(index)}
                  className={cn(
                    "flex cursor-pointer items-center gap-2 rounded-md px-2 py-1.5 text-sm",
                    index === active && "bg-accent text-accent-foreground",
                  )}
                >
                  <MemberAvatar userId={userId} className="size-5" />
                  <span className="flex-1 truncate">{labelOf(userId)}</span>
                </li>
              ))}
            </ul>,
            position.host,
          )
        : null}
    </div>
  );
}
