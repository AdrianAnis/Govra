import { cookies } from "next/headers";
import { DEMO_PROFILES } from "@/lib/mock/profile";
import { parseRole, SESSION_COOKIE, type Role } from "@/lib/session";

export interface SessionUser {
  id?: string;
  name: string;
  email: string;
  initials: string;
  role: Role;
  opdName: string | null;
  opdId?: string | null;
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

const OPD_NAME_LOOKUP: Record<string, string> = {
  "e0000000-0000-0000-0000-000000000001": "Dinas Bina Marga & SDA",
  "e0000000-0000-0000-0000-000000000002": "Dinas Lingkungan Hidup & Kebersihan",
  "e0000000-0000-0000-0000-000000000003": "Dinas Perhubungan",
  "e0000000-0000-0000-0000-000000000004": "Dinas Kesehatan",
  "e0000000-0000-0000-0000-000000000005": "Satuan Polisi Pamong Praja",
  "e0000000-0000-0000-0000-000000000006": "Badan Penanggulangan Bencana Daerah",
  "e0000000-0000-0000-0000-000000000007": "Dinas PUPR",
};

export async function getSessionUser(): Promise<SessionUser | null> {
  const jar = await cookies();
  const sessionToken = jar.get(SESSION_COOKIE)?.value;
  if (!sessionToken) {
    return null;
  }
  const role = parseRole(sessionToken);
  if (!role) {
    return null;
  }

  const profileRaw = jar.get("govra_profile")?.value;
  if (profileRaw) {
    try {
      const p = JSON.parse(decodeURIComponent(profileRaw));
      const name = p.display_name || FALLBACK_NAME;
      const opdId = p.opd_id ?? null;
      const opdName = p.opd_name || (opdId ? OPD_NAME_LOOKUP[opdId] : null);
      return {
        id: p.id || undefined,
        name,
        email: p.email,
        initials: initialsOf(name),
        role,
        opdName,
        opdId,
      };
    } catch {}
  }

  const profile = DEMO_PROFILES[role];
  if (!profile) {
    return null;
  }
  const name = profile.display_name ?? FALLBACK_NAME;
  return {
    id: profile.id,
    name,
    email: profile.email,
    initials: initialsOf(name),
    role,
    opdName: profile.opd?.name ?? null,
  };
}
