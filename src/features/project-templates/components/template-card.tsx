import Link from "next/link";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { getCategoryInfo } from "@/features/project-templates/lib/categories";
import {
  formatTemplateCounts,
  getAuthorLabel,
  isWorkspaceTemplate,
} from "@/features/project-templates/lib/template-labels";
import { WorkspaceTemplateBadge } from "@/features/project-templates/components/template-badges";
import type {
  ProjectTemplateCategoryInfo,
  ProjectTemplateSummary,
} from "@/types/project-template";

interface TemplateCardProps {
  template: ProjectTemplateSummary;
  categories?: ProjectTemplateCategoryInfo[];
}

export function TemplateCard({ template, categories }: TemplateCardProps) {
  const category = getCategoryInfo(template.category, categories);

  return (
    <Link
      href={`/templates/${template.id}`}
      className="group block rounded-xl focus-visible:ring-[3px] focus-visible:ring-ring/50 focus-visible:outline-none"
    >
      <Card className="h-full transition-colors group-hover:ring-primary/40 group-hover:bg-muted/30">
        <CardHeader>
          <div className="flex items-start justify-between gap-2">
            <p className="text-xs text-muted-foreground">
              <span aria-hidden>{category.icon}</span> {category.label}
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
          <p>{getAuthorLabel(template)}</p>
        </CardContent>
      </Card>
    </Link>
  );
}
