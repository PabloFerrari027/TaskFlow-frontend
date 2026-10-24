import type { WorkspaceBlueprintAudience } from "@/types/workspace-blueprint";

export const AUDIENCE_INFO: Record<WorkspaceBlueprintAudience, { label: string; icon: string }> = {
  PERSONAL: { label: "Vida pessoal", icon: "🏠" },
  FREELANCE: { label: "Autônomos", icon: "💼" },
  SMALL_BUSINESS: { label: "Pequenos negócios", icon: "🏪" },
  SERVICES: { label: "Prestação de serviços", icon: "🤝" },
  COMPANY: { label: "Empresas e equipes", icon: "🏢" },
  EDUCATION: { label: "Educação", icon: "🎓" },
  COMMUNITY: { label: "Comunidades", icon: "🫂" },
  AGRO: { label: "Agro", icon: "🌾" },
};

export function getAudienceInfo(audience: WorkspaceBlueprintAudience) {
  return AUDIENCE_INFO[audience] ?? { label: audience, icon: "📁" };
}
