import { cookies } from "next/headers";
import { NextResponse } from "next/server";

const BFF_KEY = process.env.BFF_SHARED_KEY || "";
const API_BASE = process.env.API_BASE_URL || "http://localhost:8080";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const tab = searchParams.get("tab") || "trending";

  const jar = await cookies();
  const token = jar.get("govra_token")?.value;

  const headers: Record<string, string> = {
    "X-BFF-Key": BFF_KEY,
  };
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  try {
    const res = await fetch(`${API_BASE}/feeds?tab=${encodeURIComponent(tab)}`, {
      method: "GET",
      headers,
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

export async function POST(request: Request) {
  const jar = await cookies();
  const token = jar.get("govra_token")?.value;

  if (!token) {
    return NextResponse.json({ message: "Wajib masuk terlebih dahulu" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const res = await fetch(`${API_BASE}/feeds`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-BFF-Key": BFF_KEY,
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(body),
    });

    const data = await res.json();
    return NextResponse.json(data, { status: res.status });
  } catch {
    return NextResponse.json({ message: "Gagal membuat postingan" }, { status: 500 });
  }
}
