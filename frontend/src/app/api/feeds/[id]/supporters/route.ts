import { NextResponse } from "next/server";

const BFF_KEY = process.env.BFF_SHARED_KEY || "";
const API_BASE = process.env.API_BASE_URL || "http://localhost:8080";

export async function GET(
  _request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const { id } = await context.params;

  try {
    const res = await fetch(`${API_BASE}/feeds/${encodeURIComponent(id)}/supporters`, {
      method: "GET",
      headers: {
        "X-BFF-Key": BFF_KEY,
      },
      cache: "no-store",
    });

    if (!res.ok) {
      return NextResponse.json({ items: [], total: 0 }, { status: res.status });
    }
    const data = await res.json();
    return NextResponse.json(data);
  } catch {
    return NextResponse.json({ items: [], total: 0 }, { status: 500 });
  }
}
