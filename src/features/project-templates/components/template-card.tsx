import Link from "next/link";
import { cn } from "@/lib/utils";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { getCategoryInfo } from "@/features/project-templates/lib/categories";
import {
  TEMPLATE_LEVEL_LABEL,
  formatTemplateCounts,
  getAuthorLabel,
  isWorkspaceTemplate,
  plural,
} from "@/features/project-templates/lib/template-labels";
import { WorkspaceTemplateBadge } from "@/features/project-templates/components/template-badges";
import { TemplateImage } from "@/features/project-templates/components/template-image";
import type {
  ProjectTemplateCategoryInfo,
  ProjectTemplateSummary,
} from "@/types/project-template";

interface TemplateCardProps {
  template: ProjectTemplateSummary;
  categories?: ProjectTemplateCategoryInfo[];
  /** Project the template will be added to ("Aplicar um modelo"). */
  applyTo?: string;
}

export function TemplateCard({ template, categories, applyTo }: TemplateCardProps) {
  const category = getCategoryInfo(template.category, categories);
  const uses = template.stats?.instantiationCount ?? 0;

  return (
    <Link
      href={
        applyTo
          ? `/templates/${template.id}?applyTo=${encodeURIComponent(applyTo)}`
          : `/templates/${template.id}`
      }
      className="group block rounded-xl focus-visible:ring-[3px] focus-visible:ring-ring/50 focus-visible:outline-none"
    >
      <Card
        className={cn(
          "h-full overflow-hidden transition-colors group-hover:ring-primary/40 group-hover:bg-muted/30",
          template.hasCover && "pt-0"
        )}
      >
        {template.hasCover ? (
          <TemplateImage
            template={template}
            image="cover"
            alt=""
            className="aspect-[16/7] w-full"
          />
        ) : null}
        <CardHeader>
          <div className="flex items-start justify-between gap-2">
            <p className="text-xs text-muted-foreground">
              <span aria-hidden>{category.icon}</span> {category.label}
              {template.level ? ` · ${TEMPLATE_LEVEL_LABEL[template.level]}` : ""}
            </p>
            {isWorkspaceTemplate(template) ? <WorkspaceTemplateBadge /> : null}
          </div>
          <CardTitle className="leading-snug">{template.name}</CardTitle>
          {template.description ? (
            <CardDescription className="line-clamp-2">{template.description}</CardDescription>
          ) : null}
        </CardHeader>
        <CardContent className="mt-auto space-y-1 text-xs text-muted-foreground">
          <p>{formatTemplateCounts(template)}</p>
          <p>
            {getAuthorLabel(template)}
            {uses > 0 ? ` · ${plural(uses, "uso", "usos")}` : ""}
          </p>
        </CardContent>
      </Card>
    </Link>
  );
}
