import { matchesQuery, paginate, type PageParams } from "@/lib/data/paging";
import { PROGRAM_DETAILS } from "@/lib/mock/programs";
import { goalRef, districtRef, opdRef } from "@/lib/mock/reference";
import type { Schema } from "@/lib/schema";

const supabaseUrl = process.env.SUPABASE_URL || "https://gtsskmxircedhfggqena.supabase.co";
const supabaseKey =
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || "";

export interface ProgramFilters extends PageParams {
  q?: string | undefined;
  opd?: string | undefined;
  district_id?: string | undefined;
  goal?: string | undefined;
  status?: Schema<"ProgramStatus"> | undefined;
}

type Program = Schema<"ProgramDetail">;

function toSummary(program: Program): Schema<"ProgramSummary"> {
  return {
    code: program.code,
    name: program.name,
    opd: program.opd,
    goal: program.goal,
    district: program.district,
    status: program.status,
    progress_percent: program.progress_percent,
    expected_percent: program.expected_percent,
    start_date: program.start_date,
    end_date: program.end_date,
    related_issue_count: program.related_issue_count,
  };
}

function matches(program: Program, filters: ProgramFilters): boolean {
  const searchable = `${program.code} ${program.name} ${program.opd.name} ${program.district.name} ${program.goal.name}`;
  return (
    matchesQuery(searchable, filters.q) &&
    (!filters.opd || program.opd.slug === filters.opd) &&
    (!filters.district_id || program.district.id === filters.district_id) &&
    (!filters.goal || program.goal.code === filters.goal) &&
    (!filters.status || program.status === filters.status)
  );
}

function mapSupabaseToDetail(
  p: any,
  opdMap: Map<string, { code: string; name: string; slug: string }>,
  updatesMap: Map<string, any[]>
): Program {
  const opdInfo = (p.opd_id && opdMap.get(p.opd_id)) || {
    code: "BMSDA",
    name: "Dinas Bina Marga dan Penataan Ruang",
    slug: "bmsda",
  };

  const target = Number(p.target_output) || 100;
  const realization = Number(p.realization_output) || 0;
  const progressPercent = target > 0 ? Math.min(100, Math.round((realization / target) * 100)) : 0;

  const startMs = Date.parse(p.start_date || "2026-01-01");
  const endMs = Date.parse(p.end_date || "2026-12-31");
  const nowMs = Date.now();
  const duration = Math.max(1, endMs - startMs);
  const elapsed = Math.max(0, Math.min(duration, nowMs - startMs));
  const expectedPercent = Math.round((elapsed / duration) * 100);

  let status: Schema<"ProgramStatus"> = "SESUAI_JADWAL";
  const rawStatus = (p.status || "").toUpperCase();
  if (rawStatus === "SELESAI" || progressPercent >= 100) {
    status = "SELESAI";
  } else if (rawStatus === "BELUM_DIMULAI" || nowMs < startMs) {
    status = "BELUM_DIMULAI";
  } else if (rawStatus === "MELEWATI_TENGGAT" || nowMs > endMs) {
    status = "MELEWATI_TENGGAT";
  } else if (rawStatus === "TERLAMBAT" || progressPercent < expectedPercent - 15) {
    status = "TERLAMBAT";
  }

  const pUpdates = updatesMap.get(p.id) || [];

  return {
    code: p.code,
    name: p.name,
    opd: {
      code: opdInfo.code,
      name: opdInfo.name,
      slug: opdInfo.slug,
    },
    goal: {
      code: "INFRA_JALAN",
      name: "Infrastruktur jalan mantap",
    },
    district: {
      id: "0197a000-0000-7000-8000-000000000001",
      name: "Kecamatan Utara",
    },
    status,
    progress_percent: progressPercent,
    expected_percent: expectedPercent,
    start_date: p.start_date || "2026-01-01",
    end_date: p.end_date || "2026-12-31",
    related_issue_count: 0,
    indicator: "Persentase Capaian Program Kerja",
    target,
    unit: p.target_unit || "%",
    realization,
    budget: {
      ceiling: Number(p.budget_pagu) || 0,
      realized: Number(p.budget_realization) || 0,
    },
    milestones: [
      { name: "Perencanaan dan Pelelangan", due_date: p.start_date || "2026-01-01", done: true },
      { name: "Pelaksanaan Konstruksi / Pengerjaan", due_date: "2026-06-30", done: progressPercent >= 50 },
      { name: "Serah Terima Hasil Pekerjaan", due_date: p.end_date || "2026-12-31", done: progressPercent >= 100 },
    ],
    documentation: (() => {
      const docs: Array<{ url: string; caption: string }> = [];
      for (const u of pUpdates) {
        if (Array.isArray(u.documentation_photos)) {
          for (const photoUrl of u.documentation_photos) {
            if (typeof photoUrl === "string" && photoUrl.trim().length > 0) {
              docs.push({
                url: photoUrl,
                caption: u.title || "Dokumentasi Lapangan",
              });
            }
          }
        }
      }
      return docs;
    })(),
    updates: pUpdates
      .filter((u: any) => u.title !== "PENUGASAN_OPD")
      .map((u: any) => {
        let photos: string[] = [];
        if (Array.isArray(u.documentation_photos)) {
          photos = u.documentation_photos.filter(
            (url: any) => typeof url === "string" && url.trim().length > 0
          );
        }
        return {
          date: (u.created_at || "").slice(0, 10) || "2026-10-30",
          note: u.title ? `${u.title}: ${u.content}` : u.content,
          progress_percent: u.progress_percentage ?? progressPercent,
          photos,
        };
      }),
  };
}

export async function listPrograms(filters: ProgramFilters = {}): Promise<Schema<"ProgramList">> {
  try {
    const [progsRes, opdsRes, updatesRes] = await Promise.all([
      fetch(`${supabaseUrl}/rest/v1/programs?select=*&order=code.asc`, {
        headers: { apikey: supabaseKey, Authorization: `Bearer ${supabaseKey}`, "Accept-Profile": "app" },
        cache: "no-store",
      }),
      fetch(`${supabaseUrl}/rest/v1/opds?select=id,code,name,slug`, {
        headers: { apikey: supabaseKey, Authorization: `Bearer ${supabaseKey}`, "Accept-Profile": "app" },
        cache: "no-store",
      }),
      fetch(`${supabaseUrl}/rest/v1/program_updates?select=*&order=created_at.desc`, {
        headers: { apikey: supabaseKey, Authorization: `Bearer ${supabaseKey}`, "Accept-Profile": "app" },
        cache: "no-store",
      }),
    ]);

    if (progsRes.ok && opdsRes.ok) {
      const progs = await progsRes.json();
      const opds = await opdsRes.json();
      const updates = updatesRes.ok ? await updatesRes.json() : [];

      if (Array.isArray(progs) && progs.length > 0) {
        const opdMap = new Map<string, { code: string; name: string; slug: string }>();
        for (const o of opds) {
          opdMap.set(o.id, { code: o.code, name: o.name, slug: o.slug || o.code.toLowerCase() });
        }

        const updatesMap = new Map<string, any[]>();
        for (const u of updates) {
          if (!u.program_id) continue;
          if (!updatesMap.has(u.program_id)) {
            updatesMap.set(u.program_id, []);
          }
          updatesMap.get(u.program_id)!.push(u);
        }

        const details = progs.map((p) => mapSupabaseToDetail(p, opdMap, updatesMap));
        const filtered = details.filter((p) => matches(p, filters)).map(toSummary);
        return paginate(filtered, filters);
      }
    }
  } catch {}

  const items = PROGRAM_DETAILS.filter((program) => matches(program, filters)).map(toSummary);
  return paginate(items, filters);
}

export async function getProgram(code: string): Promise<Program | null> {
  try {
    const [progsRes, opdsRes, updatesRes] = await Promise.all([
      fetch(`${supabaseUrl}/rest/v1/programs?code=eq.${encodeURIComponent(code)}&select=*`, {
        headers: { apikey: supabaseKey, Authorization: `Bearer ${supabaseKey}`, "Accept-Profile": "app" },
        cache: "no-store",
      }),
      fetch(`${supabaseUrl}/rest/v1/opds?select=id,code,name,slug`, {
        headers: { apikey: supabaseKey, Authorization: `Bearer ${supabaseKey}`, "Accept-Profile": "app" },
        cache: "no-store",
      }),
      fetch(`${supabaseUrl}/rest/v1/program_updates?select=*&order=created_at.desc`, {
        headers: { apikey: supabaseKey, Authorization: `Bearer ${supabaseKey}`, "Accept-Profile": "app" },
        cache: "no-store",
      }),
    ]);

    if (progsRes.ok && opdsRes.ok) {
      const progs = await progsRes.json();
      const opds = await opdsRes.json();
      const updates = updatesRes.ok ? await updatesRes.json() : [];

      if (Array.isArray(progs) && progs.length > 0) {
        const opdMap = new Map<string, { code: string; name: string; slug: string }>();
        for (const o of opds) {
          opdMap.set(o.id, { code: o.code, name: o.name, slug: o.slug || o.code.toLowerCase() });
        }

        const updatesMap = new Map<string, any[]>();
        for (const u of updates) {
          if (!u.program_id) continue;
          if (!updatesMap.has(u.program_id)) {
            updatesMap.set(u.program_id, []);
          }
          updatesMap.get(u.program_id)!.push(u);
        }

        return mapSupabaseToDetail(progs[0], opdMap, updatesMap);
      }
    }
  } catch {}

  return PROGRAM_DETAILS.find((program) => program.code === code) ?? null;
}
