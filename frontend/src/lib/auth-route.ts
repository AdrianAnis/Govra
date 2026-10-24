import { errorResponse } from "@/lib/api-response";
import { PENDING_MAX_AGE_SECONDS } from "@/lib/auth-flow";
import { mockOnly } from "@/lib/mock-guard";
import { rejectCrossOrigin } from "@/lib/origin";

const INVALID_STATUS = 422;

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
