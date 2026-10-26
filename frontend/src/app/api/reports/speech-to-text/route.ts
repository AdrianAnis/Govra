import { errorResponse } from "@/lib/api-response";
import { rejectCrossOrigin } from "@/lib/origin";

const BFF_KEY = process.env.BFF_SHARED_KEY || "413016c9d4970e8030a87654f65c11321dd77c97ecf9f4d95d1beca837faddb2";

export async function POST(request: Request) {
  const rejected = rejectCrossOrigin(request);
  if (rejected) {
    return rejected;
  }
  try {
    const json = await request.json();
    const audioBase64 = String(json.audio_base64 || "");
    const mimeType = String(json.mime_type || "audio/webm");

    if (!audioBase64) {
      return errorResponse("BAD_REQUEST", "Data audio wajib disertakan", 400);
    }

    const apiBase = process.env.API_BASE_URL || "http://127.0.0.1:8080";
    const targetUrl = apiBase.replace("localhost", "127.0.0.1");
    const res = await fetch(`${targetUrl}/reports/speech-to-text`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-BFF-Key": BFF_KEY,
      },
      body: JSON.stringify({ audio_base64: audioBase64, mime_type: mimeType }),
    });

    if (!res.ok) {
      const errText = await res.text();
      console.error("[STT BFF Error]", res.status, errText);
      return errorResponse("STT_FAILED", "Gagal memproses suara ke teks: " + errText, 500);
    }

    const data = await res.json();
    return Response.json({ transcript: data.transcript });
  } catch (err) {
    console.error("[STT Internal Error]", err);
    return errorResponse("INTERNAL_ERROR", "Terjadi kesalahan server saat transkripsi: " + String(err), 500);
  }
}
