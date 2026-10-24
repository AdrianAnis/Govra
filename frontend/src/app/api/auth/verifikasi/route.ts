import { cookies } from "next/headers";
import { errorResponse } from "@/lib/api-response";
import { codeSchema, parsePending, PENDING_COOKIE, RESET_COOKIE } from "@/lib/auth-flow";
import { authGuard, COOKIE_OPTIONS, invalid, readJson } from "@/lib/auth-route";
import { DEMO_CODE } from "@/lib/mock-guard";
import { SESSION_COOKIE } from "@/lib/session";
import { REPORTER_HOME } from "@/lib/routes";

const WRONG_CODE_STATUS = 422;
const DEMO_ROLE = "pelapor";

export async function POST(request: Request) {
  const blocked = authGuard(request);
  if (blocked) {
    return blocked;
  }
  const parsed = codeSchema.safeParse(await readJson(request));
  if (!parsed.success) {
    return invalid(parsed.error.issues[0]?.message);
  }
  const jar = await cookies();
  const pending = parsePending(jar.get(PENDING_COOKIE)?.value);
  if (!pending) {
    return invalid("Sesi verifikasi berakhir. Mulai lagi dari awal.");
  }
  if (parsed.data.kode !== DEMO_CODE) {
    return errorResponse("WRONG_CODE", "Kode salah atau sudah kedaluwarsa.", WRONG_CODE_STATUS);
  }
  jar.delete(PENDING_COOKIE);
  if (pending.purpose === "reset") {
    jar.set(RESET_COOKIE, "1", COOKIE_OPTIONS);
    return Response.json({ next: "/atur-sandi" });
  }
  jar.set(SESSION_COOKIE, DEMO_ROLE, { httpOnly: true, sameSite: "lax", path: "/" });
  return Response.json({ next: REPORTER_HOME });
}
