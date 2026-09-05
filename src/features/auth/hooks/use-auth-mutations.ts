import { useMutation } from "@tanstack/react-query";
import { authService } from "@/features/auth/api/auth-service";
import { setSession } from "@/lib/auth/token-store";
import type { AuthTokensResponse } from "@/types/auth";

export function useRegisterMutation() {
  return useMutation({
    mutationFn: authService.register,
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
