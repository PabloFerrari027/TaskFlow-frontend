import { Suspense } from "react";
import type { Metadata } from "next";
import { ResetPasswordPageContent } from "@/features/auth/components/reset-password-page-content";

export const metadata: Metadata = {
  title: "Redefinir senha",
  // The URL carries a single-use secret; don't let it leak via the Referer header.
  referrer: "no-referrer",
};

export default function ResetPasswordPage() {
  return (
    <Suspense>
      <ResetPasswordPageContent />
    </Suspense>
  );
}
