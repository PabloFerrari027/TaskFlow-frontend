"use client";

import { useRouter } from "next/navigation";
import { ShieldOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { SessionList } from "@/features/sessions/components/session-list";
import { useRevokeAllSessionsMutation } from "@/features/sessions/hooks/use-sessions";

export function SessionsSettingsSection() {
  const router = useRouter();
  const revokeAllMutation = useRevokeAllSessionsMutation();

  return (
    <Card id="sessoes">
      <CardHeader>
        <CardTitle>Sessões</CardTitle>
        <CardDescription>Dispositivos atualmente conectados à sua conta.</CardDescription>
        <CardAction>
          <ConfirmDialog
            trigger={
              <Button variant="outline" size="sm">
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
        </CardAction>
      </CardHeader>
      <CardContent>
        <SessionList />
      </CardContent>
    </Card>
  );
}
