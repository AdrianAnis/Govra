import type { Metadata } from "next";
import { cookies } from "next/headers";
import Link from "next/link";
import { redirect } from "next/navigation";
import { AuthCard } from "@/components/auth-card";
import { VerifyForm } from "@/components/auth/verify-form";
import { buttonVariants } from "@/components/ui/button";
import { CODE_LENGTH, CODE_MINUTES, maskEmail, parsePending, PENDING_COOKIE } from "@/lib/auth-flow";
import { DEMO_CODE } from "@/lib/mock-guard";
import { cn } from "@/lib/utils";

export const metadata: Metadata = { title: "Verifikasi Email" };

export default async function VerifyPage() {
  const jar = await cookies();
  const pending = parsePending(jar.get(PENDING_COOKIE)?.value);
  if (!pending) {
    redirect("/daftar");
  }
  const reset = pending.purpose === "reset";
  const demo = process.env.NODE_ENV !== "production";

  return (
    <AuthCard
      title="Masukkan Kode"
      description={`Kami mengirim kode ${CODE_LENGTH} digit ke ${maskEmail(pending.email)}.`}
      alternate={
        <Link
          href={reset ? "/lupa-sandi" : "/daftar"}
          className={cn(buttonVariants({ variant: "outline", size: "lg" }))}
        >
          Ubah email
        </Link>
      }
      note={<p>Kode berlaku {CODE_MINUTES} menit. Periksa juga folder spam.</p>}
    >
      <VerifyForm demoCode={demo ? DEMO_CODE : null} />
    </AuthCard>
  );
}
