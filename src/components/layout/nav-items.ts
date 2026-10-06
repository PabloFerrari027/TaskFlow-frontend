import type { LucideIcon } from "lucide-react";
import {
  House,
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
  TicketPercent,
} from "lucide-react";
import { canManageDeveloperPlatform } from "@/lib/permissions";
import type { WorkspaceRole } from "@/types/workspace";

export type NavGroup = "work" | "team" | "help" | "account" | "admin";

// Rendered in this order, each under its label; items keep their array order
// inside a group. Ordered by frequency: what is used every day comes first.
export const NAV_GROUPS: { id: NavGroup; label: string }[] = [
  { id: "work", label: "Trabalho" },
  { id: "team", label: "Equipe" },
  { id: "help", label: "Ajuda" },
  { id: "account", label: "Conta" },
  { id: "admin", label: "Administração" },
];

export interface NavItem {
  href: string;
  label: string;
  icon: LucideIcon;
  group: NavGroup;
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
  { href: "/home", label: "Início", icon: House, group: "work" },
  { href: "/folders", label: "Pastas", icon: FolderKanban, group: "work" },
  {
    href: "/workspaces/pages",
    label: "Páginas",
    icon: PanelsTopLeft,
    group: "work",
    workspaceHref: (workspaceId) => `/workspaces/${workspaceId}/pages`,
  },
  { href: "/assistant", label: "Assistente", icon: Bot, group: "work" },
  { href: "/templates", label: "Modelos", icon: LayoutTemplate, group: "work" },

  // Organizar a equipe.
  { href: "/workspaces", label: "Workspaces", icon: Building2, group: "team" },
  // Recurso técnico, só para Proprietário/Administrador.
  {
    href: "/developers",
    label: "Desenvolvedores",
    icon: Code2,
    group: "team",
    workspacePermission: canManageDeveloperPlatform,
  },

  // Ajuda para quem está começando e informações de referência.
  { href: "/tutorial", label: "Tutorial", icon: BookOpen, group: "help" },
  { href: "/privacy", label: "Privacidade e FAQ", icon: FileText, group: "help" },

  // Conta e configurações pessoais.
  { href: "/settings/profile", label: "Perfil", icon: UserRound, group: "account" },
  { href: "/settings/plan", label: "Plano", icon: CreditCard, group: "account" },

  // Administração (somente super admin).
  {
    href: "/admin/clients",
    label: "Clientes",
    icon: ShieldCheck,
    group: "admin",
    requiresSuperAdmin: true,
  },
  {
    href: "/admin/plans",
    label: "Planos",
    icon: Coins,
    group: "admin",
    requiresSuperAdmin: true,
  },
  {
    href: "/admin/coupons",
    label: "Cupons",
    icon: TicketPercent,
    group: "admin",
    requiresSuperAdmin: true,
  },
  {
    href: "/admin/templates",
    label: "Modelos",
    icon: ShieldAlert,
    group: "admin",
    requiresSuperAdmin: true,
  },
];
