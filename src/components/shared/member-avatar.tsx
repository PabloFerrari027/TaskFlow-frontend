import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { getInitialsFromId, shortenId } from "@/lib/format";
import { cn } from "@/lib/utils";
import { useAuth } from "@/lib/auth/auth-context";
import { useSelfIdentity } from "@/features/auth/hooks/use-current-user";
import { useUserPhotoUrl } from "@/features/auth/hooks/use-user-photo";

/**
 * Member endpoints only return a `userId`, never a name — only the current
 * user's name is known (GET /auth/me). Other members get an initials avatar
 * from the id and a shortened id in the tooltip; the current user gets their
 * name's initials and "Você".
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
  const { initials: selfInitials } = useSelfIdentity({ enabled: isSelf });
  const photoUrl = useUserPhotoUrl(userId);

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Avatar className={cn("size-7", className)}>
          {photoUrl ? <AvatarImage src={photoUrl} alt="" /> : null}
          <AvatarFallback className="text-xs">
            {isSelf && selfInitials ? selfInitials : getInitialsFromId(userId)}
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
  const { label } = useSelfIdentity({ enabled: isSelf });

  if (isSelf && label) {
    return (
      <span className="text-sm text-foreground">
        {label} <span className="text-xs text-muted-foreground">(você)</span>
      </span>
    );
  }

  return (
    <span className="font-mono text-xs text-muted-foreground">
      {shortenId(userId)}…{isSelf ? " (você)" : ""}
    </span>
  );
}
