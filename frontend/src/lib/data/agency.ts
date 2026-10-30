import { currentTime } from "@/lib/clock";
import type { Outcome } from "@/lib/data/outcome";
import { paginate, type PageParams } from "@/lib/data/paging";
import {
  REJECTION_LABEL,
  TRANSFER_LABEL,
  type AgencyTransition,
  type TransitionInput,
} from "@/lib/agency";
import { PUBLIC_ISSUES, toSummary } from "@/lib/mock/issues";
import { agencyStore, type Publication } from "@/lib/mock/agency";
import { DEMO_PROFILES } from "@/lib/mock/profile";
import { checkFile } from "@/lib/report-draft";
import type { Schema } from "@/lib/schema";
import { categoryRef, locationOf, opdRef } from "@/lib/mock/reference";
import { getSessionUser } from "@/lib/data/session";

const OPD_LOOKUP: Record<string, { code: string; name: string }> = {
  "e0000000-0000-0000-0000-000000000001": { code: "DBM-SDA", name: "Dinas Bina Marga & SDA" },
  "e0000000-0000-0000-0000-000000000002": { code: "DLHK", name: "Dinas Lingkungan Hidup & Kebersihan" },
  "e0000000-0000-0000-0000-000000000003": { code: "DISHUB", name: "Dinas Perhubungan" },
  "e0000000-0000-0000-0000-000000000004": { code: "DINKES", name: "Dinas Kesehatan" },
  "e0000000-0000-0000-0000-000000000005": { code: "SATPOL-PP", name: "Satuan Polisi Pamong Praja" },
  "e0000000-0000-0000-0000-000000000006": { code: "BPBD", name: "Badan Penanggulangan Bencana Daerah" },
  "e0000000-0000-0000-0000-000000000007": { code: "PUPR", name: "Dinas PUPR" },
};


type Issue = Schema<"IssueDetail">;
type Status = Schema<"IssueStatus">;
type Urgency = Schema<"Urgency">;
type AgencyAttachment = Schema<"AgencyAttachment">;
type AgencyReport = Schema<"AgencyReport">;

export interface AgencyFilters extends PageParams {
  status?: Status | undefined;
  urgency?: Urgency | undefined;
}

const MS_PER_HOUR = 3_600_000;
const NO_DUE = Number.MAX_SAFE_INTEGER;
const MAX_REPORTS = 3;
const SLA_HOURS: Record<Urgency, number> = { URGENT: 24, TINGGI: 72, NORMAL: 120 };
const URGENCY_RANK: Record<Urgency, number> = { URGENT: 3, TINGGI: 2, NORMAL: 1 };
const AWAITING: readonly Status[] = ["DITERUSKAN", "DIBUKA_ULANG"];
const OPEN: readonly Status[] = ["DITERUSKAN", "DIPROSES", "DIBUKA_ULANG"];
const PHOTOS = ["/issues/banjir-hd.jpg", "/issues/jembatan-hd.jpg", "/issues/pagar-hd.jpg", "/issues/atap-hd.jpg"];
const SAFETY: Record<Urgency, Schema<"SafetyRisk">> = { URGENT: "LIFE", TINGGI: "PROPERTY", NORMAL: "NONE" };
const REPORT_BODIES: ReadonlyArray<(title: string) => string> = [
  (title) => `${title}. Sudah berlangsung beberapa hari dan belum ada perbaikan sama sekali.`,
  (title) => `Mohon segera ditangani: ${title.toLowerCase()}. Warga sekitar mulai khawatir.`,
  (title) => `Saya ingin melaporkan hal yang sama, ${title.toLowerCase()}. Mohon identitas saya dirahasiakan.`,
];
const AI_CONFIDENCE = 0.92;
const EVIDENCE_PATH = "/api/agency/evidence";
const REPORT_SPACING_HOURS = 5;

function agencyIssues(): Issue[] {
  const code = DEMO_PROFILES.dinas.opd?.code;
  const added = agencyStore().events;
  return PUBLIC_ISSUES.filter((issue) => issue.opd.code === code).map((issue) => {
    const extra = added.get(issue.id) ?? [];
    if (extra.length === 0) {
      return issue;
    }
    const timeline = [...issue.timeline, ...extra];
    const last = timeline[timeline.length - 1];
    return {
      ...issue,
      timeline,
      status: last ? last.to_status : issue.status,
      updated_at: last ? last.at : issue.updated_at,
    };
  });
}

function slaDueAt(issue: Issue): string | null {
  if (!AWAITING.includes(issue.status)) {
    return null;
  }
  const waiting = [...issue.timeline].reverse().find((event) => event.to_status === issue.status);
  return waiting ? new Date(Date.parse(waiting.at) + SLA_HOURS[issue.urgency] * MS_PER_HOUR).toISOString() : null;
}

function toAgencySummary(issue: Issue): Schema<"AgencyIssueSummary"> {
  return { ...toSummary(issue), sla_due_at: slaDueAt(issue) };
}

function dueMs(issue: Schema<"AgencyIssueSummary">): number {
  return issue.sla_due_at ? Date.parse(issue.sla_due_at) : NO_DUE;
}

function byPriority(a: Schema<"AgencyIssueSummary">, b: Schema<"AgencyIssueSummary">): number {
  return URGENCY_RANK[b.urgency] - URGENCY_RANK[a.urgency] || dueMs(a) - dueMs(b) || b.reporter_count - a.reporter_count;
}

export function allowedTransitions(status: Status): AgencyTransition[] {
  switch (status) {
    case "DITERUSKAN":
      return ["DIPROSES", "DITOLAK", "DIALIHKAN"];
    case "DIPROSES":
      return ["SELESAI", "DITOLAK", "DIALIHKAN"];
    case "DIBUKA_ULANG":
      return ["DIPROSES"];
    default:
      return [];
  }
}

function publicationOf(id: string, fallback: Publication): Publication {
  return agencyStore().publication.get(id) ?? fallback;
}

function reportsOf(issue: Issue): AgencyReport[] {
  const tail = Number(issue.id.slice(-3));
  const count = Math.min(issue.reporter_count, MAX_REPORTS);
  return Array.from({ length: count }, (_, reportIndex) => {
    const visibility: Schema<"Visibility"> = reportIndex === MAX_REPORTS - 1 ? "RAHASIA" : "PUBLIK";
    const urls =
      visibility === "RAHASIA"
        ? []
        : reportIndex === 0
          ? [issue.cover_photo?.url ?? PHOTOS[tail % PHOTOS.length], PHOTOS[(tail + 1) % PHOTOS.length]]
          : [PHOTOS[(tail + 2) % PHOTOS.length]];
    const attachments = urls.flatMap((url, photoIndex): AgencyAttachment[] => {
      if (!url) {
        return [];
      }
      const id = `0197d100-0000-7000-8000-${issue.id.slice(-9)}${reportIndex}${photoIndex}0`;
      const isFirst = reportIndex === 0 && photoIndex === 0 && issue.cover_photo !== null;
      const state = publicationOf(id, { public_ok: isFirst, is_cover: isFirst });
      return [{ id, url, mime: "image/jpeg", size_bytes: 312_000, ...state }];
    });
    return {
      code: `TLK-2610-A${String(tail).padStart(2, "0")}${reportIndex}`,
      body: REPORT_BODIES[reportIndex]?.(issue.title) ?? issue.title,
      visibility,
      created_at: new Date(Date.parse(issue.created_at) + reportIndex * REPORT_SPACING_HOURS * MS_PER_HOUR).toISOString(),
      location: issue.location,
      attachments,
    };
  });
}

export async function listAgencyIssues(filters: AgencyFilters = {}, opdIdOverride?: string): Promise<Schema<"AgencyIssueList">> {
  const user = await getSessionUser();
  const targetOpdId = opdIdOverride || user?.opdId;
  const supabaseUrl = process.env.SUPABASE_URL || "https://gtsskmxircedhfggqena.supabase.co";
  const supabaseKey =
    process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || "";

  try {
    let endpoint = `${supabaseUrl}/rest/v1/reports?order=created_at.desc&limit=100`;
    if (targetOpdId) {
      endpoint = `${supabaseUrl}/rest/v1/reports?opd_id=eq.${encodeURIComponent(targetOpdId)}&order=created_at.desc&limit=100`;
    }
    if (filters.status) {
      endpoint += `&status=eq.${encodeURIComponent(filters.status)}`;
    }
    const [reportsRes, attachmentsRes] = await Promise.all([
      fetch(endpoint, {
        headers: {
          apikey: supabaseKey,
          Authorization: `Bearer ${supabaseKey}`,
          "Accept-Profile": "app",
        },
        next: { revalidate: 5 },
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

    if (reportsRes.ok) {
      const rows = await reportsRes.json();
      if (Array.isArray(rows) && rows.length > 0) {
        const photos: Record<string, string> = {};
        if (attachmentsRes && attachmentsRes.ok) {
          const atts = await attachmentsRes.json();
          if (Array.isArray(atts)) {
            for (const a of atts) {
              if (a.file_url && !photos[a.report_id]) {
                photos[a.report_id] = a.file_url;
              }
            }
          }
        }
        const opdCode = (targetOpdId && OPD_LOOKUP[targetOpdId]?.code) || "DBM-SDA";
        let refOpd: Schema<"OpdRef">;
        try {
          refOpd = opdRef(opdCode);
        } catch {
          refOpd = { code: opdCode, slug: opdCode.toLowerCase(), name: (targetOpdId && OPD_LOOKUP[targetOpdId]?.name) || "Dinas" };
        }

        let defaultCat: Schema<"CategoryRef">;
        try {
          defaultCat = categoryRef("JALAN-RUSAK");
        } catch {
          defaultCat = { code: "UMUM", name: "Umum" };
        }

        const items: Schema<"AgencyIssueSummary">[] = rows.map((r: any) => {
          const itemOpdId = r.opd_id || targetOpdId;
          const itemOpdCode = (itemOpdId && OPD_LOOKUP[itemOpdId]?.code) || opdCode;
          let rowOpd: Schema<"OpdRef">;
          try {
            rowOpd = opdRef(itemOpdCode);
          } catch {
            rowOpd = { code: itemOpdCode, slug: itemOpdCode.toLowerCase(), name: (itemOpdId && OPD_LOOKUP[itemOpdId]?.name) || "Dinas" };
          }
          return {
            id: r.id,
            title: r.title,
            opd: rowOpd,
            category: defaultCat,
            status: (r.status || "DITERUSKAN") as Status,
            urgency: (r.urgency || "NORMAL") as Urgency,
            reporter_count: r.support_count ? Number(r.support_count) + 1 : 1,
            location: {
              village: { id: r.village_id || "0197b000-0000-7000-8000-002800030000", name: "Kelurahan Setempat" },
              district: { id: r.district_id || "0197a000-0000-7000-8000-002800000000", name: r.address_detail || "Kecamatan Kota" },
              point: { lat: Number(r.lat) || -6.9175, lng: Number(r.lng) || 107.6191 },
            },
            created_at: r.created_at,
            updated_at: r.updated_at || r.created_at,
            cover_photo: photos[r.id] ? { url: String(photos[r.id]), mime: "image/jpeg" as const } : null,
            response_overdue: false,
            sla_due_at: null,
          };
        });
        return paginate(items, filters);
      }
    }
  } catch {}

  const items = agencyIssues()
    .filter((issue) => (!filters.status || issue.status === filters.status) && (!filters.urgency || issue.urgency === filters.urgency))
    .map(toAgencySummary)
    .sort(byPriority);
  return paginate(items, filters);
}

export async function getAgencyIssue(id: string): Promise<Schema<"AgencyIssueDetail"> | null> {
  const supabaseUrl = process.env.SUPABASE_URL || "https://gtsskmxircedhfggqena.supabase.co";
  const supabaseKey =
    process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || "";

  try {
    const [reportRes, attRes, issRes] = await Promise.all([
      fetch(`${supabaseUrl}/rest/v1/reports?id=eq.${encodeURIComponent(id)}&select=*`, {
        headers: {
          apikey: supabaseKey,
          Authorization: `Bearer ${supabaseKey}`,
          "Accept-Profile": "app",
        },
        next: { revalidate: 0 },
      }),
      fetch(`${supabaseUrl}/rest/v1/report_attachments?report_id=eq.${encodeURIComponent(id)}&select=file_url`, {
        headers: {
          apikey: supabaseKey,
          Authorization: `Bearer ${supabaseKey}`,
          "Accept-Profile": "app",
        },
        next: { revalidate: 10 },
      }).catch(() => null),
      fetch(`${supabaseUrl}/rest/v1/issues?id=eq.${encodeURIComponent(id)}&select=*`, {
        headers: {
          apikey: supabaseKey,
          Authorization: `Bearer ${supabaseKey}`,
          "Accept-Profile": "app",
        },
        next: { revalidate: 0 },
      }).catch(() => null),
    ]);

    let targetReport: any = null;
    let targetIssue: any = null;

    if (reportRes.ok) {
      const rows = await reportRes.json();
      if (Array.isArray(rows) && rows.length > 0) {
        targetReport = rows[0];
      }
    }

    if (!targetReport && issRes && issRes.ok) {
      const issRows = await issRes.json();
      if (Array.isArray(issRows) && issRows.length > 0) {
        targetIssue = issRows[0];
      }
    }

    if (!targetReport && targetIssue) {
      const linkedRepRes = await fetch(`${supabaseUrl}/rest/v1/reports?issue_id=eq.${encodeURIComponent(targetIssue.id)}&select=*`, {
        headers: {
          apikey: supabaseKey,
          Authorization: `Bearer ${supabaseKey}`,
          "Accept-Profile": "app",
        },
        next: { revalidate: 0 },
      }).catch(() => null);
      if (linkedRepRes && linkedRepRes.ok) {
        const lr = await linkedRepRes.json();
        if (Array.isArray(lr) && lr.length > 0) {
          targetReport = lr[0];
        }
      }
    }

    if (targetReport || targetIssue) {
      const r = targetReport || {
        id: targetIssue.id,
        title: targetIssue.title,
        description: targetIssue.summary || targetIssue.title,
        status: targetIssue.status,
        urgency: targetIssue.urgency,
        opd_id: targetIssue.opd_id,
        created_at: targetIssue.created_at,
        updated_at: targetIssue.updated_at,
        lat: targetIssue.center_lat,
        lng: targetIssue.center_lng,
        village_id: targetIssue.village_id,
        district_id: targetIssue.district_id,
        address_detail: targetIssue.address_detail,
      };

      const opdId = r.opd_id || (targetIssue ? targetIssue.opd_id : "") || "";
      const opdCode = OPD_LOOKUP[opdId]?.code || "DBM-SDA";
      let refOpd: Schema<"OpdRef">;
      try {
        refOpd = opdRef(opdCode);
      } catch {
        refOpd = { code: opdCode, slug: opdCode.toLowerCase(), name: OPD_LOOKUP[opdId]?.name || "Dinas" };
      }

      let defaultCat: Schema<"CategoryRef">;
      try {
        defaultCat = categoryRef("JALAN-RUSAK");
      } catch {
        defaultCat = { code: "UMUM", name: "Umum" };
      }

      let photoUrl: string | null = null;
      if (attRes && attRes.ok) {
        const atts = await attRes.json();
        if (Array.isArray(atts) && atts.length > 0 && atts[0].file_url) {
          photoUrl = atts[0].file_url;
        }
      }

      const issueIdForEvents = r.issue_id || (targetIssue ? targetIssue.id : r.id);
      let timelineEvents: Schema<"IssueEvent">[] = [];
      try {
        const eventsRes = await fetch(`${supabaseUrl}/rest/v1/issue_events?issue_id=eq.${encodeURIComponent(issueIdForEvents)}&order=created_at.asc`, {
          headers: {
            apikey: supabaseKey,
            Authorization: `Bearer ${supabaseKey}`,
            "Accept-Profile": "app",
          },
          next: { revalidate: 0 },
        });
        if (eventsRes.ok) {
          const evRows = await eventsRes.json();
          if (Array.isArray(evRows) && evRows.length > 0) {
            timelineEvents = evRows.map((ev: any) => ({
              id: ev.id,
              at: ev.created_at,
              from_status: (ev.from_status || null) as Status | null,
              to_status: (ev.to_status || "DITERUSKAN") as Status,
              actor_label: ev.author_name || (ev.to_status === "DITERUSKAN" ? "Admin Pusat" : refOpd.name),
              note: ev.note || null,
              evidence: [],
            }));
          }
        }
      } catch {}

      if (timelineEvents.length === 0) {
        timelineEvents = [
          {
            id: "ev-init",
            at: r.created_at,
            from_status: "DIAJUKAN",
            to_status: (r.status || "DITERUSKAN") as Status,
            actor_label: "Admin Pusat",
            note: "Diteruskan ke dinas terkait",
            evidence: [],
          },
        ];
      }

      const summary: Schema<"AgencyIssueSummary"> = {
        id: id,
        title: r.title,
        opd: refOpd,
        category: defaultCat,
        status: (r.status || "DITERUSKAN") as Status,
        urgency: (r.urgency || "NORMAL") as Urgency,
        reporter_count: r.support_count ? Number(r.support_count) + 1 : 1,
        location: {
          village: { id: r.village_id || "0197b000-0000-7000-8000-002800030000", name: "Kelurahan Setempat" },
          district: { id: r.district_id || "0197a000-0000-7000-8000-002800000000", name: r.address_detail || "Kecamatan Kota" },
          point: { lat: Number(r.lat) || -6.9175, lng: Number(r.lng) || 107.6191 },
        },
        created_at: r.created_at,
        updated_at: r.updated_at || r.created_at,
        cover_photo: photoUrl ? { url: photoUrl, mime: "image/jpeg" as const } : null,
        response_overdue: false,
        sla_due_at: null,
      };

      return {
        ...summary,
        ai: { summary: r.title, confidence: 0.95, safety_risk: "NONE", sensitive: false },
        reports: [
          {
            code: r.code || "GVR",
            body: r.description || r.title,
            visibility: "PUBLIK",
            created_at: r.created_at,
            location: summary.location,
            attachments: photoUrl
              ? [{ id: "att-1", url: photoUrl, mime: "image/jpeg", size_bytes: 200_000, public_ok: true, is_cover: true }]
              : [],
          },
        ],
        timeline: timelineEvents,
        allowed_transitions: allowedTransitions(summary.status),
      };
    }
  } catch {}

  const issue = agencyIssues().find((item) => item.id === id);
  if (!issue) {
    return null;
  }
  return {
    ...toAgencySummary(issue),
    ai: { summary: issue.title, confidence: AI_CONFIDENCE, safety_risk: SAFETY[issue.urgency], sensitive: false },
    reports: reportsOf(issue),
    timeline: issue.timeline,
    allowed_transitions: allowedTransitions(issue.status),
  };
}

export async function transitionIssue(id: string, input: TransitionInput): Promise<Outcome<Schema<"TransitionResult">>> {
  const supabaseUrl = process.env.SUPABASE_URL || "https://gtsskmxircedhfggqena.supabase.co";
  const supabaseKey =
    process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || "";

  let currentStatus: Status = "DITERUSKAN";
  let opdName = "Dinas Terkait";
  let targetIssueId = id;
  let targetReportId = id;
  let found = false;

  try {
    const [repRes, issRes] = await Promise.all([
      fetch(`${supabaseUrl}/rest/v1/reports?id=eq.${encodeURIComponent(id)}&select=*`, {
        headers: { apikey: supabaseKey, Authorization: `Bearer ${supabaseKey}`, "Accept-Profile": "app" },
      }),
      fetch(`${supabaseUrl}/rest/v1/issues?id=eq.${encodeURIComponent(id)}&select=*`, {
        headers: { apikey: supabaseKey, Authorization: `Bearer ${supabaseKey}`, "Accept-Profile": "app" },
      }),
    ]);

    if (repRes.ok) {
      const repRows = await repRes.json();
      if (Array.isArray(repRows) && repRows.length > 0) {
        const rep = repRows[0];
        found = true;
        currentStatus = (rep.status || "DITERUSKAN") as Status;
        targetReportId = rep.id;
        targetIssueId = rep.issue_id || rep.id;
        const lookup = rep.opd_id ? OPD_LOOKUP[rep.opd_id] : undefined;
        if (lookup) {
          opdName = lookup.name;
        }
      }
    }

    if (!found && issRes.ok) {
      const issRows = await issRes.json();
      if (Array.isArray(issRows) && issRows.length > 0) {
        const iss = issRows[0];
        found = true;
        currentStatus = (iss.status || "DITERUSKAN") as Status;
        targetIssueId = iss.id;
        const lookup = iss.opd_id ? OPD_LOOKUP[iss.opd_id] : undefined;
        if (lookup) {
          opdName = lookup.name;
        }
      }
    }
  } catch {}

  if (!found) {
    const mock = agencyIssues().find((item) => item.id === id);
    if (mock) {
      found = true;
      currentStatus = mock.status;
      opdName = mock.opd.name;
    }
  }

  if (!found) {
    return { ok: false, status: 404, message: "Isu tidak ditemukan." };
  }

  if (!allowedTransitions(currentStatus).includes(input.to)) {
    return { ok: false, status: 409, message: "Perubahan status ini tidak diizinkan untuk isu ini." };
  }

  const store = agencyStore();
  const evidence = (input.evidence_ids ?? []).flatMap((evidenceId) => store.evidence.get(evidenceId)?.attachment ?? []);
  if (input.to === "SELESAI" && evidence.length === 0) {
    return { ok: false, status: 422, message: "Unggah minimal satu foto bukti." };
  }

  const reason =
    input.to === "DITOLAK" && input.rejection_reason
      ? `${REJECTION_LABEL[input.rejection_reason]}. `
      : input.to === "DIALIHKAN" && input.transfer_reason
        ? `${TRANSFER_LABEL[input.transfer_reason]}. `
        : "";

  const note = (input.to === "DIPROSES" && input.started_at && input.estimated_completion_at)
    ? `[JADWAL PENGERJAAN] Mulai: ${new Date(input.started_at).toLocaleString("id-ID")} · Estimasi Selesai: ${new Date(input.estimated_completion_at).toLocaleString("id-ID")}\n\nCatatan: ${input.response}`
    : `${reason}${input.response}`;

  const event: Schema<"IssueEvent"> = {
    id: crypto.randomUUID(),
    at: currentTime().toISOString(),
    from_status: currentStatus,
    to_status: input.to,
    actor_label: opdName,
    note,
    evidence,
  };
  store.events.set(id, [...(store.events.get(id) ?? []), event]);

  try {
    const nowIso = new Date().toISOString();
    const patchReport: Record<string, any> = {
      status: input.to,
      updated_at: nowIso,
      hide_reason: note,
    };

    const patchIssue: Record<string, any> = {
      status: input.to,
      updated_at: nowIso,
    };
    if (input.to === "DIPROSES") {
      if (input.started_at) {
        patchIssue.first_responded_at = new Date(input.started_at).toISOString();
      }
      if (input.estimated_completion_at) {
        patchIssue.sla_due_at = new Date(input.estimated_completion_at).toISOString();
      }
    } else if (input.to === "SELESAI") {
      patchIssue.resolved_at = nowIso;
    }

    await Promise.allSettled([
      fetch(`${supabaseUrl}/rest/v1/reports?id=eq.${encodeURIComponent(targetReportId)}`, {
        method: "PATCH",
        headers: {
          apikey: supabaseKey,
          Authorization: `Bearer ${supabaseKey}`,
          "Content-Type": "application/json",
          "Content-Profile": "app",
        },
        body: JSON.stringify(patchReport),
      }),
      fetch(`${supabaseUrl}/rest/v1/reports?issue_id=eq.${encodeURIComponent(targetIssueId)}`, {
        method: "PATCH",
        headers: {
          apikey: supabaseKey,
          Authorization: `Bearer ${supabaseKey}`,
          "Content-Type": "application/json",
          "Content-Profile": "app",
        },
        body: JSON.stringify(patchReport),
      }),
      fetch(`${supabaseUrl}/rest/v1/reports?id=eq.${encodeURIComponent(id)}`, {
        method: "PATCH",
        headers: {
          apikey: supabaseKey,
          Authorization: `Bearer ${supabaseKey}`,
          "Content-Type": "application/json",
          "Content-Profile": "app",
        },
        body: JSON.stringify(patchReport),
      }),
      fetch(`${supabaseUrl}/rest/v1/issues?id=eq.${encodeURIComponent(targetIssueId)}`, {
        method: "PATCH",
        headers: {
          apikey: supabaseKey,
          Authorization: `Bearer ${supabaseKey}`,
          "Content-Type": "application/json",
          "Content-Profile": "app",
        },
        body: JSON.stringify(patchIssue),
      }),
      fetch(`${supabaseUrl}/rest/v1/issues?id=eq.${encodeURIComponent(id)}`, {
        method: "PATCH",
        headers: {
          apikey: supabaseKey,
          Authorization: `Bearer ${supabaseKey}`,
          "Content-Type": "application/json",
          "Content-Profile": "app",
        },
        body: JSON.stringify(patchIssue),
      }),
      fetch(`${supabaseUrl}/rest/v1/issue_events`, {
        method: "POST",
        headers: {
          apikey: supabaseKey,
          Authorization: `Bearer ${supabaseKey}`,
          "Content-Type": "application/json",
          "Content-Profile": "app",
        },
        body: JSON.stringify({
          id: crypto.randomUUID(),
          issue_id: targetIssueId,
          author_id: null,
          from_status: currentStatus,
          to_status: input.to,
          note: note,
          created_at: nowIso,
        }),
      }),
    ]);
  } catch {}

  return { ok: true, value: { status: input.to, event } };
}

export async function setPublication(
  issueId: string,
  attachmentId: string,
  input: Publication,
): Promise<Outcome<AgencyAttachment>> {
  const issue = (await getAgencyIssue(issueId)) || agencyIssues().find((item) => item.id === issueId);
  if (!issue) {
    return { ok: false, status: 404, message: "Isu tidak ditemukan." };
  }
  const reports = (issue as any).reports || reportsOf(issue as any);
  const target = (reports as any[])
    .flatMap((report: any) => (report.attachments || []).map((attachment: any) => ({ attachment, visibility: report.visibility })))
    .find((entry: any) => entry.attachment.id === attachmentId);
  if (!target) {
    return { ok: false, status: 404, message: "Foto tidak ditemukan." };
  }
  if (target.visibility !== "PUBLIK") {
    return { ok: false, status: 409, message: "Foto dari laporan Rahasia tidak bisa ditampilkan di publik." };
  }
  const next: Publication = { public_ok: input.public_ok, is_cover: input.public_ok && input.is_cover };
  const store = agencyStore();
  if (next.is_cover) {
    for (const report of reports) {
      for (const attachment of report.attachments) {
        if (attachment.id !== attachmentId && attachment.is_cover) {
          store.publication.set(attachment.id, { public_ok: attachment.public_ok, is_cover: false });
        }
      }
    }
  }
  store.publication.set(attachmentId, next);
  return { ok: true, value: { ...target.attachment, ...next } };
}

function toMime(type: string): Schema<"Attachment">["mime"] | null {
  switch (type) {
    case "image/jpeg":
    case "image/png":
    case "image/webp":
      return type;
    default:
      return null;
  }
}

export async function saveEvidence(file: File): Promise<Outcome<Schema<"Attachment">>> {
  const problem = checkFile(file);
  const mime = toMime(file.type);
  if (problem || !mime) {
    return { ok: false, status: 422, message: problem ?? "Hanya foto JPEG, PNG, atau WebP." };
  }
  const id = crypto.randomUUID();
  const attachment: Schema<"Attachment"> = {
    id,
    url: `${EVIDENCE_PATH}/${id}`,
    mime,
    size_bytes: file.size,
  };
  agencyStore().evidence.set(id, { attachment, mime, bytes: await file.arrayBuffer() });
  return { ok: true, value: attachment };
}

export function readEvidence(id: string) {
  return agencyStore().evidence.get(id) ?? null;
}

function medianOf(values: readonly number[]): number | null {
  if (values.length === 0) {
    return null;
  }
  const sorted = [...values].sort((a, b) => a - b);
  const middle = Math.floor(sorted.length / 2);
  const low = sorted[middle - 1] ?? 0;
  const high = sorted[middle] ?? 0;
  return sorted.length % 2 === 0 ? (low + high) / 2 : high;
}

function responseHours(issue: Issue): number | null {
  const index = issue.timeline.findIndex((event) => event.to_status === "DITERUSKAN");
  const forwarded = issue.timeline[index];
  const next = issue.timeline[index + 1];
  if (!forwarded || !next || next.actor_label === "Sistem") {
    return null;
  }
  return (Date.parse(next.at) - Date.parse(forwarded.at)) / MS_PER_HOUR;
}

export async function getAgencyStats(): Promise<Schema<"AgencyStats">> {
  const issues = agencyIssues();
  const counts = new Map<Status, number>();
  for (const issue of issues) {
    counts.set(issue.status, (counts.get(issue.status) ?? 0) + 1);
  }
  const hours = issues.flatMap((issue) => responseHours(issue) ?? []);
  const withinSla = issues.filter((issue) => {
    const taken = responseHours(issue);
    return taken !== null && taken <= SLA_HOURS[issue.urgency];
  }).length;
  const overdue = issues.filter((issue) => {
    const due = slaDueAt(issue);
    return due !== null && Date.parse(due) < currentTime().getTime();
  }).length;
  const considered = hours.length + overdue;
  return {
    total_open: issues.filter((issue) => OPEN.includes(issue.status)).length,
    by_status: [...counts.entries()].map(([status, count]) => ({ status, count })),
    sla_compliance_percent: considered === 0 ? 100 : Math.round((withinSla / considered) * 100),
    median_response_hours: medianOf(hours),
  };
}
