import type { Metadata } from "next";
import { NotificationCenter } from "@/components/notifications/notification-center";

export const metadata: Metadata = {
  title: "Notifikasi · Dinas",
};

export default function DinasNotifikasiPage() {
  return <NotificationCenter role="dinas" />;
}
