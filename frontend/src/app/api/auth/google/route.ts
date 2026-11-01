import { safeNext } from "@/lib/session";
import { SECURE_FLAG } from "@/lib/cookie-flags";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const lanjut = safeNext(url.searchParams.get("lanjut"));
  const clientId = process.env.GOOGLE_CLIENT_ID;

  if (!clientId) {
    const devUrl = new URL(`/masuk/google-dev?lanjut=${encodeURIComponent(lanjut)}`, request.url);
    return Response.redirect(devUrl.toString(), 302);
  }

  const state = crypto.randomUUID();
  const redirectUri = `${url.origin}/api/auth/callback/google`;
  const googleAuthUrl = new URL("https://accounts.google.com/o/oauth2/v2/auth");
  googleAuthUrl.searchParams.set("client_id", clientId);
  googleAuthUrl.searchParams.set("redirect_uri", redirectUri);
  googleAuthUrl.searchParams.set("response_type", "code");
  googleAuthUrl.searchParams.set("scope", "openid email profile");
  googleAuthUrl.searchParams.set("state", state);
  googleAuthUrl.searchParams.set("prompt", "select_account");

  const stateValue = encodeURIComponent(JSON.stringify({ state, lanjut }));
  const headers = new Headers({
    Location: googleAuthUrl.toString(),
  });
  headers.append(
    "Set-Cookie",
    `govra_oauth_state=${stateValue}; Path=/; HttpOnly; SameSite=Lax; Max-Age=600${SECURE_FLAG}`,
  );

  return new Response(null, { status: 302, headers });
}
