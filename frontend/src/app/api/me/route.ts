import { cookies } from "next/headers";
import { authGuard } from "@/lib/auth-route";
import { SESSION_COOKIE } from "@/lib/session";

export async function DELETE(request: Request) {
  const blocked = authGuard(request);
  if (blocked) {
    return blocked;
  }
  const jar = await cookies();
  jar.delete(SESSION_COOKIE);
  return Response.json({ ok: true });
}
