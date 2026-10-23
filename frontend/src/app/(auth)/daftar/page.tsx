import type { Metadata } from "next";
import { AuthCard } from "@/components/auth-card";
import { AuthLink } from "@/components/auth-link";
import { ConsentField } from "@/components/consent-field";
import { FormField } from "@/components/form-field";
import { GoogleButton } from "@/components/google-button";
import { PasswordField } from "@/components/password-field";
import { Button } from "@/components/ui/button";

export const metadata: Metadata = { title: "Daftar" };

export default function RegisterPage() {
  return (
    <AuthCard
      title="Buat Akun"
      description="Daftar untuk melapor dan melacak laporan Anda."
      alternate={<GoogleButton />}
      note={
        <p>
          Sudah memiliki akun? <AuthLink href="/masuk">Masuk</AuthLink>
        </p>
      }
    >
      <form className="flex flex-col gap-4">
        <FormField
          id="nama"
          name="nama"
          label="Nama Lengkap"
          autoComplete="name"
        />
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
          autoComplete="new-password"
          hint="Minimal 12 karakter."
        />
        <ConsentField />
        <Button type="button" size="lg">
          Daftar
        </Button>
      </form>
    </AuthCard>
  );
}
