export type AccountStatus = "PENDING_VERIFICATION" | "ACTIVE";

export interface RegisterUserRequest {
  email: string;
  password: string;
}

export interface RegisterUserResponse {
  userId: string;
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
  status: AccountStatus;
  hasPassword: boolean;
  googleLinked: boolean;
}

export interface AccessTokenPayload {
  sub: string;
  email?: string;
  iat?: number;
  exp?: number;
}
