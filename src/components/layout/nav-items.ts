import type { LucideIcon } from "lucide-react";
import {
  LayoutDashboard,
  PanelsTopLeft,
  FolderKanban,
  Building2,
  MonitorSmartphone,
  KeyRound,
  ShieldCheck,
  BookOpen,
  FileText,
  UserRound,
  Sparkles,
  CreditCard,
  Coins,
  History,
  Bot,
  Zap,
  Code2,
} from "lucide-react";
import { canManageAutomations, canManageDeveloperPlatform } from "@/lib/permissions";
import type { WorkspaceRole } from "@/types/workspace";

export interface NavItem {
  href: string;
  label: string;
  icon: LucideIcon;
  requiresSuperAdmin?: boolean;
  // When set, the item only shows while the current workspace role passes
  // this check — mirrors the same gate the old workspace-page tab used.
  workspacePermission?: (role: WorkspaceRole | null | undefined) => boolean;
  // For pages that live under the current workspace's URL: the link is
  // built from its id (and the item hidden until there is one). `href` is
  // then only the item's stable key.
  workspaceHref?: (workspaceId: string) => string;
}

export const NAV_ITEMS: NavItem[] = [
  // Uso diário: onde o trabalho acontece.
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/projects", label: "Projetos", icon: FolderKanban },
  { href: "/workspaces", label: "Workspaces", icon: Building2 },
  { href: "/activity", label: "Atividade", icon: History },
  {
    href: "/workspaces/pages",
    label: "Páginas",
    icon: PanelsTopLeft,
    workspaceHref: (workspaceId) => `/workspaces/${workspaceId}/pages`,
  },

  // Recursos avançados, usados com menos frequência.
  { href: "/assistant", label: "Assistente", icon: Bot },
  {
    href: "/automations",
    label: "Automações",
    icon: Zap,
    workspacePermission: canManageAutomations,
  },
  {
    href: "/developers",
    label: "Desenvolvedores",
    icon: Code2,
    workspacePermission: canManageDeveloperPlatform,
  },

  // Conta e configurações pessoais.
  { href: "/settings/profile", label: "Perfil", icon: UserRound },
  { href: "/settings/billing", label: "Plano e cobrança", icon: CreditCard },
  { href: "/settings/ai-usage", label: "Uso de IA", icon: Sparkles },
  { href: "/settings/security", label: "Segurança", icon: KeyRound },
  { href: "/settings/sessions", label: "Sessões", icon: MonitorSmartphone },

  // Ajuda.
  { href: "/tutorial", label: "Tutorial", icon: BookOpen },
  { href: "/privacy", label: "Privacidade e FAQ", icon: FileText },

  // Administração (somente super admin).
  {
    href: "/admin/clients",
    label: "Clientes",
    icon: ShieldCheck,
    requiresSuperAdmin: true,
  },
  {
    href: "/admin/plans",
    label: "Planos",
    icon: Coins,
    requiresSuperAdmin: true,
  },
];
