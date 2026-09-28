"use client";

import { Suspense } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { PageHeader } from "@/components/shared/page-header";
import { AdminTemplatesTable } from "@/features/project-templates/components/admin-templates-table";

export default function AdminTemplatesPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Modelos"
        description="Modere os modelos do hub: remova o que não deve estar lá e restaure quando for o caso."
      />
      <Suspense fallback={<Skeleton className="h-64 w-full" />}>
        <AdminTemplatesTable />
      </Suspense>
    </div>
  );
}
