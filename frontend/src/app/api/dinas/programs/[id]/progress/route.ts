import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/data/session";
import { addDinasProgramProgress } from "@/lib/data/pemerintah";

export async function POST(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  const user = await getSessionUser();
  if (!user || user.role !== "dinas" || !user.opdId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  const { id } = await context.params;
  try {
    const body = await request.json();
    if (!body.content || !body.content.trim()) {
      return NextResponse.json({ error: "Catatan perkembangan wajib diisi" }, { status: 400 });
    }

    const result = await addDinasProgramProgress(id, user.opdId, body);
    if (!result.success) {
      return NextResponse.json({ error: result.error || "Gagal mencatat perkembangan" }, { status: 400 });
    }

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Terjadi kesalahan server" }, { status: 500 });
  }
}
