"use client";

import * as React from "react";
import Link from "next/link";
import { Building2, Check, ChevronsUpDown, Plus, Settings } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useCurrentWorkspace } from "@/features/workspaces/context/current-workspace-context";
import { CreateWorkspaceDialog } from "@/features/workspaces/components/create-workspace-dialog";

export function WorkspaceSwitcher() {
  const { workspace, workspaces, isLoading, setWorkspaceId } =
    useCurrentWorkspace();
  const [createOpen, setCreateOpen] = React.useState(false);

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="outline"
            className="h-9 max-w-[220px] justify-between"
            disabled={isLoading}
          >
            <span className="flex min-w-0 items-center gap-2">
              <Building2 className="size-4 shrink-0 text-muted-foreground" />
              <span className="truncate">
                {workspace?.name ?? (isLoading ? "Carregando…" : "Nenhum workspace")}
              </span>
            </span>
            <ChevronsUpDown className="size-3.5 shrink-0 text-muted-foreground" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" className="w-64">
          <DropdownMenuLabel>Workspaces</DropdownMenuLabel>
          <DropdownMenuSeparator />
          {workspaces.map((w) => (
            <DropdownMenuItem key={w.id} onClick={() => setWorkspaceId(w.id)}>
              <span className="truncate">{w.name}</span>
              {w.id === workspace?.id ? (
                <Check className="ml-auto size-4 text-primary" />
              ) : null}
            </DropdownMenuItem>
          ))}
          <DropdownMenuSeparator />
          <DropdownMenuItem asChild>
            <Link href="/workspaces">
              <Settings /> Gerenciar workspaces
            </Link>
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => setCreateOpen(true)}>
            <Plus /> Novo workspace
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <CreateWorkspaceDialog open={createOpen} onOpenChange={setCreateOpen} />
    </>
  );
}
