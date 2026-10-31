import { getErrorMessage } from "@/lib/error-message";
import { directSupabase } from "@/lib/supabase-direct";

const { url: supabaseUrl, key: supabaseKey } = directSupabase();

interface PemerintahOverview {
  totalReports: number;
  resolvedReports: number;
  inProgressReports: number;
  pendingReports: number;
  completionRate: number;
  urgentIssuesCount: number;
  totalBudgetPagu: number;
  totalBudgetRealization: number;
  budgetRealizationRate: number;
  programsSummary: {
    total: number;
    onSchedule: number;
    delayed: number;
    completed: number;
  };
  opdCount: number;
}

interface UrgentIssueItem {
  id: string;
  code: string;
  title: string;
  summary: string;
  status: string;
  urgency: string;
  reportersCount: number;
  opdName: string;
  createdAt: string;
}

interface OpdPerformanceItem {
  id: string;
  code: string;
  name: string;
  totalReports: number;
  resolvedReports: number;
  inProgressReports: number;
  pendingReports: number;
  completionRate: number;
  statusGrade: "Sangat Baik" | "Baik" | "Perlu Perhatian";
}

interface IssueRow {
  id: string;
  code?: string | undefined;
  title?: string | undefined;
  summary?: string | undefined;
  status?: string | undefined;
  urgency?: string | undefined;
  unique_reporters_count?: number | undefined;
  opd_id?: string | undefined;
  created_at?: string | undefined;
}

interface ReportRow {
  id: string;
  code?: string | undefined;
  title?: string | undefined;
  description?: string | undefined;
  status?: string | undefined;
  opd_id?: string | null | undefined;
  address_detail?: string | null | undefined;
  lat?: number | null | undefined;
  lng?: number | null | undefined;
  created_at?: string | undefined;
  support_count?: number | undefined;
}

interface ProgramRow {
  id: string;
  code?: string | undefined;
  name?: string | undefined;
  description?: string | undefined;
  opd_id?: string | null | undefined;
  budget_pagu?: number | string | undefined;
  budget_realization?: number | string | undefined;
  target_output?: number | string | undefined;
  realization_output?: number | string | undefined;
  target_unit?: string | undefined;
  start_date?: string | undefined;
  end_date?: string | undefined;
  status?: string | undefined;
}

interface UpdateRow {
  id: string;
  program_id: string;
  opd_id?: string | null | undefined;
  title?: string | undefined;
  content?: string | undefined;
  progress_percentage?: number | string | undefined;
  documentation_photos?: unknown;
  created_at?: string | undefined;
}

export interface PemerintahReportItem {
  id: string;
  code: string;
  title: string;
  description: string;
  status: string;
  opdId: string | null;
  opdName: string;
  addressDetail: string | null;
  lat: number | null;
  lng: number | null;
  createdAt: string;
  supportCount: number;
}

export interface AssignedOpd {
  id: string;
  code: string;
  name: string;
}

export interface PemerintahProgramItem {
  id: string;
  code: string;
  name: string;
  description: string;
  opdId: string;
  opdName: string;
  assignedOpds: AssignedOpd[];
  budgetPagu: number;
  budgetRealization: number;
  budgetPercent: number;
  targetOutput: number;
  realizationOutput: number;
  physicalPercent: number;
  targetUnit: string;
  startDate: string;
  endDate: string;
  status: string;
}

interface CreateProgramInput {
  name: string;
  code?: string;
  description?: string;
  assignedOpdIds: string[];
  budgetPagu: number;
  budgetRealization?: number;
  targetOutput: number;
  realizationOutput?: number;
  targetUnit: string;
  startDate?: string;
  endDate?: string;
  status?: string;
}

interface UpdateProgramInput {
  name?: string;
  code?: string;
  description?: string;
  assignedOpdIds?: string[];
  budgetPagu?: number;
  budgetRealization?: number;
  targetOutput?: number;
  realizationOutput?: number;
  targetUnit?: string;
  startDate?: string;
  endDate?: string;
  status?: string;
}

export async function getPemerintahOverview(): Promise<PemerintahOverview> {
  try {
    const [reportsRes, issuesRes, opdsRes, programsRes] = await Promise.all([
      fetch(`${supabaseUrl}/rest/v1/reports?select=id,status,created_at`, {
        headers: { apikey: supabaseKey, Authorization: `Bearer ${supabaseKey}`, "Accept-Profile": "app" },
        next: { revalidate: 15 },
      }),
      fetch(`${supabaseUrl}/rest/v1/issues?select=id,status,urgency`, {
        headers: { apikey: supabaseKey, Authorization: `Bearer ${supabaseKey}`, "Accept-Profile": "app" },
        next: { revalidate: 15 },
      }),
      fetch(`${supabaseUrl}/rest/v1/opds?select=id,is_active`, {
        headers: { apikey: supabaseKey, Authorization: `Bearer ${supabaseKey}`, "Accept-Profile": "app" },
        next: { revalidate: 30 },
      }),
      fetch(`${supabaseUrl}/rest/v1/programs?select=id,status,budget_pagu,budget_realization`, {
        headers: { apikey: supabaseKey, Authorization: `Bearer ${supabaseKey}`, "Accept-Profile": "app" },
        next: { revalidate: 30 },
      }),
    ]);

    const reports: Array<{ id: string; status: string }> = reportsRes.ok ? await reportsRes.json() : [];
    const issues: Array<{ id: string; status: string; urgency: string }> = issuesRes.ok ? await issuesRes.json() : [];
    const opds: Array<{ id: string }> = opdsRes.ok ? await opdsRes.json() : [];
    const programs: Array<{ id: string; status: string; budget_pagu: number; budget_realization: number }> =
      programsRes.ok ? await programsRes.json() : [];

    const totalReports = reports.length;
    let resolvedReports = 0;
    let inProgressReports = 0;
    let pendingReports = 0;

    for (const r of reports) {
      const s = (r.status || "").toUpperCase();
      if (s === "SELESAI") {
        resolvedReports++;
      } else if (s === "DIPROSES" || s === "DITERUSKAN") {
        inProgressReports++;
      } else {
        pendingReports++;
      }
    }

    const completionRate = totalReports > 0 ? Math.round((resolvedReports / totalReports) * 100) : 0;
    const urgentIssuesCount = issues.filter((i) => (i.urgency || "").toUpperCase() === "URGENT").length;

    let totalBudgetPagu = 0;
    let totalBudgetRealization = 0;
    let onSchedule = 0;
    let delayed = 0;
    let completed = 0;

    for (const p of programs) {
      totalBudgetPagu += Number(p.budget_pagu) || 0;
      totalBudgetRealization += Number(p.budget_realization) || 0;
      const st = (p.status || "").toUpperCase();
      if (st === "SELESAI") {
        completed++;
      } else if (st === "TERLAMBAT" || st === "MELEWATI_TENGGAT") {
        delayed++;
      } else {
        onSchedule++;
      }
    }

    const budgetRealizationRate =
      totalBudgetPagu > 0 ? Math.round((totalBudgetRealization / totalBudgetPagu) * 100) : 0;

    return {
      totalReports,
      resolvedReports,
      inProgressReports,
      pendingReports,
      completionRate,
      urgentIssuesCount,
      totalBudgetPagu,
      totalBudgetRealization,
      budgetRealizationRate,
      programsSummary: {
        total: programs.length,
        onSchedule,
        delayed,
        completed,
      },
      opdCount: opds.length,
    };
  } catch {
    return {
      totalReports: 0,
      resolvedReports: 0,
      inProgressReports: 0,
      pendingReports: 0,
      completionRate: 0,
      urgentIssuesCount: 0,
      totalBudgetPagu: 0,
      totalBudgetRealization: 0,
      budgetRealizationRate: 0,
      programsSummary: {
        total: 0,
        onSchedule: 0,
        delayed: 0,
        completed: 0,
      },
      opdCount: 0,
    };
  }
}

export async function getPemerintahUrgentIssues(): Promise<UrgentIssueItem[]> {
  try {
    const [issuesRes, opdsRes] = await Promise.all([
      fetch(
        `${supabaseUrl}/rest/v1/issues?select=id,code,title,summary,status,urgency,unique_reporters_count,opd_id,created_at&order=created_at.desc&limit=10`,
        {
          headers: { apikey: supabaseKey, Authorization: `Bearer ${supabaseKey}`, "Accept-Profile": "app" },
          next: { revalidate: 15 },
        }
      ),
      fetch(`${supabaseUrl}/rest/v1/opds?select=id,name`, {
        headers: { apikey: supabaseKey, Authorization: `Bearer ${supabaseKey}`, "Accept-Profile": "app" },
        next: { revalidate: 60 },
      }),
    ]);

    if (!issuesRes.ok) return [];
    const issuesData = await issuesRes.json();
    const opdsData: Array<{ id: string; name: string }> = opdsRes.ok ? await opdsRes.json() : [];
    const opdMap = new Map(opdsData.map((o) => [o.id, o.name]));

    return issuesData.map((item: IssueRow) => ({
      id: item.id,
      code: item.code || "-",
      title: item.title || "Isu Publik",
      summary: item.summary || "",
      status: item.status || "DIAJUKAN",
      urgency: item.urgency || "NORMAL",
      reportersCount: item.unique_reporters_count || 1,
      opdName: (item.opd_id && opdMap.get(item.opd_id)) || "Pemerintah Kota",
      createdAt: item.created_at || new Date().toISOString(),
    }));
  } catch {
    return [];
  }
}

export async function getPemerintahOpdPerformance(): Promise<OpdPerformanceItem[]> {
  try {
    const [opdsRes, reportsRes] = await Promise.all([
      fetch(`${supabaseUrl}/rest/v1/opds?select=id,code,name&order=code.asc`, {
        headers: { apikey: supabaseKey, Authorization: `Bearer ${supabaseKey}`, "Accept-Profile": "app" },
        next: { revalidate: 30 },
      }),
      fetch(`${supabaseUrl}/rest/v1/reports?select=id,status,opd_id`, {
        headers: { apikey: supabaseKey, Authorization: `Bearer ${supabaseKey}`, "Accept-Profile": "app" },
        next: { revalidate: 15 },
      }),
    ]);

    if (!opdsRes.ok) return [];
    const opds: Array<{ id: string; code: string; name: string }> = await opdsRes.json();
    const reports: Array<{ id: string; status: string; opd_id: string | null }> = reportsRes.ok
      ? await reportsRes.json()
      : [];

    const statsByOpd = new Map<
      string,
      { total: number; resolved: number; inProgress: number; pending: number }
    >();

    for (const opd of opds) {
      statsByOpd.set(opd.id, { total: 0, resolved: 0, inProgress: 0, pending: 0 });
    }

    for (const r of reports) {
      if (!r.opd_id) continue;
      const cur = statsByOpd.get(r.opd_id);
      if (!cur) continue;
      cur.total++;
      const s = (r.status || "").toUpperCase();
      if (s === "SELESAI") {
        cur.resolved++;
      } else if (s === "DIPROSES" || s === "DITERUSKAN") {
        cur.inProgress++;
      } else {
        cur.pending++;
      }
    }

    return opds.map((opd) => {
      const stats = statsByOpd.get(opd.id) || { total: 0, resolved: 0, inProgress: 0, pending: 0 };
      const completionRate = stats.total > 0 ? Math.round((stats.resolved / stats.total) * 100) : 100;
      let statusGrade: "Sangat Baik" | "Baik" | "Perlu Perhatian" = "Baik";
      if (completionRate >= 80) {
        statusGrade = "Sangat Baik";
      } else if (completionRate < 60) {
        statusGrade = "Perlu Perhatian";
      }

      return {
        id: opd.id,
        code: opd.code,
        name: opd.name,
        totalReports: stats.total,
        resolvedReports: stats.resolved,
        inProgressReports: stats.inProgress,
        pendingReports: stats.pending,
        completionRate,
        statusGrade,
      };
    });
  } catch {
    return [];
  }
}

export async function getPemerintahReports(): Promise<PemerintahReportItem[]> {
  try {
    const [reportsRes, opdsRes] = await Promise.all([
      fetch(
        `${supabaseUrl}/rest/v1/reports?select=id,code,title,description,status,opd_id,address_detail,lat,lng,created_at,support_count&order=created_at.desc&limit=150`,
        {
          headers: { apikey: supabaseKey, Authorization: `Bearer ${supabaseKey}`, "Accept-Profile": "app" },
          next: { revalidate: 15 },
        }
      ),
      fetch(`${supabaseUrl}/rest/v1/opds?select=id,name`, {
        headers: { apikey: supabaseKey, Authorization: `Bearer ${supabaseKey}`, "Accept-Profile": "app" },
        next: { revalidate: 60 },
      }),
    ]);

    if (!reportsRes.ok) return [];
    const reports = await reportsRes.json();
    const opds: Array<{ id: string; name: string }> = opdsRes.ok ? await opdsRes.json() : [];
    const opdMap = new Map(opds.map((o) => [o.id, o.name]));

    return reports.map((r: ReportRow) => ({
      id: r.id,
      code: r.code || "-",
      title: r.title || "Laporan Warga",
      description: r.description || "-",
      status: r.status || "DIAJUKAN",
      opdId: r.opd_id,
      opdName: (r.opd_id && opdMap.get(r.opd_id)) || "Belum Ditugaskan",
      addressDetail: r.address_detail || null,
      lat: r.lat,
      lng: r.lng,
      createdAt: r.created_at || new Date().toISOString(),
      supportCount: r.support_count || 0,
    }));
  } catch {
    return [];
  }
}

export async function getPemerintahPrograms(): Promise<PemerintahProgramItem[]> {
  try {
    const [programsRes, opdsRes, updatesRes] = await Promise.all([
      fetch(
        `${supabaseUrl}/rest/v1/programs?select=id,code,name,description,opd_id,budget_pagu,budget_realization,target_output,realization_output,target_unit,start_date,end_date,status&order=code.asc`,
        {
          headers: { apikey: supabaseKey, Authorization: `Bearer ${supabaseKey}`, "Accept-Profile": "app" },
          cache: "no-store",
        }
      ),
      fetch(`${supabaseUrl}/rest/v1/opds?select=id,code,name&order=code.asc`, {
        headers: { apikey: supabaseKey, Authorization: `Bearer ${supabaseKey}`, "Accept-Profile": "app" },
        cache: "no-store",
      }),
      fetch(`${supabaseUrl}/rest/v1/program_updates?title=eq.PENUGASAN_OPD&select=program_id,opd_id`, {
        headers: { apikey: supabaseKey, Authorization: `Bearer ${supabaseKey}`, "Accept-Profile": "app" },
        cache: "no-store",
      }),
    ]);

    if (!programsRes.ok) return [];
    const programs = await programsRes.json();
    const opds: Array<{ id: string; code: string; name: string }> = opdsRes.ok ? await opdsRes.json() : [];
    const updates: Array<{ program_id: string; opd_id: string }> = updatesRes.ok ? await updatesRes.json() : [];

    const opdMap = new Map(opds.map((o) => [o.id, o]));
    const assignedMap = new Map<string, Set<string>>();

    for (const u of updates) {
      if (!u.program_id || !u.opd_id) continue;
      const assigned = assignedMap.get(u.program_id) ?? new Set<string>();
      assigned.add(u.opd_id);
      assignedMap.set(u.program_id, assigned);
    }

    return programs.map((p: ProgramRow) => {
      const pagu = Number(p.budget_pagu) || 0;
      const realisasi = Number(p.budget_realization) || 0;
      const budgetPercent = pagu > 0 ? Math.min(100, Math.round((realisasi / pagu) * 100)) : 0;
      const target = Number(p.target_output) || 100;
      const realTarget = Number(p.realization_output) || 0;
      const physicalPercent = target > 0 ? Math.min(100, Math.round((realTarget / target) * 100)) : 0;

      const opdSet = new Set<string>();
      if (p.opd_id) opdSet.add(p.opd_id);
      const extraOpds = assignedMap.get(p.id);
      if (extraOpds) {
        for (const oid of extraOpds) opdSet.add(oid);
      }

      const assignedOpds: AssignedOpd[] = [];
      for (const oid of opdSet) {
        const found = opdMap.get(oid);
        if (found) {
          assignedOpds.push({ id: found.id, code: found.code, name: found.name });
        }
      }

      const primaryOpd = p.opd_id ? opdMap.get(p.opd_id) : null;
      const opdName = assignedOpds.length > 1
        ? `${primaryOpd ? primaryOpd.name : (assignedOpds[0]?.name ?? "Pemerintah Kota")} (+${assignedOpds.length - 1} dinas)`
        : primaryOpd ? primaryOpd.name : "Pemerintah Kota";

      return {
        id: p.id,
        code: p.code || "-",
        name: p.name || "Program Strategis",
        description: p.description || "",
        opdId: p.opd_id || (assignedOpds[0]?.id ?? ""),
        opdName,
        assignedOpds,
        budgetPagu: pagu,
        budgetRealization: realisasi,
        budgetPercent,
        targetOutput: target,
        realizationOutput: realTarget,
        physicalPercent,
        targetUnit: p.target_unit || "%",
        startDate: p.start_date || "2026-01-01",
        endDate: p.end_date || "2026-12-31",
        status: (() => {
          const s = (p.status || "").toUpperCase();
          if (s === "SELESAI") return "SELESAI";
          if (s === "TERLAMBAT") return "TERLAMBAT";
          if (s === "MELEWATI_TENGGAT") return "MELEWATI_TENGGAT";
          if (s === "BELUM_DIMULAI") return "BELUM_DIMULAI";
          return "SESUAI_JADWAL";
        })(),
      };
    });
  } catch {
    return [];
  }
}

export async function createPemerintahProgram(input: CreateProgramInput) {
  try {
    const assignedIds = input.assignedOpdIds && input.assignedOpdIds.length > 0 ? input.assignedOpdIds : [];
    let leadOpdId = assignedIds[0] || null;

    if (!leadOpdId) {
      const opdsRes = await fetch(`${supabaseUrl}/rest/v1/opds?select=id&limit=1`, {
        headers: { apikey: supabaseKey, Authorization: `Bearer ${supabaseKey}`, "Accept-Profile": "app" },
      });
      if (opdsRes.ok) {
        const opds = await opdsRes.json();
        leadOpdId = opds[0]?.id || null;
      }
    }

    let programCode = (input.code || "").trim().toUpperCase();
    if (!programCode) {
      const randomSuffix = Math.floor(100 + Math.random() * 900);
      programCode = `PRK-${randomSuffix}`;
    }

    const payload = {
      name: input.name.trim(),
      code: programCode,
      description: (input.description || "").trim(),
      opd_id: leadOpdId,
      budget_pagu: Number(input.budgetPagu) || 0,
      budget_realization: Number(input.budgetRealization) || 0,
      target_output: String(Number(input.targetOutput) || 100),
      realization_output: Number(input.realizationOutput) || 0,
      target_unit: (input.targetUnit || "%").trim(),
      start_date: input.startDate || "2026-01-01",
      end_date: input.endDate || "2026-12-31",
      status: input.status || "SESUAI_JADWAL",
      approval_status: "APPROVED",
    };

    const res = await fetch(`${supabaseUrl}/rest/v1/programs`, {
      method: "POST",
      headers: {
        apikey: supabaseKey,
        Authorization: `Bearer ${supabaseKey}`,
        "Accept-Profile": "app",
        "Content-Profile": "app",
        "Content-Type": "application/json",
        Prefer: "return=representation",
      },
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      const errText = await res.text();
      return { success: false, error: errText };
    }

    const createdRows = await res.json();
    const created = Array.isArray(createdRows) ? createdRows[0] : createdRows;

    if (created && created.id && assignedIds.length > 0) {
      const updatesPayload = assignedIds.map((oid) => ({
        program_id: created.id,
        opd_id: oid,
        title: "PENUGASAN_OPD",
        content: "Amanah Pelaksanaan Program Kerja dari Kepala Daerah",
        progress_percentage: 0,
      }));

      await fetch(`${supabaseUrl}/rest/v1/program_updates`, {
        method: "POST",
        headers: {
          apikey: supabaseKey,
          Authorization: `Bearer ${supabaseKey}`,
          "Accept-Profile": "app",
          "Content-Profile": "app",
          "Content-Type": "application/json",
        },
        body: JSON.stringify(updatesPayload),
      });
    }

    return { success: true, program: created };
  } catch (err) {
    return { success: false, error: getErrorMessage(err, "Gagal membuat program kerja") };
  }
}

export async function updatePemerintahProgram(id: string, input: UpdateProgramInput) {
  try {
    const payload: Record<string, unknown> = {};
    if (input.name !== undefined) payload.name = input.name.trim();
    if (input.code !== undefined) payload.code = input.code.trim().toUpperCase();
    if (input.description !== undefined) payload.description = input.description.trim();
    if (input.budgetPagu !== undefined) payload.budget_pagu = Number(input.budgetPagu) || 0;
    if (input.budgetRealization !== undefined) payload.budget_realization = Number(input.budgetRealization) || 0;
    if (input.targetOutput !== undefined) payload.target_output = String(Number(input.targetOutput) || 100);
    if (input.realizationOutput !== undefined) payload.realization_output = Number(input.realizationOutput) || 0;
    if (input.targetUnit !== undefined) payload.target_unit = input.targetUnit.trim();
    if (input.startDate !== undefined) payload.start_date = input.startDate;
    if (input.endDate !== undefined) payload.end_date = input.endDate;
    if (input.status !== undefined) payload.status = input.status;

    if (input.assignedOpdIds && input.assignedOpdIds.length > 0) {
      payload.opd_id = input.assignedOpdIds[0];
    }

    const res = await fetch(`${supabaseUrl}/rest/v1/programs?id=eq.${encodeURIComponent(id)}`, {
      method: "PATCH",
      headers: {
        apikey: supabaseKey,
        Authorization: `Bearer ${supabaseKey}`,
        "Accept-Profile": "app",
        "Content-Profile": "app",
        "Content-Type": "application/json",
        Prefer: "return=representation",
      },
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      const errText = await res.text();
      return { success: false, error: errText };
    }

    if (input.assignedOpdIds && input.assignedOpdIds.length > 0) {
      await fetch(
        `${supabaseUrl}/rest/v1/program_updates?program_id=eq.${encodeURIComponent(id)}&title=eq.PENUGASAN_OPD`,
        {
          method: "DELETE",
          headers: {
            apikey: supabaseKey,
            Authorization: `Bearer ${supabaseKey}`,
            "Accept-Profile": "app",
            "Content-Profile": "app",
          },
        }
      );

      const updatesPayload = input.assignedOpdIds.map((oid) => ({
        program_id: id,
        opd_id: oid,
        title: "PENUGASAN_OPD",
        content: "Amanah Pelaksanaan Program Kerja dari Kepala Daerah",
        progress_percentage: 0,
      }));

      await fetch(`${supabaseUrl}/rest/v1/program_updates`, {
        method: "POST",
        headers: {
          apikey: supabaseKey,
          Authorization: `Bearer ${supabaseKey}`,
          "Accept-Profile": "app",
          "Content-Profile": "app",
          "Content-Type": "application/json",
        },
        body: JSON.stringify(updatesPayload),
      });
    }

    const updated = await res.json();
    return { success: true, program: Array.isArray(updated) ? updated[0] : updated };
  } catch (err) {
    return { success: false, error: getErrorMessage(err, "Gagal memperbarui program kerja") };
  }
}

export async function deletePemerintahProgram(id: string) {
  try {
    const res = await fetch(`${supabaseUrl}/rest/v1/programs?id=eq.${encodeURIComponent(id)}`, {
      method: "DELETE",
      headers: {
        apikey: supabaseKey,
        Authorization: `Bearer ${supabaseKey}`,
        "Accept-Profile": "app",
        "Content-Profile": "app",
      },
    });

    if (!res.ok) {
      const errText = await res.text();
      return { success: false, error: errText };
    }

    return { success: true };
  } catch (err) {
    return { success: false, error: getErrorMessage(err, "Gagal menghapus program kerja") };
  }
}

export async function getDinasAssignedPrograms(opdId: string): Promise<PemerintahProgramItem[]> {
  const allPrograms = await getPemerintahPrograms();
  return allPrograms.filter((p) => {
    if (p.opdId === opdId) return true;
    return p.assignedOpds.some((o) => o.id === opdId);
  });
}

export interface ProgramUpdateItem {
  id: string;
  programId: string;
  opdId: string | null;
  opdName: string;
  title: string;
  content: string;
  progressPercentage: number;
  documentationPhotos: string[];
  createdAt: string;
}

export async function addDinasProgramProgress(
  programId: string,
  opdId: string,
  input: {
    title?: string;
    content: string;
    realizationOutput?: number;
    budgetRealization?: number;
    status?: string;
    documentationPhotos?: string[];
  }
) {
  try {
    const updatePayload = {
      program_id: programId,
      opd_id: opdId,
      title: (input.title || "").trim() || "Laporan Perkembangan Pengerjaan",
      content: (input.content || "").trim(),
      progress_percentage: 0,
      documentation_photos: input.documentationPhotos || [],
    };

    await fetch(`${supabaseUrl}/rest/v1/program_updates`, {
      method: "POST",
      headers: {
        apikey: supabaseKey,
        Authorization: `Bearer ${supabaseKey}`,
        "Accept-Profile": "app",
        "Content-Profile": "app",
        "Content-Type": "application/json",
      },
      body: JSON.stringify(updatePayload),
    });

    const progPatch: Record<string, unknown> = {};
    if (input.realizationOutput !== undefined) {
      progPatch.realization_output = Number(input.realizationOutput) || 0;
    }
    if (input.budgetRealization !== undefined) {
      progPatch.budget_realization = Number(input.budgetRealization) || 0;
    }
    if (input.status) {
      progPatch.status = input.status;
    }

    if (Object.keys(progPatch).length > 0) {
      await fetch(`${supabaseUrl}/rest/v1/programs?id=eq.${encodeURIComponent(programId)}`, {
        method: "PATCH",
        headers: {
          apikey: supabaseKey,
          Authorization: `Bearer ${supabaseKey}`,
          "Accept-Profile": "app",
          "Content-Profile": "app",
          "Content-Type": "application/json",
        },
        body: JSON.stringify(progPatch),
      });
    }

    return { success: true };
  } catch (err) {
    return { success: false, error: getErrorMessage(err, "Gagal mencatat perkembangan program") };
  }
}

export async function getProgramUpdateHistory(programId: string): Promise<ProgramUpdateItem[]> {
  try {
    const [updatesRes, opdsRes] = await Promise.all([
      fetch(
        `${supabaseUrl}/rest/v1/program_updates?program_id=eq.${encodeURIComponent(programId)}&order=created_at.desc`,
        {
          headers: { apikey: supabaseKey, Authorization: `Bearer ${supabaseKey}`, "Accept-Profile": "app" },
          cache: "no-store",
        }
      ),
      fetch(`${supabaseUrl}/rest/v1/opds?select=id,code,name`, {
        headers: { apikey: supabaseKey, Authorization: `Bearer ${supabaseKey}`, "Accept-Profile": "app" },
        cache: "no-store",
      }),
    ]);

    if (!updatesRes.ok) return [];
    const updates = await updatesRes.json();
    const opds: Array<{ id: string; code: string; name: string }> = opdsRes.ok ? await opdsRes.json() : [];
    const opdMap = new Map(opds.map((o) => [o.id, o]));

    return updates.map((u: UpdateRow) => {
      const opd = u.opd_id ? opdMap.get(u.opd_id) : null;
      let photos: string[] = [];
      if (Array.isArray(u.documentation_photos)) {
        photos = u.documentation_photos.filter((p: unknown): p is string => typeof p === "string" && p.trim().length > 0);
      }
      return {
        id: u.id,
        programId: u.program_id,
        opdId: u.opd_id,
        opdName: opd ? `${opd.code} - ${opd.name}` : "Pemerintah Kota",
        title: u.title || "Laporan Perkembangan",
        content: u.content || "",
        progressPercentage: Number(u.progress_percentage) || 0,
        documentationPhotos: photos,
        createdAt: u.created_at || new Date().toISOString(),
      };
    });
  } catch {
    return [];
  }
}
