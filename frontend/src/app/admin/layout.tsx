import { forbidden, redirect } from "next/navigation";
import type { ReactNode } from "react";
import { PanelShell } from "@/components/layout/panel-shell";
import { getSessionUser } from "@/lib/data/session";
import { ADMIN_HOME, AGENCY_HOME, REPORTER_HOME } from "@/lib/routes";
import { loginHref } from "@/lib/session";

export default async function AdminLayout({ children }: { children: ReactNode }) {
  const user = await getSessionUser();
  if (!user) {
    redirect(loginHref(ADMIN_HOME));
  }
  if (user.role === "dinas") {
    redirect(AGENCY_HOME);
  }
  if (user.role === "pelapor") {
    redirect(REPORTER_HOME);
  }
  if (user.role !== "admin") {
    forbidden();
  }
  return (
    <PanelShell section="admin" user={user}>
      {children}
    </PanelShell>
  );
}
