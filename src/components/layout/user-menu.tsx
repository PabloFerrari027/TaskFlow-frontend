"use client";

import * as React from "react";
import Link from "next/link";
import { BookOpen, FileText, LogOut, PlayCircle, UserRound } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useAuth } from "@/lib/auth/auth-context";
import { useSelfIdentity } from "@/features/auth/hooks/use-current-user";
import { useUserPhotoUrl } from "@/features/auth/hooks/use-user-photo";
import { useLogout } from "@/features/sessions/hooks/use-sessions";
import { useTutorial } from "@/features/tutorial/context/tutorial-context";
import { getInitialsFromId } from "@/lib/format";

export function UserMenu() {
  const { userId } = useAuth();
  const { label, initials } = useSelfIdentity();
  const photoUrl = useUserPhotoUrl(userId);
  const logout = useLogout();
  const { startTour } = useTutorial();
  const startingTour = React.useRef(false);

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="rounded-full"
          data-tour="user-menu"
        >
          <Avatar className="size-8">
            {photoUrl ? <AvatarImage src={photoUrl} alt="" /> : null}
            <AvatarFallback>
              {initials ?? (userId ? getInitialsFromId(userId) : "?")}
            </AvatarFallback>
          </Avatar>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="end"
        className="w-56"
        // The menu would otherwise hand focus back to its trigger as it
        // closes, pulling it out of the tour card that just opened.
        onCloseAutoFocus={(event) => {
          if (!startingTour.current) return;
          startingTour.current = false;
          event.preventDefault();
        }}
      >
        <DropdownMenuLabel className="truncate">
          {label ?? "Conta"}
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild>
          <Link href="/settings/profile">
            <UserRound /> Meu perfil
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <Link href="/tutorial">
            <BookOpen /> Tutorial
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <Link href="/privacy">
            <FileText /> Privacidade e FAQ
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem
          onSelect={() => {
            startingTour.current = true;
            startTour();
          }}
        >
          <PlayCircle /> Refazer tour guiado
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem variant="destructive" onClick={() => logout()}>
          <LogOut /> Sair
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
