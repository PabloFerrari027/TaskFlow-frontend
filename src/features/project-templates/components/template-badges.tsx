import { Badge } from "@/components/ui/badge";
import { formatPriceCents } from "@/lib/format";
import { cn } from "@/lib/utils";
import { TEMPLATE_STATUS_LABEL } from "@/features/project-templates/lib/template-labels";
import type { ProjectTemplateStatus } from "@/types/project-template";

const STATUS_CLASS: Record<ProjectTemplateStatus, string> = {
  PUBLISHED: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
  UNPUBLISHED: "bg-muted text-muted-foreground",
  REMOVED: "bg-destructive/10 text-destructive",
};

export function TemplateStatusBadge({ status }: { status: ProjectTemplateStatus }) {
  return (
    <Badge variant="secondary" className={cn(STATUS_CLASS[status])}>
      {TEMPLATE_STATUS_LABEL[status]}
    </Badge>
  );
}

export function TemplatePriceBadge({ priceCents }: { priceCents: number }) {
  return (
    <Badge
      variant="secondary"
      className={cn(
        priceCents === 0
          ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
          : "bg-amber-500/10 text-amber-700 dark:text-amber-400"
      )}
    >
      {formatPriceCents(priceCents)}
    </Badge>
  );
}
