import * as React from "react";

interface RoleGateProps {
  allowed: boolean;
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

export function RoleGate({ allowed, children, fallback = null }: RoleGateProps) {
  return allowed ? <>{children}</> : <>{fallback}</>;
}
