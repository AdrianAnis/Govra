import { formatRelativeTime, formatRupiah } from "@/lib/format";
import { getSessionUser } from "@/lib/data/session";

const supabaseUrl = process.env.SUPABASE_URL || "https://gtsskmxircedhfggqena.supabase.co";
const supabaseKey =
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || "";

export type NotificationCategory =
  | "PROKER"
  | "LAPORAN"
  | "DUKUNGAN"
  | "KOMENTAR"
  | "VERIFIKASI"
  | "PENUGASAN";

export interface NotificationItem {
  id: string;
  code: string;
  category: NotificationCategory;
  title: string;
  message: string;
  text: string;
  timestamp: string;
  when: string;
  href: string;
  tabKey: string;
  unread: boolean;
  meta?: {
    code?: string;
    opdName?: string;
    status?: string;
    supportCount?: number;
    likesCount?: number;
    authorName?: string;
  };
}

export type Notification = NotificationItem;

export interface NotificationFeed {
  items: NotificationItem[];
  unreadCount: number;
  tabActivity: Record<string, string>;
}

export async function listRoleNotifications(
  role: string = "pelapor",
  opdId?: string,
  userEmail?: string,
  userId?: string,
): Promise<NotificationFeed> {
  const normalizedRole = role.toLowerCase();
  const headers = {
    apikey: supabaseKey,
    Authorization: `Bearer ${supabaseKey}`,
    "Accept-Profile": "app",
  };

  try {
    const [reportsRes, updatesRes, opdsRes, programsRes, commentsRes, likesRes, supportsRes] =
      await Promise.all([
        fetch(
          `${supabaseUrl}/rest/v1/reports?select=id,code,title,status,opd_id,reporter_id,likes_count,support_count,comments_count,created_at,updated_at&order=created_at.desc&limit=35`,
          { headers, cache: "no-store" },
        ).catch(() => null),
        fetch(
          `${supabaseUrl}/rest/v1/program_updates?select=id,program_id,opd_id,title,content,created_at&order=created_at.desc&limit=35`,
          { headers, cache: "no-store" },
        ).catch(() => null),
        fetch(`${supabaseUrl}/rest/v1/opds?select=id,code,name`, {
          headers,
          cache: "no-store",
        }).catch(() => null),
        fetch(
          `${supabaseUrl}/rest/v1/programs?select=id,code,name,budget_pagu,created_at&order=created_at.desc&limit=20`,
          { headers, cache: "no-store" },
        ).catch(() => null),
        fetch(
          `${supabaseUrl}/rest/v1/feed_comments?select=id,feed_id,user_id,author_name,content,created_at&order=created_at.desc&limit=25`,
          { headers, cache: "no-store" },
        ).catch(() => null),
        fetch(
          `${supabaseUrl}/rest/v1/feed_likes?select=id,feed_id,user_id,created_at&order=created_at.desc&limit=25`,
          { headers, cache: "no-store" },
        ).catch(() => null),
        fetch(
          `${supabaseUrl}/rest/v1/feed_supports?select=id,feed_id,user_id,supporter_name,created_at&order=created_at.desc&limit=25`,
          { headers, cache: "no-store" },
        ).catch(() => null),
      ]);

    const opdMap = new Map<string, string>();
    if (opdsRes && opdsRes.ok) {
      const opds = await opdsRes.json();
      if (Array.isArray(opds)) {
        for (const o of opds) {
          opdMap.set(o.id, o.name);
        }
      }
    }

    const items: NotificationItem[] = [];
    const tabActivity: Record<string, string> = {};

    const rawReports = reportsRes && reportsRes.ok ? await reportsRes.json() : [];
    const reports: any[] = Array.isArray(rawReports) ? rawReports : [];

    const rawUpdates = updatesRes && updatesRes.ok ? await updatesRes.json() : [];
    const updates: any[] = Array.isArray(rawUpdates) ? rawUpdates : [];

    const rawPrograms = programsRes && programsRes.ok ? await programsRes.json() : [];
    const programs: any[] = Array.isArray(rawPrograms) ? rawPrograms : [];

    const rawComments = commentsRes && commentsRes.ok ? await commentsRes.json() : [];
    const comments: any[] = Array.isArray(rawComments) ? rawComments : [];

    const rawLikes = likesRes && likesRes.ok ? await likesRes.json() : [];
    const likes: any[] = Array.isArray(rawLikes) ? rawLikes : [];

    const rawSupports = supportsRes && supportsRes.ok ? await supportsRes.json() : [];
    const supports: any[] = Array.isArray(rawSupports) ? rawSupports : [];

    const reportById = new Map<string, any>();
    for (const r of reports) {
      reportById.set(r.id, r);
    }

    if (normalizedRole === "pelapor") {
      for (const prog of programs) {
        const time = prog.created_at || new Date().toISOString();
        const tab = "/proker";
        if (!tabActivity[tab] || new Date(time) > new Date(tabActivity[tab])) {
          tabActivity[tab] = time;
        }
        items.push({
          id: `prog-new-${prog.id}`,
          code: prog.code || "PROKER",
          category: "PROKER",
          title: "Proyek Baru Diumumkan",
          message: `Pemerintah Kota merilis proyek: "${prog.name}"${prog.budget_pagu ? ` dengan pagu ${formatRupiah(prog.budget_pagu)}` : ""}.`,
          text: `Proyek baru: ${prog.name}`,
          timestamp: time,
          when: formatRelativeTime(time),
          href: `/proker/${prog.code || prog.id}`,
          tabKey: tab,
          unread: true,
          meta: { code: prog.code, opdName: "Pemerintah Kota" },
        });
      }

      const userReports =
        userId && reports.some((r) => r.reporter_id === userId)
          ? reports.filter((r) => r.reporter_id === userId)
          : reports.slice(0, 6);

      const userReportIds = new Set(userReports.map((r) => r.id));

      for (const rep of userReports) {
        const status = (rep.status || "").toUpperCase();
        const opdName = opdMap.get(rep.opd_id) ?? "Dinas Terkait";
        const time = rep.updated_at || rep.created_at || new Date().toISOString();
        const tab = "/pelapor/laporan";
        if (!tabActivity[tab] || new Date(time) > new Date(tabActivity[tab])) {
          tabActivity[tab] = time;
        }

        let statusTitle = "Pembaruan Status Laporan";
        let statusMsg = `Laporan Anda ${rep.code} ("${rep.title}") kini berstatus ${status}.`;

        if (status === "DIAJUKAN") {
          statusTitle = "Laporan Berhasil Dikirim";
          statusMsg = `Laporan Anda ${rep.code} ("${rep.title}") telah diterima dan menunggu verifikasi petugas.`;
        } else if (status === "DITERUSKAN") {
          statusTitle = "Laporan Diverifikasi & Diteruskan";
          statusMsg = `Laporan Anda ${rep.code} telah diverifikasi dan diteruskan ke ${opdName}.`;
        } else if (status === "DIPROSES") {
          statusTitle = "Laporan Sedang Ditangani";
          statusMsg = `Petugas dari ${opdName} sedang melakukan penanganan lapangan untuk laporan Anda ${rep.code}.`;
        } else if (status === "SELESAI") {
          statusTitle = "Laporan Selesai Ditangani";
          statusMsg = `Kabar baik! Laporan Anda ${rep.code} telah rampung ditangani oleh ${opdName}. Terima kasih atas partisipasi Anda.`;
        } else if (status === "DITOLAK") {
          statusTitle = "Laporan Ditolak";
          statusMsg = `Laporan ${rep.code} tidak dapat diproses lebih lanjut oleh verifikator. Silakan tinjau alasan penolakan.`;
        }

        items.push({
          id: `rep-status-${rep.id}`,
          code: rep.code,
          category: "LAPORAN",
          title: statusTitle,
          message: statusMsg,
          text: `Laporan ${rep.code} berstatus ${status}`,
          timestamp: time,
          when: formatRelativeTime(time),
          href: `/pelapor/laporan/${rep.code}`,
          tabKey: tab,
          unread: status === "SELESAI" || status === "DIPROSES" || status === "DITERUSKAN",
          meta: { code: rep.code, opdName, status },
        });

        const likesCount = Number(rep.likes_count) || 0;
        if (likesCount > 0) {
          items.push({
            id: `rep-like-agg-${rep.id}`,
            code: rep.code,
            category: "DUKUNGAN",
            title: "Apresiasi Suka pada Laporan Anda",
            message: `Laporan Anda "${rep.title}" (${rep.code}) telah disukai oleh ${likesCount} warga kota.`,
            text: `Laporan ${rep.code} disukai ${likesCount} warga`,
            timestamp: time,
            when: formatRelativeTime(time),
            href: `/pelapor/laporan/${rep.code}`,
            tabKey: tab,
            unread: true,
            meta: { code: rep.code, likesCount },
          });
        }

        const supportCount = Number(rep.support_count) || 0;
        if (supportCount > 0) {
          items.push({
            id: `rep-sup-agg-${rep.id}`,
            code: rep.code,
            category: "DUKUNGAN",
            title: "Dukungan Warga untuk Laporan Anda",
            message: `Laporan Anda "${rep.title}" (${rep.code}) telah mendapatkan ${supportCount} dukungan warga.`,
            text: `Laporan ${rep.code} didukung ${supportCount} warga`,
            timestamp: time,
            when: formatRelativeTime(time),
            href: `/pelapor/laporan/${rep.code}`,
            tabKey: tab,
            unread: true,
            meta: { code: rep.code, supportCount },
          });
        }
      }

      for (const com of comments) {
        const rep = reportById.get(com.feed_id);
        if (rep && (userReportIds.has(rep.id) || !userId)) {
          if (userId && com.user_id === userId) continue;
          const time = com.created_at || new Date().toISOString();
          const tab = "/pelapor/laporan";
          if (!tabActivity[tab] || new Date(time) > new Date(tabActivity[tab])) {
            tabActivity[tab] = time;
          }
          items.push({
            id: `feed-comment-${com.id}`,
            code: rep.code,
            category: "KOMENTAR",
            title: "Komentar Baru pada Laporan Anda",
            message: `${com.author_name || "Warga"} berkomentar: "${com.content}" pada laporan "${rep.title}".`,
            text: `Komentar baru pada ${rep.code}`,
            timestamp: time,
            when: formatRelativeTime(time),
            href: `/pelapor/laporan/${rep.code}`,
            tabKey: tab,
            unread: true,
            meta: { code: rep.code, authorName: com.author_name },
          });
        }
      }

      for (const lk of likes) {
        const rep = reportById.get(lk.feed_id);
        if (rep && (userReportIds.has(rep.id) || !userId)) {
          if (userId && lk.user_id === userId) continue;
          const time = lk.created_at || new Date().toISOString();
          const tab = "/pelapor/laporan";
          if (!tabActivity[tab] || new Date(time) > new Date(tabActivity[tab])) {
            tabActivity[tab] = time;
          }
          items.push({
            id: `feed-like-${lk.id}`,
            code: rep.code,
            category: "DUKUNGAN",
            title: "Apresiasi Suka pada Laporan Anda",
            message: `Seseorang menyukai laporan Anda: "${rep.title}" (${rep.code}).`,
            text: `Laporan ${rep.code} disukai warga`,
            timestamp: time,
            when: formatRelativeTime(time),
            href: `/pelapor/laporan/${rep.code}`,
            tabKey: tab,
            unread: true,
            meta: { code: rep.code },
          });
        }
      }

      for (const sup of supports) {
        const rep = reportById.get(sup.feed_id);
        if (rep && (userReportIds.has(rep.id) || !userId)) {
          if (userId && sup.user_id === userId) continue;
          const time = sup.created_at || new Date().toISOString();
          const tab = "/pelapor/laporan";
          if (!tabActivity[tab] || new Date(time) > new Date(tabActivity[tab])) {
            tabActivity[tab] = time;
          }
          items.push({
            id: `feed-sup-${sup.id}`,
            code: rep.code,
            category: "DUKUNGAN",
            title: "Dukungan Baru untuk Laporan Anda",
            message: `${sup.supporter_name || "Warga"} memberikan dukungan pada laporan Anda: "${rep.title}" (${rep.code}).`,
            text: `Dukungan baru pada ${rep.code}`,
            timestamp: time,
            when: formatRelativeTime(time),
            href: `/pelapor/laporan/${rep.code}`,
            tabKey: tab,
            unread: true,
            meta: { code: rep.code },
          });
        }
      }
    } else if (normalizedRole === "dinas") {
      for (const rep of reports) {
        const isAssigned = !opdId || rep.opd_id === opdId;
        const status = (rep.status || "").toUpperCase();
        if (isAssigned && (status === "DITERUSKAN" || status === "DIPROSES" || status === "DIAJUKAN")) {
          const time = rep.created_at || new Date().toISOString();
          const tab = "/dinas/laporan";
          if (!tabActivity[tab] || new Date(time) > new Date(tabActivity[tab])) {
            tabActivity[tab] = time;
          }
          items.push({
            id: `rep-dinas-${rep.id}`,
            code: rep.code,
            category: "LAPORAN",
            title: "Disposisi Laporan Masuk",
            message: `Laporan ${rep.code} ("${rep.title}") telah didisposisikan ke instansi Anda untuk penanganan lapangan.`,
            text: `Laporan ${rep.code} didisposisikan ke dinas Anda.`,
            timestamp: time,
            when: formatRelativeTime(time),
            href: "/dinas/laporan",
            tabKey: tab,
            unread: true,
            meta: { code: rep.code, status },
          });
        }
      }

      for (const upd of updates) {
        const isForThisDinas = !opdId || upd.opd_id === opdId;
        if (isForThisDinas) {
          const isAssignment = upd.title === "PENUGASAN_OPD";
          const time = upd.created_at || new Date().toISOString();
          const tab = "/dinas/tugas-proker";
          if (!tabActivity[tab] || new Date(time) > new Date(tabActivity[tab])) {
            tabActivity[tab] = time;
          }
          items.push({
            id: `upd-dinas-${upd.id}`,
            code: "PROKER",
            category: "PROKER",
            title: isAssignment ? "Amanah Tugas Proker Baru" : "Catatan Progres Pengerjaan",
            message: isAssignment
              ? `Walikota mengamanahkan pelaksanaan program kerja kepada dinas Anda. Silakan laksanakan dan laporkan progresnya.`
              : `Catatan pembaruan tersimpan: "${upd.content}"`,
            text: isAssignment ? "Tugas proker baru dari Walikota" : "Progres pengerjaan tersimpan",
            timestamp: time,
            when: formatRelativeTime(time),
            href: "/dinas/tugas-proker",
            tabKey: tab,
            unread: isAssignment,
          });
        }
      }
    } else {
      for (const rep of reports) {
        const status = (rep.status || "").toUpperCase();
        const time = rep.created_at || new Date().toISOString();

        if (status === "DIAJUKAN" || status === "MENUNGGU_VERIFIKASI") {
          const tab = "/admin/verifikasi";
          if (!tabActivity[tab] || new Date(time) > new Date(tabActivity[tab])) {
            tabActivity[tab] = time;
          }
          items.push({
            id: `rep-verif-${rep.id}`,
            code: rep.code,
            category: "VERIFIKASI",
            title: "Laporan Menunggu Verifikasi",
            message: `Laporan warga ${rep.code} ("${rep.title}") baru masuk dan memerlukan verifikasi serta disposisi wewenang.`,
            text: `Laporan ${rep.code} menunggu verifikasi.`,
            timestamp: time,
            when: formatRelativeTime(time),
            href: "/admin/verifikasi",
            tabKey: tab,
            unread: true,
            meta: { code: rep.code, status },
          });
        }
      }

      for (const upd of updates) {
        const isAssignment = upd.title === "PENUGASAN_OPD";
        const opdName = opdMap.get(upd.opd_id) ?? "Dinas Terkait";
        const time = upd.created_at || new Date().toISOString();

        if (!isAssignment) {
          const tab = "/pemerintah/proker";
          if (!tabActivity[tab] || new Date(time) > new Date(tabActivity[tab])) {
            tabActivity[tab] = time;
          }
          items.push({
            id: `upd-admin-${upd.id}`,
            code: "PROKER",
            category: "PROKER",
            title: `Bukti Progres: ${opdName}`,
            message: `${opdName} melaporkan perkembangan pengerjaan proker: "${upd.content}"`,
            text: `${opdName} mengirim progres proker`,
            timestamp: time,
            when: formatRelativeTime(time),
            href: "/pemerintah/proker",
            tabKey: tab,
            unread: true,
            meta: { opdName },
          });
        }
      }
    }

    items.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
    const unreadCount = items.filter((i) => i.unread).length;

    return {
      items,
      unreadCount,
      tabActivity,
    };
  } catch {
    return {
      items: [],
      unreadCount: 0,
      tabActivity: {},
    };
  }
}

export async function listNotifications(): Promise<NotificationItem[]> {
  const user = await getSessionUser().catch(() => null);
  const feed = await listRoleNotifications(
    user?.role ?? "pelapor",
    user?.opdId ? user.opdId : undefined,
    user?.email ? user.email : undefined,
    user?.id ? user.id : undefined,
  );
  return feed.items.slice(0, 5);
}
