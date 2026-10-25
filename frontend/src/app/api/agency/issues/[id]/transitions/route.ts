import { errorResponse } from "@/lib/api-response";
import { transitionSchema } from "@/lib/agency";
import { invalid, readJson, staffGuard } from "@/lib/auth-route";
import { transitionIssue } from "@/lib/data/agency";

export async function POST(request: Request, context: { params: Promise<{ id: string }> }) {
  const blocked = await staffGuard(request, "dinas");
  if (blocked) {
    return blocked;
  }
  const parsed = transitionSchema.safeParse(await readJson(request));
  if (!parsed.success) {
    return invalid(parsed.error.issues[0]?.message);
  }
  const { id } = await context.params;
  const outcome = await transitionIssue(id, parsed.data);
  return outcome.ok ? Response.json(outcome.value) : errorResponse("REJECTED", outcome.message, outcome.status);
}
