import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { SkipLink } from "@/components/layout/skip-link";
import { NotificationsProvider } from "@/lib/notifications-context";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Govra",
  description:
    "Platform transparansi program kerja pemerintah daerah dan pelaporan warga berbasis AI.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="id" className={`${inter.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col max-w-full overflow-x-clip">
        <SkipLink />
        <NotificationsProvider>{children}</NotificationsProvider>
      </body>
    </html>
  );
}
