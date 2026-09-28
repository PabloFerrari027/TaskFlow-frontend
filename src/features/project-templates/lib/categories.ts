import type {
  ProjectTemplateCategory,
  ProjectTemplateCategoryInfo,
} from "@/types/project-template";

// Labels and icons come from `GET /project-templates/categories`; this copy
// only covers the moments before that answer arrives (or if it fails), so a
// card never shows a raw slug.
export const CATEGORY_FALLBACK: Record<
  ProjectTemplateCategory,
  { label: string; icon: string }
> = {
  PERSONAL_FINANCE: { label: "Finanças pessoais", icon: "💰" },
  INVESTMENTS: { label: "Investimentos e cripto", icon: "₿" },
  HEALTH_WELLNESS: { label: "Nutrição, saúde e bem-estar", icon: "🥗" },
  BUSINESS_MANAGEMENT: { label: "Gestão e negócios", icon: "🏢" },
  SALES_SUPPORT: { label: "Vendas e atendimento", icon: "🤝" },
  HR_PEOPLE: { label: "RH e pessoas", icon: "👥" },
  MARKETING_CONTENT: { label: "Marketing e conteúdo", icon: "📣" },
  TECH_PRODUCT: { label: "Tecnologia e produto", icon: "💻" },
  EDUCATION: { label: "Educação e estudos", icon: "🎓" },
  HOME_PERSONAL: { label: "Vida pessoal e casa", icon: "🏠" },
  CAREER_FREELANCE: { label: "Carreira e freelas", icon: "🧑‍💼" },
  INDUSTRY_SPECIFIC: { label: "Setores específicos", icon: "🏗️" },
};

export function getCategoryInfo(
  slug: ProjectTemplateCategory,
  categories?: ProjectTemplateCategoryInfo[]
): { label: string; icon: string } {
  const fromServer = categories?.find((category) => category.slug === slug);
  if (fromServer) return { label: fromServer.label, icon: fromServer.icon };
  return CATEGORY_FALLBACK[slug] ?? { label: slug, icon: "📁" };
}
