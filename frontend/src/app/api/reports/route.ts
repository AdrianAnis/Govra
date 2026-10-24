import { errorResponse } from "@/lib/api-response";
import { createReport } from "@/lib/data/reports";
import { rejectCrossOrigin } from "@/lib/origin";
import { checkFile, createReportSchema, MAX_FILES } from "@/lib/report-draft";

const CREATED_STATUS = 201;
const INVALID_STATUS = 422;

function textOf(value: FormDataEntryValue | null): string {
  return typeof value === "string" ? value : "";
}

export async function POST(request: Request) {
  const rejected = rejectCrossOrigin(request);
  if (rejected) {
    return rejected;
  }
  const form = await request.formData();
  const parsed = createReportSchema.safeParse({
    title: textOf(form.get("title")),
    body: textOf(form.get("body")),
    village_id: textOf(form.get("village_id")),
    lat: textOf(form.get("lat")),
    lng: textOf(form.get("lng")),
    visibility: textOf(form.get("visibility")),
    turnstile_token: textOf(form.get("turnstile_token")),
  });
  if (!parsed.success) {
    return errorResponse("VALIDATION_ERROR", "Isi laporan belum lengkap atau tidak valid.", INVALID_STATUS);
  }
  const files = form.getAll("attachments").filter((entry): entry is File => entry instanceof File && entry.size > 0);
  const problem = files.map(checkFile).find((message) => message !== null);
  if (files.length > MAX_FILES || problem) {
    return errorResponse("VALIDATION_ERROR", problem ?? `Maksimal ${MAX_FILES} foto.`, INVALID_STATUS);
  }
  const created = await createReport({
    title: parsed.data.title,
    body: parsed.data.body,
    villageId: parsed.data.village_id,
    visibility: parsed.data.visibility,
  });
  if (!created) {
    return errorResponse("VALIDATION_ERROR", "Kelurahan tidak dikenali.", INVALID_STATUS);
  }
  return Response.json(created, { status: CREATED_STATUS });
}
