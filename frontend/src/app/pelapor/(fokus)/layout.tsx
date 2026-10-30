import { forbidden, redirect } from "next/navigation";
import type { ReactNode } from "react";
import { getSessionUser } from "@/lib/data/session";
import { AGENCY_HOME, PEMERINTAH_HOME, REPORT_NEW } from "@/lib/routes";
import { loginHref } from "@/lib/session";

export default async function ReporterFocusLayout({ children }: { children: ReactNode }) {
  const user = await getSessionUser();
  if (!user) {
    redirect(loginHref(REPORT_NEW));
  }
  if (user.role === "dinas") {
    redirect(AGENCY_HOME);
  }
  if (user.role === "admin" || user.role === "kepala_daerah") {
    redirect(PEMERINTAH_HOME);
  }
  if (user.role !== "pelapor") {
    forbidden();
  }
  return <>{children}</>;
}
