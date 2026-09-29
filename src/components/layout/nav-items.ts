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
  // Ordenado por prioridade: o que se usa todo dia vem primeiro.

  // Uso diário: onde o trabalho acontece.
  { href: "/projects", label: "Projetos", icon: FolderKanban },
  {
    href: "/workspaces/pages",
    label: "Páginas",
    icon: PanelsTopLeft,
    workspaceHref: (workspaceId) => `/workspaces/${workspaceId}/pages`,
  },
  { href: "/assistant", label: "Assistente", icon: Bot },

  // Uso ocasional: começar algo novo e organizar a equipe.
  { href: "/templates", label: "Modelos", icon: LayoutTemplate },
  { href: "/workspaces", label: "Workspaces", icon: Building2 },

  // Ajuda para quem está começando.
  { href: "/tutorial", label: "Tutorial", icon: BookOpen },

  // Conta e configurações pessoais.
  { href: "/settings/profile", label: "Perfil", icon: UserRound },
  { href: "/settings/plan", label: "Plano", icon: CreditCard },

  // Recurso técnico, só para Proprietário/Administrador.
  {
    href: "/developers",
    label: "Desenvolvedores",
    icon: Code2,
    workspacePermission: canManageDeveloperPlatform,
  },

  // Informações de referência.
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
