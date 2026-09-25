import { Building2, Globe, Lock, Users, type LucideIcon } from "lucide-react";
import type { DashboardPageVisibility } from "@/types/dashboard-page";

export interface VisibilitySpec {
  value: DashboardPageVisibility;
  icon: LucideIcon;
  label: string;
  description: string;
}

// Most to least restrictive — the order the choice is presented in, so
// opening a page up is always a step the user takes on purpose.
export const VISIBILITY_SPECS: VisibilitySpec[] = [
  {
    value: "PRIVATE",
    icon: Lock,
    label: "Privada",
    description: "Só quem criou a página pode ver e editar.",
  },
  {
    value: "RESTRICTED",
    icon: Users,
    label: "Pessoas escolhidas",
    description: "Só quem for adicionado abaixo: membros do workspace ou pessoas de fora, por e-mail.",
  },
  {
    value: "WORKSPACE",
    icon: Building2,
    label: "Todo o workspace",
    description: "Todos os membros do workspace podem ver.",
  },
  {
    value: "PUBLIC",
    icon: Globe,
    label: "Qualquer pessoa com o link",
    description: "Sem precisar de conta. Útil para mostrar resultados a clientes.",
  },
];

export function visibilitySpec(value: DashboardPageVisibility): VisibilitySpec {
  return VISIBILITY_SPECS.find((spec) => spec.value === value) ?? VISIBILITY_SPECS[0];
}

export const PUBLIC_REQUIRES_MANAGER_HINT =
  "Só o Proprietário ou um Administrador do workspace pode tornar uma página pública.";

export function publicPageUrl(token: string) {
  const origin = typeof window === "undefined" ? "" : window.location.origin;
  return `${origin}/pages/public/${encodeURIComponent(token)}`;
}
