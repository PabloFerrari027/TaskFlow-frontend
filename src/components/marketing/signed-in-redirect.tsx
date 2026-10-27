"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth/auth-context";

// The public landing ("Entrar / Criar conta grátis") is for visitors: someone
// already signed in who lands on "/" (a bookmark, the 404 page, the logo) goes
// straight to their Início instead.
export function SignedInRedirect() {
  const { isAuthenticated } = useAuth();
  const router = useRouter();

  React.useEffect(() => {
    if (isAuthenticated) router.replace("/home");
  }, [isAuthenticated, router]);

  return null;
}
