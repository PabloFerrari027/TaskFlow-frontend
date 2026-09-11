import type { LucideIcon } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

export function StatCard({
  label,
  value,
  icon: Icon,
  isLoading,
}: {
  label: string;
  value: number;
  icon: LucideIcon;
  isLoading?: boolean;
}) {
  return (
    <Card className="flex-row items-center gap-3 p-4">
      <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
        <Icon className="size-5" />
      </div>
      <div className="min-w-0">
        <p className="truncate text-xs text-muted-foreground">{label}</p>
        {isLoading ? (
          <Skeleton className="mt-1 h-6 w-14" />
        ) : (
          <p className="text-xl font-semibold text-foreground">
            {value.toLocaleString("pt-BR")}
          </p>
        )}
      </div>
    </Card>
  );
}
