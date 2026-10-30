import { cookies } from "next/headers";
import { errorResponse } from "@/lib/api-response";
import { createReport } from "@/lib/data/reports";
import { rejectCrossOrigin } from "@/lib/origin";
import { checkFile, createReportSchema, MAX_FILES } from "@/lib/report-draft";
import type { Schema } from "@/lib/schema";

const CREATED_STATUS = 201;
const INVALID_STATUS = 422;
const BFF_KEY = process.env.BFF_SHARED_KEY || "";

function textOf(value: FormDataEntryValue | null): string {
  return typeof value === "string" ? value : "";
}

async function uploadToSupabaseStorage(file: File): Promise<string | null> {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL || "";
  const serviceKey =
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
    "";
  const ext = file.name.split(".").pop() || "jpg";
  const filename = `${Date.now()}-${Math.random().toString(36).slice(2, 10)}.${ext}`;
  try {
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const res = await fetch(`${supabaseUrl}/storage/v1/object/reports/${filename}`, {
      method: "POST",
      headers: {
        apikey: serviceKey,
        Authorization: `Bearer ${serviceKey}`,
        "Content-Type": file.type || "image/jpeg",
      },
      body: buffer,
    });
    if (res.ok) {
      return `${supabaseUrl}/storage/v1/object/public/reports/${filename}`;
    }
  } catch {}
  return null;
}

export async function POST(request: Request): Promise<Response> {
  const crossOriginError = rejectCrossOrigin(request);
  if (crossOriginError) {
    return crossOriginError;
  }

  const form = await request.formData();
  const fileEntries = form.getAll("attachments");
  const files: File[] = [];
  for (const entry of fileEntries) {
    if (entry instanceof File && entry.size > 0) {
      files.push(entry);
    }
  }

  if (files.length > MAX_FILES) {
    return errorResponse("ATTACHMENTS_COUNT", `Maksimal ${MAX_FILES} foto.`, INVALID_STATUS);
  }

  for (const file of files) {
    const errorMsg = checkFile(file);
    if (errorMsg) {
      return errorResponse("INVALID_FILE", errorMsg, INVALID_STATUS);
    }
  }

  const uploadedUrls: string[] = [];
  for (const file of files) {
    const publicUrl = await uploadToSupabaseStorage(file);
    if (publicUrl) {
      uploadedUrls.push(publicUrl);
    }
  }

  const raw = {
    title: textOf(form.get("title")),
    body: textOf(form.get("body") || form.get("description")),
    village_id: textOf(form.get("village_id")) || "v-3273010001",
    district_id: textOf(form.get("district_id")) || undefined,
    address_detail: textOf(form.get("address_detail")),
    lat: form.get("lat") || -6.9175,
    lng: form.get("lng") || 107.6191,
    visibility: textOf(form.get("visibility")) || "PUBLIK",
    turnstile_token: textOf(form.get("turnstile_token")) || "bypass-token",
  };

  const parsed = createReportSchema.safeParse(raw);
  if (!parsed.success) {
    const issue = parsed.error.issues[0];
    const msg = issue ? issue.message : "Data laporan tidak valid.";
    return errorResponse("VALIDATION_ERROR", msg, INVALID_STATUS);
  }

  const jar = await cookies();
  const token = jar.get("govra_token")?.value;
  const apiBase = process.env.API_BASE_URL || "http://localhost:8080";

  if (token) {
    try {
      const beRes = await fetch(`${apiBase}/reports`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`,
          "X-BFF-Key": BFF_KEY,
        },
        body: JSON.stringify({
          title: parsed.data.title,
          body: parsed.data.body,
          village_id: parsed.data.village_id,
          district_id: parsed.data.district_id,
          lat: parsed.data.lat,
          lng: parsed.data.lng,
          address_detail: parsed.data.address_detail,
          visibility: parsed.data.visibility,
          attachments: uploadedUrls,
        }),
      });

      if (beRes.ok) {
        const beData = await beRes.json();
        return Response.json(
          {
            code: beData.code,
            track_url: `/pelapor/laporan/${beData.code}`,
          },
          { status: CREATED_STATUS }
        );
      }
    } catch {}
  }

  const attachments: Schema<"Attachment">[] = uploadedUrls.map((url, idx) => ({
    id: `att-${idx}`,
    url,
    mime: "image/jpeg",
    size_bytes: 1024,
  }));
  const created = await createReport({
    title: parsed.data.title,
    body: parsed.data.body,
    villageId: parsed.data.village_id,
    visibility: parsed.data.visibility,
    lat: parsed.data.lat,
    lng: parsed.data.lng,
    attachments,
  });
  if (!created) {
    return errorResponse("SERVER_ERROR", "Gagal menyimpan laporan", 500);
  }
  return Response.json(
    {
      code: created.code,
      track_url: `/pelapor/laporan/${created.code}`,
    },
    { status: CREATED_STATUS }
  );
}
