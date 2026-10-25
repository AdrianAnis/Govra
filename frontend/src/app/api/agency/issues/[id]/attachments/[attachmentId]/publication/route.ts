import { errorResponse } from "@/lib/api-response";
import { publicationSchema } from "@/lib/agency";
import { invalid, readJson, staffGuard } from "@/lib/auth-route";
import { setPublication } from "@/lib/data/agency";

export async function PUT(request: Request, context: { params: Promise<{ id: string; attachmentId: string }> }) {
  const blocked = await staffGuard(request, "dinas");
  if (blocked) {
    return blocked;
  }
  const parsed = publicationSchema.safeParse(await readJson(request));
  if (!parsed.success) {
    return invalid(parsed.error.issues[0]?.message);
  }
  const { id, attachmentId } = await context.params;
  const outcome = await setPublication(id, attachmentId, parsed.data);
  return outcome.ok ? Response.json(outcome.value) : errorResponse("REJECTED", outcome.message, outcome.status);
}
