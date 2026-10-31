import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/data/session";
import { getProgramUpdateHistory } from "@/lib/data/pemerintah";
import { getErrorMessage } from "@/lib/error-message";

export async function GET(
  _request: Request,
  context: { params: Promise<{ id: string }> }
) {
  const user = await getSessionUser();
  if (!user || (user.role !== "kepala_daerah" && user.role !== "admin" && user.role !== "dinas")) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  const { id } = await context.params;
  try {
    const history = await getProgramUpdateHistory(id);
    return NextResponse.json({ updates: history }, { status: 200 });
  } catch (err) {
    return NextResponse.json({ error: getErrorMessage(err, "Gagal mengambil riwayat perkembangan") }, { status: 500 });
  }
}
