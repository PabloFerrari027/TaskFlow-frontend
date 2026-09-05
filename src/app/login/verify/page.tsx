import { Suspense } from "react";
import type { Metadata } from "next";
import { VerifyPageContent } from "@/features/auth/components/verify-page-content";

export const metadata: Metadata = { title: "Verificar código" };

export default function VerifyPage() {
  return (
    <Suspense>
      <VerifyPageContent />
    </Suspense>
  );
}
