import { ADMIN_HOME, AGENCY_HOME, PEMERINTAH_HOME, REPORTER_HOME } from "@/lib/routes";

export const SESSION_COOKIE = "govra_session";

export type Role = "pelapor" | "dinas" | "admin" | "kepala_daerah";

const ROLES: readonly string[] = ["pelapor", "dinas", "admin", "kepala_daerah"];
const PROTECTED_PATHS: readonly string[] = [REPORTER_HOME, AGENCY_HOME, ADMIN_HOME, PEMERINTAH_HOME];
const HOME = "/";

export const ROLE_HOME: Record<Role, string> = {
  pelapor: REPORTER_HOME,
  dinas: AGENCY_HOME,
  admin: ADMIN_HOME,
  kepala_daerah: PEMERINTAH_HOME,
};

export function parseRole(value: string | null | undefined): Role | null {
  return ROLES.find((role): role is Role => role === value) ?? null;
}

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
