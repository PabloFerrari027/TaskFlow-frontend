/**
 * Only ever redirect to a same-origin relative path. `next` query params are
 * attacker-controlled (crafted links), and Next.js's router.push/replace
 * explicitly warn against passing unsanitized URLs to them — a bare
 * "https://evil.example" would open-redirect after a legitimate login, and a
 * "javascript:" value can execute as XSS. Rejects protocol-relative ("//")
 * and backslash ("/\") variants too, since browsers treat both as absolute.
 */
export function getSafeRedirectPath(
  next: string | null | undefined,
  fallback = "/dashboard"
): string {
  if (!next) return fallback;
  if (!next.startsWith("/") || next.startsWith("//") || next.startsWith("/\\")) {
    return fallback;
  }
  return next;
}
