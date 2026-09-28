"use client";

import * as React from "react";
import { useParams, useRouter } from "next/navigation";
import { Skeleton } from "@/components/ui/skeleton";
import { useCurrentWorkspace } from "@/features/workspaces/context/current-workspace-context";

// Workspace settings now live on /workspaces and follow the current workspace.
// Kept so old links and bookmarks still land on the right workspace.
export default function WorkspaceDetailRedirect() {
  const { workspaceId } = useParams<{ workspaceId: string }>();
  const router = useRouter();
  const { setWorkspaceId } = useCurrentWorkspace();

  React.useEffect(() => {
    setWorkspaceId(workspaceId);
    router.replace("/workspaces");
  }, [workspaceId, setWorkspaceId, router]);

  return <Skeleton className="h-64 w-full" />;
}
