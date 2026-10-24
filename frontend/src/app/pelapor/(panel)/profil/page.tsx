import type { Metadata } from "next";
import { Container } from "@/components/layout/container";
import { PageHeader } from "@/components/page-header";
import { ChangePasswordButton } from "@/components/profile/change-password-button";
import { DeleteAccount } from "@/components/profile/delete-account";
import { buttonVariants } from "@/components/ui/button";
import { listMyReports } from "@/lib/data/reports";
import { getSessionUser } from "@/lib/data/session";
import { formatNumber } from "@/lib/format";
import { cn } from "@/lib/utils";

export const metadata: Metadata = { title: "Profil" };

export default async function ProfilePage() {
  const [user, reports] = await Promise.all([getSessionUser(), listMyReports({ page: 1, limit: 1 })]);
  if (!user) {
    return null;
  }

  return (
    <Container className="flex flex-col gap-10 py-10">
      <PageHeader title="Profil" description="Kelola akun dan data Anda." />
      <div className="flex flex-wrap items-center gap-5">
        <span className="grid size-20 place-items-center rounded-full bg-secondary text-2xl font-bold text-secondary-fg">
          {user.initials}
        </span>
        <div className="flex flex-col gap-1">
          <p className="text-2xl font-bold tracking-tight">{user.name}</p>
          <p className="text-fg-muted">{user.email}</p>
          <p className="text-sm text-fg-muted">
            Pelapor · {formatNumber(reports.total)} laporan dikirim
          </p>
        </div>
      </div>
      <ul className="flex flex-col divide-y rounded-lg border">
        <li className="flex flex-col gap-4 p-6 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex max-w-prose flex-col gap-1">
            <h2 className="text-lg font-semibold">Kata sandi</h2>
            <p className="text-fg-muted">Kami kirim kode 6 digit ke email Anda sebelum kata sandi bisa diubah.</p>
          </div>
          <ChangePasswordButton email={user.email} />
        </li>
        <li className="flex flex-col gap-4 p-6 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex max-w-prose flex-col gap-1">
            <h2 className="text-lg font-semibold">Unduh data saya</h2>
            <p className="text-fg-muted">Salinan profil dan semua laporan Anda dalam format JSON.</p>
          </div>
          <a href="/api/me/export" download className={cn(buttonVariants({ variant: "outline" }))}>
            Unduh data
          </a>
        </li>
        <li className="flex flex-col gap-4 p-6 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex max-w-prose flex-col gap-1">
            <h2 className="text-lg font-semibold">Hapus akun</h2>
            <p className="text-fg-muted">
              Laporan Anda tetap tersimpan tanpa identitas agar riwayat penanganan isu tetap utuh.
            </p>
          </div>
          <DeleteAccount />
        </li>
      </ul>
    </Container>
  );
}
