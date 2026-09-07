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
  | "USER_ALREADY_CLOSED"
  | "EMAIL_NOT_VERIFIED"
  | "EMAIL_ALREADY_VERIFIED"
  | "EMAIL_VERIFICATION_NOT_FOUND"
  | "EMAIL_VERIFICATION_EXPIRED"
  | "EMAIL_VERIFICATION_INVALID_CODE"
  | "EMAIL_VERIFICATION_MAX_ATTEMPTS_EXCEEDED"
  | "TOO_MANY_VERIFICATION_REQUESTS"
  | "WORKSPACE_NOT_FOUND"
  | "FORBIDDEN_WORKSPACE_ACTION"
  | "MEMBER_ALREADY_EXISTS"
  | "MEMBER_NOT_FOUND"
  | "LAST_OWNER_CANNOT_BE_REMOVED"
  | "WORKSPACE_NOT_EMPTY"
  | "INVITATION_NOT_FOUND"
  | "INVITATION_ALREADY_PROCESSED"
  | "INVITATION_EXPIRED"
  | "INVITATION_EMAIL_MISMATCH"
  | "PROJECT_NOT_FOUND"
  | "TASK_NOT_FOUND"
  | "ATTACHMENT_NOT_FOUND"
  | "SUBTASK_PROJECT_MISMATCH"
  | "TASK_HAS_PENDING_SUBTASKS"
  | "SECTION_NOT_FOUND"
  | "SECTION_PROJECT_MISMATCH"
  | "DEFAULT_SECTION_NOT_DELETABLE"
  | "SECTION_NOT_EMPTY"
  | "ASSIGNEE_NOT_PROJECT_MEMBER"
  | "CUSTOM_FIELD_NOT_FOUND"
  | "CUSTOM_FIELD_VALUE_INVALID"
  | "SYNC_VERSION_CONFLICT"
  | "CLIENT_NOT_FOUND"
  | "CANNOT_MODIFY_OWN_ACCOUNT"
  | "COMMENT_NOT_FOUND"
  | "COMMENT_CONTENT_INVALID"
  | "COMMENT_AUTHOR_MISMATCH"
  | "INVALID_ANALYTICS_QUERY";

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

export const DEFAULT_PAGE_SIZE = 20;
export const MAX_PAGE_SIZE = 100;

export interface PaginationParams {
  page?: number;
  limit?: number;
}

export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface PaginatedResult<T> {
  data: T[];
  meta: PaginationMeta;
}

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
