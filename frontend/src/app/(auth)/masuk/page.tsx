import type { Metadata } from "next";
import { AuthCard } from "@/components/auth-card";
import { AuthLink } from "@/components/auth-link";
import { FormField } from "@/components/form-field";
import { GoogleButton } from "@/components/google-button";
import { PasswordField } from "@/components/password-field";
import { Button } from "@/components/ui/button";
import { safeNext } from "@/lib/session";

export const metadata: Metadata = { title: "Masuk" };

export default async function LoginPage({ searchParams }: PageProps<"/masuk">) {
  const raw = (await searchParams).lanjut;
  const next = safeNext(Array.isArray(raw) ? raw[0] : raw);

  return (
    <AuthCard
      title="Selamat Datang"
      description="Masuk untuk melanjutkan ke akun Anda."
      alternate={<GoogleButton />}
      note={
        <p>
          Belum memiliki akun? <AuthLink href="/daftar">Daftar Sekarang</AuthLink>
        </p>
      }
    >
      <form
        className="flex flex-col gap-4"
        action="/api/auth/masuk"
        method="post"
      >
        <input type="hidden" name="lanjut" value={next} />
        <FormField
          id="email"
          name="email"
          type="email"
          label="Alamat Email"
          autoComplete="email"
        />
        <PasswordField
          id="password"
          name="password"
          label="Kata Sandi"
          autoComplete="current-password"
        />
        <div className="text-right text-sm">
          <AuthLink href="/lupa-sandi" className="font-medium text-fg-muted no-underline hover:underline">
            Lupa Kata Sandi?
          </AuthLink>
        </div>
        <Button type="submit" size="lg">
          Masuk
        </Button>
      </form>
    </AuthCard>
  );
}
