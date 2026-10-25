import "@/lib/zod-config";
import { z } from "zod";
import { jsonInit, request } from "@/lib/http";

const okSchema = z.object({ ok: z.literal(true) });
const nextSchema = z.object({ next: z.string() });

interface SignupInput {
  nama: string;
  email: string;
  password: string;
  setuju: true;
}

export function signUp(input: SignupInput) {
  return request("/api/auth/daftar", jsonInit(input), okSchema);
}

export function requestReset(email: string) {
  return request("/api/auth/lupa-sandi", jsonInit({ email }), okSchema);
}

export function verifyCode(kode: string) {
  return request("/api/auth/verifikasi", jsonInit({ kode }), nextSchema);
}

export function resendCode() {
  return request("/api/auth/kirim-ulang", { method: "POST" }, okSchema);
}

export function resetPassword(password: string) {
  return request("/api/auth/atur-ulang", jsonInit({ password }), nextSchema);
}

export function deleteAccount() {
  return request("/api/me", { method: "DELETE" }, okSchema);
}
