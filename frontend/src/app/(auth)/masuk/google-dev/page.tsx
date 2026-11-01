import type { Metadata } from "next";
import { AuthCard } from "@/components/auth-card";
import { AuthLink } from "@/components/auth-link";
import { FormField } from "@/components/form-field";
import { Button } from "@/components/ui/button";
import { safeNext } from "@/lib/session";

export const metadata: Metadata = { title: "Simulasi Masuk Google" };

interface GoogleDevPageProps {
  searchParams: Promise<{ lanjut?: string | string[] }>;
}

export default async function GoogleDevPage({ searchParams }: GoogleDevPageProps) {
  const params = await searchParams;
  const raw = params.lanjut;
  const next = safeNext(Array.isArray(raw) ? raw[0] : raw);

  const presets = [
    {
      name: "Budi Santoso",
      email: "budi.santoso@gmail.com",
      desc: "Warga / Pelapor Terdaftar",
    },
    {
      name: "Siti Aminah",
      email: "siti.aminah@gmail.com",
      desc: "Warga Baru (Registrasi Otomatis)",
    },
    {
      name: "Admin Pusat",
      email: "admin@kotacontoh.go.id",
      desc: "Uji Proteksi (Harus Ditolak)",
    },
  ];

  return (
    <AuthCard
      title="Akun Google"
      description="Pilih akun Google Anda untuk melanjutkan ke Govra."
      alternate={
        <div className="flex flex-col gap-2">
          <p className="text-xs font-semibold text-fg-muted uppercase tracking-wider">
            Pilih Cepat Akun Pengujian
          </p>
          <div className="flex flex-col gap-2">
            {presets.map((preset) => (
              <form key={preset.email} action="/api/auth/google/dev" method="post">
                <input type="hidden" name="lanjut" value={next} />
                <input type="hidden" name="email" value={preset.email} />
                <input type="hidden" name="display_name" value={preset.name} />
                <button
                  type="submit"
                  className="flex w-full items-center justify-between rounded-lg border border-border p-3 text-left transition hover:border-primary hover:bg-surface-elevated"
                >
                  <div className="flex items-center gap-3">
                    <span aria-hidden className="size-6 bg-google" />
                    <div>
                      <p className="text-sm font-semibold">{preset.name}</p>
                      <p className="text-xs text-fg-muted">{preset.email}</p>
                    </div>
                  </div>
                  <span className="text-xs text-fg-subtle">{preset.desc}</span>
                </button>
              </form>
            ))}
          </div>
        </div>
      }
      note={
        <p>
          Kembali ke halaman <AuthLink href="/masuk">Masuk Biasa</AuthLink>
        </p>
      }
    >
      <form
        className="flex flex-col gap-4"
        action="/api/auth/google/dev"
        method="post"
      >
        <input type="hidden" name="lanjut" value={next} />
        <FormField
          id="display_name"
          name="display_name"
          type="text"
          label="Nama Lengkap Google"
          required
        />
        <FormField
          id="email"
          name="email"
          type="email"
          label="Email Akun Google"
          autoComplete="email"
          required
        />
        <Button type="submit" size="lg">
          Lanjutkan dengan Akun Ini
        </Button>
      </form>
    </AuthCard>
  );
}
