import { type Role, getSafeRedirect, safeNext, SESSION_COOKIE } from "@/lib/session";

const SEE_OTHER_STATUS = 303;
const BFF_KEY = process.env.BFF_SHARED_KEY || "413016c9d4970e8030a87654f65c11321dd77c97ecf9f4d95d1beca837faddb2";

function mapRole(role: string): Role {
  if (role === "kepala_daerah") {
    return "kepala_daerah";
  }
  if (role === "admin") {
    return "admin";
  }
  if (role === "dinas") {
    return "dinas";
  }
  return "pelapor";
}

export async function POST(request: Request) {
  const contentType = request.headers.get("content-type") || "";
  let email = "";
  let password = "";
  let next = "/";
  const isJson = contentType.includes("application/json");

  if (isJson) {
    try {
      const json = await request.json();
      email = String(json.email || json.identifier || "").trim();
      password = String(json.password || "");
      next = safeNext(typeof json.lanjut === "string" ? json.lanjut : null);
    } catch {}
  } else {
    try {
      const form = await request.formData();
      email = String(form.get("email") ?? "").trim();
      password = String(form.get("password") ?? "");
      const raw = form.get("lanjut");
      next = safeNext(typeof raw === "string" ? raw : null);
    } catch {}
  }

  const apiBase = process.env.API_BASE_URL || "http://localhost:8080";

  try {
    const res = await fetch(`${apiBase}/auth/login`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-BFF-Key": BFF_KEY,
      },
      body: JSON.stringify({ email, password }),
    });

    if (res.ok) {
      const data = await res.json();
      const role = mapRole(data.profile?.role ?? "pelapor");
      const targetPath = getSafeRedirect(role, next);
      const target = new URL(targetPath, request.url);

      const headers = new Headers({ Location: target.toString() });
      headers.append("Set-Cookie", `${SESSION_COOKIE}=${role}; Path=/; HttpOnly; SameSite=Lax`);
      headers.append("Set-Cookie", `govra_token=${data.token}; Path=/; HttpOnly; SameSite=Lax`);
      headers.append(
        "Set-Cookie",
        `govra_profile=${encodeURIComponent(JSON.stringify(data.profile))}; Path=/; HttpOnly; SameSite=Lax`
      );

      return new Response(null, { status: SEE_OTHER_STATUS, headers });
    }
  } catch {}

  const target = new URL(`/masuk?error=gagal&lanjut=${encodeURIComponent(next)}`, request.url);
  return new Response(null, { status: SEE_OTHER_STATUS, headers: { Location: target.toString() } });
}
