import { Suspense } from "react";
import type { Metadata } from "next";
import { ForgotPasswordPageContent } from "@/features/auth/components/forgot-password-page-content";

export const metadata: Metadata = { title: "Esqueci minha senha" };

export default function ForgotPasswordPage() {
  return (
    <Suspense>
      <ForgotPasswordPageContent />
    </Suspense>
  );
}
