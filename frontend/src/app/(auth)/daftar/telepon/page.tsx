import type { Metadata } from "next";
import { cookies } from "next/headers";
import Link from "next/link";
import { redirect } from "next/navigation";
import { AuthCard } from "@/components/auth-card";
import { PhoneForm } from "@/components/auth/phone-form";
import { buttonVariants } from "@/components/ui/button";
import { GOOGLE_PENDING_COOKIE, readGooglePending } from "@/lib/google-pending";
import { cn } from "@/lib/utils";

export const metadata: Metadata = { title: "Nomor Telepon" };

export default async function GooglePhonePage() {
  const jar = await cookies();
  const pending = await readGooglePending(jar.get(GOOGLE_PENDING_COOKIE)?.value);
  if (!pending) {
    redirect("/daftar");
  }

  return (
    <AuthCard
      title="Satu Langkah Lagi"
      description={`Akun Google ${pending.email} hampir siap. Masukkan nomor telepon Anda untuk menyelesaikan pendaftaran.`}
      alternate={
        <Link href="/daftar" className={cn(buttonVariants({ variant: "outline", size: "lg" }))}>
          Gunakan akun lain
        </Link>
      }
      note={<p>Nomor ini hanya dipakai untuk mengirim notifikasi progres laporan Anda lewat WhatsApp.</p>}
    >
      <PhoneForm />
    </AuthCard>
  );
}
