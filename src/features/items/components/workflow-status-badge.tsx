import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { ItemStatus } from "@/types/item";

// Fallback colors when an etapa has none: the category's usual tone.
export const CATEGORY_COLOR: Record<ItemStatus, string> = {
  TODO: "#94A3B8",
  IN_PROGRESS: "#F59E0B",
  DONE: "#10B981",
};

export function StatusDot({ color, category }: { color: string | null; category: ItemStatus }) {
  return (
    <span
      aria-hidden
      className="inline-block size-2 shrink-0 rounded-full"
      style={{ backgroundColor: color ?? CATEGORY_COLOR[category] }}
    />
  );
}

export function WorkflowStatusBadge({
  name,
  color,
  category,
  className,
}: {
  name: string;
  color: string | null;
  category: ItemStatus;
  className?: string;
}) {
  return (
    <Badge variant="secondary" className={cn("gap-1.5", className)}>
      <StatusDot color={color} category={category} />
      {name}
    </Badge>
  );
}
