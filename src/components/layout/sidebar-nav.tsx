"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { NAV_GROUPS, NAV_ITEMS } from "@/components/layout/nav-items";
import { useIsSuperAdminQuery } from "@/features/admin/hooks/use-clients";
import { useCurrentWorkspace } from "@/features/workspaces/context/current-workspace-context";
import { useAuth } from "@/lib/auth/auth-context";

export function SidebarNav({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname();
  const isSuperAdminQuery = useIsSuperAdminQuery();
  const { workspace } = useCurrentWorkspace();
  const { userId } = useAuth();
  const myWorkspaceRole = workspace?.members.find((m) => m.userId === userId)?.role;

  const items = NAV_ITEMS.filter((item) => {
    if (item.requiresSuperAdmin && !isSuperAdminQuery.isSuccess) return false;
    if (item.workspacePermission && !item.workspacePermission(myWorkspaceRole)) return false;
    if (item.workspaceHref && !workspace) return false;
    return true;
  }).map((item) => ({
    ...item,
    to: item.workspaceHref && workspace ? item.workspaceHref(workspace.id) : item.href,
  }));

  // Only the most specific match is highlighted: /workspaces/:id/pages is
  // "Páginas", not also "Workspaces".
  const activeHref = items
    .map((item) => item.to)
    .filter((to) => pathname === to || pathname.startsWith(`${to}/`))
    .sort((a, b) => b.length - a.length)[0];

  const groups = NAV_GROUPS.map((group) => ({
    ...group,
    items: items.filter((item) => item.group === group.id),
  })).filter((group) => group.items.length > 0);

  return (
    <nav className="flex flex-col gap-6 px-3 py-5">
      {groups.map((group) => (
        <div key={group.id} className="flex flex-col gap-0.5">
          <p className="px-3 pb-1.5 text-[0.6875rem] font-semibold tracking-wider text-muted-foreground/70 uppercase">
            {group.label}
          </p>
          {group.items.map((item) => {
            const active = item.to === activeHref;
            return (
              <Link
                key={item.href}
                href={item.to}
                onClick={onNavigate}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "relative flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                  active
                    ? "bg-primary/10 text-primary before:absolute before:inset-y-2 before:-left-3 before:w-1 before:rounded-r-full before:bg-primary"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground"
                )}
              >
                <item.icon className="size-4.5" />
                {item.label}
              </Link>
            );
          })}
        </div>
      ))}
    </nav>
  );
}
