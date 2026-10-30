import { cookies } from "next/headers";
import { errorResponse } from "@/lib/api-response";
import { parsePending, PENDING_COOKIE } from "@/lib/auth-flow";
import { invalid } from "@/lib/auth-route";

const BFF_KEY = process.env.BFF_SHARED_KEY || "413016c9d4970e8030a87654f65c11321dd77c97ecf9f4d95d1beca837faddb2";

export async function POST() {
  const jar = await cookies();
  const pending = parsePending(jar.get(PENDING_COOKIE)?.value);
  const email = jar.get("govra_pending_email")?.value || pending?.email;

  if (!email) {
    return invalid("Sesi telah berakhir. Silakan ulangi proses dari awal.");
  }

  const apiBase = process.env.API_BASE_URL || "http://localhost:8080";
  try {
    const res = await fetch(`${apiBase}/auth/send-otp`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-BFF-Key": BFF_KEY,
      },
      body: JSON.stringify({
        email,
        purpose: "REGISTRATION",
      }),
    });

    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      return errorResponse("SEND_OTP_FAILED", data.message || "Gagal mengirim ulang kode OTP", res.status);
    }

    return Response.json({ ok: true });
  } catch {
    return errorResponse("SERVER_ERROR", "Gagal menghubungi server", 500);
  }
}
