import { cookies } from "next/headers";
import { errorResponse } from "@/lib/api-response";
import { authGuard, invalid, readJson } from "@/lib/auth-route";
import { chatRequestSchema, replySchema } from "@/lib/chat";

export const maxDuration = 60;

const RATE_LIMITED_STATUS = 429;
const UNAVAILABLE_STATUS = 502;
const BACKEND_TIMEOUT_MS = 50_000;
const UNAVAILABLE_MESSAGE = "Asisten sedang sibuk. Coba lagi sebentar lagi.";

function clientIp(request: Request): string {
  const forwarded = request.headers.get("x-forwarded-for") ?? "";
  return forwarded.split(",")[0]?.trim() || "lokal";
}

export async function POST(request: Request) {
  const blocked = authGuard(request);
  if (blocked) {
    return blocked;
  }
  const parsed = chatRequestSchema.safeParse(await readJson(request));
  if (!parsed.success) {
    return invalid("Pertanyaan tidak valid.");
  }
  const last = parsed.data.messages[parsed.data.messages.length - 1];
  if (!last || last.role !== "USER") {
    return invalid("Pesan terakhir harus dari pengguna.");
  }

  const token = (await cookies()).get("govra_token")?.value;
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    "X-BFF-Key": process.env.BFF_SHARED_KEY || "",
    "X-Forwarded-For": clientIp(request),
  };
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }
  const apiBase = process.env.API_BASE_URL || "http://localhost:8080";

  try {
    const res = await fetch(`${apiBase}/assistant/messages`, {
      method: "POST",
      headers,
      body: JSON.stringify({ messages: parsed.data.messages }),
      cache: "no-store",
      signal: AbortSignal.timeout(BACKEND_TIMEOUT_MS),
    });
    if (res.status === RATE_LIMITED_STATUS) {
      return errorResponse(
        "RATE_LIMITED",
        "Terlalu banyak pertanyaan. Coba lagi beberapa menit lagi.",
        RATE_LIMITED_STATUS,
      );
    }
    if (!res.ok) {
      return errorResponse("ASSISTANT_UNAVAILABLE", UNAVAILABLE_MESSAGE, UNAVAILABLE_STATUS);
    }
    const reply = replySchema.safeParse(await res.json());
    if (!reply.success) {
      return errorResponse("ASSISTANT_UNAVAILABLE", UNAVAILABLE_MESSAGE, UNAVAILABLE_STATUS);
    }
    return Response.json(reply.data);
  } catch {
    return errorResponse("ASSISTANT_UNAVAILABLE", UNAVAILABLE_MESSAGE, UNAVAILABLE_STATUS);
  }
}
