import { errorResponse } from "@/lib/api-response";
import { suggestDuplicates } from "@/lib/data/reports";
import { rejectCrossOrigin } from "@/lib/origin";
import { duplicateQuerySchema } from "@/lib/report-draft";

const INVALID_STATUS = 422;

export async function POST(request: Request) {
  const rejected = rejectCrossOrigin(request);
  if (rejected) {
    return rejected;
  }
  const payload: unknown = await request.json().catch(() => null);
  const parsed = duplicateQuerySchema.safeParse(payload);
  if (!parsed.success) {
    return errorResponse("VALIDATION_ERROR", "Permintaan tidak valid.", INVALID_STATUS);
  }
  return Response.json(await suggestDuplicates(parsed.data));
}
