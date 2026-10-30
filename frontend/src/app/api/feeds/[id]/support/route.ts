import { cookies } from "next/headers";
import { NextResponse } from "next/server";

const BFF_KEY = process.env.BFF_SHARED_KEY || "413016c9d4970e8030a87654f65c11321dd77c97ecf9f4d95d1beca837faddb2";
const API_BASE = process.env.API_BASE_URL || "http://localhost:8080";

export async function POST(
  _request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const { id } = await context.params;
  const jar = await cookies();
  const token = jar.get("govra_token")?.value;

  if (!token) {
    return NextResponse.json({ message: "Wajib masuk untuk mendukung laporan" }, { status: 401 });
  }

  try {
    const res = await fetch(`${API_BASE}/feeds/${encodeURIComponent(id)}/support`, {
      method: "POST",
      headers: {
        "X-BFF-Key": BFF_KEY,
        Authorization: `Bearer ${token}`,
      },
    });

    const data = await res.json();
    return NextResponse.json(data, { status: res.status });
  } catch {
    return NextResponse.json({ message: "Gagal mendukung laporan" }, { status: 500 });
  }
}
