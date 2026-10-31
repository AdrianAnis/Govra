import { forbidden, redirect } from "next/navigation";
import type { ReactNode } from "react";
import { PanelShell } from "@/components/layout/panel-shell";
import { getSessionUser } from "@/lib/data/session";
import { AGENCY_HOME, PEMERINTAH_HOME, REPORTER_HOME } from "@/lib/routes";
import { loginHref } from "@/lib/session";

export default async function DinasLayout({ children }: { children: ReactNode }) {
  const user = await getSessionUser();
  if (!user) {
    redirect(loginHref(AGENCY_HOME));
  }
  if (user.role === "pelapor") {
    redirect(REPORTER_HOME);
  }
  if (user.role === "admin") {
    redirect(PEMERINTAH_HOME);
  }
  if (user.role !== "dinas") {
    forbidden();
  }
  return (
    <PanelShell section="dinas" user={user}>
      {children}
    </PanelShell>
  );
}
