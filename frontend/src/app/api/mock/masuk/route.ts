import { rejectCrossOrigin } from "@/lib/origin";
import { mockOnly } from "@/lib/mock-guard";
import { type Role, getSafeRedirect, safeNext, SESSION_COOKIE } from "@/lib/session";

const SEE_OTHER_STATUS = 303;

function roleFromEmail(email: string): Role {
  const name = email.trim().toLowerCase().split("@")[0] ?? "";
  if (name.startsWith("dinas")) {
    return "dinas";
  }
  return name.startsWith("admin") ? "admin" : "pelapor";
}

export async function POST(request: Request) {
  const blocked = mockOnly() ?? rejectCrossOrigin(request);
  if (blocked) {
    return blocked;
  }
  const form = await request.formData();
  const email = form.get("email");
  const role = roleFromEmail(typeof email === "string" ? email : "");
  const raw = form.get("lanjut");
  const next = safeNext(typeof raw === "string" ? raw : null);
  const target = new URL(getSafeRedirect(role, next), request.url);
  const headers = new Headers({ Location: target.toString() });
  headers.append("Set-Cookie", `${SESSION_COOKIE}=${role}; Path=/; HttpOnly; SameSite=Lax`);
  return new Response(null, { status: SEE_OTHER_STATUS, headers });
}
