import crypto from "node:crypto";
import { safeNext } from "@/lib/session";
import { SECURE_FLAG } from "@/lib/cookie-flags";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const mode = url.searchParams.get("mode") === "daftar" ? "daftar" : "masuk";
  const lanjut = safeNext(url.searchParams.get("lanjut"));
  const googleClientId = process.env.GOOGLE_CLIENT_ID;

  const redirectUri = `${url.origin}/api/auth/callback/google`;

  if (googleClientId) {
    const state = crypto.randomUUID();
    const googleAuthUrl = new URL("https://accounts.google.com/o/oauth2/v2/auth");
    googleAuthUrl.searchParams.set("client_id", googleClientId);
    googleAuthUrl.searchParams.set("redirect_uri", redirectUri);
    googleAuthUrl.searchParams.set("response_type", "code");
    googleAuthUrl.searchParams.set("scope", "openid email profile");
    googleAuthUrl.searchParams.set("state", state);
    googleAuthUrl.searchParams.set("prompt", "select_account");

    const flowPayload = encodeURIComponent(
      JSON.stringify({
        type: "google",
        state,
        mode,
        lanjut,
      }),
    );

    const headers = new Headers({
      Location: googleAuthUrl.toString(),
    });
    headers.append(
      "Set-Cookie",
      `govra_oauth_flow=${flowPayload}; Path=/; HttpOnly; SameSite=Lax; Max-Age=600${SECURE_FLAG}`,
    );

    return new Response(null, { status: 302, headers });
  }

  const rawUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || "";
  const cleanSupabaseUrl = rawUrl.replace(/\/rest\/v1\/?$/, "").replace(/\/+$/, "");

  if (!cleanSupabaseUrl) {
    const errorTarget = new URL(`/${mode}?error=supabase_tidak_tersedia`, request.url);
    return Response.redirect(errorTarget.toString(), 302);
  }

  const codeVerifier = crypto.randomBytes(32).toString("base64url");
  const codeChallenge = crypto.createHash("sha256").update(codeVerifier).digest("base64url");

  const authorizeUrl = new URL(`${cleanSupabaseUrl}/auth/v1/authorize`);
  authorizeUrl.searchParams.set("provider", "google");
  authorizeUrl.searchParams.set("redirect_to", redirectUri);
  authorizeUrl.searchParams.set("code_challenge", codeChallenge);
  authorizeUrl.searchParams.set("code_challenge_method", "s256");
  authorizeUrl.searchParams.set("prompt", "select_account");

  const flowPayload = encodeURIComponent(
    JSON.stringify({
      type: "supabase",
      codeVerifier,
      mode,
      lanjut,
    }),
  );

  const headers = new Headers({
    Location: authorizeUrl.toString(),
  });
  headers.append(
    "Set-Cookie",
    `govra_oauth_flow=${flowPayload}; Path=/; HttpOnly; SameSite=Lax; Max-Age=600${SECURE_FLAG}`,
  );

  return new Response(null, { status: 302, headers });
}
