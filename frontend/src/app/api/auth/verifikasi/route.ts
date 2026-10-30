import { cookies } from "next/headers";
import { errorResponse } from "@/lib/api-response";
import { codeSchema, parsePending, PENDING_COOKIE } from "@/lib/auth-flow";
import { invalid, readJson } from "@/lib/auth-route";

const BFF_KEY = process.env.BFF_SHARED_KEY || "";

export async function POST(request: Request) {
  const parsed = codeSchema.safeParse(await readJson(request));
  if (!parsed.success) {
    return invalid(parsed.error.issues[0]?.message);
  }

  const jar = await cookies();
  const pending = parsePending(jar.get(PENDING_COOKIE)?.value);
  const email = jar.get("govra_pending_email")?.value || pending?.email;

  if (!email) {
    return invalid("Sesi verifikasi telah berakhir. Silakan daftar kembali dari awal.");
  }

  const apiBase = process.env.API_BASE_URL || "http://localhost:8080";
  try {
    const res = await fetch(`${apiBase}/auth/verify-registration`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-BFF-Key": BFF_KEY,
      },
      body: JSON.stringify({
        email,
        code: parsed.data.kode,
        purpose: "REGISTRATION",
      }),
    });

    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      return errorResponse("VERIFY_FAILED", data.message || "Kode verifikasi tidak valid.", res.status);
    }

    jar.delete(PENDING_COOKIE);
    jar.delete("govra_pending_email");
    return Response.json({ next: "/masuk?registered=sukses" });
  } catch {
    return errorResponse("SERVER_ERROR", "Gagal memverifikasi kode ke server", 500);
  }
}
