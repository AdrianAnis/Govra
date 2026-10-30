import { cookies } from "next/headers";
import { PENDING_COOKIE, pendingValue, signupSchema } from "@/lib/auth-flow";
import { COOKIE_OPTIONS, invalid, readJson } from "@/lib/auth-route";
import { errorResponse } from "@/lib/api-response";

const BFF_KEY = process.env.BFF_SHARED_KEY || "413016c9d4970e8030a87654f65c11321dd77c97ecf9f4d95d1beca837faddb2";

export async function POST(request: Request) {
  const parsed = signupSchema.safeParse(await readJson(request));
  if (!parsed.success) {
    return invalid(parsed.error.issues[0]?.message);
  }

  const apiBase = process.env.API_BASE_URL || "http://localhost:8080";
  try {
    const res = await fetch(`${apiBase}/auth/register`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-BFF-Key": BFF_KEY,
      },
      body: JSON.stringify({
        display_name: parsed.data.nama,
        email: parsed.data.email,
        password: parsed.data.password,
      }),
    });

    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      return errorResponse("REGISTER_FAILED", data.message || "Pendaftaran gagal", res.status);
    }

    const jar = await cookies();
    jar.set(PENDING_COOKIE, pendingValue("daftar", parsed.data.email), COOKIE_OPTIONS);
    jar.set("govra_pending_email", parsed.data.email, COOKIE_OPTIONS);
    return Response.json({ ok: true });
  } catch {
    return errorResponse("SERVER_ERROR", "Gagal menghubungi server autentikasi", 500);
  }
}
