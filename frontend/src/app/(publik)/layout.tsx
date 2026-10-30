import { LazyChatWidget } from "@/components/chat/lazy-chat-widget";
import { SiteFooter } from "@/components/layout/site-footer";
import { SiteHeader } from "@/components/layout/site-header";
import { listNotifications } from "@/lib/data/notifications";
import { getSessionUser } from "@/lib/data/session";

export default async function PublicLayout({ children }: LayoutProps<"/">) {
  const user = await getSessionUser();
  const notifications = user?.role === "pelapor" ? await listNotifications() : [];

  return (
    <>
      <SiteHeader user={user} notifications={notifications} />
      <main id="konten" tabIndex={-1} className="outline-none flex-1 max-w-full overflow-x-clip">
        {children}
      </main>
      {!user && <SiteFooter />}
      <LazyChatWidget signedIn={user?.role === "pelapor"} />
    </>
  );
}
