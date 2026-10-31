import { cookies } from "next/headers";
import { errorResponse } from "@/lib/api-response";
import { authGuard, invalid, readJson } from "@/lib/auth-route";
import { chatRequestSchema } from "@/lib/chat";
import { answerQuestion } from "@/lib/data/assistant";
import { allow } from "@/lib/mock/rate-limit";
import { readRole, SESSION_COOKIE } from "@/lib/session";

const RATE_LIMITED_STATUS = 429;
const WINDOW_MS = 10 * 60 * 1000;
const ACCOUNT_LIMIT = 20;
const PUBLIC_LIMIT = 10;

export async function POST(request: Request) {
  const blocked = authGuard(request);
  if (blocked) {
    return blocked;
  }
  const parsed = chatRequestSchema.safeParse(await readJson(request));
  const last = parsed.success ? parsed.data.messages[parsed.data.messages.length - 1] : undefined;
  if (!last || last.role !== "USER") {
    return invalid("Pertanyaan tidak valid.");
  }
  const signedIn = (await readRole((await cookies()).get(SESSION_COOKIE)?.value)) === "pelapor";
  const key = signedIn ? "akun" : `ip:${request.headers.get("x-forwarded-for") ?? "lokal"}`;
  if (!allow(key, signedIn ? ACCOUNT_LIMIT : PUBLIC_LIMIT, WINDOW_MS, Date.now())) {
    return errorResponse("RATE_LIMITED", "Terlalu banyak pertanyaan. Coba lagi beberapa menit lagi.", RATE_LIMITED_STATUS);
  }
  return Response.json(await answerQuestion(last.content, signedIn));
}
