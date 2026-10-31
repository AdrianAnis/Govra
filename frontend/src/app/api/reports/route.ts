import { cookies } from "next/headers";
import { errorResponse } from "@/lib/api-response";
import { createReport } from "@/lib/data/reports";
import { rejectCrossOrigin } from "@/lib/origin";
import { checkFile, createReportSchema, MAX_FILES } from "@/lib/report-draft";
import { directSupabase } from "@/lib/supabase-direct";

const CREATED_STATUS = 201;
const INVALID_STATUS = 422;
const BFF_KEY = process.env.BFF_SHARED_KEY || "";

function textOf(value: FormDataEntryValue | null): string {
  return typeof value === "string" ? value : "";
}

async function uploadToSupabaseStorage(file: File): Promise<string | null> {
  const { url: supabaseUrl, serviceKey } = directSupabase();
  if (!supabaseUrl || !serviceKey) {
    return null;
  }
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

export async function POST(request: Request) {
  const rejected = rejectCrossOrigin(request);
  if (rejected) {
    return rejected;
  }
  const form = await request.formData();
  const parsed = createReportSchema.safeParse({
    title: textOf(form.get("title")),
    body: textOf(form.get("body")),
    district_id: textOf(form.get("district_id")),
    village_id: textOf(form.get("village_id")),
    address_detail: textOf(form.get("address_detail")),
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

  const attachments = await Promise.all(
    files.map(async (file, idx) => {
      let url = await uploadToSupabaseStorage(file);
      if (!url) {
        const buf = Buffer.from(await file.arrayBuffer());
        url = `data:${file.type || "image/jpeg"};base64,${buf.toString("base64")}`;
      }
      const cleanMime: "image/webp" | "image/jpeg" | "image/png" =
        file.type === "image/png" ? "image/png" : file.type === "image/webp" ? "image/webp" : "image/jpeg";
      return {
        id: crypto.randomUUID(),
        file_url: url,
        url,
        mime_type: cleanMime,
        mime: cleanMime,
        file_size: file.size,
        size_bytes: file.size,
        is_cover: idx === 0,
        is_public_ok: true,
      };
    }),
  );

  const jar = await cookies();
  const token = jar.get("govra_token")?.value;
  const apiBase = process.env.API_BASE_URL || "http://localhost:8080";

  if (token) {
    try {
      const latNum = Number(parsed.data.lat) || -6.9175;
      const lngNum = Number(parsed.data.lng) || 107.6191;
      const backendRes = await fetch(`${apiBase}/reports`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
          "X-BFF-Key": BFF_KEY,
        },
        body: JSON.stringify({
          title: parsed.data.title,
          description: parsed.data.body,
          district_id: parsed.data.district_id,
          village_id: parsed.data.village_id,
          address_detail: parsed.data.address_detail,
          lat: latNum,
          lng: lngNum,
          visibility: parsed.data.visibility,
          attachments,
        }),
      });
      if (backendRes.ok) {
        const data = await backendRes.json();
        return Response.json(
          { code: data.code, status: data.status || "DIAJUKAN", created_at: data.created_at || new Date().toISOString() },
          { status: CREATED_STATUS },
        );
      }
    } catch {}
  }

  const created = await createReport({
    title: parsed.data.title,
    body: parsed.data.body,
    villageId: parsed.data.village_id,
    visibility: parsed.data.visibility,
    attachments,
  });
  if (!created) {
    return errorResponse("VALIDATION_ERROR", "Kelurahan tidak dikenali.", INVALID_STATUS);
  }
  return Response.json(created, { status: CREATED_STATUS });
}
