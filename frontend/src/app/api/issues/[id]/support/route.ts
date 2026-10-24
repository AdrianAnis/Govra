import { errorResponse } from "@/lib/api-response";
import { supportIssue } from "@/lib/data/reports";
import { rejectCrossOrigin } from "@/lib/origin";

const NOT_FOUND_STATUS = 404;

export async function POST(request: Request, context: { params: Promise<{ id: string }> }) {
  const rejected = rejectCrossOrigin(request);
  if (rejected) {
    return rejected;
  }
  const { id } = await context.params;
  const result = await supportIssue(id);
  if (!result) {
    return errorResponse("NOT_FOUND", "Isu tidak ditemukan.", NOT_FOUND_STATUS);
  }
  return Response.json(result);
}
