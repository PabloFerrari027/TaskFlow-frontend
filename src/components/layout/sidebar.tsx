"use client";

import { Logo } from "@/components/shared/logo";
import { SidebarNav } from "@/components/layout/sidebar-nav";
import { useSidebar } from "@/components/layout/sidebar-context";
import { cn } from "@/lib/utils";

export function Sidebar() {
  const { collapsed } = useSidebar();

  return (
    <aside
      id="app-sidebar"
      data-tour="sidebar"
      className={cn(
        "hidden w-60 shrink-0 border-r border-border/60 bg-card/40",
        !collapsed && "md:flex md:flex-col"
      )}
    >
      <div className="flex h-16 items-center border-b border-border/60 px-4">
        <Logo href="/dashboard" />
      </div>
      <div className="flex-1 overflow-y-auto">
        <SidebarNav />
      </div>
    </aside>
  );
}
