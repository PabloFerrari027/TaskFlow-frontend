import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { authService } from "@/features/auth/api/auth-service";
import { clearSession, setSession } from "@/lib/auth/token-store";
import { getErrorCode, getErrorMessage } from "@/lib/errors";
import { queryKeys } from "@/lib/query-keys";
import type { AuthTokensResponse } from "@/types/auth";

export function useRegisterMutation() {
  return useMutation({
    mutationFn: authService.register,
  });
}

export function useVerifyEmailMutation() {
  return useMutation({
    mutationFn: authService.verifyEmail,
  });
}

export function useResendVerificationCodeMutation() {
  return useMutation({
    mutationFn: authService.resendVerificationCode,
  });
}

export function useLoginMutation() {
  return useMutation({
    mutationFn: authService.login,
  });
}

function persistTokens(tokens: AuthTokensResponse) {
  setSession({
    accessToken: tokens.accessToken,
    refreshToken: tokens.refreshToken,
    sessionId: tokens.sessionId,
  });
}

export function useVerifyTwoFactorMutation() {
  return useMutation({
    mutationFn: authService.verifyTwoFactor,
    onSuccess: persistTokens,
  });
}

export function useGoogleLoginMutation() {
  return useMutation({
    mutationFn: authService.loginWithGoogle,
    onSuccess: persistTokens,
  });
}

export function useForgotPasswordMutation() {
  return useMutation({
    mutationFn: authService.forgotPassword,
  });
}

// A reset revokes EVERY session server-side, including any this browser still
// holds — drop the local one so the login screen doesn't bounce a stale token.
export function useResetPasswordMutation() {
  return useMutation({
    mutationFn: authService.resetPassword,
    onSuccess: () => clearSession(),
  });
}

// The password endpoints and the Google-link endpoint all revoke every OTHER
// session server-side; the current one stays valid, so there's nothing to
// clear locally — just refresh the sessions list and tell the user why their
// other devices dropped.
function useOnCredentialsUpdated() {
  const queryClient = useQueryClient();

  return (message: string) => {
    toast.success(message, {
      description: "Suas outras sessões foram desconectadas por segurança.",
    });
    queryClient.invalidateQueries({ queryKey: queryKeys.sessions.all() });
  };
}

export function useChangePasswordMutation() {
  const onCredentialsUpdated = useOnCredentialsUpdated();

  return useMutation({
    mutationFn: authService.changePassword,
    onSuccess: () => onCredentialsUpdated("Senha alterada com sucesso."),
    onError: (error) => {
      // A wrong current password is a field error, shown inline by the form —
      // not a generic toast.
      if (getErrorCode(error) === "CURRENT_PASSWORD_INCORRECT") return;
      toast.error(getErrorMessage(error));
    },
  });
}

export function useSetFirstPasswordMutation() {
  const queryClient = useQueryClient();
  const onCredentialsUpdated = useOnCredentialsUpdated();

  return useMutation({
    mutationFn: authService.setFirstPassword,
    onSuccess: () => {
      onCredentialsUpdated("Senha definida com sucesso.");
      // `hasPassword` flips to true — the security section must swap to the
      // "change password" form instead of trusting stale cached /auth/me.
      queryClient.invalidateQueries({ queryKey: queryKeys.auth.me() });
    },
    onError: (error) => toast.error(getErrorMessage(error)),
  });
}

export function useLinkGoogleMutation() {
  const queryClient = useQueryClient();
  const onCredentialsUpdated = useOnCredentialsUpdated();

  return useMutation({
    mutationFn: authService.linkGoogle,
    onSuccess: () => {
      onCredentialsUpdated("Conta Google vinculada com sucesso.");
      // `googleLinked` flips to true — the section must swap to the
      // "already linked" note instead of trusting stale cached /auth/me.
      queryClient.invalidateQueries({ queryKey: queryKeys.auth.me() });
    },
    onError: (error) => {
      // A wrong current password is a field error, shown inline by the form —
      // not a generic toast.
      if (getErrorCode(error) === "CURRENT_PASSWORD_INCORRECT") return;
      toast.error(getErrorMessage(error));
    },
  });
}
