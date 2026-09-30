"use client";

import { useParams } from "next/navigation";
import { PageEditor } from "@/features/dashboard-pages/components/page-editor";

export default function DashboardPageEditorPage() {
  const { workspaceId, pageId } = useParams<{ workspaceId: string; pageId: string }>();
  return (
    <div data-page-width="full">
      <PageEditor key={pageId} workspaceId={workspaceId} pageId={pageId} />
    </div>
  );
}
