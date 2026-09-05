"use client";

import { useRouter } from "next/navigation";
import { ShieldOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/shared/page-header";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { SessionList } from "@/features/sessions/components/session-list";
import { useRevokeAllSessionsMutation } from "@/features/sessions/hooks/use-sessions";

export default function SessionsPage() {
  const router = useRouter();
  const revokeAllMutation = useRevokeAllSessionsMutation();

  return (
    <div className="space-y-6">
      <PageHeader
        title="Sessões"
        description="Dispositivos atualmente conectados à sua conta."
        actions={
          <ConfirmDialog
            trigger={
              <Button variant="outline">
                <ShieldOff /> Encerrar todas
              </Button>
            }
            title="Encerrar todas as sessões"
            description="Você será desconectado de todos os dispositivos, incluindo este. Será necessário fazer login novamente."
            confirmLabel="Encerrar todas"
            isLoading={revokeAllMutation.isPending}
            onConfirm={() =>
              revokeAllMutation.mutate(undefined, {
                onSuccess: () => router.push("/login"),
              })
            }
          />
        }
      />
      <SessionList />
    </div>
  );
}
