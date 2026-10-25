import { type Role, ROLE_HOME, safeNext, SESSION_COOKIE } from "@/lib/session";

const SEE_OTHER_STATUS = 303;

function mapRole(role: string): Role {
  if (role === "admin" || role === "kepala_daerah") {
    return "admin";
  }
  if (role === "dinas") {
    return "dinas";
  }
  return "pelapor";
}

export async function POST(request: Request) {
  const form = await request.formData();
  const email = String(form.get("email") ?? "").trim();
  const password = String(form.get("password") ?? "");
  const raw = form.get("lanjut");
  const next = safeNext(typeof raw === "string" ? raw : null);

  const apiBase = process.env.API_BASE_URL || "http://localhost:8080";

  try {
    const res = await fetch(`${apiBase}/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });

    if (res.ok) {
      const data = await res.json();
      const role = mapRole(data.profile?.role ?? "pelapor");
      const targetPath = next === "/" ? ROLE_HOME[role] : next;
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
