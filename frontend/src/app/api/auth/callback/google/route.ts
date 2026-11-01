import { cookies } from "next/headers";
import { getSafeRedirect, safeNext, SESSION_COOKIE } from "@/lib/session";
import { SECURE_FLAG } from "@/lib/cookie-flags";
import { signProfile, signValue } from "@/lib/session-sign";

const BFF_KEY = process.env.BFF_SHARED_KEY || "";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const state = url.searchParams.get("state");
  const errorParam = url.searchParams.get("error");

  if (errorParam) {
    return Response.redirect(new URL("/masuk?error=google_batal", request.url).toString(), 302);
  }

  if (!code || !state) {
    return Response.redirect(new URL("/masuk?error=google_gagal", request.url).toString(), 302);
  }

  const cookieStore = await cookies();
  const rawStateCookie = cookieStore.get("govra_oauth_state")?.value;
  let targetLanjut = "/pelapor";

  try {
    const parsedState = JSON.parse(decodeURIComponent(rawStateCookie || "{}"));
    if (parsedState.state !== state) {
      return Response.redirect(new URL("/masuk?error=google_gagal", request.url).toString(), 302);
    }
    if (parsedState.lanjut) {
      targetLanjut = safeNext(parsedState.lanjut);
    }
  } catch {
    return Response.redirect(new URL("/masuk?error=google_gagal", request.url).toString(), 302);
  }

  const clientId = process.env.GOOGLE_CLIENT_ID || "";
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET || "";
  const redirectUri = `${url.origin}/api/auth/callback/google`;

  try {
    const tokenRes = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        code,
        client_id: clientId,
        client_secret: clientSecret,
        redirect_uri: redirectUri,
        grant_type: "authorization_code",
      }),
    });

    if (!tokenRes.ok) {
      return Response.redirect(new URL("/masuk?error=google_gagal", request.url).toString(), 302);
    }

    const tokenData = await tokenRes.json();
    const userRes = await fetch("https://www.googleapis.com/oauth2/v3/userinfo", {
      headers: { Authorization: `Bearer ${tokenData.access_token}` },
    });

    if (!userRes.ok) {
      return Response.redirect(new URL("/masuk?error=google_gagal", request.url).toString(), 302);
    }

    const userData = await userRes.json();
    const apiBase = process.env.API_BASE_URL || "http://localhost:8080";

    const backendRes = await fetch(`${apiBase}/auth/oauth-login`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-BFF-Key": BFF_KEY,
      },
      body: JSON.stringify({
        email: userData.email,
        display_name: userData.name || userData.email,
        avatar_url: userData.picture || "",
        provider: "google",
      }),
    });

    if (!backendRes.ok) {
      const errorData = await backendRes.json().catch(() => ({}));
      const msg = String(errorData.message || "").toLowerCase();
      if (backendRes.status === 403 || msg.includes("dinas") || msg.includes("admin")) {
        return Response.redirect(new URL("/masuk?error=google_dinas_terlarang", request.url).toString(), 302);
      }
      return Response.redirect(new URL("/masuk?error=google_gagal", request.url).toString(), 302);
    }

    const data = await backendRes.json();
    const targetPath = getSafeRedirect("pelapor", targetLanjut);
    const target = new URL(targetPath, request.url);

    const headers = new Headers({ Location: target.toString() });
    headers.append("Set-Cookie", `${SESSION_COOKIE}=${await signValue("pelapor")}; Path=/; HttpOnly; SameSite=Lax${SECURE_FLAG}`);
    headers.append("Set-Cookie", `govra_token=${data.token}; Path=/; HttpOnly; SameSite=Lax${SECURE_FLAG}`);
    headers.append("Set-Cookie", `govra_profile=${await signProfile(data.profile)}; Path=/; HttpOnly; SameSite=Lax${SECURE_FLAG}`);
    headers.append("Set-Cookie", `govra_oauth_state=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0${SECURE_FLAG}`);

    return new Response(null, { status: 302, headers });
  } catch {
    return Response.redirect(new URL("/masuk?error=google_gagal", request.url).toString(), 302);
  }
}
