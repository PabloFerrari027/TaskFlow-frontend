import { apiClient } from "@/lib/api/client";
import type {
  AuthTokensResponse,
  GoogleLoginRequest,
  LoginChallengeResponse,
  LoginRequest,
  RegisterUserRequest,
  RegisterUserResponse,
  ResendVerificationCodeRequest,
  ResendVerificationCodeResponse,
  VerifyEmailRequest,
  VerifyEmailResponse,
  VerifyTwoFactorRequest,
} from "@/types/auth";

export const authService = {
  async register(payload: RegisterUserRequest) {
    const { data } = await apiClient.post<RegisterUserResponse>(
      "/auth/register",
      payload
    );
    return data;
  },

  async verifyEmail(payload: VerifyEmailRequest) {
    const { data } = await apiClient.post<VerifyEmailResponse>(
      "/auth/verify-email",
      payload
    );
    return data;
  },

  async resendVerificationCode(payload: ResendVerificationCodeRequest) {
    const { data } = await apiClient.post<ResendVerificationCodeResponse>(
      "/auth/resend-verification-code",
      payload
    );
    return data;
  },

  async login(payload: LoginRequest) {
    const { data } = await apiClient.post<LoginChallengeResponse>(
      "/auth/login",
      payload
    );
    return data;
  },

  async verifyTwoFactor(payload: VerifyTwoFactorRequest) {
    const { data } = await apiClient.post<AuthTokensResponse>(
      "/auth/login/verify",
      payload
    );
    return data;
  },

  async loginWithGoogle(payload: GoogleLoginRequest) {
    const { data } = await apiClient.post<AuthTokensResponse>(
      "/auth/login/google",
      payload
    );
    return data;
  },
};
