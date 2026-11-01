import { getSafeRedirect, safeNext, SESSION_COOKIE } from "@/lib/session";
import { SECURE_FLAG } from "@/lib/cookie-flags";
import { signProfile, signValue } from "@/lib/session-sign";

const BFF_KEY = process.env.BFF_SHARED_KEY || "";
const SEE_OTHER_STATUS = 303;

export async function POST(request: Request) {
  let email = "";
  let displayName = "";
  let lanjut = "/pelapor";

  const contentType = request.headers.get("content-type") || "";
  if (contentType.includes("application/json")) {
    try {
      const body = await request.json();
      email = String(body.email || "").trim();
      displayName = String(body.display_name || body.name || "").trim();
      lanjut = safeNext(body.lanjut);
    } catch {}
  } else {
    try {
      const form = await request.formData();
      email = String(form.get("email") || "").trim();
      displayName = String(form.get("display_name") || "").trim();
      lanjut = safeNext(typeof form.get("lanjut") === "string" ? String(form.get("lanjut")) : null);
    } catch {}
  }

  if (!email) {
    const target = new URL(`/masuk?error=google_gagal`, request.url);
    return new Response(null, { status: SEE_OTHER_STATUS, headers: { Location: target.toString() } });
  }

  const apiBase = process.env.API_BASE_URL || "http://localhost:8080";

  try {
    const backendRes = await fetch(`${apiBase}/auth/oauth-login`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-BFF-Key": BFF_KEY,
      },
      body: JSON.stringify({
        email,
        display_name: displayName || email.split("@")[0],
        avatar_url: `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(displayName || email)}`,
        provider: "google",
      }),
    });

    if (!backendRes.ok) {
      const errorData = await backendRes.json().catch(() => ({}));
      const msg = String(errorData.message || "").toLowerCase();
      if (backendRes.status === 403 || msg.includes("dinas") || msg.includes("admin")) {
        const target = new URL(`/masuk?error=google_dinas_terlarang`, request.url);
        return new Response(null, { status: SEE_OTHER_STATUS, headers: { Location: target.toString() } });
      }
      const target = new URL(`/masuk?error=google_gagal`, request.url);
      return new Response(null, { status: SEE_OTHER_STATUS, headers: { Location: target.toString() } });
    }

    const data = await backendRes.json();
    const targetPath = getSafeRedirect("pelapor", lanjut);
    const target = new URL(targetPath, request.url);

    const headers = new Headers({ Location: target.toString() });
    headers.append("Set-Cookie", `${SESSION_COOKIE}=${await signValue("pelapor")}; Path=/; HttpOnly; SameSite=Lax${SECURE_FLAG}`);
    headers.append("Set-Cookie", `govra_token=${data.token}; Path=/; HttpOnly; SameSite=Lax${SECURE_FLAG}`);
    headers.append("Set-Cookie", `govra_profile=${await signProfile(data.profile)}; Path=/; HttpOnly; SameSite=Lax${SECURE_FLAG}`);

    return new Response(null, { status: SEE_OTHER_STATUS, headers });
  } catch {
    const target = new URL(`/masuk?error=google_gagal`, request.url);
    return new Response(null, { status: SEE_OTHER_STATUS, headers: { Location: target.toString() } });
  }
}
