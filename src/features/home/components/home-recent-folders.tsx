"use client";

import Link from "next/link";
import { FolderKanban } from "lucide-react";
import { Card, CardAction, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { formatRelativeTime } from "@/lib/format";
import type { Folder } from "@/types/folder";

const RECENT_COUNT = 5;

export function HomeRecentFolders({
  folders,
  isLoading,
}: {
  folders: Folder[];
  isLoading: boolean;
}) {
  const recent = folders
    .filter((folder) => folder.status === "ACTIVE")
    .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))
    .slice(0, RECENT_COUNT);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Continue de onde parou</CardTitle>
        <CardAction>
          <Button asChild variant="ghost" size="sm">
            <Link href="/folders">Ver todos</Link>
          </Button>
        </CardAction>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="space-y-2">
            {Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} className="h-12 w-full rounded-lg" />
            ))}
          </div>
        ) : recent.length === 0 ? (
          <p className="py-4 text-sm text-muted-foreground">
            Nenhuma pasta ativa ainda. Crie a primeira para começar.
          </p>
        ) : (
          <ul className="-mx-2 space-y-0.5">
            {recent.map((folder) => (
              <li key={folder.id}>
                <Link
                  href={`/folders/${folder.id}`}
                  className="flex items-center gap-3 rounded-lg px-2 py-2 transition-colors hover:bg-muted/60"
                >
                  <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-muted text-muted-foreground">
                    <FolderKanban className="size-4" />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-medium">{folder.name}</span>
                    <span className="block text-xs text-muted-foreground">
                      Atualizado {formatRelativeTime(folder.updatedAt)}
                    </span>
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}
