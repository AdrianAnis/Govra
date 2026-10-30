import { NextResponse } from "next/server";

const BFF_KEY = process.env.BFF_SHARED_KEY || "";
const API_BASE = process.env.API_BASE_URL || "http://localhost:8080";

export async function POST(
  _request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const { id } = await context.params;

  try {
    const res = await fetch(`${API_BASE}/feeds/${encodeURIComponent(id)}/share`, {
      method: "POST",
      headers: {
        "X-BFF-Key": BFF_KEY,
      },
    });

    const data = await res.json();
    return NextResponse.json(data, { status: res.status });
  } catch {
    return NextResponse.json({ message: "Gagal membagikan postingan" }, { status: 500 });
  }
}
