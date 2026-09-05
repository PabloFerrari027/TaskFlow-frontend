"use client";

import Link from "next/link";
import { CheckCircle2, Loader2, TriangleAlert } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Logo } from "@/components/shared/logo";
import { InvitationStatusBadge } from "@/components/shared/status-badge";
import { formatDate } from "@/lib/format";
import type { InvitationStatus } from "@/types/common";

interface InvitationPreviewCardProps {
  entityLabel: string;
  entityName: string;
  email: string;
  role: string;
  status: InvitationStatus;
  expiresAt: string;
  isAuthenticated: boolean;
  currentEmail: string | null;
  loginHref: string;
  registerHref: string;
  onAccept: () => void;
  isAccepting: boolean;
}

export function InvitationPreviewCard({
  entityLabel,
  entityName,
  email,
  role,
  status,
  expiresAt,
  isAuthenticated,
  currentEmail,
  loginHref,
  registerHref,
  onAccept,
  isAccepting,
}: InvitationPreviewCardProps) {
  const emailMismatch =
    isAuthenticated && currentEmail && currentEmail.toLowerCase() !== email.toLowerCase();

  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-8 bg-muted/30 px-4 py-12">
      <Logo />

      <Card className="w-full max-w-md p-6 sm:p-8">
        <div className="space-y-1 text-center">
          <p className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
            Convite para {entityLabel}
          </p>
          <h1 className="text-xl font-semibold text-foreground">{entityName}</h1>
        </div>

        <dl className="mt-6 space-y-3 rounded-lg border border-border/60 bg-muted/30 p-4 text-sm">
          <div className="flex justify-between">
            <dt className="text-muted-foreground">E-mail convidado</dt>
            <dd className="font-medium text-foreground">{email}</dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-muted-foreground">Papel</dt>
            <dd className="font-medium text-foreground">{role}</dd>
          </div>
          <div className="flex items-center justify-between">
            <dt className="text-muted-foreground">Status</dt>
            <dd>
              <InvitationStatusBadge status={status} />
            </dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-muted-foreground">Expira em</dt>
            <dd className="font-medium text-foreground">{formatDate(expiresAt)}</dd>
          </div>
        </dl>

        {status !== "PENDING" ? (
          <p className="mt-6 text-center text-sm text-muted-foreground">
            {status === "ACCEPTED" && "Este convite já foi aceito."}
            {status === "REVOKED" && "Este convite foi revogado pelo remetente."}
            {status === "EXPIRED" && "Este convite expirou."}
          </p>
        ) : !isAuthenticated ? (
          <div className="mt-6 space-y-3">
            <p className="text-center text-sm text-muted-foreground">
              Entre ou crie uma conta com o e-mail convidado para aceitar.
            </p>
            <div className="flex gap-2">
              <Button variant="outline" className="flex-1" asChild>
                <Link href={registerHref}>Criar conta</Link>
              </Button>
              <Button className="flex-1" asChild>
                <Link href={loginHref}>Entrar</Link>
              </Button>
            </div>
          </div>
        ) : (
          <div className="mt-6 space-y-3">
            {emailMismatch ? (
              <p className="flex items-start gap-2 rounded-md bg-amber-500/10 p-3 text-xs text-amber-600 dark:text-amber-400">
                <TriangleAlert className="mt-0.5 size-3.5 shrink-0" />
                Você está logado como {currentEmail}, mas este convite foi
                enviado para {email}. Talvez seja necessário entrar com a
                outra conta.
              </p>
            ) : null}
            <Button className="w-full" onClick={onAccept} disabled={isAccepting}>
              {isAccepting ? <Loader2 className="animate-spin" /> : <CheckCircle2 />}
              Aceitar convite
            </Button>
          </div>
        )}
      </Card>
    </div>
  );
}
