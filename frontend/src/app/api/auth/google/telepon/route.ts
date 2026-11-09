import { cookies } from "next/headers";
import { errorResponse } from "@/lib/api-response";
import { teleponSchema } from "@/lib/auth-flow";
import { authGuard, invalid, readJson } from "@/lib/auth-route";
import { GOOGLE_PENDING_COOKIE, readGooglePending } from "@/lib/google-pending";
import { getSafeRedirect, SESSION_COOKIE } from "@/lib/session";
import { signProfile, signValue } from "@/lib/session-sign";

const BFF_KEY = process.env.BFF_SHARED_KEY || "";
const CONFLICT_STATUS = 409;
const EXPIRED_STATUS = 401;
const SERVER_ERROR_STATUS = 500;

const COOKIE_BASE = {
  httpOnly: true,
  sameSite: "lax",
  path: "/",
  secure: process.env.NODE_ENV === "production",
} as const;

export async function POST(request: Request) {
  const blocked = authGuard(request);
  if (blocked) {
    return blocked;
  }
  const parsed = teleponSchema.safeParse(await readJson(request));
  if (!parsed.success) {
    return invalid(parsed.error.issues[0]?.message);
  }

  const jar = await cookies();
  const pending = await readGooglePending(jar.get(GOOGLE_PENDING_COOKIE)?.value);
  if (!pending) {
    return errorResponse(
      "SESSION_EXPIRED",
      "Sesi pendaftaran Google sudah berakhir. Silakan mulai lagi dari tombol Google.",
      EXPIRED_STATUS,
    );
  }

  const apiBase = process.env.API_BASE_URL || "http://localhost:8080";
  try {
    const res = await fetch(`${apiBase}/auth/oauth-login`, {
      method: "POST",
      headers: { "Content-Type": "application/json", "X-BFF-Key": BFF_KEY },
      body: JSON.stringify({
        email: pending.email,
        display_name: pending.name,
        avatar_url: pending.avatar,
        phone: parsed.data.telepon,
        provider: "google",
        mode: "daftar",
      }),
    });

    if (!res.ok) {
      const failure = await res.json().catch(() => ({}));
      if (failure.code === "INVALID_PHONE") {
        return invalid(String(failure.message));
      }
      if (String(failure.message || "").toLowerCase().includes("sudah terdaftar")) {
        return errorResponse("ALREADY_REGISTERED", "Email ini sudah terdaftar. Silakan masuk.", CONFLICT_STATUS);
      }
      return errorResponse("REGISTER_FAILED", "Pendaftaran gagal. Silakan coba lagi.", res.status);
    }

    const data = await res.json();
    jar.set(SESSION_COOKIE, await signValue("pelapor"), COOKIE_BASE);
    jar.set("govra_token", String(data.token), COOKIE_BASE);
    jar.set("govra_profile", await signProfile(data.profile), COOKIE_BASE);
    jar.delete(GOOGLE_PENDING_COOKIE);
    return Response.json({ next: getSafeRedirect("pelapor", pending.lanjut) });
  } catch {
    return errorResponse("SERVER_ERROR", "Gagal menghubungi server autentikasi.", SERVER_ERROR_STATUS);
  }
}
