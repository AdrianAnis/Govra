import type { Metadata } from "next";
import { cookies } from "next/headers";
import Link from "next/link";
import { redirect } from "next/navigation";
import { AuthCard } from "@/components/auth-card";
import { VerifyForm } from "@/components/auth/verify-form";
import { buttonVariants } from "@/components/ui/button";
import { CODE_LENGTH, CODE_MINUTES, parsePending, PENDING_COOKIE } from "@/lib/auth-flow";
import { cn } from "@/lib/utils";

export const metadata: Metadata = { title: "Verifikasi Email" };

export default async function VerifyPage() {
  const jar = await cookies();
  const pending = parsePending(jar.get(PENDING_COOKIE)?.value);
  const email = jar.get("govra_pending_email")?.value || pending?.email;
  if (!email) {
    redirect("/daftar");
  }
  const reset = pending?.purpose === "reset";

  return (
    <AuthCard
      title="Verifikasi Email"
      description={`Kami mengirim kode verifikasi ${CODE_LENGTH} digit ke ${email}.`}
      alternate={
        <Link
          href={reset ? "/lupa-sandi" : "/daftar"}
          className={cn(buttonVariants({ variant: "outline", size: "lg" }))}
        >
          Ubah email
        </Link>
      }
      note={<p>Kode berlaku selama {CODE_MINUTES} menit. Silakan periksa kotak masuk (inbox) atau folder spam email Anda.</p>}
    >
      <VerifyForm demoCode={null} />
    </AuthCard>
  );
}
