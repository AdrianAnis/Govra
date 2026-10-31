import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/data/session";
import { addDinasProgramProgress, getProgramUpdateHistory } from "@/lib/data/pemerintah";
import { getErrorMessage } from "@/lib/error-message";

export async function GET(
  _request: Request,
  context: { params: Promise<{ id: string }> }
) {
  const user = await getSessionUser();
  if (!user || (user.role !== "dinas" && user.role !== "kepala_daerah" && user.role !== "admin")) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  const { id } = await context.params;
  try {
    const history = await getProgramUpdateHistory(id);
    return NextResponse.json({ updates: history }, { status: 200 });
  } catch (err) {
    return NextResponse.json({ error: getErrorMessage(err, "Gagal mengambil riwayat") }, { status: 500 });
  }
}

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
  } catch (err) {
    return NextResponse.json({ error: getErrorMessage(err, "Terjadi kesalahan server") }, { status: 500 });
  }
}
