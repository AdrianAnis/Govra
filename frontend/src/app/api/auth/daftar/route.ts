import { cookies } from "next/headers";
import { PENDING_COOKIE, pendingValue, signupSchema } from "@/lib/auth-flow";
import { authGuard, COOKIE_OPTIONS, invalid, readJson } from "@/lib/auth-route";

export async function POST(request: Request) {
  const blocked = authGuard(request);
  if (blocked) {
    return blocked;
  }
  const parsed = signupSchema.safeParse(await readJson(request));
  if (!parsed.success) {
    return invalid(parsed.error.issues[0]?.message);
  }
  const jar = await cookies();
  jar.set(PENDING_COOKIE, pendingValue("daftar", parsed.data.email), COOKIE_OPTIONS);
  return Response.json({ ok: true });
}
