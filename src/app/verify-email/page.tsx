import { Suspense } from "react";
import type { Metadata } from "next";
import { VerifyEmailPageContent } from "@/features/auth/components/verify-email-page-content";

export const metadata: Metadata = { title: "Confirmar e-mail" };

export default function VerifyEmailPage() {
  return (
    <Suspense>
      <VerifyEmailPageContent />
    </Suspense>
  );
}
