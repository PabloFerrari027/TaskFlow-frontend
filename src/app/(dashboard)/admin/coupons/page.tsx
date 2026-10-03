"use client";

import * as React from "react";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/shared/page-header";
import { CouponsTable } from "@/features/plans/components/coupons-table";
import { CouponFormDialog } from "@/features/plans/components/coupon-form-dialog";

export default function AdminCouponsPage() {
  const [createOpen, setCreateOpen] = React.useState(false);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Cupons"
        description="Descontos no preço mensal dos planos pagos. Cada pessoa usa cada cupom uma vez."
        actions={
          <Button onClick={() => setCreateOpen(true)}>
            <Plus /> Novo cupom
          </Button>
        }
      />
      <CouponsTable />
      {createOpen ? (
        <CouponFormDialog coupon={null} open onOpenChange={setCreateOpen} />
      ) : null}
    </div>
  );
}
