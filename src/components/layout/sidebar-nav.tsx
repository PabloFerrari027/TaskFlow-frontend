"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { NAV_ITEMS } from "@/components/layout/nav-items";
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
    return true;
  });

  return (
    <nav className="flex flex-col gap-1 p-3">
      {items.map((item) => {
        const active =
          pathname === item.href || pathname.startsWith(`${item.href}/`);
        return (
          <Link
            key={item.href}
            href={item.href}
            onClick={onNavigate}
            className={cn(
              "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
              active
                ? "bg-primary/10 text-primary"
                : "text-muted-foreground hover:bg-muted hover:text-foreground"
            )}
          >
            <item.icon className="size-4" />
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}
