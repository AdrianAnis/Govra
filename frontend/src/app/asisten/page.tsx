import type { Metadata } from "next";
import { AssistantPageView } from "@/components/chat/assistant-page-view";
import { getSessionUser } from "@/lib/data/session";

export const metadata: Metadata = {
  title: "Tanya Govra AI — Asisten Cerdas Transparansi Kota",
  description:
    "Asisten cerdas 24/7 untuk pengecekan status tiket pengaduan warga, transparansi program kerja pemda, anggaran, dan isu darurat kota.",
};

export default async function AssistantPage() {
  const user = await getSessionUser();
  const signedIn = user?.role === "pelapor";

  return <AssistantPageView signedIn={signedIn} userName={user?.name ?? undefined} />;
}
