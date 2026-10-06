"use client";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { shortenId } from "@/lib/format";
import { cn } from "@/lib/utils";
import { useAuth } from "@/lib/auth/auth-context";
import { useAssignableMembers } from "@/features/items/hooks/use-assignable-members";
import { UNASSIGNED_VALUE } from "@/features/items/schemas";

export function AssigneeSelect({
  folderId,
  value,
  onChange,
  triggerClassName,
}: {
  folderId: string;
  value: string | undefined;
  onChange: (value: string | undefined) => void;
  triggerClassName?: string;
}) {
  const { userId: currentUserId } = useAuth();
  const { userIds } = useAssignableMembers(folderId);

  return (
    <Select
      value={value ?? UNASSIGNED_VALUE}
      onValueChange={(next) => onChange(next === UNASSIGNED_VALUE ? undefined : next)}
    >
      <SelectTrigger className={cn("w-full", triggerClassName)}>
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value={UNASSIGNED_VALUE}>Sem responsável</SelectItem>
        {userIds.map((userId) => (
          <SelectItem key={userId} value={userId}>
            {userId === currentUserId ? "Você" : `Usuário ${shortenId(userId)}…`}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
