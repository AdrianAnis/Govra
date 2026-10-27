import { NextResponse } from "next/server";

const BFF_KEY = process.env.BFF_SHARED_KEY || "413016c9d4970e8030a87654f65c11321dd77c97ecf9f4d95d1beca837faddb2";
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
