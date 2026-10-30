import { cookies } from "next/headers";
import type { ReportMapPoint } from "@/components/admin/admin-distribution-map";

const BFF_KEY = process.env.BFF_SHARED_KEY || "413016c9d4970e8030a87654f65c11321dd77c97ecf9f4d95d1beca837faddb2";

const OPD_NAMES: Record<string, string> = {
  "e0000000-0000-0000-0000-000000000001": "Dinas Bina Marga & SDA",
  "e0000000-0000-0000-0000-000000000002": "Dinas Lingkungan Hidup & Kebersihan",
  "e0000000-0000-0000-0000-000000000003": "Dinas Perhubungan",
  "e0000000-0000-0000-0000-000000000004": "Dinas Kesehatan",
  "e0000000-0000-0000-0000-000000000005": "Satuan Polisi Pamong Praja",
  "e0000000-0000-0000-0000-000000000006": "Badan Penanggulangan Bencana Daerah",
  "e0000000-0000-0000-0000-000000000007": "Dinas PUPR",
};

export async function getDistributionPoints(opdId?: string): Promise<ReportMapPoint[]> {
  const apiBase = process.env.API_BASE_URL || "http://localhost:8080";
  try {
    const jar = await cookies();
    const token = jar.get("govra_token")?.value;
    const url = new URL(`${apiBase}/map/distribution`);
    if (opdId) {
      url.searchParams.set("opd", opdId);
    }
    const res = await fetch(url.toString(), {
      headers: {
        "X-BFF-Key": BFF_KEY,
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      next: { revalidate: 10 },
    });
    if (res.ok) {
      const data = await res.json();
      const raw = Array.isArray(data)
        ? data
        : Array.isArray(data.points)
        ? data.points
        : Array.isArray(data.items)
        ? data.items
        : [];
      if (raw.length > 0) {
        return raw.map((item: Record<string, any>) => ({
          id: item.id,
          code: item.code || "GVR",
          title: item.title,
          description: item.description || item.summary || "",
          status: item.status || "DITERUSKAN",
          urgency: item.urgency,
          opd_id: item.opd_id,
          opd_name: item.opd_name || (item.opd_id ? OPD_NAMES[item.opd_id] : undefined),
          address_detail: item.address_detail || "",
          cover_photo_url: item.cover_photo_url || "",
          lat: Number(item.point?.lat ?? item.lat ?? -6.9175),
          lng: Number(item.point?.lng ?? item.lng ?? 107.6191),
          created_at: item.created_at,
        }));
      }
    }
  } catch {}

  const supabaseUrl = process.env.SUPABASE_URL || "https://gtsskmxircedhfggqena.supabase.co";
  const supabaseKey =
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imd0c3NrbXhpcmNlZGhmZ2dxZW5hIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc5MjY2MzM1MywiZXhwIjoyMTA4MjM5MzUzfQ.ATvm9u6Dm2cSZ_IiUkajOiIGgXA13jJgC8lU-LrXTXY";

  try {
    let endpoint = `${supabaseUrl}/rest/v1/reports?select=id,code,title,description,status,opd_id,lat,lng,address_detail,created_at&order=created_at.desc&limit=150`;
    if (opdId) {
      endpoint += `&opd_id=eq.${encodeURIComponent(opdId)}`;
    }
    const [reportsRes, attachmentsRes] = await Promise.all([
      fetch(endpoint, {
        headers: {
          apikey: supabaseKey,
          Authorization: `Bearer ${supabaseKey}`,
          "Accept-Profile": "app",
        },
        next: { revalidate: 10 },
      }),
      fetch(`${supabaseUrl}/rest/v1/report_attachments?select=report_id,file_url&limit=300`, {
        headers: {
          apikey: supabaseKey,
          Authorization: `Bearer ${supabaseKey}`,
          "Accept-Profile": "app",
        },
        next: { revalidate: 60 },
      }).catch(() => null),
    ]);

    const photosByReport: Record<string, string> = {};
    if (attachmentsRes && attachmentsRes.ok) {
      const atts = await attachmentsRes.json();
      if (Array.isArray(atts)) {
        for (const a of atts) {
          if (a.file_url && !photosByReport[a.report_id]) {
            photosByReport[a.report_id] = a.file_url;
          }
        }
      }
    }

    if (reportsRes.ok) {
      const data = await reportsRes.json();
      return (data || []).map((item: Record<string, any>) => ({
        id: item.id,
        code: item.code || "GVR",
        title: item.title,
        description: item.description || "",
        status: item.status,
        opd_id: item.opd_id,
        opd_name: item.opd_id ? OPD_NAMES[item.opd_id] : undefined,
        address_detail: item.address_detail || "",
        cover_photo_url: photosByReport[item.id] || "",
        lat: Number(item.lat) || -6.9175,
        lng: Number(item.lng) || 107.6191,
        created_at: item.created_at,
      }));
    }
  } catch {}

  return [];
}
