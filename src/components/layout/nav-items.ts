import type { LucideIcon } from "lucide-react";
import { LayoutDashboard, FolderKanban, Building2, MonitorSmartphone } from "lucide-react";

export interface NavItem {
  href: string;
  label: string;
  icon: LucideIcon;
}

export const NAV_ITEMS: NavItem[] = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/projects", label: "Projetos", icon: FolderKanban },
  { href: "/workspaces", label: "Workspaces", icon: Building2 },
  { href: "/settings/sessions", label: "Sessões", icon: MonitorSmartphone },
];
