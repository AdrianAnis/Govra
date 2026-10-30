import type { Metadata } from "next";
import { cookies } from "next/headers";
import { Container } from "@/components/layout/container";
import { PageHeader } from "@/components/page-header";
import { FeedView } from "@/components/feed/feed-view";
import { currentTime } from "@/lib/clock";
import type { FeedItem } from "@/lib/data/feeds";

export const metadata: Metadata = { title: "Isu Terkini" };

const BFF_KEY = process.env.BFF_SHARED_KEY || "";
const API_BASE = process.env.API_BASE_URL || "http://localhost:8080";

async function loadInitialFeeds(): Promise<FeedItem[]> {
  const jar = await cookies();
  const token = jar.get("govra_token")?.value;
  const headers: Record<string, string> = { "X-BFF-Key": BFF_KEY };
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  try {
    const res = await fetch(`${API_BASE}/feeds`, {
      headers,
      cache: "no-store",
    });
    if (!res.ok) return [];
    const data = await res.json();
    return Array.isArray(data.items) ? data.items : [];
  } catch {
    return [];
  }
}

export default async function IssuesPage() {
  const now = currentTime();
  const initialFeeds = await loadInitialFeeds();

  return (
    <Container className="flex flex-col gap-6 py-6 sm:py-10">
      <PageHeader
        title="Isu Terkini"
        description="Dukung laporan sesama warga untuk menaikkan urgensi penanganan oleh dinas terkait."
      />

      <FeedView initialFeeds={initialFeeds} nowIso={now.toISOString()} />
    </Container>
  );
}
