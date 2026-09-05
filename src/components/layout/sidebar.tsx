import { Logo } from "@/components/shared/logo";
import { SidebarNav } from "@/components/layout/sidebar-nav";

export function Sidebar() {
  return (
    <aside className="hidden w-60 shrink-0 border-r border-border/60 bg-card/40 md:flex md:flex-col">
      <div className="flex h-16 items-center border-b border-border/60 px-4">
        <Logo href="/dashboard" />
      </div>
      <div className="flex-1 overflow-y-auto">
        <SidebarNav />
      </div>
    </aside>
  );
}
