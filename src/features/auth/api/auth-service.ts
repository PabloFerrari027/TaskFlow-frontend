import axios from "axios";
import { apiClient } from "@/lib/api/client";
import type {
  AuthTokensResponse,
  ChangePasswordRequest,
  CurrentUserResponse,
  ForgotPasswordRequest,
  ForgotPasswordResponse,
  GoogleLoginRequest,
  LinkGoogleRequest,
  LinkGoogleResponse,
  LoginChallengeResponse,
  LoginRequest,
  PasswordUpdateResponse,
  RegisterUserRequest,
  RegisterUserResponse,
  ResetPasswordRequest,
  ResendVerificationCodeRequest,
  ResendVerificationCodeResponse,
  SetFirstPasswordRequest,
  UpdateProfilePhotoResponse,
  VerifyEmailRequest,
  VerifyEmailResponse,
  VerifyTwoFactorRequest,
} from "@/types/auth";

// A data URL (unlike an object URL) has no lifecycle to manage, so it can sit
// in the query cache and be dropped by GC like any other value.
function blobToDataUrl(blob: Blob) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(blob);
  });
}

export const MAX_PHOTO_SIZE_BYTES = 5 * 1024 * 1024;
export const ACCEPTED_PHOTO_TYPES = ["image/jpeg", "image/png", "image/webp"];

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

  async forgotPassword(payload: ForgotPasswordRequest) {
    const { data } = await apiClient.post<ForgotPasswordResponse>(
      "/auth/forgot-password",
      payload
    );
    return data;
  },

  async resetPassword(payload: ResetPasswordRequest) {
    await apiClient.post("/auth/reset-password", payload);
  },

  async getCurrentUser() {
    const { data } = await apiClient.get<CurrentUserResponse>("/auth/me");
    return data;
  },

  async uploadPhoto(file: File) {
    const formData = new FormData();
    formData.append("file", file);
    const { data } = await apiClient.put<UpdateProfilePhotoResponse>(
      "/auth/me/photo",
      formData
    );
    return data;
  },

  // Protected by JWT, so it can't be an <img src> — fetch the blob and hand
  // the caller a data URL. `null` means the user has no photo (404).
  async getUserPhoto(userId: string) {
    try {
      const response = await apiClient.get<Blob>(`/users/${userId}/photo`, {
        responseType: "blob",
      });
      return await blobToDataUrl(response.data);
    } catch (error) {
      if (axios.isAxiosError(error) && error.response?.status === 404) {
        return null;
      }
      throw error;
    }
  },

  async changePassword(payload: ChangePasswordRequest) {
    const { data } = await apiClient.patch<PasswordUpdateResponse>(
      "/auth/password",
      payload
    );
    return data;
  },

  async setFirstPassword(payload: SetFirstPasswordRequest) {
    const { data } = await apiClient.post<PasswordUpdateResponse>(
      "/auth/password",
      payload
    );
    return data;
  },

  async linkGoogle(payload: LinkGoogleRequest) {
    const { data } = await apiClient.post<LinkGoogleResponse>(
      "/auth/google-link",
      payload
    );
    return data;
  },
};
