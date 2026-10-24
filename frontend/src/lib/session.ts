import { REPORTER_HOME } from "@/lib/routes";
export const SESSION_COOKIE = "govra_session";

const PROTECTED_PATHS: readonly string[] = [REPORTER_HOME];
const HOME = "/";

export function isProtectedPath(pathname: string): boolean {
  return PROTECTED_PATHS.some((path) => pathname === path || pathname.startsWith(`${path}/`));
}

export function loginHref(next: string): string {
  return `/masuk?lanjut=${encodeURIComponent(next)}`;
}

export function safeNext(value: string | null | undefined): string {
  if (!value || !value.startsWith("/") || value.startsWith("//") || value.startsWith("/\\")) {
    return HOME;
  }
  return value;
}
