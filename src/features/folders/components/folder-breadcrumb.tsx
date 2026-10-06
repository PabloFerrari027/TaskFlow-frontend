"use client";

import * as React from "react";
import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { useFoldersQuery } from "@/features/folders/hooks/use-folders";
import { useWorkspaceQuery } from "@/features/workspaces/hooks/use-workspaces";
import { getAncestors } from "@/lib/tree";
import type { Folder } from "@/types/folder";

// Shown only for sub-folders: Workspace → ancestors (root first) → current.
// The ancestors come from the workspace's folder list already in cache (the
// same query the folders page uses), so no per-ancestor request is needed.
export function FolderBreadcrumb({ folder }: { folder: Folder }) {
  const foldersQuery = useFoldersQuery(folder.parentId ? folder.workspaceId : null);
  const workspaceQuery = useWorkspaceQuery(folder.parentId ? folder.workspaceId : null);

  const ancestors = React.useMemo(
    () => getAncestors(foldersQuery.data?.data ?? [], folder.id),
    [foldersQuery.data, folder.id]
  );

  if (!folder.parentId || ancestors.length === 0) return null;

  return (
    <nav aria-label="Breadcrumb">
      <ol className="flex flex-wrap items-center gap-1 text-sm text-muted-foreground">
        <li>
          <Link href="/folders" className="hover:text-foreground hover:underline">
            {workspaceQuery.data?.name ?? "Workspace"}
          </Link>
        </li>
        {ancestors.map((ancestor) => (
          <li key={ancestor.id} className="flex items-center gap-1">
            <ChevronRight className="size-3.5" aria-hidden />
            <Link href={`/folders/${ancestor.id}`} className="hover:text-foreground hover:underline">
              {ancestor.name}
            </Link>
          </li>
        ))}
        <li className="flex items-center gap-1" aria-current="page">
          <ChevronRight className="size-3.5" aria-hidden />
          <span className="font-medium text-foreground">{folder.name}</span>
        </li>
      </ol>
    </nav>
  );
}
