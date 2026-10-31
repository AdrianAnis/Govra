import { SECURE_FLAG } from "@/lib/cookie-flags";
import { SESSION_COOKIE } from "@/lib/session";

const SEE_OTHER_STATUS = 303;

function handleLogout(request: Request) {
  const headers = new Headers({ Location: new URL("/", request.url).toString() });
  headers.append("Set-Cookie", `${SESSION_COOKIE}=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0; Expires=Thu, 01 Jan 1970 00:00:00 GMT${SECURE_FLAG}`);
  headers.append("Set-Cookie", `govra_token=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0; Expires=Thu, 01 Jan 1970 00:00:00 GMT${SECURE_FLAG}`);
  headers.append("Set-Cookie", `govra_profile=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0; Expires=Thu, 01 Jan 1970 00:00:00 GMT${SECURE_FLAG}`);
  return new Response(null, { status: SEE_OTHER_STATUS, headers });
}

export async function GET(request: Request) {
  return handleLogout(request);
}

export async function POST(request: Request) {
  return handleLogout(request);
}
