"use client";

import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { MemberAvatar, MemberIdLabel } from "@/components/shared/member-avatar";
import { shortenId } from "@/lib/format";
import { useAuth } from "@/lib/auth/auth-context";
import { useAssignableMembers } from "@/features/tasks/hooks/use-assignable-members";
import {
  useAddParticipantMutation,
  useRemoveParticipantMutation,
} from "@/features/tasks/hooks/use-tasks";

// Participants are additive to the main assignee (no hierarchy, never
// substitutes assigneeId) — a separate concept from `AssigneeSelect`, whose
// single-value + "unassign" sentinel contract doesn't fit "add one at a time,
// keep the picker open for more". Reuses the same member-lookup hook and
// avatar/label components as the assignee picker instead.
export function ParticipantsSection({
  projectId,
  taskId,
  participantIds,
}: {
  projectId: string;
  taskId: string;
  participantIds: string[];
}) {
  const { userId: currentUserId } = useAuth();
  const { userIds } = useAssignableMembers(projectId);
  const addMutation = useAddParticipantMutation(taskId);
  const removeMutation = useRemoveParticipantMutation(taskId);

  const addableUserIds = userIds.filter((id) => !participantIds.includes(id));

  return (
    <div className="space-y-1.5">
      <p className="text-xs font-medium text-muted-foreground uppercase">Participantes</p>

      {participantIds.length === 0 ? (
        <p className="text-sm text-muted-foreground">Nenhum participante</p>
      ) : (
        <ul className="space-y-1.5">
          {participantIds.map((userId) => (
            <li key={userId} className="flex items-center gap-2">
              <MemberAvatar userId={userId} />
              <MemberIdLabel userId={userId} />
              <Button
                size="icon-sm"
                variant="ghost"
                className="ml-auto"
                disabled={removeMutation.isPending}
                onClick={() => removeMutation.mutate(userId)}
              >
                <X />
              </Button>
            </li>
          ))}
        </ul>
      )}

      {addableUserIds.length > 0 ? (
        <Select
          value=""
          disabled={addMutation.isPending}
          onValueChange={(userId) => addMutation.mutate(userId)}
        >
          <SelectTrigger className="w-full">
            <SelectValue placeholder="Adicionar participante" />
          </SelectTrigger>
          <SelectContent>
            {addableUserIds.map((userId) => (
              <SelectItem key={userId} value={userId}>
                {userId === currentUserId ? "Você" : `Usuário ${shortenId(userId)}…`}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      ) : null}
    </div>
  );
}
