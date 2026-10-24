import type { Metadata } from "next";
import { cookies } from "next/headers";
import Link from "next/link";
import { redirect } from "next/navigation";
import { AuthCard } from "@/components/auth-card";
import { ResetForm } from "@/components/auth/reset-form";
import { buttonVariants } from "@/components/ui/button";
import { RESET_COOKIE } from "@/lib/auth-flow";
import { cn } from "@/lib/utils";

export const metadata: Metadata = { title: "Atur Kata Sandi Baru" };

export default async function ResetPasswordPage() {
  const jar = await cookies();
  if (!jar.has(RESET_COOKIE)) {
    redirect("/lupa-sandi");
  }

  return (
    <AuthCard
      title="Kata Sandi Baru"
      description="Buat kata sandi baru untuk akun Anda."
      alternate={
        <Link href="/masuk" className={cn(buttonVariants({ variant: "outline", size: "lg" }))}>
          Kembali ke halaman masuk
        </Link>
      }
      note={<p>Gunakan kata sandi yang belum pernah Anda pakai di tempat lain.</p>}
    >
      <ResetForm />
    </AuthCard>
  );
}
