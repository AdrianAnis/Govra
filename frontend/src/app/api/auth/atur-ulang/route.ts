import { errorResponse } from "@/lib/api-response";
import { resetSchema } from "@/lib/auth-flow";
import { invalid, readJson } from "@/lib/auth-route";

const BFF_KEY = process.env.BFF_SHARED_KEY || "";

export async function POST(request: Request) {
  const json: unknown = await readJson(request);
  const body = typeof json === "object" && json !== null ? Object.fromEntries(Object.entries(json)) : {};
  const parsed = resetSchema.safeParse(json);
  if (!parsed.success) {
    return invalid(parsed.error.issues[0]?.message);
  }

  const email = String(body.email || "");
  const token = String(body.token || "");
  const code = String(body.code || "");

  const apiBase = process.env.API_BASE_URL || "http://localhost:8080";
  try {
    const res = await fetch(`${apiBase}/auth/reset-password`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-BFF-Key": BFF_KEY,
      },
      body: JSON.stringify({
        email,
        token,
        code,
        new_password: parsed.data.password,
      }),
    });

    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      return errorResponse("RESET_FAILED", data.message || "Gagal mengatur ulang kata sandi", res.status);
    }

    return Response.json({ next: "/masuk?reset=sukses" });
  } catch {
    return errorResponse("SERVER_ERROR", "Gagal menghubungi server", 500);
  }
}
