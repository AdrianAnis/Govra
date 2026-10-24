import { cookies } from "next/headers";
import { emailSchema, PENDING_COOKIE, pendingValue } from "@/lib/auth-flow";
import { authGuard, COOKIE_OPTIONS, invalid, readJson } from "@/lib/auth-route";

export async function POST(request: Request) {
  const blocked = authGuard(request);
  if (blocked) {
    return blocked;
  }
  const parsed = emailSchema.safeParse(await readJson(request));
  if (!parsed.success) {
    return invalid(parsed.error.issues[0]?.message);
  }
  const jar = await cookies();
  jar.set(PENDING_COOKIE, pendingValue("reset", parsed.data.email), COOKIE_OPTIONS);
  return Response.json({ ok: true });
}
