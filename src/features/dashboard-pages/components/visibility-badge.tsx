import { Badge } from "@/components/ui/badge";
import { visibilitySpec } from "@/features/dashboard-pages/lib/visibility";
import type { DashboardPageVisibility } from "@/types/dashboard-page";

/** Icon + words, never the icon alone — "who can see this" must be readable at a glance. */
export function VisibilityBadge({ visibility }: { visibility: DashboardPageVisibility }) {
  const spec = visibilitySpec(visibility);
  return (
    <Badge variant="secondary" className="gap-1 font-normal">
      <spec.icon className="size-3" />
      {spec.label}
    </Badge>
  );
}
