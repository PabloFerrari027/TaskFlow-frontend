import Link from "next/link";
import { FolderKanban } from "lucide-react";
import { Card } from "@/components/ui/card";
import { ProjectStatusBadge } from "@/components/shared/status-badge";
import { formatRelativeTime } from "@/lib/format";
import type { Project } from "@/types/project";

export function ProjectCard({ project }: { project: Project }) {
  return (
    <Link href={`/projects/${project.id}`}>
      <Card className="h-full gap-3 p-5 transition-shadow hover:shadow-md">
        <div className="flex items-start justify-between gap-2">
          <div className="flex size-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
            <FolderKanban className="size-4.5" />
          </div>
          <ProjectStatusBadge status={project.status} />
        </div>
        <div>
          <h3 className="truncate font-medium text-foreground">{project.name}</h3>
          <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">
            {project.description || "Sem descrição"}
          </p>
        </div>
        <p className="text-xs text-muted-foreground">
          Atualizado {formatRelativeTime(project.updatedAt)}
        </p>
      </Card>
    </Link>
  );
}
