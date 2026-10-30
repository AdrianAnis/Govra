import { ADMIN_HOME, AGENCY_HOME, PEMERINTAH_HOME, REPORTER_HOME } from "@/lib/routes";

export const SESSION_COOKIE = "govra_session";

export type Role = "pelapor" | "dinas" | "admin";

const ROLES: readonly string[] = ["pelapor", "dinas", "admin"];
const PROTECTED_PATHS: readonly string[] = [REPORTER_HOME, AGENCY_HOME, ADMIN_HOME, PEMERINTAH_HOME];
const HOME = "/";

export const ROLE_HOME: Record<Role, string> = {
  pelapor: REPORTER_HOME,
  dinas: AGENCY_HOME,
  admin: PEMERINTAH_HOME,
};

export function parseRole(value: string | null | undefined): Role | null {
  if (value === "kepala_daerah") {
    return "admin";
  }
  return ROLES.find((role): role is Role => role === value) ?? null;
}

export function isProtectedPath(pathname: string): boolean {
  return PROTECTED_PATHS.some((path) => pathname === path || pathname.startsWith(`${path}/`));
}

export function canAccessPath(role: Role, pathname: string): boolean {
  if (role === "admin") {
    return (
      pathname.startsWith(PEMERINTAH_HOME) ||
      pathname.startsWith(ADMIN_HOME) ||
      !isProtectedPath(pathname)
    );
  }
  if (role === "dinas") {
    return pathname.startsWith(AGENCY_HOME) || !isProtectedPath(pathname);
  }
  if (role === "pelapor") {
    return pathname.startsWith(REPORTER_HOME) || !isProtectedPath(pathname);
  }
  return !isProtectedPath(pathname);
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

export function getSafeRedirect(role: Role, next: string | null | undefined): string {
  const safe = safeNext(next);
  if (!safe || safe === "/" || safe === "/masuk" || !canAccessPath(role, safe)) {
    return ROLE_HOME[role];
  }
  return safe;
}
