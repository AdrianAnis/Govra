import { errorResponse } from "@/lib/api-response";
import { submitFeedback } from "@/lib/data/reports";
import { rejectCrossOrigin } from "@/lib/origin";
import { feedbackSchema } from "@/lib/report-draft";

const INVALID_STATUS = 422;
const CONFLICT_STATUS = 409;

export async function POST(request: Request, context: { params: Promise<{ code: string }> }) {
  const rejected = rejectCrossOrigin(request);
  if (rejected) {
    return rejected;
  }
  const payload: unknown = await request.json().catch(() => null);
  const parsed = feedbackSchema.safeParse(payload);
  if (!parsed.success) {
    return errorResponse("VALIDATION_ERROR", "Permintaan tidak valid.", INVALID_STATUS);
  }
  const { code } = await context.params;
  const result = await submitFeedback(code, parsed.data.outcome);
  if (!result) {
    return errorResponse("CONFLICT", "Umpan balik tidak dapat dikirim untuk laporan ini.", CONFLICT_STATUS);
  }
  return Response.json(result);
}
