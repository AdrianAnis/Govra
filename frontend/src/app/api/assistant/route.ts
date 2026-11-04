import { cookies } from "next/headers";
import { errorResponse } from "@/lib/api-response";
import { authGuard, invalid, readJson } from "@/lib/auth-route";
import { chatRequestSchema } from "@/lib/chat";
import { answerQuestion } from "@/lib/data/assistant";
import { getSessionUser } from "@/lib/data/session";
import { allow } from "@/lib/mock/rate-limit";
import { readRole, SESSION_COOKIE } from "@/lib/session";

const RATE_LIMITED_STATUS = 429;
const WINDOW_MS = 10 * 60 * 1000;
const ACCOUNT_LIMIT = 40;
const PUBLIC_LIMIT = 20;

export async function POST(request: Request) {
  const blocked = authGuard(request);
  if (blocked) {
    return blocked;
  }
  const parsed = chatRequestSchema.safeParse(await readJson(request));
  if (!parsed.success || parsed.data.messages.length === 0) {
    return invalid("Pertanyaan tidak valid.");
  }
  const last = parsed.data.messages[parsed.data.messages.length - 1];
  if (!last || last.role !== "USER") {
    return invalid("Pesan terakhir harus dari pengguna.");
  }

  const user = await getSessionUser();
  const signedIn = Boolean(user && user.role === "pelapor");
  const key = user?.id ? `user:${user.id}` : `ip:${request.headers.get("x-forwarded-for") ?? "lokal"}`;

  if (!allow(key, signedIn ? ACCOUNT_LIMIT : PUBLIC_LIMIT, WINDOW_MS, Date.now())) {
    return errorResponse(
      "RATE_LIMITED",
      "Terlalu banyak pertanyaan. Coba lagi beberapa menit lagi.",
      RATE_LIMITED_STATUS,
    );
  }

  const answer = await answerQuestion(parsed.data.messages, user);
  return Response.json(answer);
}
