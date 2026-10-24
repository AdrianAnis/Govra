import type { Metadata } from "next";
import Link from "next/link";
import { AuthCard } from "@/components/auth-card";
import { ForgotForm } from "@/components/auth/forgot-form";
import { buttonVariants } from "@/components/ui/button";
import { CODE_LENGTH, CODE_MINUTES } from "@/lib/auth-flow";
import { cn } from "@/lib/utils";

export const metadata: Metadata = { title: "Lupa Kata Sandi" };

export default function ForgotPasswordPage() {
  return (
    <AuthCard
      title="Lupa Kata Sandi"
      description={`Masukkan email akun Anda. Kami kirim kode ${CODE_LENGTH} digit untuk mengatur ulang kata sandi.`}
      alternate={
        <Link href="/masuk" className={cn(buttonVariants({ variant: "outline", size: "lg" }))}>
          Kembali ke halaman masuk
        </Link>
      }
      note={<p>Kode berlaku {CODE_MINUTES} menit.</p>}
    >
      <ForgotForm />
    </AuthCard>
  );
}
