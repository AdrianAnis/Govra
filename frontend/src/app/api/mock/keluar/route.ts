import { errorResponse } from "@/lib/api-response";
import { SESSION_COOKIE } from "@/lib/session";

const NOT_FOUND_STATUS = 404;
const SEE_OTHER_STATUS = 303;

export async function GET(request: Request) {
  if (process.env.NODE_ENV === "production") {
    return errorResponse("NOT_FOUND", "Tidak ditemukan.", NOT_FOUND_STATUS);
  }
  const headers = new Headers({ Location: new URL("/", request.url).toString() });
  headers.append("Set-Cookie", `${SESSION_COOKIE}=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0`);
  return new Response(null, { status: SEE_OTHER_STATUS, headers });
}
