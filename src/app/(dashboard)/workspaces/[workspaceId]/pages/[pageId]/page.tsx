"use client";

import { useParams } from "next/navigation";
import { PageEditor } from "@/features/dashboard-pages/components/page-editor";

export default function DashboardPageEditorPage() {
  const { workspaceId, pageId } = useParams<{ workspaceId: string; pageId: string }>();
  return <PageEditor key={pageId} workspaceId={workspaceId} pageId={pageId} />;
}
