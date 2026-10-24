import { cookies } from "next/headers";
import { DEMO_PROFILE } from "@/lib/mock/profile";
import { SESSION_COOKIE } from "@/lib/session";

export interface SessionUser {
  name: string;
  email: string;
  initials: string;
}

const MAX_INITIALS = 2;
const FALLBACK_NAME = "Pelapor";

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
  if (!jar.has(SESSION_COOKIE)) {
    return null;
  }
  const name = DEMO_PROFILE.display_name ?? FALLBACK_NAME;
  return { name, email: DEMO_PROFILE.email, initials: initialsOf(name) };
}
