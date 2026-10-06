"use client";

import { Suspense, use } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { TemplateDetailView } from "@/features/folder-templates/components/template-detail-view";

export default function TemplateDetailPage(props: PageProps<"/templates/[templateId]">) {
  const { templateId } = use(props.params);

  return (
    <Suspense fallback={<Skeleton className="h-48 w-full rounded-xl" />}>
      <TemplateDetailView key={templateId} templateId={templateId} />
    </Suspense>
  );
}
