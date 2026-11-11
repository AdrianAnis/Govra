import type { Metadata } from "next";
import Link from "next/link";
import { UserPen } from "lucide-react";
import { Container } from "@/components/layout/container";
import { PageHeader } from "@/components/page-header";
import { ChangePasswordButton } from "@/components/profile/change-password-button";
import { DeleteAccount } from "@/components/profile/delete-account";
import { buttonVariants } from "@/components/ui/button";
import { getSessionUser } from "@/lib/data/session";
import { PROFILE_EDIT } from "@/lib/routes";
import { cn } from "@/lib/utils";

export const metadata: Metadata = { title: "Profil" };

function maskNik(nik?: string | null): string {
  if (!nik || nik.length < 8) {
    return nik || "Belum diisi";
  }
  return `${nik.slice(0, 4)}********${nik.slice(-4)}`;
}

export default async function ProfilePage() {
  const user = await getSessionUser();
  if (!user) {
    return null;
  }

  return (
    <Container className="flex flex-col gap-10 py-10">
      <PageHeader title="Profil" description="Kelola akun dan data diri Anda." />

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 rounded-xl border border-border bg-surface p-6 sm:p-8">
        <div className="flex flex-wrap items-center gap-5">
          <div className="relative size-20 rounded-full border border-border bg-secondary flex items-center justify-center overflow-hidden shrink-0">
            {user.avatarUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={user.avatarUrl} alt={user.name} className="size-full object-cover" />
            ) : (
              <span className="text-2xl font-bold text-secondary-fg">{user.initials}</span>
            )}
          </div>
          <div className="flex flex-col gap-1">
            <div className="flex items-center gap-3">
              <p className="text-2xl font-bold tracking-tight text-fg">{user.name}</p>
              <span className="rounded-full border border-border px-2.5 py-0.5 text-xs font-medium text-fg-muted">
                Warga Terdaftar
              </span>
            </div>
            <p className="text-fg-muted">{user.email}</p>
          </div>
        </div>

        <Link
          href={PROFILE_EDIT}
          className={cn(buttonVariants({ variant: "outline" }), "gap-2 self-start sm:self-center")}
        >
          <UserPen className="size-4 text-fg" />
          <span>Ubah Profil</span>
        </Link>
      </div>

      <div className="rounded-xl border border-border bg-surface overflow-hidden">
        <div className="border-b border-border p-6">
          <h2 className="text-lg font-semibold text-fg">Informasi Kependudukan & Kontak</h2>
          <p className="text-sm text-fg-muted">Data lengkap warga yang terhubung dengan layanan pengaduan.</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 divide-y sm:divide-y-0 sm:divide-x border-b border-border">
          <div className="p-6 flex flex-col gap-1">
            <span className="text-xs font-semibold uppercase tracking-wider text-fg-muted">Nomor WhatsApp</span>
            <span className="text-base font-medium text-fg">{user.phone || "Belum diatur"}</span>
          </div>
          <div className="p-6 flex flex-col gap-1">
            <span className="text-xs font-semibold uppercase tracking-wider text-fg-muted">
              Nomor Induk Kependudukan (NIK)
            </span>
            <span className="text-base font-medium text-fg">{maskNik(user.nik)}</span>
          </div>
          <div className="p-6 flex flex-col gap-1">
            <span className="text-xs font-semibold uppercase tracking-wider text-fg-muted">Status Akun</span>
            <span className="text-base font-medium text-fg">Aktif</span>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 divide-y sm:divide-y-0 sm:divide-x border-b border-border">
          <div className="p-6 flex flex-col gap-1">
            <span className="text-xs font-semibold uppercase tracking-wider text-fg-muted">Kecamatan Domisili</span>
            <span className="text-base font-medium text-fg">{user.district || "Belum dipilih"}</span>
          </div>
          <div className="p-6 flex flex-col gap-1">
            <span className="text-xs font-semibold uppercase tracking-wider text-fg-muted">Kelurahan Domisili</span>
            <span className="text-base font-medium text-fg">{user.village || "Belum dipilih"}</span>
          </div>
        </div>

        <div className="p-6 flex flex-col gap-1 border-b border-border">
          <span className="text-xs font-semibold uppercase tracking-wider text-fg-muted">Alamat Lengkap</span>
          <span className="text-base text-fg">{user.address || "Belum diisi"}</span>
        </div>

        <div className="p-6 flex flex-col gap-1">
          <span className="text-xs font-semibold uppercase tracking-wider text-fg-muted">Bio / Catatan Warga</span>
          <span className="text-base text-fg">{user.bio || "Belum ada catatan."}</span>
        </div>
      </div>

      <div className="flex flex-col gap-4">
        <h2 className="text-xl font-semibold text-fg">Keamanan & Data Akun</h2>
        <ul className="flex flex-col divide-y rounded-xl border border-border bg-surface">
          <li className="flex flex-col gap-4 p-6 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex max-w-prose flex-col gap-1">
              <h3 className="text-base font-semibold text-fg">Kata sandi</h3>
              <p className="text-sm text-fg-muted">
                Kami kirim kode 6 digit ke email Anda sebelum kata sandi bisa diubah.
              </p>
            </div>
            <ChangePasswordButton email={user.email} />
          </li>
          <li className="flex flex-col gap-4 p-6 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex max-w-prose flex-col gap-1">
              <h3 className="text-base font-semibold text-fg">Hapus akun</h3>
              <p className="text-sm text-fg-muted">
                Laporan Anda tetap tersimpan tanpa identitas agar riwayat penanganan isu tetap utuh.
              </p>
            </div>
            <DeleteAccount />
          </li>
        </ul>
      </div>
    </Container>
  );
}
