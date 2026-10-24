import { cookies } from "next/headers";
import { RESET_COOKIE, resetSchema } from "@/lib/auth-flow";
import { authGuard, invalid, readJson } from "@/lib/auth-route";

export async function POST(request: Request) {
  const blocked = authGuard(request);
  if (blocked) {
    return blocked;
  }
  const parsed = resetSchema.safeParse(await readJson(request));
  if (!parsed.success) {
    return invalid(parsed.error.issues[0]?.message);
  }
  const jar = await cookies();
  if (!jar.has(RESET_COOKIE)) {
    return invalid("Sesi atur ulang berakhir. Mulai lagi dari lupa kata sandi.");
  }
  jar.delete(RESET_COOKIE);
  return Response.json({ next: "/masuk" });
}
