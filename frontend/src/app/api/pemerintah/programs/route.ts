import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/data/session";
import { createPemerintahProgram } from "@/lib/data/pemerintah";
import { getErrorMessage } from "@/lib/error-message";

export async function POST(request: Request) {
  const user = await getSessionUser();
  if (!user || (user.role !== "kepala_daerah" && user.role !== "admin")) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  try {
    const body = await request.json();
    if (!body.name || !body.name.trim()) {
      return NextResponse.json({ error: "Nama program kerja wajib diisi" }, { status: 400 });
    }

    const result = await createPemerintahProgram(body);
    if (!result.success) {
      return NextResponse.json({ error: result.error || "Gagal membuat program kerja" }, { status: 400 });
    }

    return NextResponse.json(result.program, { status: 201 });
  } catch (err) {
    return NextResponse.json({ error: getErrorMessage(err, "Terjadi kesalahan server") }, { status: 500 });
  }
}
