import "@/lib/zod-config";
import { z } from "zod";
import { jsonInit, request } from "@/lib/http";

const okSchema = z.object({ ok: z.literal(true), message: z.string().optional() });
const nextSchema = z.object({ next: z.string() });

interface SignupInput {
  nama: string;
  email: string;
  telepon: string;
  password: string;
  setuju: true;
}

export function signUp(input: SignupInput) {
  return request("/api/auth/daftar", jsonInit(input), okSchema);
}

export function submitGooglePhone(telepon: string) {
  return request("/api/auth/google/telepon", jsonInit({ telepon }), nextSchema);
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

export function resetPassword(password: string, email?: string, token?: string, code?: string) {
  return request("/api/auth/atur-ulang", jsonInit({ password, email, token, code }), nextSchema);
}

export function deleteAccount() {
  return request("/api/me", { method: "DELETE" }, okSchema);
}

export interface UpdateProfileInput {
  displayName: string;
  phone?: string;
  avatarUrl?: string;
  nik?: string;
  address?: string;
  district?: string;
  village?: string;
  bio?: string;
}

const profileUpdateResultSchema = z.object({
  ok: z.literal(true),
  profile: z.record(z.string(), z.unknown()).optional(),
});

export function updateProfile(input: UpdateProfileInput) {
  return request(
    "/api/me",
    {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(input),
    },
    profileUpdateResultSchema,
  );
}
