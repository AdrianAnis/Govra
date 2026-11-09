import { cookies } from "next/headers";
import { getSafeRedirect, safeNext, SESSION_COOKIE } from "@/lib/session";
import { SECURE_FLAG } from "@/lib/cookie-flags";
import { signProfile, signValue } from "@/lib/session-sign";

const BFF_KEY = process.env.BFF_SHARED_KEY || "";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const stateParam = url.searchParams.get("state");
  const errorParam = url.searchParams.get("error");
  const errorDescription = (url.searchParams.get("error_description") || "").toLowerCase();

  const cookieStore = await cookies();
  const rawFlowCookie = cookieStore.get("govra_oauth_flow")?.value;

  let mode = "masuk";
  let lanjut = "/pelapor";
  let flowType = "supabase";
  let codeVerifier = "";
  let savedState = "";

  if (rawFlowCookie) {
    try {
      const parsed = JSON.parse(decodeURIComponent(rawFlowCookie));
      if (parsed.mode === "daftar") {
        mode = "daftar";
      }
      if (parsed.lanjut) {
        lanjut = safeNext(parsed.lanjut);
      }
      if (parsed.type) {
        flowType = parsed.type;
      }
      if (parsed.codeVerifier) {
        codeVerifier = parsed.codeVerifier;
      }
      if (parsed.state) {
        savedState = parsed.state;
      }
    } catch {}
  }

  if (errorParam || errorDescription) {
    if (errorDescription.includes("provider is not enabled") || errorDescription.includes("unsupported provider")) {
      return Response.redirect(new URL(`/${mode}?error=supabase_google_unconfigured`, request.url).toString(), 302);
    }
    if (errorParam === "access_denied" || errorDescription.includes("denied") || errorDescription.includes("cancel")) {
      return Response.redirect(new URL(`/${mode}?error=google_batal`, request.url).toString(), 302);
    }
    return Response.redirect(new URL(`/${mode}?error=google_gagal`, request.url).toString(), 302);
  }

  if (!code) {
    return Response.redirect(new URL(`/${mode}?error=google_gagal`, request.url).toString(), 302);
  }

  let email = "";
  let displayName = "";
  let avatarUrl = "";

  if (flowType === "google") {
    if (!savedState || !stateParam || savedState !== stateParam) {
      return Response.redirect(new URL(`/${mode}?error=google_gagal`, request.url).toString(), 302);
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
        return Response.redirect(new URL(`/${mode}?error=google_gagal`, request.url).toString(), 302);
      }

      const tokenData = await tokenRes.json();
      const userRes = await fetch("https://www.googleapis.com/oauth2/v3/userinfo", {
        headers: { Authorization: `Bearer ${tokenData.access_token}` },
      });

      if (!userRes.ok) {
        return Response.redirect(new URL(`/${mode}?error=google_gagal`, request.url).toString(), 302);
      }

      const userData = await userRes.json();
      email = String(userData.email || "").trim().toLowerCase();
      displayName = String(userData.name || userData.given_name || email.split("@")[0]).trim();
      avatarUrl = String(userData.picture || "").trim();
    } catch {
      return Response.redirect(new URL(`/${mode}?error=google_gagal`, request.url).toString(), 302);
    }
  } else {
    if (!codeVerifier) {
      return Response.redirect(new URL(`/${mode}?error=google_gagal`, request.url).toString(), 302);
    }

    const rawUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || "";
    const cleanSupabaseUrl = rawUrl.replace(/\/rest\/v1\/?$/, "").replace(/\/+$/, "");
    const supabaseKey =
      process.env.SUPABASE_SERVICE_ROLE_KEY ||
      process.env.SUPABASE_ANON_KEY ||
      process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
      "";

    try {
      const tokenRes = await fetch(`${cleanSupabaseUrl}/auth/v1/token?grant_type=pkce`, {
        method: "POST",
        headers: {
          apikey: supabaseKey,
          Authorization: `Bearer ${supabaseKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          auth_code: code,
          code_verifier: codeVerifier,
        }),
      });

      if (!tokenRes.ok) {
        return Response.redirect(new URL(`/${mode}?error=google_gagal`, request.url).toString(), 302);
      }

      const tokenData = await tokenRes.json();
      const user = tokenData.user;
      if (!user || !user.email) {
        return Response.redirect(new URL(`/${mode}?error=google_gagal`, request.url).toString(), 302);
      }

      email = String(user.email).trim().toLowerCase();
      const metadata = user.user_metadata || {};
      displayName = String(metadata.full_name || metadata.name || email.split("@")[0]).trim();
      avatarUrl = String(metadata.avatar_url || metadata.picture || "").trim();
    } catch {
      return Response.redirect(new URL(`/${mode}?error=google_gagal`, request.url).toString(), 302);
    }
  }

  if (!email) {
    return Response.redirect(new URL(`/${mode}?error=google_gagal`, request.url).toString(), 302);
  }

  try {
    const apiBase = process.env.API_BASE_URL || "http://localhost:8080";
    const backendRes = await fetch(`${apiBase}/auth/oauth-login`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-BFF-Key": BFF_KEY,
      },
      body: JSON.stringify({
        email,
        display_name: displayName,
        avatar_url: avatarUrl,
        provider: "google",
        mode,
      }),
    });

    if (!backendRes.ok) {
      const errData = await backendRes.json().catch(() => ({}));
      const msg = String(errData.message || "").toLowerCase();

      if (mode === "daftar" && (msg.includes("sudah terdaftar") || backendRes.status === 400)) {
        return Response.redirect(new URL("/masuk?error=email_sudah_terdaftar", request.url).toString(), 302);
      }
      if (mode === "masuk" && (msg.includes("belum terdaftar") || backendRes.status === 400)) {
        return Response.redirect(new URL("/daftar?error=akun_belum_terdaftar", request.url).toString(), 302);
      }
      if (msg.includes("dinas") || msg.includes("admin") || backendRes.status === 403) {
        return Response.redirect(new URL("/masuk?error=google_dinas_terlarang", request.url).toString(), 302);
      }
      if (msg.includes("nonaktif")) {
        return Response.redirect(new URL("/masuk?error=akun_nonaktif", request.url).toString(), 302);
      }
      return Response.redirect(new URL(`/${mode}?error=google_gagal`, request.url).toString(), 302);
    }

    const data = await backendRes.json();
    const targetPath = getSafeRedirect("pelapor", lanjut);
    const target = new URL(targetPath, request.url);

    const headers = new Headers({ Location: target.toString() });
    headers.append("Set-Cookie", `${SESSION_COOKIE}=${await signValue("pelapor")}; Path=/; HttpOnly; SameSite=Lax${SECURE_FLAG}`);
    headers.append("Set-Cookie", `govra_token=${data.token}; Path=/; HttpOnly; SameSite=Lax${SECURE_FLAG}`);
    headers.append("Set-Cookie", `govra_profile=${await signProfile(data.profile)}; Path=/; HttpOnly; SameSite=Lax${SECURE_FLAG}`);
    headers.append("Set-Cookie", `govra_oauth_flow=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0${SECURE_FLAG}`);

    return new Response(null, { status: 302, headers });
  } catch {
    return Response.redirect(new URL(`/${mode}?error=google_gagal`, request.url).toString(), 302);
  }
}
