import { errorResponse } from "@/lib/api-response";
import { staffGuard } from "@/lib/auth-route";
import { readEvidence } from "@/lib/data/agency";

const NOT_FOUND_STATUS = 404;

export async function GET(request: Request, context: { params: Promise<{ id: string }> }) {
  const blocked = await staffGuard(request, "dinas");
  if (blocked) {
    return blocked;
  }
  const { id } = await context.params;
  const stored = readEvidence(id);
  if (!stored) {
    return errorResponse("NOT_FOUND", "Foto tidak ditemukan.", NOT_FOUND_STATUS);
  }
  return new Response(new Blob([stored.bytes], { type: stored.mime }), { headers: { "Content-Type": stored.mime } });
}
