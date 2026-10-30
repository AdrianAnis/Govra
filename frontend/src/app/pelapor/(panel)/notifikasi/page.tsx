import type { Metadata } from "next";
import { NotificationCenter } from "@/components/notifications/notification-center";

export const metadata: Metadata = {
  title: "Notifikasi · Warga",
};

export default function PelaporNotifikasiPage() {
  return <NotificationCenter role="pelapor" />;
}
