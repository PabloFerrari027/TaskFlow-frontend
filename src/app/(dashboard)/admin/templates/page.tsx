"use client";

import { Suspense } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { PageHeader } from "@/components/shared/page-header";
import { AdminTemplatesTable } from "@/features/folder-templates/components/admin-templates-table";

export default function AdminTemplatesPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Modelos do sistema"
        description="Gerencie os modelos que o TaskFlow oferece a todos: tire da lista, restaure ou exclua."
      />
      <Suspense fallback={<Skeleton className="h-64 w-full" />}>
        <AdminTemplatesTable />
      </Suspense>
    </div>
  );
}
