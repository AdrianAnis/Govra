import type { Metadata } from "next";
import Link from "next/link";
import { AuthCard } from "@/components/auth-card";
import { ResetForm } from "@/components/auth/reset-form";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export const metadata: Metadata = { title: "Atur Kata Sandi Baru" };

interface ResetPageProps {
  searchParams: Promise<{ token?: string; email?: string }>;
}

export default async function ResetPasswordPage({ searchParams }: ResetPageProps) {
  const params = await searchParams;
  const token = params.token || "";
  const email = params.email || "";

  return (
    <AuthCard
      title="Kata Sandi Baru"
      description="Buat kata sandi baru untuk akun Govra Anda."
      alternate={
        <Link href="/masuk" className={cn(buttonVariants({ variant: "outline", size: "lg" }))}>
          Kembali ke halaman masuk
        </Link>
      }
      note={<p>Gunakan minimal 8 karakter dengan kombinasi huruf dan angka.</p>}
    >
      <ResetForm token={token} email={email} />
    </AuthCard>
  );
}
