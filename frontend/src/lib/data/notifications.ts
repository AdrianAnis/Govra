import { formatRelativeTime } from "@/lib/format";

const supabaseUrl = process.env.SUPABASE_URL || "https://gtsskmxircedhfggqena.supabase.co";
const supabaseKey =
  process.env.SUPABASE_SERVICE_ROLE_KEY ||
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imd0c3NrbXhpcmNlZGhmZ2dxZW5hIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc5MjY2MzM1MywiZXhwIjoyMTA4MjM5MzUzfQ.ATvm9u6Dm2cSZ_IiUkajOiIGgXA13jJgC8lU-LrXTXY";

export type NotificationCategory = "VERIFIKASI" | "PROKER" | "LAPORAN" | "SISTEM";

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
  userId?: string,
): Promise<NotificationFeed> {
  const normalizedRole = role.toLowerCase();
  const headers = {
    apikey: supabaseKey,
    Authorization: `Bearer ${supabaseKey}`,
    "Accept-Profile": "app",
  };

  try {
    const [reportsRes, updatesRes, opdsRes] = await Promise.all([
      fetch(`${supabaseUrl}/rest/v1/reports?select=id,code,title,status,opd_id,created_at&order=created_at.desc&limit=25`, {
        headers,
        cache: "no-store",
      }),
      fetch(`${supabaseUrl}/rest/v1/program_updates?select=id,program_id,opd_id,title,content,created_at&order=created_at.desc&limit=25`, {
        headers,
        cache: "no-store",
      }),
      fetch(`${supabaseUrl}/rest/v1/opds?select=id,code,name`, {
        headers,
        cache: "no-store",
      }),
    ]);

    const opdMap = new Map<string, string>();
    if (opdsRes.ok) {
      const opds = await opdsRes.json();
      if (Array.isArray(opds)) {
        for (const o of opds) {
          opdMap.set(o.id, o.name);
        }
      }
    }

    const items: NotificationItem[] = [];
    const tabActivity: Record<string, string> = {};

    if (reportsRes.ok) {
      const reports = await reportsRes.json();
      if (Array.isArray(reports)) {
        for (const rep of reports) {
          const status = (rep.status || "").toUpperCase();
          const opdName = opdMap.get(rep.opd_id) ?? "Dinas Terkait";
          const time = rep.created_at || new Date().toISOString();

          if (normalizedRole === "admin" || normalizedRole === "kepala_daerah") {
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
                message: `Laporan ${rep.code} (${rep.title}) masuk dan perlu diverifikasi serta diteruskan ke dinas.`,
                text: `Laporan ${rep.code} (${rep.title}) menunggu verifikasi.`,
                timestamp: time,
                when: formatRelativeTime(time),
                href: "/admin/verifikasi",
                tabKey: tab,
                unread: true,
                meta: { code: rep.code, status },
              });
            } else {
              const tab = "/pemerintah/laporan";
              if (!tabActivity[tab] || new Date(time) > new Date(tabActivity[tab])) {
                tabActivity[tab] = time;
              }
              items.push({
                id: `rep-all-${rep.id}`,
                code: rep.code,
                category: "LAPORAN",
                title: `Laporan Warga: ${rep.title}`,
                message: `Laporan ${rep.code} berstatus ${status} (${opdName}).`,
                text: `Laporan ${rep.code} berstatus ${status}.`,
                timestamp: time,
                when: formatRelativeTime(time),
                href: "/pemerintah/laporan",
                tabKey: tab,
                unread: false,
                meta: { code: rep.code, opdName, status },
              });
            }
          } else if (normalizedRole === "dinas") {
            const isAssigned = !opdId || rep.opd_id === opdId;
            if (isAssigned && (status === "DITERUSKAN" || status === "DIPROSES" || status === "DIAJUKAN")) {
              const tab = "/dinas/laporan";
              if (!tabActivity[tab] || new Date(time) > new Date(tabActivity[tab])) {
                tabActivity[tab] = time;
              }
              items.push({
                id: `rep-dinas-${rep.id}`,
                code: rep.code,
                category: "LAPORAN",
                title: "Disposisi Laporan Masuk",
                message: `Laporan ${rep.code} (${rep.title}) didisposisikan ke instansi Anda untuk penanganan lapangan.`,
                text: `Laporan ${rep.code} didisposisikan ke dinas Anda.`,
                timestamp: time,
                when: formatRelativeTime(time),
                href: "/dinas/laporan",
                tabKey: tab,
                unread: true,
                meta: { code: rep.code, status },
              });
            }
          } else {
            const tab = "/pelapor/laporan";
            if (!tabActivity[tab] || new Date(time) > new Date(tabActivity[tab])) {
              tabActivity[tab] = time;
            }
            items.push({
              id: `rep-citizen-${rep.id}`,
              code: rep.code,
              category: "LAPORAN",
              title: `Pembaruan Laporan: ${rep.code}`,
              message: `Laporan "${rep.title}" kini berstatus ${status} (${opdName}).`,
              text: `Laporan ${rep.code} kini berstatus ${status}.`,
              timestamp: time,
              when: formatRelativeTime(time),
              href: `/pelapor/laporan/${rep.code}`,
              tabKey: tab,
              unread: status === "SELESAI" || status === "DIPROSES",
              meta: { code: rep.code, opdName, status },
            });
          }
        }
      }
    }

    if (updatesRes.ok) {
      const updates = await updatesRes.json();
      if (Array.isArray(updates)) {
        for (const upd of updates) {
          const isAssignment = upd.title === "PENUGASAN_OPD";
          const opdName = opdMap.get(upd.opd_id) ?? "Dinas Terkait";
          const time = upd.created_at || new Date().toISOString();

          if (normalizedRole === "admin" || normalizedRole === "kepala_daerah") {
            const tab = "/pemerintah/proker";
            if (!tabActivity[tab] || new Date(time) > new Date(tabActivity[tab])) {
              tabActivity[tab] = time;
            }
            items.push({
              id: `upd-admin-${upd.id}`,
              code: "PROKER",
              category: "PROKER",
              title: isAssignment ? "Penugasan Program Kerja Diterbitkan" : `Bukti Progres: ${opdName}`,
              message: isAssignment
                ? `Amanah penugasan kepada ${opdName} berhasil didaftarkan ke sistem.`
                : `${opdName} melaporkan perkembangan: "${upd.content}"`,
              text: isAssignment ? `Penugasan proker ke ${opdName}` : `${opdName} mengirim progres proker`,
              timestamp: time,
              when: formatRelativeTime(time),
              href: "/pemerintah/proker",
              tabKey: tab,
              unread: !isAssignment,
              meta: { opdName },
            });
          } else if (normalizedRole === "dinas") {
            const isForThisDinas = !opdId || upd.opd_id === opdId;
            if (isForThisDinas) {
              const tab = "/dinas/tugas-proker";
              if (!tabActivity[tab] || new Date(time) > new Date(tabActivity[tab])) {
                tabActivity[tab] = time;
              }
              items.push({
                id: `upd-dinas-${upd.id}`,
                code: "PROKER",
                category: "PROKER",
                title: isAssignment ? "Amanah Tugas Proker Baru" : "Catatan Progres Tersimpan",
                message: isAssignment
                  ? `Walikota mengamanahkan program kerja kepada dinas Anda. Silakan laksanakan dan laporkan berkala.`
                  : `Dokumentasi dan capaian: "${upd.content}"`,
                text: isAssignment ? "Tugas proker baru dari Walikota" : "Progres tersimpan",
                timestamp: time,
                when: formatRelativeTime(time),
                href: "/dinas/tugas-proker",
                tabKey: tab,
                unread: isAssignment,
                meta: { opdName },
              });
            }
          } else {
            if (!isAssignment) {
              const tab = "/proker";
              if (!tabActivity[tab] || new Date(time) > new Date(tabActivity[tab])) {
                tabActivity[tab] = time;
              }
              items.push({
                id: `upd-citizen-${upd.id}`,
                code: "PROKER",
                category: "PROKER",
                title: `Transparansi Proker: ${opdName}`,
                message: `${opdName} memperbarui pengerjaan program kerja: "${upd.content}"`,
                text: `${opdName} memperbarui program kerja`,
                timestamp: time,
                when: formatRelativeTime(time),
                href: "/proker",
                tabKey: tab,
                unread: false,
                meta: { opdName },
              });
            }
          }
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
  const feed = await listRoleNotifications("pelapor");
  return feed.items.slice(0, 5);
}
