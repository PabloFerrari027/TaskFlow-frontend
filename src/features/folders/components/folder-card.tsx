import Link from "next/link";
import { FolderKanban } from "lucide-react";
import { Card } from "@/components/ui/card";
import { FolderStatusBadge } from "@/components/shared/status-badge";
import { formatRelativeTime } from "@/lib/format";
import type { Folder } from "@/types/folder";

export function FolderCard({ folder }: { folder: Folder }) {
  return (
    <Link href={`/folders/${folder.id}`} data-tour="folder-card">
      <Card className="h-full gap-3 p-5 transition-all hover:-translate-y-0.5 hover:shadow-card-hover hover:ring-primary/25">
        <div className="flex items-start justify-between gap-2">
          <div className="flex size-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
            <FolderKanban className="size-4.5" />
          </div>
          <FolderStatusBadge status={folder.status} />
        </div>
        <div>
          <h3 className="truncate font-medium text-foreground">{folder.name}</h3>
          <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">
            {folder.description || "Sem descrição"}
          </p>
        </div>
        <p className="text-xs text-muted-foreground">
          Atualizado {formatRelativeTime(folder.updatedAt)}
        </p>
      </Card>
    </Link>
  );
}
