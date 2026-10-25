import { errorResponse } from "@/lib/api-response";
import { emailSchema } from "@/lib/auth-flow";
import { invalid, readJson } from "@/lib/auth-route";

const BFF_KEY = process.env.BFF_SHARED_KEY || "413016c9d4970e8030a87654f65c11321dd77c97ecf9f4d95d1beca837faddb2";

export async function POST(request: Request) {
  const parsed = emailSchema.safeParse(await readJson(request));
  if (!parsed.success) {
    return invalid(parsed.error.issues[0]?.message);
  }

  const apiBase = process.env.API_BASE_URL || "http://localhost:8080";
  try {
    const res = await fetch(`${apiBase}/auth/forgot-password`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-BFF-Key": BFF_KEY,
      },
      body: JSON.stringify({ email: parsed.data.email }),
    });

    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      return errorResponse("FORGOT_PASSWORD_FAILED", data.message || "Email tidak terdaftar dalam sistem Govra.", res.status);
    }

    return Response.json({
      ok: true,
      message: data.message || "Tautan atur ulang kata sandi telah dikirimkan ke email Anda.",
    });
  } catch {
    return errorResponse("SERVER_ERROR", "Gagal menghubungi server autentikasi", 500);
  }
}
