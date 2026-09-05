"use client";

import * as React from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/lib/auth/auth-context";
import { getSafeRedirectPath } from "@/lib/safe-redirect";

export function RequireGuest({ children }: { children: React.ReactNode }) {
  const { isLoading, isAuthenticated } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();

  React.useEffect(() => {
    if (!isLoading && isAuthenticated) {
      router.replace(getSafeRedirectPath(searchParams.get("next")));
    }
  }, [isLoading, isAuthenticated, router, searchParams]);

  if (isLoading || isAuthenticated) {
    return null;
  }

  return <>{children}</>;
}
