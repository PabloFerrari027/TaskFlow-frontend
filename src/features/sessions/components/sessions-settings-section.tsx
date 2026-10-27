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
        <CardTitle>Aparelhos conectados</CardTitle>
        <CardDescription>Onde sua conta está aberta agora.</CardDescription>
        <CardAction>
          <ConfirmDialog
            trigger={
              <Button variant="outline" size="sm">
                <ShieldOff /> Desconectar todos
              </Button>
            }
            title="Desconectar todos os aparelhos?"
            description="Sua conta sai de todos os aparelhos, inclusive deste. Depois é só entrar de novo."
            confirmLabel="Desconectar todos"
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
