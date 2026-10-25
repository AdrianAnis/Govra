import "@/lib/zod-config";
import { z } from "zod";

export const CODE_LENGTH = 6;
export const CODE_MINUTES = 10;
export const RESEND_SECONDS = 60;
export const PASSWORD_MIN = 12;
export const PENDING_COOKIE = "govra_pending";
export const RESET_COOKIE = "govra_reset";
export const PENDING_MAX_AGE_SECONDS = CODE_MINUTES * 60;

export type Purpose = "daftar" | "reset";

const PURPOSES: readonly string[] = ["daftar", "reset"];

function isPurpose(value: string): value is Purpose {
  return PURPOSES.includes(value);
}

export function pendingValue(purpose: Purpose, email: string): string {
  return `${purpose}:${encodeURIComponent(email)}`;
}

export function parsePending(value: string | undefined): { purpose: Purpose; email: string } | null {
  if (!value) {
    return null;
  }
  const separator = value.indexOf(":");
  const purpose = value.slice(0, separator);
  const email = decodeURIComponent(value.slice(separator + 1));
  return separator > 0 && isPurpose(purpose) && email ? { purpose, email } : null;
}

export function maskEmail(email: string): string {
  const [name = "", domain = ""] = email.split("@");
  return `${name.charAt(0)}***@${domain}`;
}

const emailField = z.email("Alamat email tidak valid.");
const passwordField = z
  .string()
  .min(PASSWORD_MIN, `Kata sandi minimal ${PASSWORD_MIN} karakter.`)
  .max(128, "Kata sandi terlalu panjang.");

export const signupSchema = z.object({
  nama: z.string().trim().min(2, "Isi nama lengkap Anda.").max(100, "Nama terlalu panjang."),
  email: emailField,
  password: passwordField,
  setuju: z.literal(true, "Setujui Kebijakan Privasi untuk melanjutkan."),
});

export const emailSchema = z.object({ email: emailField });

export const codeSchema = z.object({
  kode: z.string().regex(new RegExp(`^\\d{${CODE_LENGTH}}$`), `Masukkan ${CODE_LENGTH} digit kode.`),
});

export const resetSchema = z.object({ password: passwordField });
