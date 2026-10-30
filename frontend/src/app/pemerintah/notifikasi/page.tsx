import type { Metadata } from "next";
import { NotificationCenter } from "@/components/notifications/notification-center";

export const metadata: Metadata = {
  title: "Notifikasi · Admin Pusat",
};

export default function PemerintahNotifikasiPage() {
  return <NotificationCenter role="pemerintah" />;
}
