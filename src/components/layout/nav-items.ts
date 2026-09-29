import type { LucideIcon } from "lucide-react";
import {
  PanelsTopLeft,
  FolderKanban,
  Building2,
  ShieldCheck,
  BookOpen,
  FileText,
  UserRound,
  CreditCard,
  Coins,
  Bot,
  Code2,
  LayoutTemplate,
  ShieldAlert,
} from "lucide-react";
import { canManageDeveloperPlatform } from "@/lib/permissions";
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
  { href: "/projects", label: "Projetos", icon: FolderKanban },
  { href: "/templates", label: "Modelos", icon: LayoutTemplate },
  { href: "/workspaces", label: "Workspaces", icon: Building2 },
  {
    href: "/workspaces/pages",
    label: "Páginas",
    icon: PanelsTopLeft,
    workspaceHref: (workspaceId) => `/workspaces/${workspaceId}/pages`,
  },

  // Recursos avançados, usados com menos frequência.
  { href: "/assistant", label: "Assistente", icon: Bot },
  {
    href: "/developers",
    label: "Desenvolvedores",
    icon: Code2,
    workspacePermission: canManageDeveloperPlatform,
  },

  // Conta e configurações pessoais.
  { href: "/settings/profile", label: "Perfil", icon: UserRound },
  { href: "/settings/plan", label: "Plano", icon: CreditCard },

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
  {
    href: "/admin/templates",
    label: "Modelos",
    icon: ShieldAlert,
    requiresSuperAdmin: true,
  },
];
