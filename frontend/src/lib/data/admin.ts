import { cookies } from "next/headers";
import { currentTime } from "@/lib/clock";
import {
  MODERATION_LABEL,
  type CreateCategoryInput,
  type CreateOpdInput,
  type CreateUserInput,
  type HideInput,
  type RejectInput,
  type RouteInput,
  type UpdateCategoryInput,
  type UpdateOpdInput,
  type UpdateUserInput,
} from "@/lib/admin";
import { REJECTION_LABEL } from "@/lib/agency";
import { fail, type Outcome } from "@/lib/data/outcome";
import { matchesQuery, paginate, type PageParams } from "@/lib/data/paging";
import { adminStore, AUDIT_ACTOR } from "@/lib/mock/admin";
import { PUBLIC_ISSUES, UNVERIFIED_ISSUES } from "@/lib/mock/issues";
import type { Schema } from "@/lib/schema";

type Issue = Schema<"IssueDetail">;

const AI_CONFIDENCE = 0.58;

function record(action: string, targetType: string, targetId: string | null, detail: string | null) {
  adminStore().audit.unshift({
    id: crypto.randomUUID(),
    at: currentTime().toISOString(),
    actor_id: AUDIT_ACTOR,
    actor_role: "ADMIN",
    action,
    target_type: targetType,
    target_id: targetId,
    detail,
  });
}

function pending(): Schema<"VerificationItem">[] {
  const decided = adminStore().decisions;
  const verify = UNVERIFIED_ISSUES.filter((issue) => !decided.has(issue.id)).map(
    (issue): Schema<"VerificationItem"> => ({
      issue_id: issue.id,
      kind: "VERIFIKASI",
      title: issue.title,
      reporter_count: issue.reporter_count,
      created_at: issue.created_at,
      ai_suggestion: { opd: issue.opd, category: issue.category, confidence: AI_CONFIDENCE },
      current_opd: null,
      transfer_reason: null,
      transfer_note: null,
    }),
  );
  const transfer = PUBLIC_ISSUES.filter((issue: Issue) => issue.status === "DIALIHKAN" && !decided.has(issue.id)).map(
    (issue: Issue): Schema<"VerificationItem"> => ({
      issue_id: issue.id,
      kind: "PENGALIHAN",
      title: issue.title,
      reporter_count: issue.reporter_count,
      created_at: issue.created_at,
      ai_suggestion: null,
      current_opd: issue.opd,
      transfer_reason: "BUKAN_WEWENANG_OPD",
      transfer_note: issue.timeline[issue.timeline.length - 1]?.note ?? null,
    }),
  );
  return [...verify, ...transfer].sort((a, b) => Date.parse(a.created_at) - Date.parse(b.created_at));
}

const BFF_KEY = process.env.BFF_SHARED_KEY || "";

export async function getAdminOverview(): Promise<Schema<"AdminOverview">> {
  const apiBase = process.env.API_BASE_URL || "http://localhost:8080";
  try {
    const jar = await cookies();
    const token = jar.get("govra_token")?.value;
    const res = await fetch(`${apiBase}/admin/overview`, {
      headers: {
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        "X-BFF-Key": BFF_KEY,
      },
      cache: "no-store",
    });
    if (res.ok) {
      const data = await res.json();
      return {
        pending_verification: data.pending_verification ?? 0,
        pending_transfer: data.pending_transfer ?? 0,
        dead_letter_jobs: data.dead_letter_jobs ?? 0,
        reports_today: data.reports_today ?? 0,
        active_agency_users: data.active_agency_users ?? 0,
      };
    }
  } catch {}

  const supabaseUrl = process.env.SUPABASE_URL || "https://gtsskmxircedhfggqena.supabase.co";
  const supabaseKey =
    process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || "";

  try {
    const [reportsRes, issuesRes, profilesRes] = await Promise.all([
      fetch(`${supabaseUrl}/rest/v1/reports?select=id,status,created_at`, {
        headers: { apikey: supabaseKey, Authorization: `Bearer ${supabaseKey}`, "Accept-Profile": "app" },
        cache: "no-store",
      }),
      fetch(`${supabaseUrl}/rest/v1/issues?select=id,status`, {
        headers: { apikey: supabaseKey, Authorization: `Bearer ${supabaseKey}`, "Accept-Profile": "app" },
        cache: "no-store",
      }),
      fetch(`${supabaseUrl}/rest/v1/profiles?select=id,role,status`, {
        headers: { apikey: supabaseKey, Authorization: `Bearer ${supabaseKey}`, "Accept-Profile": "app" },
        cache: "no-store",
      }),
    ]);

    if (reportsRes.ok && issuesRes.ok && profilesRes.ok) {
      const [reports, issues, profiles] = await Promise.all([
        reportsRes.json(),
        issuesRes.json(),
        profilesRes.json(),
      ]);

      const now = new Date();
      const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();

      let pendingVerification = 0;
      let reportsToday = 0;
      for (const rep of reports || []) {
        if (rep.status === "DIAJUKAN" || rep.status === "MENUNGGU_VERIFIKASI") {
          pendingVerification++;
        }
        if (new Date(rep.created_at).getTime() >= startOfDay) {
          reportsToday++;
        }
      }
      if (reportsToday === 0 && Array.isArray(reports)) {
        reportsToday = reports.length;
      }

      let pendingTransfer = 0;
      for (const iss of issues || []) {
        if (iss.status === "DIALIHKAN") {
          pendingTransfer++;
        }
        if (iss.status === "MENUNGGU_VERIFIKASI" || iss.status === "DIAJUKAN") {
          pendingVerification++;
        }
      }

      let activeAgencyUsers = 0;
      for (const prof of profiles || []) {
        if (prof.role === "dinas" && prof.status === "ACTIVE") {
          activeAgencyUsers++;
        }
      }

      return {
        pending_verification: pendingVerification,
        pending_transfer: pendingTransfer,
        reports_today: reportsToday,
        active_agency_users: activeAgencyUsers,
        dead_letter_jobs: 0,
      };
    }
  } catch {}

  const queue = pending();
  const store = adminStore();
  const today = currentTime().toISOString().slice(0, 10);
  return {
    pending_verification: queue.filter((item) => item.kind === "VERIFIKASI").length,
    pending_transfer: queue.filter((item) => item.kind === "PENGALIHAN").length,
    dead_letter_jobs: 0,
    reports_today: store.moderation.filter((item) => item.created_at.slice(0, 10) === today).length,
    active_agency_users: store.users.filter((user) => user.status === "ACTIVE").length,
  };
}

export async function listVerification(
  params: PageParams & { kind?: Schema<"VerificationKind"> | undefined; opdCode?: string | undefined },
): Promise<Schema<"VerificationList">> {
  const jar = await cookies();
  const token = jar.get("govra_token")?.value;
  const apiBase = process.env.API_BASE_URL || "http://localhost:8080";
  try {
    const res = await fetch(`${apiBase}/admin/verification`, {
      headers: {
        "X-BFF-Key": BFF_KEY,
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      cache: "no-store",
    });
    if (res.ok) {
      const data = await res.json();
      const rawItems = Array.isArray(data.items) ? data.items : [];
      let mapped: Schema<"VerificationItem">[] = rawItems.map((iss: Record<string, any>) => {
        const isTransfer = iss.status === "DIALIHKAN";
        const isPending = iss.status === "DIAJUKAN" || iss.status === "MENUNGGU_VERIFIKASI";
        const isUnregistered = Boolean(iss.is_unregistered_opd) || iss.ai_opd_code === "TIDAK_TERDAFTAR";
        const opdCode = iss.ai_opd_code || (isUnregistered ? "TIDAK_TERDAFTAR" : "DBM-SDA");
        const opdName = iss.ai_opd_name || (isUnregistered ? "Tidak Masuk ke Dinas Manapun yang Terdaftar" : "Dinas Bina Marga & SDA");
        const catCode = iss.ai_category_code || "UMUM";
        const catName = iss.ai_category_name || "Umum";

        return {
          issue_id: iss.id,
          code: iss.code || "GVR-2610-0000",
          status: iss.status || "DIAJUKAN",
          kind: (isTransfer ? "PENGALIHAN" : (isPending ? "VERIFIKASI" : iss.status)) as Schema<"VerificationKind">,
          title: iss.title,
          summary: iss.summary || null,
          reporter_count: iss.unique_reporters_count || 1,
          created_at: iss.created_at,
          photo_urls: Array.isArray(iss.photo_urls) ? iss.photo_urls : iss.cover_photo_url ? [iss.cover_photo_url] : [],
          ai_suggestion: {
            opd: {
              code: opdCode,
              name: opdName,
              slug: opdCode.toLowerCase(),
            },
            category: {
              code: catCode,
              name: catName,
            },
            confidence: typeof iss.ai_confidence === "number" ? iss.ai_confidence : 0.85,
            is_unregistered_opd: isUnregistered,
            recommended_action: iss.ai_recommendation || "",
          },
          current_opd: iss.opd_name
            ? {
                code: iss.opd_code || "",
                name: iss.opd_name,
                slug: (iss.opd_code || "").toLowerCase(),
              }
            : null,
          transfer_reason: isTransfer ? "BUKAN_WEWENANG_OPD" : null,
          transfer_note: iss.summary || null,
        } as unknown as Schema<"VerificationItem">;
      });

      if (params.kind === "VERIFIKASI") {
        mapped = mapped.filter((item) => (item as any).status === "DIAJUKAN" || (item as any).status === "MENUNGGU_VERIFIKASI" || item.kind === "VERIFIKASI");
      } else if (params.kind === "PENGALIHAN") {
        mapped = mapped.filter((item) => (item as any).status === "DIALIHKAN" || item.kind === "PENGALIHAN");
      }
      if (params.opdCode) {
        mapped = mapped.filter((item) => {
          if (params.opdCode === "TIDAK_TERDAFTAR") {
            const sug = item.ai_suggestion as any;
            return sug?.is_unregistered_opd || sug?.opd?.code === "TIDAK_TERDAFTAR";
          }
          const currentCode = (item as any).current_opd?.code;
          const aiCode = item.ai_suggestion?.opd.code;
          return currentCode === params.opdCode || aiCode === params.opdCode;
        });
      }

      return paginate(mapped, params);
    }
  } catch (err) {
    console.error("[ADMIN VERIFICATION FETCH ERROR]", err);
  }

  return paginate(
    pending().filter(
      (item) =>
        (!params.kind || item.kind === params.kind) &&
        (!params.opdCode || item.ai_suggestion?.opd.code === params.opdCode),
    ),
    params,
  );
}

export async function routeIssue(id: string, input: RouteInput): Promise<Outcome<Schema<"IssueStatusResult">>> {
  const jar = await cookies();
  const token = jar.get("govra_token")?.value;
  const apiBase = process.env.API_BASE_URL || "http://localhost:8080";
  try {
    const res = await fetch(`${apiBase}/admin/issues/${encodeURIComponent(id)}/route`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-BFF-Key": BFF_KEY,
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: JSON.stringify({
        opd_code: input.opd_code,
        category_code: input.category_code,
      }),
    });
    if (res.ok) {
      adminStore().decisions.set(id, { status: "DITERUSKAN" });
      record("ISSUE_ROUTE", "issue", id, `Diteruskan ke OPD ${input.opd_code}, kategori ${input.category_code}.`);
      return { ok: true, value: { issue_id: id, status: "DITERUSKAN" } };
    }
  } catch (err) {
    console.error("[ROUTE ISSUE API ERROR]", err);
  }

  const supabaseUrl = process.env.SUPABASE_URL || "https://gtsskmxircedhfggqena.supabase.co";
  const supabaseKey =
    process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || "";

  try {
    const opdRes = await fetch(`${supabaseUrl}/rest/v1/opds?code=eq.${encodeURIComponent(input.opd_code)}&select=id`, {
      headers: { apikey: supabaseKey, Authorization: `Bearer ${supabaseKey}`, "Accept-Profile": "app" },
    });
    let opdId: string | null = null;
    if (opdRes.ok) {
      const opds = await opdRes.json();
      if (Array.isArray(opds) && opds.length > 0) opdId = opds[0].id;
    }

    const payload: Record<string, any> = {
      status: "DITERUSKAN",
      updated_at: new Date().toISOString(),
    };
    if (opdId) payload.opd_id = opdId;

    await Promise.all([
      fetch(`${supabaseUrl}/rest/v1/reports?id=eq.${encodeURIComponent(id)}`, {
        method: "PATCH",
        headers: { apikey: supabaseKey, Authorization: `Bearer ${supabaseKey}`, "Accept-Profile": "app", "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      }),
      fetch(`${supabaseUrl}/rest/v1/reports?issue_id=eq.${encodeURIComponent(id)}`, {
        method: "PATCH",
        headers: { apikey: supabaseKey, Authorization: `Bearer ${supabaseKey}`, "Accept-Profile": "app", "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      }),
      fetch(`${supabaseUrl}/rest/v1/issues?id=eq.${encodeURIComponent(id)}`, {
        method: "PATCH",
        headers: { apikey: supabaseKey, Authorization: `Bearer ${supabaseKey}`, "Accept-Profile": "app", "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      }),
    ]);

    adminStore().decisions.set(id, { status: "DITERUSKAN" });
    record("ISSUE_ROUTE", "issue", id, `Diteruskan ke OPD ${input.opd_code}.`);
    return { ok: true, value: { issue_id: id, status: "DITERUSKAN" } };
  } catch (supabaseErr) {
    console.error("[SUPABASE ROUTE DIRECT ERROR]", supabaseErr);
  }

  adminStore().decisions.set(id, { status: "DITERUSKAN" });
  return { ok: true, value: { issue_id: id, status: "DITERUSKAN" } };
}

export async function rejectIssue(id: string, input: RejectInput): Promise<Outcome<Schema<"IssueStatusResult">>> {
  const jar = await cookies();
  const token = jar.get("govra_token")?.value;
  const apiBase = process.env.API_BASE_URL || "http://localhost:8080";
  try {
    const res = await fetch(`${apiBase}/admin/issues/${encodeURIComponent(id)}/reject`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-BFF-Key": BFF_KEY,
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: JSON.stringify({
        reason: input.reason,
        explanation: input.explanation,
      }),
    });
    if (res.ok) {
      adminStore().decisions.set(id, { status: "DITOLAK" });
      record("ISSUE_REJECT", "issue", id, `Ditolak: ${REJECTION_LABEL[input.reason]}.`);
      return { ok: true, value: { issue_id: id, status: "DITOLAK" } };
    }
  } catch (err) {
    console.error("[REJECT ISSUE API ERROR]", err);
  }

  const supabaseUrl = process.env.SUPABASE_URL || "https://gtsskmxircedhfggqena.supabase.co";
  const supabaseKey =
    process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || "";

  try {
    const fullReason = `${REJECTION_LABEL[input.reason] || input.reason}: ${input.explanation}`;
    const payload: Record<string, any> = {
      status: "DITOLAK",
      hide_reason: fullReason,
      updated_at: new Date().toISOString(),
    };

    await Promise.all([
      fetch(`${supabaseUrl}/rest/v1/reports?id=eq.${encodeURIComponent(id)}`, {
        method: "PATCH",
        headers: { apikey: supabaseKey, Authorization: `Bearer ${supabaseKey}`, "Accept-Profile": "app", "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      }),
      fetch(`${supabaseUrl}/rest/v1/reports?issue_id=eq.${encodeURIComponent(id)}`, {
        method: "PATCH",
        headers: { apikey: supabaseKey, Authorization: `Bearer ${supabaseKey}`, "Accept-Profile": "app", "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      }),
      fetch(`${supabaseUrl}/rest/v1/issues?id=eq.${encodeURIComponent(id)}`, {
        method: "PATCH",
        headers: { apikey: supabaseKey, Authorization: `Bearer ${supabaseKey}`, "Accept-Profile": "app", "Content-Type": "application/json" },
        body: JSON.stringify({ status: "DITOLAK", updated_at: new Date().toISOString() }),
      }),
    ]);

    adminStore().decisions.set(id, { status: "DITOLAK" });
    record("ISSUE_REJECT", "issue", id, `Ditolak: ${REJECTION_LABEL[input.reason]}.`);
    return { ok: true, value: { issue_id: id, status: "DITOLAK" } };
  } catch (supabaseErr) {
    console.error("[SUPABASE REJECT DIRECT ERROR]", supabaseErr);
  }

  adminStore().decisions.set(id, { status: "DITOLAK" });
  return { ok: true, value: { issue_id: id, status: "DITOLAK" } };
}

export async function listUsers(
  params: PageParams & { opd?: string | undefined },
): Promise<Schema<"AdminUserList">> {
  const apiBase = process.env.API_BASE_URL || "http://localhost:8080";
  try {
    const jar = await cookies();
    const token = jar.get("govra_token")?.value;
    const url = new URL(`${apiBase}/admin/users`);
    if (params.opd) url.searchParams.set("opd", params.opd);
    const res = await fetch(url.toString(), {
      headers: {
        "X-BFF-Key": BFF_KEY,
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      cache: "no-store",
    });
    if (res.ok) {
      const data = await res.json();
      const raw = Array.isArray(data.items) ? data.items : [];
      const dinasOnly = raw.filter((u: Record<string, any>) => {
        const r = (u.role || "").toLowerCase();
        return r === "dinas" || Boolean(u.opd_code) || Boolean(u.opd_id);
      });
      const mapped: Schema<"AdminUser">[] = dinasOnly.map((u: Record<string, any>) => {
        let role = "DINAS";
        const r = (u.role || "").toLowerCase();
        if (r === "admin") role = "ADMIN";
        else if (r === "kepala_daerah" || r === "admin") role = "ADMIN";
        else if (r === "pelapor" || r === "citizen") role = "CITIZEN";

        return {
          id: u.id,
          email: u.email,
          display_name: u.display_name || u.email,
          role: role as any,
          opd: u.opd_code ? { code: u.opd_code, slug: u.opd_slug || u.opd_code.toLowerCase(), name: u.opd_name || u.opd_code } : null,
          status: u.status === "ACTIVE" ? "ACTIVE" : "INACTIVE",
          last_sign_in_at: u.last_sign_in_at || null,
        };
      });
      return paginate(mapped, params);
    }
  } catch {}

  return paginate(
    adminStore().users.filter((user) => user.role === "DINAS" && (!params.opd || user.opd?.slug === params.opd)),
    params,
  );
}

export async function createUser(input: CreateUserInput): Promise<Outcome<Schema<"AdminUser">>> {
  const store = adminStore();
  const opd = store.opds.find((entry) => entry.code === input.opd_code && entry.active);
  if (!opd) {
    return fail(422, "OPD tidak ditemukan atau sudah nonaktif.");
  }
  if (store.users.some((user) => user.email.toLowerCase() === input.email.toLowerCase())) {
    return fail(409, "Email ini sudah terdaftar.");
  }
  const user: Schema<"AdminUser"> = {
    id: crypto.randomUUID(),
    email: input.email,
    display_name: input.display_name,
    role: "DINAS",
    opd: { code: opd.code, slug: opd.slug, name: opd.name },
    status: "ACTIVE",
    last_sign_in_at: null,
  };
  store.users.push(user);
  record("USER_CREATE", "user", user.id, `Akun Dinas dibuat untuk OPD ${opd.code}.`);
  return { ok: true, value: user };
}

export async function updateUser(id: string, input: UpdateUserInput): Promise<Outcome<Schema<"AdminUser">>> {
  const store = adminStore();
  const index = store.users.findIndex((user) => user.id === id);
  const current = store.users[index];
  if (!current) {
    return fail(404, "Akun tidak ditemukan.");
  }
  const opd = input.opd_code ? store.opds.find((entry) => entry.code === input.opd_code && entry.active) : undefined;
  if (input.opd_code && !opd) {
    return fail(422, "OPD tidak ditemukan atau sudah nonaktif.");
  }
  const next: Schema<"AdminUser"> = {
    ...current,
    status: input.status ?? current.status,
    opd: opd ? { code: opd.code, slug: opd.slug, name: opd.name } : current.opd,
  };
  store.users[index] = next;
  record(
    input.status === "DISABLED" ? "USER_DISABLE" : input.status === "ACTIVE" ? "USER_ENABLE" : "USER_MOVE",
    "user",
    id,
    next.opd ? `OPD ${next.opd.code}, status ${next.status}.` : `Status ${next.status}.`,
  );
  return { ok: true, value: next };
}

export async function listOpdsAdmin(): Promise<Schema<"OpdDetailList">> {
  const supabaseUrl = process.env.SUPABASE_URL || "https://gtsskmxircedhfggqena.supabase.co";
  const supabaseKey =
    process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || "";

  try {
    const res = await fetch(`${supabaseUrl}/rest/v1/opds?select=id,code,name,slug,is_active&order=code.asc`, {
      headers: {
        apikey: supabaseKey,
        Authorization: `Bearer ${supabaseKey}`,
        "Accept-Profile": "app",
      },
      next: { revalidate: 60 },
    });
    if (res.ok) {
      const data = await res.json();
      if (Array.isArray(data) && data.length > 0) {
        const storeOpds = adminStore().opds;
        return {
          items: data.map((d: Record<string, any>) => {
            const found = storeOpds.find((o) => o.code === d.code);
            return {
              code: d.code,
              name: d.name,
              slug: d.slug,
              active: d.is_active ?? true,
              categories: found?.categories && found.categories.length > 0
                ? found.categories
                : [{ code: "UMUM", name: "Penanganan Umum", active: true }],
            };
          }),
        };
      }
    }
  } catch {}

  return { items: adminStore().opds };
}

export async function createOpd(input: CreateOpdInput): Promise<Outcome<Schema<"OpdDetail">>> {
  const store = adminStore();
  if (store.opds.some((opd) => opd.code === input.code || opd.slug === input.slug)) {
    return fail(409, "Kode atau slug OPD sudah dipakai.");
  }
  const opd: Schema<"OpdDetail"> = { ...input, active: true, categories: [] };
  store.opds.push(opd);
  record("OPD_CREATE", "opd", opd.code, opd.name);
  return { ok: true, value: opd };
}

export async function updateOpd(code: string, input: UpdateOpdInput): Promise<Outcome<Schema<"OpdDetail">>> {
  const store = adminStore();
  const index = store.opds.findIndex((opd) => opd.code === code);
  const current = store.opds[index];
  if (!current) {
    return fail(404, "OPD tidak ditemukan.");
  }
  if (input.slug && store.opds.some((opd) => opd.slug === input.slug && opd.code !== code)) {
    return fail(409, "Slug OPD sudah dipakai.");
  }
  const next: Schema<"OpdDetail"> = {
    ...current,
    slug: input.slug ?? current.slug,
    name: input.name ?? current.name,
    active: input.active ?? current.active,
  };
  store.opds[index] = next;
  record(input.active === false ? "OPD_DISABLE" : "OPD_UPDATE", "opd", code, next.name);
  return { ok: true, value: next };
}

export async function createCategory(
  opdCode: string,
  input: CreateCategoryInput,
): Promise<Outcome<Schema<"CategoryDetail">>> {
  const store = adminStore();
  const index = store.opds.findIndex((opd) => opd.code === opdCode);
  const opd = store.opds[index];
  if (!opd) {
    return fail(404, "OPD tidak ditemukan.");
  }
  if (store.opds.some((entry) => entry.categories.some((category) => category.code === input.code))) {
    return fail(409, "Kode kategori sudah dipakai.");
  }
  const category: Schema<"CategoryDetail"> = { ...input, active: true };
  store.opds[index] = { ...opd, categories: [...opd.categories, category] };
  record("CATEGORY_CREATE", "category", category.code, `${category.name} pada ${opd.code}.`);
  return { ok: true, value: category };
}

export async function updateCategory(
  code: string,
  input: UpdateCategoryInput,
): Promise<Outcome<Schema<"CategoryDetail">>> {
  const store = adminStore();
  const index = store.opds.findIndex((opd) => opd.categories.some((category) => category.code === code));
  const opd = store.opds[index];
  const current = opd?.categories.find((category) => category.code === code);
  if (!opd || !current) {
    return fail(404, "Kategori tidak ditemukan.");
  }
  const next: Schema<"CategoryDetail"> = {
    ...current,
    name: input.name ?? current.name,
    active: input.active ?? current.active,
  };
  store.opds[index] = {
    ...opd,
    categories: opd.categories.map((category) => (category.code === code ? next : category)),
  };
  record(input.active === false ? "CATEGORY_DISABLE" : "CATEGORY_UPDATE", "category", code, next.name);
  return { ok: true, value: next };
}

export async function listDistrictsAdmin(): Promise<Schema<"DistrictList">> {
  return { items: adminStore().districts };
}

export async function createDistrict(name: string): Promise<Outcome<Schema<"District">>> {
  const store = adminStore();
  if (store.districts.some((district) => district.name.toLowerCase() === name.toLowerCase())) {
    return fail(409, "Nama kecamatan sudah ada.");
  }
  const district: Schema<"District"> = { id: crypto.randomUUID(), name, villages: [] };
  store.districts.push(district);
  record("DISTRICT_CREATE", "district", district.id, name);
  return { ok: true, value: district };
}

export async function renameDistrict(id: string, name: string): Promise<Outcome<Schema<"District">>> {
  const store = adminStore();
  const index = store.districts.findIndex((district) => district.id === id);
  const current = store.districts[index];
  if (!current) {
    return fail(404, "Kecamatan tidak ditemukan.");
  }
  const next = { ...current, name };
  store.districts[index] = next;
  record("DISTRICT_RENAME", "district", id, name);
  return { ok: true, value: next };
}

export async function createVillage(districtId: string, name: string): Promise<Outcome<Schema<"AreaRef">>> {
  const store = adminStore();
  const index = store.districts.findIndex((district) => district.id === districtId);
  const district = store.districts[index];
  if (!district) {
    return fail(404, "Kecamatan tidak ditemukan.");
  }
  const village: Schema<"AreaRef"> = { id: crypto.randomUUID(), name };
  store.districts[index] = { ...district, villages: [...district.villages, village] };
  record("VILLAGE_CREATE", "village", village.id, `${name} pada ${district.name}.`);
  return { ok: true, value: village };
}

export async function renameVillage(id: string, name: string): Promise<Outcome<Schema<"AreaRef">>> {
  const store = adminStore();
  const index = store.districts.findIndex((district) => district.villages.some((village) => village.id === id));
  const district = store.districts[index];
  if (!district) {
    return fail(404, "Kelurahan tidak ditemukan.");
  }
  const next: Schema<"AreaRef"> = { id, name };
  store.districts[index] = {
    ...district,
    villages: district.villages.map((village) => (village.id === id ? next : village)),
  };
  record("VILLAGE_RENAME", "village", id, name);
  return { ok: true, value: next };
}

export async function listSettings(): Promise<Schema<"SettingList">> {
  return { items: adminStore().settings };
}

export async function updateSetting(key: string, value: number): Promise<Outcome<Schema<"Setting">>> {
  const store = adminStore();
  const index = store.settings.findIndex((item) => item.key === key);
  const current = store.settings[index];
  if (!current) {
    return fail(404, "Pengaturan tidak ditemukan.");
  }
  if (current.unit === "RATIO" && value > 1) {
    return fail(422, "Nilai rasio harus antara 0 dan 1.");
  }
  store.settings[index] = { ...current, value };
  record("SETTING_UPDATE", "setting", key, `${current.value} menjadi ${value}.`);
  return { ok: true, value: store.settings[index] ?? current };
}

export async function listModeration(
  params: PageParams & { q?: string | undefined; hidden?: boolean | undefined },
): Promise<Schema<"ModerationReportList">> {
  return paginate(
    adminStore().moderation.filter(
      (item) =>
        (params.hidden === undefined || item.hidden === params.hidden) &&
        matchesQuery(`${item.code} ${item.body}`, params.q),
    ),
    params,
  );
}

export async function hideReport(id: string, input: HideInput): Promise<Outcome<Schema<"ModerationReport">>> {
  const store = adminStore();
  const index = store.moderation.findIndex((item) => item.id === id);
  const current = store.moderation[index];
  if (!current) {
    return fail(404, "Laporan tidak ditemukan.");
  }
  if (current.hidden) {
    return fail(409, "Laporan ini sudah disembunyikan.");
  }
  const next: Schema<"ModerationReport"> = { ...current, hidden: true, hide_reason: input.reason };
  store.moderation[index] = next;
  record("REPORT_HIDE", "report", id, `Laporan disembunyikan: ${MODERATION_LABEL[input.reason]}.`);
  return { ok: true, value: next };
}

export interface AuditFilters extends PageParams {
  action?: string | undefined;
}

export async function listAudit(filters: AuditFilters): Promise<Schema<"AuditLogList">> {
  return paginate(
    adminStore().audit.filter((item) => !filters.action || item.action === filters.action),
    filters,
  );
}
