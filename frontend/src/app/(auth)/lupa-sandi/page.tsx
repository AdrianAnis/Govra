import type { Metadata } from "next";
import Link from "next/link";
import { AuthCard } from "@/components/auth-card";
import { ForgotForm } from "@/components/auth/forgot-form";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export const metadata: Metadata = { title: "Lupa Kata Sandi" };

export default function ForgotPasswordPage() {
  return (
    <AuthCard
      title="Lupa Kata Sandi"
      description="Masukkan alamat email akun Anda. Kami akan mengirimkan tautan untuk mengatur ulang kata sandi Anda."
      alternate={
        <Link href="/masuk" className={cn(buttonVariants({ variant: "outline", size: "lg" }))}>
          Kembali ke halaman masuk
        </Link>
      }
      note={<p>Tautan berlaku selama 1 jam. Silakan periksa inbox atau spam.</p>}
    >
      <ForgotForm />
    </AuthCard>
  );
}
