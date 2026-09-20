"use client";

import * as React from "react";
import {
  GOOGLE_IDENTITY_SCRIPT_SRC,
  googleClientId,
  type GoogleCredentialResponse,
} from "@/lib/google-identity";

/**
 * The single Google Identity Services integration: hands a one-off ID token to
 * `onCredential`. What happens next is the caller's business — GoogleSignInButton
 * exchanges it for a new session (login/sign-up), while ReauthDialog, the "set
 * first password" form and the "link Google" form only use it to confirm
 * identity inside an already-authenticated session.
 *
 * Usage: render `<Script {...scriptProps} />` and a `<div ref={buttonRef} />`
 * — GIS draws its own button into that div, and the ID token only reaches
 * `onCredential` once the user clicks it. The token is handed straight to the
 * callback and never stored here. The div must be mounted whenever `enabled`
 * is true.
 *
 * `onCredential` is read through a ref, so a fresh function identity on every
 * render doesn't re-mount the Google-rendered button.
 */
export function useGoogleIdentityToken({
  enabled,
  onCredential,
  buttonWidth = 300,
}: {
  enabled: boolean;
  onCredential: (idToken: string) => void;
  buttonWidth?: number;
}) {
  const [scriptLoaded, setScriptLoaded] = React.useState(false);
  const buttonRef = React.useRef<HTMLDivElement>(null);

  const onCredentialRef = React.useRef(onCredential);
  React.useEffect(() => {
    onCredentialRef.current = onCredential;
  }, [onCredential]);

  React.useEffect(() => {
    if (!enabled || !scriptLoaded || !googleClientId) return;
    if (!window.google || !buttonRef.current) return;

    window.google.accounts.id.initialize({
      client_id: googleClientId,
      callback: (response: GoogleCredentialResponse) => {
        onCredentialRef.current(response.credential);
      },
    });
    buttonRef.current.innerHTML = "";
    window.google.accounts.id.renderButton(buttonRef.current, {
      type: "standard",
      theme: "outline",
      size: "large",
      text: "continue_with",
      width: buttonWidth,
    });
  }, [enabled, scriptLoaded, buttonWidth]);

  const onReady = React.useCallback(() => setScriptLoaded(true), []);

  return {
    buttonRef,
    scriptProps: {
      src: GOOGLE_IDENTITY_SCRIPT_SRC,
      strategy: "afterInteractive" as const,
      onReady,
    },
    // False when NEXT_PUBLIC_GOOGLE_CLIENT_ID isn't configured — GIS can't run.
    isConfigured: Boolean(googleClientId),
  };
}
