import type { Metadata } from "next";
import { AuthCard } from "@/components/auth-card";
import { AuthLink } from "@/components/auth-link";
import { RegisterForm } from "@/components/auth/register-form";
import { GoogleButton } from "@/components/google-button";

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
      <RegisterForm />
    </AuthCard>
  );
}
