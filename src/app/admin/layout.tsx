import { AdminShell } from "@/components/layout/admin-shell";
import { getCurrentUser } from "@/lib/auth";
import { redirect } from "next/navigation";
import type { ReactNode } from "react";

export const dynamic = "force-dynamic";

export default async function AdminLayout({ children }: { children: ReactNode }) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  return <AdminShell user={user}>{children}</AdminShell>;
}
