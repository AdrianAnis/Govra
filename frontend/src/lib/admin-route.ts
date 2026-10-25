import type { z } from "zod";
import { errorResponse } from "@/lib/api-response";
import { invalid, readJson, staffGuard } from "@/lib/auth-route";
import type { Outcome } from "@/lib/data/outcome";

const OK_STATUS = 200;

export async function adminAction<S extends z.ZodType, T>(
  request: Request,
  schema: S,
  run: (input: z.infer<S>) => Promise<Outcome<T>>,
  successStatus: number = OK_STATUS,
): Promise<Response> {
  const blocked = await staffGuard(request, "admin");
  if (blocked) {
    return blocked;
  }
  const parsed = schema.safeParse(await readJson(request));
  if (!parsed.success) {
    return invalid(parsed.error.issues[0]?.message);
  }
  const outcome = await run(parsed.data);
  return outcome.ok
    ? Response.json(outcome.value, { status: successStatus })
    : errorResponse("REJECTED", outcome.message, outcome.status);
}
