"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Bell, CheckCheck, Settings2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Skeleton } from "@/components/ui/skeleton";
import { MemberAvatar } from "@/components/shared/member-avatar";
import { Pager } from "@/components/shared/pager";
import { formatRelativeTime } from "@/lib/format";
import { cn } from "@/lib/utils";
import { useCurrentWorkspace } from "@/features/workspaces/context/current-workspace-context";
import {
  useMarkAllNotificationsReadMutation,
  useMarkNotificationReadMutation,
  useNotificationsQuery,
  useUnreadNotificationsCountQuery,
} from "@/features/notifications/hooks/use-notifications";
import type { AppNotification } from "@/types/notification";

function notificationHref(notification: AppNotification) {
  if (notification.folderId && notification.itemId) {
    return `/folders/${notification.folderId}/items?itemId=${notification.itemId}`;
  }
  if (notification.folderId) return `/folders/${notification.folderId}/items`;
  return null;
}

export function NotificationBell() {
  const router = useRouter();
  const [open, setOpen] = React.useState(false);
  const [unreadOnly, setUnreadOnly] = React.useState(false);
  const [page, setPage] = React.useState(1);
  const { workspaceId, setWorkspaceId } = useCurrentWorkspace();
  const countQuery = useUnreadNotificationsCountQuery();
  // Only fetched while the panel is open; the badge is all the topbar needs.
  const listQuery = useNotificationsQuery({ unreadOnly, page }, { enabled: open });
  const markRead = useMarkNotificationReadMutation();
  const markAllRead = useMarkAllNotificationsReadMutation();

  const unread = countQuery.data ?? 0;
  const result = listQuery.data;

  function openNotification(notification: AppNotification) {
    if (!notification.read) markRead.mutate(notification.id);
    const href = notificationHref(notification);
    if (!href) return;
    // The item lives in another workspace: switch to it first, or the
    // folder page would answer "not found" for the current one.
    if (notification.workspaceId !== workspaceId) setWorkspaceId(notification.workspaceId);
    setOpen(false);
    router.push(href);
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="relative"
          aria-label={unread > 0 ? `Notificações: ${unread} não lidas` : "Notificações"}
          title="Notificações"
        >
          <Bell />
          {unread > 0 ? (
            <span className="absolute top-1 right-1 flex min-w-4 items-center justify-center rounded-full bg-destructive px-1 text-[10px] leading-4 font-semibold text-white">
              {unread > 99 ? "99+" : unread}
            </span>
          ) : null}
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-[min(24rem,calc(100vw-2rem))] p-0">
        <div className="flex items-center justify-between gap-2 border-b px-4 py-3">
          <p className="text-sm font-semibold">Notificações</p>
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="sm"
              disabled={unread === 0 || markAllRead.isPending}
              onClick={() => markAllRead.mutate()}
            >
              <CheckCheck /> Marcar todas como lidas
            </Button>
            <Button variant="ghost" size="icon-sm" asChild title="Escolher o que receber">
              <Link
                href="/settings/notifications"
                aria-label="Escolher o que receber"
                onClick={() => setOpen(false)}
              >
                <Settings2 />
              </Link>
            </Button>
          </div>
        </div>

        <div className="flex gap-1 px-4 pt-3" role="group" aria-label="Filtrar notificações">
          {[
            { value: false, label: "Todas" },
            { value: true, label: "Não lidas" },
          ].map((option) => (
            <Button
              key={option.label}
              size="sm"
              variant={unreadOnly === option.value ? "secondary" : "ghost"}
              aria-pressed={unreadOnly === option.value}
              onClick={() => {
                setUnreadOnly(option.value);
                setPage(1);
              }}
            >
              {option.label}
            </Button>
          ))}
        </div>

        <div className="max-h-[60vh] overflow-y-auto p-2">
          {listQuery.isLoading ? (
            <div className="space-y-2 p-2">
              {Array.from({ length: 4 }).map((_, i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          ) : listQuery.isError ? (
            <p className="p-4 text-center text-sm text-muted-foreground">
              Não foi possível carregar as notificações.
            </p>
          ) : !result || result.data.length === 0 ? (
            <p className="p-6 text-center text-sm text-muted-foreground">
              {unreadOnly ? "Nada novo por aqui. Você está em dia!" : "Você ainda não tem notificações."}
            </p>
          ) : (
            <ul className="space-y-1">
              {result.data.map((notification) => (
                <li key={notification.id}>
                  <button
                    type="button"
                    onClick={() => openNotification(notification)}
                    className={cn(
                      "flex w-full items-start gap-3 rounded-md p-2 text-left transition-colors hover:bg-muted",
                      !notification.read && "bg-primary/5"
                    )}
                  >
                    {notification.actorId ? (
                      <MemberAvatar userId={notification.actorId} className="mt-0.5 shrink-0" />
                    ) : (
                      <span className="mt-0.5 flex size-7 shrink-0 items-center justify-center rounded-full bg-muted">
                        <Bell className="size-3.5 text-muted-foreground" />
                      </span>
                    )}
                    <span className="min-w-0 flex-1">
                      <span className="block text-sm font-medium text-foreground">
                        {notification.title}
                      </span>
                      <span className="line-clamp-2 block text-xs text-muted-foreground">
                        {notification.body}
                      </span>
                      <span className="mt-0.5 block text-[11px] text-muted-foreground">
                        {formatRelativeTime(notification.createdAt)}
                      </span>
                    </span>
                    {!notification.read ? (
                      <span className="mt-2 size-2 shrink-0 rounded-full bg-primary" aria-label="Não lida" />
                    ) : null}
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>

        {result && result.meta.totalPages > 1 ? (
          <div className="border-t px-3 py-2">
            <Pager meta={result.meta} isLoading={listQuery.isFetching} onPageChange={setPage} />
          </div>
        ) : null}
      </PopoverContent>
    </Popover>
  );
}
