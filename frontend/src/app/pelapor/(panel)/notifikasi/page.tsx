import type { Metadata } from "next";
import { Container } from "@/components/layout/container";
import { NotificationCenter } from "@/components/notifications/notification-center";

export const metadata: Metadata = {
  title: "Notifikasi · Warga",
};

export default function PelaporNotifikasiPage() {
  return (
    <Container className="py-8 sm:py-10">
      <NotificationCenter role="pelapor" />
    </Container>
  );
}
