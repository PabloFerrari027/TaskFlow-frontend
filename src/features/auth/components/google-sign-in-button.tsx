"use client";

import * as React from "react";
import Script from "next/script";
import { useRouter, useSearchParams } from "next/navigation";
import { toast } from "sonner";
import { useGoogleLoginMutation } from "@/features/auth/hooks/use-auth-mutations";
import { getErrorMessage } from "@/lib/errors";
import { getSafeRedirectPath } from "@/lib/safe-redirect";

const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;

interface GoogleCredentialResponse {
  credential: string;
}

interface GoogleAccountsId {
  initialize: (config: {
    client_id: string;
    callback: (response: GoogleCredentialResponse) => void;
  }) => void;
  renderButton: (parent: HTMLElement, options: Record<string, unknown>) => void;
}

declare global {
  interface Window {
    google?: { accounts: { id: GoogleAccountsId } };
  }
}

export function GoogleSignInButton() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const googleLoginMutation = useGoogleLoginMutation();
  const buttonRef = React.useRef<HTMLDivElement>(null);
  const [scriptLoaded, setScriptLoaded] = React.useState(false);

  const handleCredential = React.useCallback(
    (response: GoogleCredentialResponse) => {
      googleLoginMutation.mutate(
        { idToken: response.credential },
        {
          onSuccess: () => {
            toast.success("Login realizado com sucesso.");
            router.push(getSafeRedirectPath(searchParams.get("next")));
          },
          onError: (error) => toast.error(getErrorMessage(error)),
        }
      );
    },
    [googleLoginMutation, router, searchParams]
  );

  React.useEffect(() => {
    if (!scriptLoaded || !clientId || !buttonRef.current) return;
    if (!window.google) return;

    window.google.accounts.id.initialize({
      client_id: clientId,
      callback: handleCredential,
    });
    window.google.accounts.id.renderButton(buttonRef.current, {
      type: "standard",
      theme: "outline",
      size: "large",
      width: 336,
      text: "continue_with",
    });
  }, [scriptLoaded, handleCredential]);

  if (!clientId) return null;

  return (
    <div className="space-y-5">
      <div className="flex items-center gap-3">
        <div className="h-px flex-1 bg-border" />
        <span className="text-xs text-muted-foreground">ou continue com</span>
        <div className="h-px flex-1 bg-border" />
      </div>
      <div className="flex justify-center">
        <Script
          src="https://accounts.google.com/gsi/client"
          strategy="afterInteractive"
          onReady={() => setScriptLoaded(true)}
        />
        <div ref={buttonRef} />
      </div>
    </div>
  );
}
