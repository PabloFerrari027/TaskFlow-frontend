import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { getInitialsFromId, shortenId } from "@/lib/format";
import { cn } from "@/lib/utils";
import { useAuth } from "@/lib/auth/auth-context";

/**
 * The API never returns a display name or e-mail for a member — only their
 * `userId`. This renders an initials avatar from the id and shows the full
 * id (or "Você" for the current user) in a tooltip, which is the most this
 * data can honestly support.
 */
export function MemberAvatar({
  userId,
  className,
}: {
  userId: string;
  className?: string;
}) {
  const { userId: currentUserId } = useAuth();
  const isSelf = currentUserId === userId;

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Avatar className={cn("size-7", className)}>
          <AvatarFallback className="text-xs">
            {getInitialsFromId(userId)}
          </AvatarFallback>
        </Avatar>
      </TooltipTrigger>
      <TooltipContent>
        {isSelf ? "Você" : `Usuário ${shortenId(userId)}…`}
      </TooltipContent>
    </Tooltip>
  );
}

export function MemberIdLabel({ userId }: { userId: string }) {
  const { userId: currentUserId } = useAuth();
  const isSelf = currentUserId === userId;

  return (
    <span className="font-mono text-xs text-muted-foreground">
      {shortenId(userId)}…{isSelf ? " (você)" : ""}
    </span>
  );
}
