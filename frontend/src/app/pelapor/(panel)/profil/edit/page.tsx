import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { Container } from "@/components/layout/container";
import { PageHeader } from "@/components/page-header";
import { EditProfileForm } from "@/components/profile/edit-profile-form";
import { getSessionUser } from "@/lib/data/session";
import { PROFILE } from "@/lib/routes";
import { loginHref } from "@/lib/session";

export const metadata: Metadata = {
  title: "Ubah Profil",
};

export default async function EditProfilePage() {
  const user = await getSessionUser();
  if (!user) {
    redirect(loginHref(PROFILE));
  }

  return (
    <Container className="flex flex-col gap-8 py-8 sm:py-10">
      <PageHeader
        title="Ubah Profil Warga"
        description="Perbarui identitas pribadi, nomor kontak WhatsApp untuk notifikasi laporan, dan data domisili kependudukan Anda."
      />
      <EditProfileForm user={user} />
    </Container>
  );
}
