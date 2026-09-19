"use client";

import * as React from "react";
import Script from "next/script";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import { PendingActionDetails } from "@/features/assistant/components/pending-action-details";
import { useCurrentUserQuery } from "@/features/auth/hooks/use-current-user";
import {
  GOOGLE_IDENTITY_SCRIPT_SRC,
  googleClientId,
  type GoogleCredentialResponse,
} from "@/lib/google-identity";

/**
 * Bloqueante de propósito (adendo de segurança máxima): um passo inline no
 * mesmo card do chat não cria a mesma pausa física que um modal separado —
 * fica fácil confirmar "no automático" clicando em elementos da conversa.
 * Não fecha clicando fora nem com Esc, só pelos botões "Confirmar"/"Cancelar"
 * aqui dentro — "Cancelar" só fecha esta etapa, nunca cancela a
 * PendingAction em si (isso continua sendo o botão "Cancelar" do card).
 *
 * O campo mostrado depende de `hasPassword`/`googleLinked` da própria conta
 * (GET /auth/me). O botão "Confirmar com Google" usa a Google Identity
 * Services para pegar um ID Token pontual, direto neste modal — isso NUNCA é
 * um login: não navega para fora da tela do assistente, não troca a sessão
 * atual, o token só vive na variável local desta chamada.
 */
export function ReauthDialog({
  open,
  onClose,
  humanDescription,
  params,
  isCurrentSession,
  password,
  onPasswordChange,
  error,
  isPending,
  onConfirm,
  onConfirmWithGoogle,
}: {
  open: boolean;
  onClose: () => void;
  humanDescription: string;
  params: Record<string, unknown>;
  isCurrentSession?: boolean;
  password: string;
  onPasswordChange: (value: string) => void;
  error: string | null;
  isPending: boolean;
  onConfirm: () => void;
  onConfirmWithGoogle: (idToken: string) => void;
}) {
  const currentUserQuery = useCurrentUserQuery({ enabled: open });
  const currentUser = currentUserQuery.data;
  const hasPassword = Boolean(currentUser?.hasPassword);
  const googleLinked = Boolean(currentUser?.googleLinked);

  const [scriptLoaded, setScriptLoaded] = React.useState(false);
  const googleButtonRef = React.useRef<HTMLDivElement>(null);

  // Effect only re-runs on open/script-ready/googleLinked changes, never on
  // every render — the callback reads these refs instead, so a fresh
  // `onConfirmWithGoogle` identity from the parent doesn't re-mount the
  // Google-rendered button.
  const onConfirmWithGoogleRef = React.useRef(onConfirmWithGoogle);
  React.useEffect(() => {
    onConfirmWithGoogleRef.current = onConfirmWithGoogle;
  }, [onConfirmWithGoogle]);
  const isPendingRef = React.useRef(isPending);
  React.useEffect(() => {
    isPendingRef.current = isPending;
  }, [isPending]);

  React.useEffect(() => {
    if (!open || !scriptLoaded || !googleLinked || !googleClientId) return;
    if (!window.google || !googleButtonRef.current) return;

    window.google.accounts.id.initialize({
      client_id: googleClientId,
      callback: (response: GoogleCredentialResponse) => {
        if (isPendingRef.current) return;
        onConfirmWithGoogleRef.current(response.credential);
      },
    });
    googleButtonRef.current.innerHTML = "";
    window.google.accounts.id.renderButton(googleButtonRef.current, {
      type: "standard",
      theme: "outline",
      size: "large",
      text: "continue_with",
      width: 300,
    });
  }, [open, scriptLoaded, googleLinked]);

  const noReauthMethodAvailable =
    !currentUserQuery.isLoading && !hasPassword && !googleLinked;

  return (
    <Dialog open={open} onOpenChange={(next) => (!next ? onClose() : undefined)}>
      <DialogContent
        showCloseButton={false}
        onInteractOutside={(event) => event.preventDefault()}
        onEscapeKeyDown={(event) => event.preventDefault()}
      >
        <DialogHeader>
          <DialogTitle>Confirme sua identidade</DialogTitle>
          <DialogDescription>
            Essa é uma ação crítica — confirme sua identidade para executá-la.
          </DialogDescription>
        </DialogHeader>

        {googleLinked ? (
          <Script
            src={GOOGLE_IDENTITY_SCRIPT_SRC}
            strategy="afterInteractive"
            onReady={() => setScriptLoaded(true)}
          />
        ) : null}

        <div className="space-y-3">
          <PendingActionDetails
            humanDescription={humanDescription}
            params={params}
            isCurrentSession={isCurrentSession}
          />

          {currentUserQuery.isLoading ? (
            <div className="flex justify-center py-2">
              <Loader2 className="size-4 animate-spin text-muted-foreground" />
            </div>
          ) : noReauthMethodAvailable ? (
            <p className="text-xs text-muted-foreground">
              Sua conta não tem nenhum método de reautenticação disponível (nem senha, nem
              Google vinculado) — não é possível confirmar esta ação agora.
            </p>
          ) : (
            <>
              {hasPassword ? (
                <Input
                  type="password"
                  value={password}
                  onChange={(event) => onPasswordChange(event.target.value)}
                  placeholder="Sua senha"
                  autoFocus
                  aria-invalid={Boolean(error)}
                />
              ) : null}

              {hasPassword && googleLinked ? (
                <div className="flex items-center gap-3">
                  <div className="h-px flex-1 bg-border" />
                  <span className="text-xs text-muted-foreground">ou</span>
                  <div className="h-px flex-1 bg-border" />
                </div>
              ) : null}

              {googleLinked ? (
                <div
                  className={cn(
                    "flex justify-center",
                    isPending && "pointer-events-none opacity-60"
                  )}
                >
                  <div ref={googleButtonRef} />
                </div>
              ) : null}

              {error ? <p className="text-xs text-destructive">{error}</p> : null}
            </>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" disabled={isPending} onClick={onClose}>
            Cancelar
          </Button>
          {hasPassword ? (
            <Button variant="destructive" disabled={!password || isPending} onClick={onConfirm}>
              {isPending ? <Loader2 className="animate-spin" /> : null}
              Confirmar
            </Button>
          ) : null}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
