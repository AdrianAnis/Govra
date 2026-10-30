import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/data/session";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://gtsskmxircedhfggqena.supabase.co";
const serviceKey =
  process.env.SUPABASE_SERVICE_ROLE_KEY ||
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imd0c3NrbXhpcmNlZGhmZ2dxZW5hIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc5MjY2MzM1MywiZXhwIjoyMTA4MjM5MzUzfQ.ATvm9u6Dm2cSZ_IiUkajOiIGgXA13jJgC8lU-LrXTXY";

export async function POST(request: Request) {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ error: "Sesi tidak valid atau telah berakhir" }, { status: 401 });
  }

  try {
    const formData = await request.formData();
    const file = formData.get("file");

    if (!file || !(file instanceof File)) {
      return NextResponse.json({ error: "File tidak ditemukan dalam permintaan" }, { status: 400 });
    }

    const allowedTypes = ["image/jpeg", "image/png", "image/webp", "image/jpg"];
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json(
        { error: "Format file tidak didukung. Harap unggah file gambar (JPG, PNG, atau WebP)." },
        { status: 400 }
      );
    }

    if (file.size > 5 * 1024 * 1024) {
      return NextResponse.json(
        { error: "Ukuran file terlalu besar. Maksimal 5 MB per gambar." },
        { status: 400 }
      );
    }

    const ext = file.name.split(".").pop() || "jpg";
    const cleanExt = ext.toLowerCase().replace(/[^a-z0-9]/g, "");
    const filename = `proker-${Date.now()}-${Math.random().toString(36).slice(2, 9)}.${cleanExt || "jpg"}`;

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    const uploadRes = await fetch(`${supabaseUrl}/storage/v1/object/reports/${filename}`, {
      method: "POST",
      headers: {
        apikey: serviceKey,
        Authorization: `Bearer ${serviceKey}`,
        "Content-Type": file.type || "image/jpeg",
      },
      body: buffer,
    });

    if (!uploadRes.ok) {
      const errText = await uploadRes.text();
      return NextResponse.json(
        { error: "Gagal mengunggah gambar ke penyimpanan server: " + errText },
        { status: 502 }
      );
    }

    const publicUrl = `${supabaseUrl}/storage/v1/object/public/reports/${filename}`;
    return NextResponse.json({ url: publicUrl, filename }, { status: 200 });
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message || "Terjadi kesalahan internal saat mengunggah berkas" },
      { status: 500 }
    );
  }
}
