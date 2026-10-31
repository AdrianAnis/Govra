import { cookies } from "next/headers";
import { errorResponse } from "@/lib/api-response";
import { PENDING_MAX_AGE_SECONDS } from "@/lib/auth-flow";
import { mockOnly } from "@/lib/mock-guard";
import { rejectCrossOrigin } from "@/lib/origin";
import { readRole, SESSION_COOKIE, type Role } from "@/lib/session";

const INVALID_STATUS = 422;
const FORBIDDEN_STATUS = 403;

export const COOKIE_OPTIONS = {
  httpOnly: true,
  sameSite: "lax",
  path: "/",
  maxAge: PENDING_MAX_AGE_SECONDS,
} as const;

export function authGuard(request: Request): Response | null {
  return mockOnly() ?? rejectCrossOrigin(request);
}

export async function readJson(request: Request): Promise<unknown> {
  return request.json().catch(() => null);
}

export function invalid(message = "Permintaan tidak valid."): Response {
  return errorResponse("VALIDATION_ERROR", message, INVALID_STATUS);
}

export async function staffGuard(request: Request, role: Role): Promise<Response | null> {
  const blocked = authGuard(request);
  if (blocked) {
    return blocked;
  }
  const current = await readRole((await cookies()).get(SESSION_COOKIE)?.value);
  return current === role ? null : errorResponse("FORBIDDEN", "Akun Anda tidak boleh melakukan aksi ini.", FORBIDDEN_STATUS);
}
