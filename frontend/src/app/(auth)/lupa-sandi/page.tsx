import type { Metadata } from "next";
import Link from "next/link";
import { AuthCard } from "@/components/auth-card";
import { FormField } from "@/components/form-field";
import { Button, buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export const metadata: Metadata = { title: "Lupa Kata Sandi" };

export default function ForgotPasswordPage() {
  return (
    <AuthCard
      title="Lupa Kata Sandi"
      description="Masukkan email akun Anda. Kami kirim tautan untuk mengatur ulang kata sandi."
      alternate={
        <Link
          href="/masuk"
          className={cn(buttonVariants({ variant: "outline", size: "lg" }))}
        >
          Kembali ke halaman masuk
        </Link>
      }
      note={<p>Tautan hanya berlaku beberapa menit.</p>}
    >
      <form className="flex flex-col gap-4">
        <FormField
          id="email"
          name="email"
          type="email"
          label="Alamat Email"
          autoComplete="email"
        />
        <Button type="button" size="lg">
          Kirim Tautan
        </Button>
      </form>
    </AuthCard>
  );
}
