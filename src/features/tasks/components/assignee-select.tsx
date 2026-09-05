"use client";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { shortenId } from "@/lib/format";
import { useAuth } from "@/lib/auth/auth-context";
import { useAssignableMembers } from "@/features/tasks/hooks/use-assignable-members";
import { UNASSIGNED_VALUE } from "@/features/tasks/schemas";

export function AssigneeSelect({
  projectId,
  value,
  onChange,
}: {
  projectId: string;
  value: string | undefined;
  onChange: (value: string | undefined) => void;
}) {
  const { userId: currentUserId } = useAuth();
  const { userIds } = useAssignableMembers(projectId);

  return (
    <Select
      value={value ?? UNASSIGNED_VALUE}
      onValueChange={(next) => onChange(next === UNASSIGNED_VALUE ? undefined : next)}
    >
      <SelectTrigger className="w-full">
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
