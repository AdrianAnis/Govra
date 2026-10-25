import { cookies } from "next/headers";
import { DEMO_PROFILES } from "@/lib/mock/profile";
import { parseRole, SESSION_COOKIE, type Role } from "@/lib/session";

export interface SessionUser {
  name: string;
  email: string;
  initials: string;
  role: Role;
  opdName: string | null;
}

const MAX_INITIALS = 2;
const FALLBACK_NAME = "Pengguna";

function initialsOf(name: string): string {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, MAX_INITIALS)
    .map((word) => word.charAt(0).toUpperCase())
    .join("");
}

export async function getSessionUser(): Promise<SessionUser | null> {
  const jar = await cookies();
  const role = parseRole(jar.get(SESSION_COOKIE)?.value);
  if (!role) {
    return null;
  }
  const profile = DEMO_PROFILES[role];
  const name = profile.display_name ?? FALLBACK_NAME;
  return { name, email: profile.email, initials: initialsOf(name), role, opdName: profile.opd?.name ?? null };
}
