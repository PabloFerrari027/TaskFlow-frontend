export type AccountStatus = "PENDING_VERIFICATION" | "ACTIVE";

export interface RegisterUserRequest {
  name: string;
  email: string;
  password: string;
}

export interface RegisterUserResponse {
  userId: string;
  name: string;
  email: string;
  status: AccountStatus;
}

export interface VerifyEmailRequest {
  email: string;
  code: string;
}

export interface VerifyEmailResponse {
  userId: string;
  email: string;
  status: AccountStatus;
}

export interface ResendVerificationCodeRequest {
  email: string;
}

export interface ResendVerificationCodeResponse {
  expiresInSeconds: number;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginChallengeResponse {
  challengeId: string;
  expiresInSeconds: number;
}

export interface VerifyTwoFactorRequest {
  challengeId: string;
  code: string;
}

export interface AuthTokensResponse {
  accessToken: string;
  refreshToken: string;
  expiresInSeconds: number;
  sessionId: string;
}

export interface ForgotPasswordRequest {
  email: string;
}

export interface ForgotPasswordResponse {
  expiresInSeconds: number;
}

export interface ResetPasswordRequest {
  token: string;
  newPassword: string;
}

export interface GoogleLoginRequest {
  idToken: string;
}

export interface RefreshTokenRequest {
  sessionId: string;
  refreshToken: string;
}

export interface RefreshTokenResponse {
  accessToken: string;
  refreshToken: string;
  expiresInSeconds: number;
}

export interface ChangePasswordRequest {
  currentPassword: string;
  newPassword: string;
}

export interface SetFirstPasswordRequest {
  newPassword: string;
  googleIdToken: string;
}

export interface PasswordUpdateResponse {
  success: boolean;
}

export interface LinkGoogleRequest {
  currentPassword: string;
  googleIdToken: string;
}

export interface LinkGoogleResponse {
  success: boolean;
}

export interface CurrentUserResponse {
  id: string;
  email: string;
  // null on accounts created before the field existed (or Google without a
  // profile name) — callers fall back to the e-mail.
  name: string | null;
  // When true the binary is at GET /users/:id/photo (using the user's own id).
  hasPhoto: boolean;
  status: AccountStatus;
  hasPassword: boolean;
  googleLinked: boolean;
  // Billing fields (see features/billing). Optional until the backend ships
  // them: a missing `planId` reads as "no plan" (FREE cap) and a missing
  // `hasStripeCustomer` hides "Gerenciar assinatura".
  planId?: string | null;
  hasStripeCustomer?: boolean;
}

export interface UpdateProfilePhotoResponse {
  id: string;
  hasPhoto: boolean;
}

export interface AccessTokenPayload {
  sub: string;
  email?: string;
  iat?: number;
  exp?: number;
}
