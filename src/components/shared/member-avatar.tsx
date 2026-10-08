import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { getInitialsFromId, getInitialsFromName, shortenId } from "@/lib/format";
import { cn } from "@/lib/utils";
import { useAuth } from "@/lib/auth/auth-context";
import { useSelfIdentity } from "@/features/auth/hooks/use-current-user";
import { useUserPhotoUrl } from "@/features/auth/hooks/use-user-photo";
import { useOptionalCurrentWorkspace } from "@/features/workspaces/context/current-workspace-context";

/**
 * A member's display name: the `name` the caller already has (folder member
 * lists, which include folder-only guests), else the current workspace's
 * member list (GET /workspaces/:id returns `name` per member). `null` for an
 * account without a profile name or someone outside the current workspace —
 * those keep the shortened-id fallback.
 */
function useMemberName(userId: string, name?: string | null): string | null {
  const current = useOptionalCurrentWorkspace();
  if (name) return name;
  return current?.workspace?.members.find((member) => member.userId === userId)?.name ?? null;
}

export function MemberAvatar({
  userId,
  name,
  className,
}: {
  userId: string;
  name?: string | null;
  className?: string;
}) {
  const { userId: currentUserId } = useAuth();
  const isSelf = currentUserId === userId;
  const { initials: selfInitials } = useSelfIdentity({ enabled: isSelf });
  const memberName = useMemberName(userId, name);
  const photoUrl = useUserPhotoUrl(userId);

  const initials =
    isSelf && selfInitials
      ? selfInitials
      : memberName
        ? getInitialsFromName(memberName)
        : getInitialsFromId(userId);

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Avatar className={cn("size-7", className)}>
          {photoUrl ? <AvatarImage src={photoUrl} alt="" /> : null}
          <AvatarFallback className="text-xs">{initials}</AvatarFallback>
        </Avatar>
      </TooltipTrigger>
      <TooltipContent>
        {isSelf ? "Você" : (memberName ?? `Usuário ${shortenId(userId)}…`)}
      </TooltipContent>
    </Tooltip>
  );
}

export function MemberIdLabel({ userId, name }: { userId: string; name?: string | null }) {
  const { userId: currentUserId } = useAuth();
  const isSelf = currentUserId === userId;
  const { label } = useSelfIdentity({ enabled: isSelf });
  const memberName = useMemberName(userId, name);

  if (isSelf && label) {
    return (
      <span className="text-sm text-foreground">
        {label} <span className="text-xs text-muted-foreground">(você)</span>
      </span>
    );
  }

  if (memberName) {
    return (
      <span className="text-sm text-foreground">
        {memberName}
        {isSelf ? <span className="text-xs text-muted-foreground"> (você)</span> : null}
      </span>
    );
  }

  return (
    <span className="font-mono text-xs text-muted-foreground">
      {shortenId(userId)}…{isSelf ? " (você)" : ""}
    </span>
  );
}
