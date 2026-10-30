import { NextResponse } from "next/server";
import { rejectCrossOrigin } from "@/lib/origin";

const BFF_KEY = process.env.BFF_SHARED_KEY || "";
const API_BASE = process.env.API_BASE_URL || "http://localhost:8080";

export async function POST(request: Request) {
  const rejected = rejectCrossOrigin(request);
  if (rejected) {
    return rejected;
  }

  try {
    const body = await request.json();
    const text = typeof body?.text === "string" ? body.text.trim() : "";
    const title = typeof body?.title === "string" ? body.title.trim() : "";

    if (!text) {
      return NextResponse.json({
        is_violation: false,
        violation_type: "NONE",
        confidence: 0.0,
      });
    }

    const res = await fetch(`${API_BASE}/reports/check-content`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-BFF-Key": BFF_KEY,
      },
      body: JSON.stringify({ text, title }),
      cache: "no-store",
    });

    if (!res.ok) {
      return NextResponse.json({
        is_violation: false,
        violation_type: "NONE",
        confidence: 0.0,
        topic: "Umum",
      });
    }

    const data = await res.json();
    return NextResponse.json(data);
  } catch {
    return NextResponse.json({
      is_violation: false,
      violation_type: "NONE",
      confidence: 0.0,
      topic: "Umum",
    });
  }
}
