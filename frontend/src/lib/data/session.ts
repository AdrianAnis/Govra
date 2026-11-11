import { cookies } from "next/headers";
import { DEMO_PROFILES } from "@/lib/mock/profile";
import { z } from "zod";
import { readRole, SESSION_COOKIE, type Role } from "@/lib/session";
import { verifyProfile } from "@/lib/session-sign";
import { directSupabase } from "@/lib/supabase-direct";

export interface SessionUser {
  id?: string;
  name: string;
  email: string;
  initials: string;
  role: Role;
  opdName: string | null;
  opdId?: string | null;
  phone?: string | null;
  avatarUrl?: string | null;
  nik?: string | null;
  address?: string | null;
  district?: string | null;
  village?: string | null;
  bio?: string | null;
}

const profileSchema = z.object({
  id: z.string().optional(),
  email: z.string().default(""),
  display_name: z.string().nullish(),
  opd_id: z.string().nullish(),
  opd_name: z.string().nullish(),
  phone: z.string().nullish(),
  avatar_url: z.string().nullish(),
  nik: z.string().nullish(),
  address: z.string().nullish(),
  district: z.string().nullish(),
  village: z.string().nullish(),
  bio: z.string().nullish(),
});

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
  const role = await readRole(jar.get(SESSION_COOKIE)?.value);
  if (!role) {
    return null;
  }

  const parsedProfile = profileSchema.safeParse(await verifyProfile(jar.get("govra_profile")?.value));
  const p = parsedProfile.success ? parsedProfile.data : null;
  const email = p?.email || "";

  const { url: supabaseUrl, serviceKey } = directSupabase();
  if (email && supabaseUrl && serviceKey && !supabaseUrl.includes("127.0.0.1:1")) {
    try {
      const dbRes = await fetch(`${supabaseUrl}/rest/v1/profiles?email=eq.${encodeURIComponent(email)}&limit=1`, {
        headers: {
          apikey: serviceKey,
          Authorization: `Bearer ${serviceKey}`,
          "Accept-Profile": "app",
        },
        cache: "no-store",
      });
      if (dbRes.ok) {
        const rows = await dbRes.json();
        if (Array.isArray(rows) && rows.length > 0) {
          const row = rows[0];
          let extra: Record<string, string> = {};
          try {
            const extraRes = await fetch(
              `${supabaseUrl}/rest/v1/settings?key=eq.CITIZEN_PROFILE_${encodeURIComponent(email)}&limit=1`,
              {
                headers: {
                  apikey: serviceKey,
                  Authorization: `Bearer ${serviceKey}`,
                  "Accept-Profile": "app",
                },
                cache: "no-store",
              },
            );
            if (extraRes.ok) {
              const extraRows = await extraRes.json();
              if (Array.isArray(extraRows) && extraRows.length > 0 && extraRows[0].value) {
                extra = JSON.parse(extraRows[0].value);
              }
            }
          } catch {}

          const name = row.display_name || FALLBACK_NAME;
          const opdId = row.opd_id ?? null;
          const opdName = row.opd_name || (opdId ? (OPD_NAME_LOOKUP[opdId] ?? null) : null);
          return {
            id: row.id,
            name,
            email: row.email,
            initials: initialsOf(name),
            role,
            opdName,
            opdId,
            phone: row.phone ?? p?.phone ?? null,
            avatarUrl: row.avatar_url ?? p?.avatar_url ?? null,
            nik: extra.nik ?? p?.nik ?? null,
            address: extra.address ?? p?.address ?? null,
            district: extra.district ?? p?.district ?? null,
            village: extra.village ?? p?.village ?? null,
            bio: extra.bio ?? p?.bio ?? null,
          };
        }
      }
    } catch {}
  }

  if (p) {
    const name = p.display_name || FALLBACK_NAME;
    const opdId = p.opd_id ?? null;
    const opdName = p.opd_name || (opdId ? (OPD_NAME_LOOKUP[opdId] ?? null) : null);
    return {
      ...(p.id ? { id: p.id } : {}),
      name,
      email: p.email,
      initials: initialsOf(name),
      role,
      opdName,
      opdId,
      phone: p.phone ?? null,
      avatarUrl: p.avatar_url ?? null,
      nik: p.nik ?? null,
      address: p.address ?? null,
      district: p.district ?? null,
      village: p.village ?? null,
      bio: p.bio ?? null,
    };
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
    phone: role === "pelapor" ? "081234567890" : null,
    avatarUrl: null,
    nik: role === "pelapor" ? "3273012304950002" : null,
    address: role === "pelapor" ? "Jl. Ciateul No. 45, RT 02 / RW 04" : null,
    district: role === "pelapor" ? "Regol" : null,
    village: role === "pelapor" ? "Ciateul" : null,
    bio: role === "pelapor" ? "Warga aktif pemerhati fasilitas umum dan kebersihan lingkungan." : null,
  };
}
