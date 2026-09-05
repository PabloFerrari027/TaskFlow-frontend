export type ErrorCode =
  | "INVALID_CREDENTIALS"
  | "USER_ALREADY_EXISTS"
  | "CHALLENGE_NOT_FOUND"
  | "CHALLENGE_EXPIRED"
  | "CHALLENGE_INVALID_CODE"
  | "CHALLENGE_MAX_ATTEMPTS_EXCEEDED"
  | "SESSION_NOT_FOUND"
  | "SESSION_EXPIRED"
  | "USER_NOT_FOUND"
  | "WORKSPACE_NOT_FOUND"
  | "FORBIDDEN_WORKSPACE_ACTION"
  | "MEMBER_ALREADY_EXISTS"
  | "MEMBER_NOT_FOUND"
  | "LAST_OWNER_CANNOT_BE_REMOVED"
  | "INVITATION_NOT_FOUND"
  | "INVITATION_ALREADY_PROCESSED"
  | "INVITATION_EXPIRED"
  | "INVITATION_EMAIL_MISMATCH"
  | "PROJECT_NOT_FOUND"
  | "TASK_NOT_FOUND"
  | "ATTACHMENT_NOT_FOUND"
  | "SUBTASK_PROJECT_MISMATCH"
  | "TASK_HAS_PENDING_SUBTASKS"
  | "CUSTOM_FIELD_NOT_FOUND"
  | "CUSTOM_FIELD_VALUE_INVALID"
  | "SYNC_VERSION_CONFLICT";

export interface DomainErrorResponse {
  statusCode: number;
  code: ErrorCode;
  message: string;
  timestamp: string;
}

export interface ValidationErrorResponse {
  statusCode: number;
  message: string[] | string;
  error: string;
}

export type ApiErrorResponse = DomainErrorResponse | ValidationErrorResponse;

export type InvitationStatus = "PENDING" | "ACCEPTED" | "REVOKED" | "EXPIRED";

export function isDomainError(
  data: unknown
): data is DomainErrorResponse {
  return (
    typeof data === "object" &&
    data !== null &&
    "code" in data &&
    typeof (data as Record<string, unknown>).code === "string"
  );
}
