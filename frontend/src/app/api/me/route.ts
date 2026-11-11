import { cookies } from "next/headers";
import { authGuard, readJson, invalid } from "@/lib/auth-route";
import { SESSION_COOKIE } from "@/lib/session";
import { signProfile, verifyProfile } from "@/lib/session-sign";
import { DEMO_PROFILES } from "@/lib/mock/profile";
import { directSupabase } from "@/lib/supabase-direct";

export async function GET(request: Request) {
  const blocked = authGuard(request);
  if (blocked) {
    return blocked;
  }
  const jar = await cookies();
  const session = jar.get(SESSION_COOKIE)?.value;
  if (!session) {
    return Response.json({ message: "Wajib login" }, { status: 401 });
  }

  const verified = (await verifyProfile(jar.get("govra_profile")?.value)) as Record<string, unknown> | null;
  const email = (verified?.email as string) || "";

  const { url: supabaseUrl, serviceKey } = directSupabase();
  if (email && supabaseUrl && serviceKey && !supabaseUrl.includes("127.0.0.1:1")) {
    try {
      const [dbRes, extraRes] = await Promise.all([
        fetch(`${supabaseUrl}/rest/v1/profiles?email=eq.${encodeURIComponent(email)}&limit=1`, {
          headers: {
            apikey: serviceKey,
            Authorization: `Bearer ${serviceKey}`,
            "Accept-Profile": "app",
          },
          cache: "no-store",
        }),
        fetch(`${supabaseUrl}/rest/v1/settings?key=eq.CITIZEN_PROFILE_${encodeURIComponent(email)}&limit=1`, {
          headers: {
            apikey: serviceKey,
            Authorization: `Bearer ${serviceKey}`,
            "Accept-Profile": "app",
          },
          cache: "no-store",
        }).catch(() => null),
      ]);

      if (dbRes.ok) {
        const rows = await dbRes.json();
        if (Array.isArray(rows) && rows.length > 0) {
          const row = rows[0];
          let extra: Record<string, string> = {};
          if (extraRes && extraRes.ok) {
            try {
              const extraRows = await extraRes.json();
              if (Array.isArray(extraRows) && extraRows.length > 0 && extraRows[0].value) {
                extra = JSON.parse(extraRows[0].value);
              }
            } catch {}
          }

          const fullProfile = {
            ...row,
            nik: extra.nik || "",
            address: extra.address || "",
            district: extra.district || "",
            village: extra.village || "",
            bio: extra.bio || "",
          };

          return Response.json({ ok: true, profile: fullProfile });
        }
      }
    } catch {}
  }

  if (verified && typeof verified === "object") {
    return Response.json({ ok: true, profile: verified });
  }

  return Response.json({ ok: true, profile: DEMO_PROFILES.pelapor });
}

export async function PUT(request: Request) {
  return handleUpdate(request);
}

export async function PATCH(request: Request) {
  return handleUpdate(request);
}

async function handleUpdate(request: Request) {
  const blocked = authGuard(request);
  if (blocked) {
    return blocked;
  }

  const jar = await cookies();
  const session = jar.get(SESSION_COOKIE)?.value;
  if (!session) {
    return Response.json({ message: "Wajib login" }, { status: 401 });
  }

  const raw = await readJson(request);
  if (!raw || typeof raw !== "object") {
    return invalid("Format data tidak valid.");
  }

  const data = raw as Record<string, unknown>;
  const displayName =
    typeof data.displayName === "string"
      ? data.displayName.trim()
      : typeof data.display_name === "string"
        ? data.display_name.trim()
        : "";
  if (displayName && displayName.length < 2) {
    return invalid("Nama lengkap minimal 2 karakter.");
  }

  const phone =
    typeof data.phone === "string"
      ? data.phone.trim()
      : typeof data.telepon === "string"
        ? data.telepon.trim()
        : "";
  const avatarUrl =
    typeof data.avatarUrl === "string"
      ? data.avatarUrl.trim()
      : typeof data.avatar_url === "string"
        ? data.avatar_url.trim()
        : "";
  const nik = typeof data.nik === "string" ? data.nik.trim() : "";
  const address =
    typeof data.address === "string"
      ? data.address.trim()
      : typeof data.alamat === "string"
        ? data.alamat.trim()
        : "";
  const district =
    typeof data.district === "string"
      ? data.district.trim()
      : typeof data.kecamatan === "string"
        ? data.kecamatan.trim()
        : "";
  const village =
    typeof data.village === "string"
      ? data.village.trim()
      : typeof data.kelurahan === "string"
        ? data.kelurahan.trim()
        : "";
  const bio = typeof data.bio === "string" ? data.bio.trim() : "";

  const hasAvatar = "avatarUrl" in data || "avatar_url" in data;
  const hasDisplayName = "displayName" in data || "display_name" in data;
  const hasPhone = "phone" in data || "telepon" in data;
  const hasNik = "nik" in data;
  const hasAddress = "address" in data || "alamat" in data;
  const hasDistrict = "district" in data || "kecamatan" in data;
  const hasVillage = "village" in data || "kelurahan" in data;
  const hasBio = "bio" in data;

  const existingProfile = (await verifyProfile(jar.get("govra_profile")?.value)) as Record<string, unknown> | null;
  const email = (existingProfile?.email as string) || (data.email as string) || "";

  const { url: supabaseUrl, serviceKey } = directSupabase();
  const token = jar.get("govra_token")?.value;
  const apiBase = process.env.API_BASE_URL || "http://localhost:8088";
  const bffKey = process.env.BFF_SHARED_KEY || "";

  const updateTasks: Promise<unknown>[] = [];

  if (email && supabaseUrl && serviceKey && !supabaseUrl.includes("127.0.0.1:1")) {
    const profilePatch: Record<string, unknown> = {
      updated_at: new Date().toISOString(),
    };
    if (displayName) profilePatch.display_name = displayName;
    if (phone) profilePatch.phone = phone;
    if (hasAvatar) profilePatch.avatar_url = avatarUrl || null;

    updateTasks.push(
      fetch(`${supabaseUrl}/rest/v1/profiles?email=eq.${encodeURIComponent(email)}`, {
        method: "PATCH",
        headers: {
          apikey: serviceKey,
          Authorization: `Bearer ${serviceKey}`,
          "Content-Type": "application/json",
          "Content-Profile": "app",
        },
        body: JSON.stringify(profilePatch),
      }).catch(() => null),
    );

    updateTasks.push(
      fetch(`${supabaseUrl}/rest/v1/settings`, {
        method: "POST",
        headers: {
          apikey: serviceKey,
          Authorization: `Bearer ${serviceKey}`,
          "Content-Type": "application/json",
          "Content-Profile": "app",
          Prefer: "resolution=merge-duplicates",
        },
        body: JSON.stringify({
          key: `CITIZEN_PROFILE_${email}`,
          value: JSON.stringify({ nik, address, district, village, bio }),
          unit: "JSON",
          description: "Profil tambahan data kependudukan warga",
        }),
      }).catch(() => null),
    );
  }

  if (token) {
    updateTasks.push(
      fetch(`${apiBase}/me`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
          "X-BFF-Key": bffKey,
        },
        body: JSON.stringify({
          display_name: displayName,
          phone,
          avatar_url: hasAvatar && !avatarUrl ? "__REMOVE__" : avatarUrl,
          nik,
          address,
          district,
          village,
          bio,
        }),
      }).catch(() => null),
    );
  }

  await Promise.allSettled(updateTasks);

  const mergedProfile = {
    ...(existingProfile || DEMO_PROFILES.pelapor),
    display_name: hasDisplayName ? (displayName || (existingProfile?.display_name as string) || "Pelapor") : ((existingProfile?.display_name as string) || "Pelapor"),
    phone: hasPhone ? phone : ((existingProfile?.phone as string) || ""),
    avatar_url: hasAvatar ? avatarUrl : ((existingProfile?.avatar_url as string) || ""),
    nik: hasNik ? nik : ((existingProfile?.nik as string) || ""),
    address: hasAddress ? address : ((existingProfile?.address as string) || ""),
    district: hasDistrict ? district : ((existingProfile?.district as string) || ""),
    village: hasVillage ? village : ((existingProfile?.village as string) || ""),
    bio: hasBio ? bio : ((existingProfile?.bio as string) || ""),
  };

  const signed = await signProfile(mergedProfile);
  jar.set("govra_profile", signed, {
    path: "/",
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
  });

  return Response.json({ ok: true, profile: mergedProfile });
}

export async function DELETE(request: Request) {
  const blocked = authGuard(request);
  if (blocked) {
    return blocked;
  }
  const jar = await cookies();
  jar.delete(SESSION_COOKIE);
  jar.delete("govra_token");
  jar.delete("govra_profile");
  return Response.json({ ok: true });
}
