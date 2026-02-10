import { ReactNode } from "react";
import { Redirect } from "wouter";
import { trpc } from "@/lib/trpc";

interface RequireAuthProps {
  children: ReactNode;
  requireAdmin?: boolean;
}

export function RequireAuth({ children, requireAdmin }: RequireAuthProps) {
  const { data: me, isLoading } = trpc.auth.me.useQuery();

  if (isLoading) {
    return null;
  }

  if (!me) {
    return <Redirect to="/login" />;
  }

  if (requireAdmin && me.role !== "admin") {
  return <Redirect to="/dashboard" />;
}

  return <>{children}</>;
}
