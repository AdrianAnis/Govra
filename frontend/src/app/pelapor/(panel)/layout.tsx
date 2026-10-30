import { forbidden, redirect } from "next/navigation";
import type { ReactNode } from "react";
import { LazyChatWidget } from "@/components/chat/lazy-chat-widget";
import { SiteHeader } from "@/components/layout/site-header";
import { listNotifications } from "@/lib/data/notifications";
import { getSessionUser } from "@/lib/data/session";
import { AGENCY_HOME, PEMERINTAH_HOME, REPORTER_HOME } from "@/lib/routes";
import { loginHref } from "@/lib/session";

export default async function ReporterLayout({ children }: { children: ReactNode }) {
  const user = await getSessionUser();
  if (!user) {
    redirect(loginHref(REPORTER_HOME));
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
  const notifications = await listNotifications();

  return (
    <>
      <SiteHeader user={user} notifications={notifications} />
      <main id="konten" tabIndex={-1} className="outline-none flex-1">
        {children}
      </main>
      <LazyChatWidget signedIn />
    </>
  );
}
