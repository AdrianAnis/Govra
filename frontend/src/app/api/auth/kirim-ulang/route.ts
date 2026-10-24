import { cookies } from "next/headers";
import { parsePending, PENDING_COOKIE } from "@/lib/auth-flow";
import { authGuard, invalid } from "@/lib/auth-route";

export async function POST(request: Request) {
  const blocked = authGuard(request);
  if (blocked) {
    return blocked;
  }
  const jar = await cookies();
  if (!parsePending(jar.get(PENDING_COOKIE)?.value)) {
    return invalid("Sesi verifikasi berakhir. Mulai lagi dari awal.");
  }
  return Response.json({ ok: true });
}
