import type { Metadata } from "next";
import { AuthCard } from "@/components/auth-card";
import { AuthLink } from "@/components/auth-link";
import { RegisterForm } from "@/components/auth/register-form";
import { GoogleButton } from "@/components/google-button";
import { safeNext } from "@/lib/session";

export const metadata: Metadata = { title: "Daftar" };

interface RegisterPageProps {
  searchParams?: Promise<{ lanjut?: string | string[] }>;
}

export default async function RegisterPage({ searchParams }: RegisterPageProps) {
  const params = searchParams ? await searchParams : {};
  const raw = params.lanjut;
  const next = safeNext(Array.isArray(raw) ? raw[0] : raw);

  return (
    <AuthCard
      title="Buat Akun"
      description="Daftar untuk melapor dan melacak laporan Anda."
      alternate={<GoogleButton lanjut={next} />}
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
