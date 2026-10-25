import { ChatWidget } from "@/components/chat/chat-widget";
import { ScrollProgress } from "@/components/layout/scroll-progress";
import { SiteFooter } from "@/components/layout/site-footer";
import { SiteHeader } from "@/components/layout/site-header";
import { listNotifications } from "@/lib/data/notifications";
import { getSessionUser } from "@/lib/data/session";

export default async function PublicLayout({ children }: LayoutProps<"/">) {
  const user = await getSessionUser();
  const notifications = user?.role === "pelapor" ? await listNotifications() : [];

  return (
    <>
      <ScrollProgress />
      <SiteHeader user={user} notifications={notifications} />
      <main id="konten" className="flex-1">
        {children}
      </main>
      {!user && <SiteFooter />}
      <ChatWidget signedIn={user?.role === "pelapor"} />
    </>
  );
}
