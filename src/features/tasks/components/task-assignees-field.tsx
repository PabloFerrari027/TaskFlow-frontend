"use client";

import * as React from "react";
import { Check, Star, UserPlus, X } from "lucide-react";
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
import { MemberAvatar } from "@/components/shared/member-avatar";
import { shortenId } from "@/lib/format";
import { useAuth } from "@/lib/auth/auth-context";
import { useAssignableMembers } from "@/features/tasks/hooks/use-assignable-members";
import { useUpdateTaskMutation } from "@/features/tasks/hooks/use-tasks";

const MAX_ASSIGNEES = 20;

export function useMemberName(projectId: string) {
  const { userId: currentUserId } = useAuth();
  const { names } = useAssignableMembers(projectId);
  return React.useCallback(
    (userId: string) =>
      userId === currentUserId
        ? "Você"
        : (names.get(userId) ?? `Usuário ${shortenId(userId)}…`),
    [currentUserId, names]
  );
}

/**
 * Every assignee of a task. The first one is the main assignee (the one shown
 * on cards and used by "assigned to me"); the rest share the task. Each change
 * sends the complete set (`assigneeIds`).
 */
export function TaskAssigneesField({
  projectId,
  taskId,
  assigneeIds,
}: {
  projectId: string;
  taskId: string;
  assigneeIds: string[];
}) {
  const [open, setOpen] = React.useState(false);
  const { userIds } = useAssignableMembers(projectId);
  const memberName = useMemberName(projectId);
  const updateMutation = useUpdateTaskMutation(taskId);

  function save(next: string[]) {
    updateMutation.mutate({ assigneeIds: next });
  }

  function toggle(userId: string) {
    if (assigneeIds.includes(userId)) save(assigneeIds.filter((id) => id !== userId));
    else if (assigneeIds.length < MAX_ASSIGNEES) save([...assigneeIds, userId]);
  }

  return (
    <div className={updateMutation.isPending ? "pointer-events-none space-y-2 opacity-60" : "space-y-2"}>
      {assigneeIds.length === 0 ? (
        <p className="text-sm text-muted-foreground">Ninguém ainda.</p>
      ) : (
        <ul className="space-y-1.5">
          {assigneeIds.map((userId, index) => (
            <li key={userId} className="flex items-center gap-2">
              <MemberAvatar userId={userId} />
              <span className="min-w-0 flex-1 truncate text-sm">{memberName(userId)}</span>
              {index === 0 ? (
                assigneeIds.length > 1 ? (
                  <span className="text-[11px] text-muted-foreground">principal</span>
                ) : null
              ) : (
                <Button
                  variant="ghost"
                  size="icon-sm"
                  title="Tornar responsável principal"
                  aria-label={`Tornar ${memberName(userId)} responsável principal`}
                  onClick={() => save([userId, ...assigneeIds.filter((id) => id !== userId)])}
                >
                  <Star />
                </Button>
              )}
              <Button
                variant="ghost"
                size="icon-sm"
                title="Tirar da tarefa"
                aria-label={`Tirar ${memberName(userId)} da tarefa`}
                onClick={() => save(assigneeIds.filter((id) => id !== userId))}
              >
                <X />
              </Button>
            </li>
          ))}
        </ul>
      )}

      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button variant="outline" size="sm" className="w-full">
            <UserPlus /> {assigneeIds.length === 0 ? "Escolher responsável" : "Adicionar ou remover"}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-72 p-0" align="start">
          <Command>
            <CommandInput placeholder="Buscar pessoa…" />
            <CommandList>
              <CommandEmpty>Ninguém encontrado.</CommandEmpty>
              <CommandGroup>
                {userIds.map((userId) => {
                  const selected = assigneeIds.includes(userId);
                  return (
                    <CommandItem
                      key={userId}
                      value={`${memberName(userId)} ${userId}`}
                      onSelect={() => toggle(userId)}
                    >
                      <MemberAvatar userId={userId} className="size-6" />
                      <span className="flex-1 truncate">{memberName(userId)}</span>
                      {selected ? <Check className="text-primary" /> : null}
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
