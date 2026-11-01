import crypto from "node:crypto";
import { safeNext } from "@/lib/session";
import { SECURE_FLAG } from "@/lib/cookie-flags";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const mode = url.searchParams.get("mode") === "daftar" ? "daftar" : "masuk";
  const lanjut = safeNext(url.searchParams.get("lanjut"));

  const rawUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || "";
  const cleanSupabaseUrl = rawUrl.replace(/\/rest\/v1\/?$/, "").replace(/\/+$/, "");

  if (!cleanSupabaseUrl) {
    const errorTarget = new URL(`/${mode}?error=supabase_tidak_tersedia`, request.url);
    return Response.redirect(errorTarget.toString(), 302);
  }

  const codeVerifier = crypto.randomBytes(32).toString("base64url");
  const codeChallenge = crypto.createHash("sha256").update(codeVerifier).digest("base64url");
  const redirectUri = `${url.origin}/api/auth/callback/google`;

  const authorizeUrl = new URL(`${cleanSupabaseUrl}/auth/v1/authorize`);
  authorizeUrl.searchParams.set("provider", "google");
  authorizeUrl.searchParams.set("redirect_to", redirectUri);
  authorizeUrl.searchParams.set("code_challenge", codeChallenge);
  authorizeUrl.searchParams.set("code_challenge_method", "s256");
  authorizeUrl.searchParams.set("prompt", "select_account");

  const flowPayload = encodeURIComponent(
    JSON.stringify({
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
