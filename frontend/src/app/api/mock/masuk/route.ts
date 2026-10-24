import { errorResponse } from "@/lib/api-response";
import { rejectCrossOrigin } from "@/lib/origin";
import { safeNext, SESSION_COOKIE } from "@/lib/session";

const NOT_FOUND_STATUS = 404;
const SEE_OTHER_STATUS = 303;
const DEMO_ROLE = "pelapor";

export async function POST(request: Request) {
  if (process.env.NODE_ENV === "production") {
    return errorResponse("NOT_FOUND", "Tidak ditemukan.", NOT_FOUND_STATUS);
  }
  const rejected = rejectCrossOrigin(request);
  if (rejected) {
    return rejected;
  }
  const form = await request.formData();
  const raw = form.get("lanjut");
  const target = new URL(safeNext(typeof raw === "string" ? raw : null), request.url);
  const headers = new Headers({ Location: target.toString() });
  headers.append("Set-Cookie", `${SESSION_COOKIE}=${DEMO_ROLE}; Path=/; HttpOnly; SameSite=Lax`);
  return new Response(null, { status: SEE_OTHER_STATUS, headers });
}
