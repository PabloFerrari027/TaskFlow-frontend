"use client";

import * as React from "react";
import { AtSign, Check, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { MemberAvatar, MemberIdLabel } from "@/components/shared/member-avatar";
import { shortenId } from "@/lib/format";
import { cn } from "@/lib/utils";
import { useAuth } from "@/lib/auth/auth-context";
import { useAssignableMembers } from "@/features/tasks/hooks/use-assignable-members";

/**
 * The API stores mentions as a separate `mentionedUserIds` list — the text
 * itself carries no `@` token — and member endpoints only expose ids, never
 * names. So mentioning is an explicit "pick who to notify" control (chips +
 * searchable member list) instead of inline `@name` autocompletion in the
 * textarea, which would have no name to insert.
 */
export function MentionPicker({
  projectId,
  value,
  onChange,
  disabled,
  className,
}: {
  projectId: string;
  value: string[];
  onChange: (next: string[]) => void;
  disabled?: boolean;
  className?: string;
}) {
  const { userId: currentUserId } = useAuth();
  const { userIds, isLoading } = useAssignableMembers(projectId);
  const [open, setOpen] = React.useState(false);

  function toggle(userId: string) {
    onChange(value.includes(userId) ? value.filter((id) => id !== userId) : [...value, userId]);
  }

  return (
    <div className={cn("flex flex-wrap items-center gap-1.5", className)}>
      {value.map((userId) => (
        <span
          key={userId}
          className="inline-flex items-center gap-1.5 rounded-full border border-border/60 bg-muted/40 py-0.5 pr-1 pl-1"
        >
          <MemberAvatar userId={userId} className="size-5" />
          <MemberIdLabel userId={userId} />
          <button
            type="button"
            aria-label="Remover menção"
            disabled={disabled}
            onClick={() => toggle(userId)}
            className="rounded-full p-0.5 text-muted-foreground hover:bg-muted hover:text-foreground disabled:pointer-events-none disabled:opacity-50"
          >
            <X className="size-3" />
          </button>
        </span>
      ))}

      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button type="button" size="xs" variant="ghost" disabled={disabled || isLoading}>
            <AtSign /> Mencionar
          </Button>
        </PopoverTrigger>
        <PopoverContent align="start" className="w-64 p-0">
          <Command>
            <CommandInput placeholder="Buscar membro…" />
            <CommandList>
              <CommandEmpty>Nenhum membro encontrado.</CommandEmpty>
              <CommandGroup>
                {userIds.map((userId) => {
                  const selected = value.includes(userId);
                  const label = userId === currentUserId ? "Você" : `Usuário ${shortenId(userId)}…`;
                  return (
                    <CommandItem
                      key={userId}
                      // cmdk filters on `value`, so it has to be the visible label.
                      value={`${label} ${userId}`}
                      onSelect={() => toggle(userId)}
                    >
                      <MemberAvatar userId={userId} className="size-5" />
                      <span className="flex-1 truncate">{label}</span>
                      {selected ? <Check className="size-4" /> : null}
                    </CommandItem>
                  );
                })}
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
    </div>
  );
}

/** Read-only counterpart of `MentionPicker`, for showing who a saved text mentions. */
export function MentionedUsers({ userIds, className }: { userIds: string[]; className?: string }) {
  if (userIds.length === 0) return null;

  return (
    <div className={cn("flex flex-wrap items-center gap-1.5", className)}>
      <AtSign className="size-3.5 text-muted-foreground" />
      {userIds.map((userId) => (
        <span
          key={userId}
          className="inline-flex items-center gap-1.5 rounded-full border border-border/60 bg-muted/40 py-0.5 pr-2 pl-1"
        >
          <MemberAvatar userId={userId} className="size-5" />
          <MemberIdLabel userId={userId} />
        </span>
      ))}
    </div>
  );
}
