"use client";

import { PageHeader } from "@/components/shared/page-header";
import { ClientsTable } from "@/features/admin/components/clients-table";

export default function AdminClientsPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Clientes"
        description="Gerencie as contas de clientes da plataforma."
      />
      <ClientsTable />
    </div>
  );
}
