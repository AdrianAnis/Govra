import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/data/session";
import { deletePemerintahProgram, updatePemerintahProgram } from "@/lib/data/pemerintah";

export async function PUT(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  const user = await getSessionUser();
  if (!user || user.role !== "admin") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  const { id } = await context.params;
  try {
    const body = await request.json();
    const result = await updatePemerintahProgram(id, body);
    if (!result.success) {
      return NextResponse.json({ error: result.error || "Gagal memperbarui program kerja" }, { status: 400 });
    }

    return NextResponse.json(result.program, { status: 200 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Terjadi kesalahan server" }, { status: 500 });
  }
}

export async function DELETE(
  _request: Request,
  context: { params: Promise<{ id: string }> }
) {
  const user = await getSessionUser();
  if (!user || user.role !== "admin") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  const { id } = await context.params;
  try {
    const result = await deletePemerintahProgram(id);
    if (!result.success) {
      return NextResponse.json({ error: result.error || "Gagal menghapus program kerja" }, { status: 400 });
    }

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Terjadi kesalahan server" }, { status: 500 });
  }
}
