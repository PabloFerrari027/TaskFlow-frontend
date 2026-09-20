"use client";

import Script from "next/script";
import { useRouter, useSearchParams } from "next/navigation";
import { toast } from "sonner";
import { useGoogleLoginMutation } from "@/features/auth/hooks/use-auth-mutations";
import { useGoogleIdentityToken } from "@/features/auth/hooks/use-google-identity-token";
import { getErrorMessage } from "@/lib/errors";
import { getSafeRedirectPath } from "@/lib/safe-redirect";

/**
 * "Continuar com Google" on the login/register screens. Unlike the
 * ReauthDialog / security-settings uses of `useGoogleIdentityToken`, there is
 * no session yet here: the credential is exchanged for one (POST
 * /auth/login/google) and the user is sent into the app. The backend decides
 * login vs. sign-up from the token's e-mail.
 */
export function GoogleSignInButton() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const googleLoginMutation = useGoogleLoginMutation();

  const { buttonRef, scriptProps, isConfigured } = useGoogleIdentityToken({
    enabled: true,
    onCredential: (idToken) => {
      if (googleLoginMutation.isPending) return;
      googleLoginMutation.mutate(
        { idToken },
        {
          onSuccess: () => {
            toast.success("Login realizado com sucesso.");
            router.push(getSafeRedirectPath(searchParams.get("next")));
          },
          onError: (error) => toast.error(getErrorMessage(error)),
        }
      );
    },
    buttonWidth: 336,
  });

  if (!isConfigured) return null;

  return (
    <div className="space-y-5">
      <div className="flex items-center gap-3">
        <div className="h-px flex-1 bg-border" />
        <span className="text-xs text-muted-foreground">ou continue com</span>
        <div className="h-px flex-1 bg-border" />
      </div>
      <div className="flex justify-center">
        <Script {...scriptProps} />
        <div ref={buttonRef} />
      </div>
    </div>
  );
}
