import type { ReactNode } from "react";
import { SiteHeader } from "@/components/layout/site-header";
import { listNotifications } from "@/lib/data/notifications";
import { getSessionUser } from "@/lib/data/session";

export default async function ReporterLayout({ children }: { children: ReactNode }) {
  const user = await getSessionUser();
  const notifications = user ? await listNotifications() : [];

  return (
    <>
      <SiteHeader user={user} notifications={notifications} />
      <main id="konten" className="flex-1">
        {children}
      </main>
    </>
  );
}
