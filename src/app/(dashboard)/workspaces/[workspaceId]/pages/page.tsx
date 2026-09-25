"use client";

import { useParams } from "next/navigation";
import { PageList } from "@/features/dashboard-pages/components/page-list";

export default function DashboardPagesPage() {
  const { workspaceId } = useParams<{ workspaceId: string }>();
  return <PageList key={workspaceId} workspaceId={workspaceId} />;
}
