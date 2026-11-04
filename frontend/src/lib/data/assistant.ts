import type { ChatCard, ChatSource } from "@/lib/chat";
import { listIssues } from "@/lib/data/issues";
import { listPrograms } from "@/lib/data/programs";
import { getMyReport, listMyReports } from "@/lib/data/reports";
import type { SessionUser } from "@/lib/data/session";
import { formatPercent } from "@/lib/format";
import { ISSUE_STATUS, PROGRAM_STATUS } from "@/lib/status";

export interface AssistantAnswer {
  reply: string;
  sources: ChatSource[];
  cards: ChatCard[];
}

export interface ChatMessage {
  role: "USER" | "ASSISTANT";
  content: string;
}

const REPORT_CODE_PATTERN = /TLK-\d{4}-[A-Z0-9]{4}/i;

function cleanFormatting(text: string): string {
  return text
    .replace(/\*\*(.*?)\*\*/g, "$1")
    .replace(/__(.*?)__/g, "$1")
    .replace(/\*(.*?)\*/g, "$1")
    .replace(/_(.*?)_/g, "$1")
    .trim();
}

async function callGemini(
  systemInstruction: string,
  history: Array<{ role: "user" | "model"; parts: Array<{ text: string }> }>,
): Promise<string | null> {
  const apiKey =
    process.env.GEMINI_API_KEY_ASSISTANT ||
    process.env.GEMINI_API_KEY_TRIAGE ||
    "";

  if (!apiKey || apiKey.startsWith("mock")) {
    return null;
  }

  const primaryModel = process.env.GEMINI_MODEL || "gemini-3-flash-preview";
  const candidateModels = Array.from(
    new Set([primaryModel, "gemini-3-flash-preview", "gemini-3.5-flash", "gemini-2.5-flash"]),
  );

  const payload = {
    system_instruction: {
      parts: [{ text: systemInstruction }],
    },
    contents: history,
    generationConfig: {
      temperature: 0.3,
      maxOutputTokens: 1000,
    },
  };

  for (const model of candidateModels) {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;
    try {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), 9000);

      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
        signal: controller.signal,
      });

      clearTimeout(timer);

      if (res.ok) {
        const data = await res.json();
        const candidateText = data?.candidates?.[0]?.content?.parts?.[0]?.text;
        if (typeof candidateText === "string" && candidateText.trim()) {
          return candidateText.trim();
        }
      }
    } catch {
      continue;
    }
  }

  return null;
}

export async function answerQuestion(
  input: string | ChatMessage[],
  userOrSignedIn?: SessionUser | boolean | null,
): Promise<AssistantAnswer> {
  const messages: ChatMessage[] =
    typeof input === "string"
      ? [{ role: "USER", content: input }]
      : input;

  const lastUserTurn = [...messages].reverse().find((m) => m.role === "USER");
  const question = lastUserTurn?.content?.trim() || "";

  const sessionUser: SessionUser | null =
    typeof userOrSignedIn === "object" ? userOrSignedIn : null;
  const signedIn =
    typeof userOrSignedIn === "boolean"
      ? userOrSignedIn
      : Boolean(sessionUser && sessionUser.role === "pelapor");

  const [programsResult, issuesResult, myReportsResult] = await Promise.all([
    listPrograms({ limit: 8 }).catch(() => ({ items: [], total: 0 })),
    listIssues({ limit: 15 }).catch(() => ({ items: [], total: 0 })),
    signedIn ? listMyReports({ page: 1, limit: 10 }).catch(() => ({ items: [], total: 0 })) : Promise.resolve({ items: [], total: 0 }),
  ]);

  const codeMatch = REPORT_CODE_PATTERN.exec(question);
  let specificReport: Awaited<ReturnType<typeof getMyReport>> = null;
  if (codeMatch && signedIn) {
    specificReport = await getMyReport(codeMatch[0].toUpperCase()).catch(() => null);
  }

  const sortedIssues = [...issuesResult.items].sort(
    (a, b) => (b.reporter_count || 1) - (a.reporter_count || 1),
  );
  const urgentIssues = sortedIssues.slice(0, 5);

  const userInfoContext = sessionUser
    ? `Nama Pengguna: ${sessionUser.name}\nStatus Login: Masuk sebagai Warga / Pelapor (email: ${sessionUser.email})`
    : `Status Login: Belum Masuk / Anonim (Pengguna Umum)`;

  const myReportsContext =
    myReportsResult.items.length > 0
      ? `Pengguna memiliki ${myReportsResult.items.length} laporan aktif di sistem:\n` +
        myReportsResult.items
          .map((r) => {
            const statusLabel = ISSUE_STATUS[r.status]?.label || r.status;
            return `- Kode: ${r.code}, Judul: "${r.title || 'Laporan Warga'}", Status: ${statusLabel}, Dibuat: ${r.created_at}`;
          })
          .join("\n")
      : "Pengguna saat ini belum memiliki laporan aduan yang diajukan di sistem.";

  const specificReportContext = specificReport
    ? `Detail Tiket ${specificReport.code}:\n` +
      `- Judul: ${specificReport.title || 'Laporan Warga'}\n` +
      `- Status: ${ISSUE_STATUS[specificReport.status]?.label || specificReport.status}\n` +
      `- Wilayah: ${specificReport.location?.district?.name || '-'}, ${specificReport.location?.village?.name || '-'}\n` +
      `- Catatan Terakhir: ${specificReport.timeline?.[specificReport.timeline.length - 1]?.note || '-'}\n` +
      `- Alasan Penolakan (jika ada): ${specificReport.rejection_reason || '-'}`
    : "Tidak ada kode tiket spesifik yang diproses.";

  const programsContext = programsResult.items
    .map((p) => {
      const statusLabel = PROGRAM_STATUS[p.status]?.label || p.status;
      return `- Kode: ${p.code}, Nama: "${p.name}", OPD Penanggung Jawab: ${p.opd.name}, Progres: ${formatPercent(p.progress_percent)} (Target: ${formatPercent(p.expected_percent)}), Status: ${statusLabel}`;
    })
    .join("\n");

  const issuesContext = urgentIssues
    .map((iss) => {
      const statusLabel = ISSUE_STATUS[iss.status]?.label || iss.status;
      return `- ID: ${iss.id}, Judul: "${iss.title}", Lokasi: ${iss.location?.district?.name || '-'}, Kategori: ${iss.category?.name || '-'}, Status: ${statusLabel}, Jumlah Pelapor/Pendukung: ${iss.reporter_count} warga, Urgensi: ${iss.urgency || 'MEDIUM'}`;
    })
    .join("\n");

  const systemPrompt = `Anda adalah Govra AI, asisten kecerdasan buatan resmi untuk platform transparansi pemerintah daerah Govra.
Anda bertindak seperti asisten manusia yang sangat ramah, hangat, empatik, cerdas, dan suportif kepada warga.

PANDUAN KOMUNIKASI DAN KEPRIBADIAN:
1. Selalu sapa pengguna dengan sebutan "SobatGovra" (contoh: "Halo SobatGovra!", "Selamat pagi, SobatGovra!"). Jika nama pengguna diketahui dari info akun, Anda boleh menyapa seperti "Halo SobatGovra [Nama]!".
2. Gaya bicara harus luwes, alami, dan empatik selayaknya manusia yang benar-benar peduli. Hindari bahasa kaku atau birokrasi berbelit-belit.
3. JANGAN PERNAH menyertakan karakter format markdown mentah seperti tanda bintang ganda (**) atau garis bawah ganda (__). Gunakan teks bersih tanpa tanda bintang.

ATURAN RUANG LINGKUP & PENANGANAN TOPIK:
Anda secara ketat hanya beroperasi dalam 4 topik utama Govra, ditambah interaksi percakapan alami (sapaan, identitas, basa-basi):

A. Sapaan & Basa-basi Alami:
- Jika pengguna menyapa ("halo", "hai", "selamat pagi", "selamat pagii", "pagi", "assalamualaikum", "p", "sampurasun", dll.), sapa balik dengan sangat hangat dan tanyakan hal apa yang ingin diketahui hari ini seputar program kerja daerah, laporan tiket, atau isu prioritas kota.
- JANGAN PERNAH menganggap sapaan sebagai laporan keluhan atau masalah!
- JANGAN menyertakan tag kartu apapun untuk sapaan atau obrolan santai.

B. Pertanyaan Identitas Pengguna / Asisten:
- Jika pengguna bertanya tentang siapa Anda ("kamu siapa?", "apa tugasmu?"): jelaskan peran Anda sebagai asisten AI keterbukaan informasi dan pelaporan kota Govra.
- Jika pengguna bertanya tentang identitas mereka ("kamu tahu saya siapa?", "siapa aku?"):
  * Jika pengguna sedang login: sebutkan nama mereka dan jelaskan bahwa mereka terdaftar di Govra.
  * Jika pengguna belum login / anonim: jelaskan secara santun bahwa mereka belum masuk ke akun Govra sehingga Anda belum mengetahui nama mereka, serta beritahu bahwa mereka bisa masuk untuk melihat laporan pribadi atau tetap bebas memantau proker tanpa login.
- JANGAN menyertakan tag kartu untuk pertanyaan identitas.

C. Status & Antrean Tiket Laporan Warga:
- Jika pengguna menanyakan berapa banyak laporan yang diajukan, status laporannya, atau kode tiket (misal TLK-...):
  * Jika belum login: jelaskan bahwa mereka perlu masuk ke akun terlebih dahulu agar riwayat laporan dapat diakses, lalu cantumkan tag [CARD:ACTION:login] di baris terakhir.
  * Jika sudah login: jelaskan berapa banyak laporan yang mereka miliki berdasarkan data [Daftar Laporan Pengguna Terdaftar], sebutkan judul dan status masing-masing dengan ramah, dan berikan alasan antrean (misal dinas memverifikasi bukti di tengah volume laporan yang masuk).
  * Cantumkan tag: [CARD:REPORT:kode_laporan] di baris terakhir untuk tiap laporan yang relevan.

D. Program Kerja (Proker) Pemda & Anggaran:
- Jelaskan program kerja pemerintah daerah yang sedang berjalan, dinas (OPD) penanggung jawabnya, capaian progres, dan target waktu.
- Tunjukkan transparansi capaian kota.
- Cantumkan tag: [CARD:PROGRAM:kode_proker] di baris terakhir untuk program yang relevan.

E. Isu Darurat / Masalah Prioritas Kota:
- Jika pengguna menanyakan masalah apa yang paling urgent/darurat atau paling banyak dilaporkan warga:
  * Jelaskan isu-isu teratas dari data yang tersedia.
  * Jelaskan MENGAPA masalah tersebut mendesak (misalnya: jalan berlubang membahayakan keselamatan pengendara, sampah menumpuk mengancam kesehatan lingkungan, banjir mengganggu mobilitas).
  * Sebutkan jumlah warga yang telah mendukung isu tersebut.
  * Cantumkan tag: [CARD:ISSUE:id_isu] di baris terakhir.

F. Pengecekan Status Masalah / Fasilitas Tertentu di Wilayah (misal: "jalan rusak di bojongsoang apakah sudah dilaporkan?"):
- Periksa data isu yang ada:
  * Jika ada masalah yang cocok: jelaskan bahwa aduan sudah tercatat di sistem, sebutkan status penanganannya dan jumlah pendukung, lalu cantumkan tag [CARD:ISSUE:id_isu].
  * Jika BENAR-BENAR belum ada di data DAN pengguna memang secara spesifik menanyakan status kerusakan fasilitas publik tertentu: jelaskan dengan santun bahwa saat ini belum ada laporan warga yang tercatat mengenai kendala tersebut, dan ajak pengguna untuk menjadi pelapor pertama agar segera didisposisikan ke dinas terkait. Cantumkan tag [CARD:ACTION:create].

G. Pertanyaan di Luar Lingkup (Resep, Koding, Game, Musik, Politik Nasional, Percintaan, dll.):
- Tolak secara santun, ramah, dan bersahabat.
- Jelaskan bahwa Anda adalah asisten khusus transparansi daerah dan pengaduan warga Govra.
- Ajak kembali ke 4 topik utama Govra.
- JANGAN sertakan tag kartu apapun.

DATA SISTEM SAAT INI UNTUK MENJAWAB:
[Info Pengguna]
${userInfoContext}

[Detail Tiket Spesifik Jika Ada]
${specificReportContext}

[Daftar Laporan Pengguna Terdaftar]
${myReportsContext}

[Daftar Program Kerja (Proker) Pemda]
${programsContext}

[Daftar Isu / Aduan Warga Terkini]
${issuesContext}
`;

  const conversationHistory = messages.slice(-6).map((m) => ({
    role: m.role === "USER" ? ("user" as const) : ("model" as const),
    parts: [{ text: m.content }],
  }));

  const aiRaw = await callGemini(systemPrompt, conversationHistory);

  if (aiRaw) {
    const cardTagPattern = /\[CARD:(REPORT|PROGRAM|ISSUE|ACTION):([A-Za-z0-9_-]+)\]/g;
    const matchedCardTags: Array<{ type: string; idOrCode: string }> = [];

    let match: RegExpExecArray | null;
    while ((match = cardTagPattern.exec(aiRaw)) !== null) {
      if (match[1] && match[2]) {
        matchedCardTags.push({ type: match[1], idOrCode: match[2] });
      }
    }

    const cleanedReply = cleanFormatting(aiRaw.replace(cardTagPattern, "").trim());

    const cards: ChatCard[] = [];
    const sources: ChatSource[] = [];

    for (const tag of matchedCardTags) {
      if (tag.type === "REPORT") {
        const found =
          (specificReport && specificReport.code.toUpperCase() === tag.idOrCode.toUpperCase() ? specificReport : null) ||
          myReportsResult.items.find((r) => r.code.toUpperCase() === tag.idOrCode.toUpperCase());

        if (found) {
          const statusLabel = ISSUE_STATUS[found.status]?.label || found.status;
          const isDone = found.status === "SELESAI";
          const isProc = found.status === "DIPROSES";
          cards.push({
            id: `card-rep-${found.code}`,
            type: "REPORT",
            title: found.title || `Laporan ${found.code}`,
            subtitle: `Kode Tiket: ${found.code}`,
            status: statusLabel,
            statusTone: isDone ? "good" : isProc ? "warn" : "neutral",
            badge: statusLabel,
            href: `/pelapor/laporan/${found.code}`,
            actionLabel: "Lihat Linimasa & Bukti Laporan",
          });
          sources.push({ kind: "ISSUE", title: found.title || found.code, path: `/pelapor/laporan/${found.code}` });
        }
      } else if (tag.type === "PROGRAM") {
        const prog = programsResult.items.find(
          (p) => p.code.toLowerCase() === tag.idOrCode.toLowerCase(),
        );
        if (prog) {
          const statusLabel = PROGRAM_STATUS[prog.status]?.label || prog.status;
          const isDone = prog.status === "SELESAI";
          const isLate = prog.status === "TERLAMBAT";
          cards.push({
            id: `card-prog-${prog.code}`,
            type: "PROGRAM",
            title: prog.name,
            subtitle: prog.opd.name,
            status: statusLabel,
            statusTone: isDone ? "good" : isLate ? "bad" : "warn",
            badge: statusLabel,
            progress: prog.progress_percent,
            meta: `Realisasi: ${formatPercent(prog.progress_percent)} • Target: ${formatPercent(prog.expected_percent)}`,
            href: `/proker/${prog.code}`,
            actionLabel: "Lihat Detail Program & Realisasi",
          });
          sources.push({ kind: "PROGRAM", title: prog.name, path: `/proker/${prog.code}` });
        }
      } else if (tag.type === "ISSUE") {
        const iss = issuesResult.items.find(
          (i) => i.id.toLowerCase() === tag.idOrCode.toLowerCase(),
        );
        if (iss) {
          const statusLabel = ISSUE_STATUS[iss.status]?.label || iss.status;
          const isUrgent = iss.urgency === "URGENT" || (iss.reporter_count || 1) >= 15;
          cards.push({
            id: `card-iss-${iss.id}`,
            type: "ISSUE",
            title: iss.title,
            subtitle: `${iss.location?.district?.name || 'Kota'}, ${iss.location?.village?.name || ''}`.replace(/,\s*$/, ""),
            status: statusLabel,
            statusTone: isUrgent ? "bad" : "warn",
            badge: isUrgent ? "Mendesak / Prioritas" : "Didukung Warga",
            meta: `Didukung oleh ${iss.reporter_count} warga sekitar`,
            href: `/isu/${iss.id}`,
            actionLabel: "Lihat Isu & Berikan Dukungan",
          });
          sources.push({ kind: "ISSUE", title: iss.title, path: `/isu/${iss.id}` });
        }
      } else if (tag.type === "ACTION") {
        if (tag.idOrCode === "create") {
          cards.push({
            id: "act-create-report",
            type: "ACTION",
            title: "Ajukan Laporan Terkait",
            subtitle: "Jadilah yang pertama melaporkan kendala ini agar segera ditangani dinas",
            href: "/pelapor/lapor",
            actionLabel: "Buat Laporan Baru Sekarang",
          });
        } else if (tag.idOrCode === "login") {
          cards.push({
            id: "act-login-govra",
            type: "ACTION",
            title: "Masuk ke Akun Govra",
            subtitle: "Masuk dengan akun pelapor untuk melihat status tiket laporan Anda",
            href: "/masuk",
            actionLabel: "Masuk Sekarang",
          });
        }
      }
    }

    return {
      reply: cleanedReply,
      sources,
      cards,
    };
  }

  const lower = question.toLowerCase();

  const isAskingMyReports =
    lower.includes("laporan yang pernah") ||
    lower.includes("laporan saya") ||
    lower.includes("laporanku") ||
    lower.includes("berapa laporan") ||
    lower.includes("status laporanku") ||
    lower.includes("tiket saya");

  if (isAskingMyReports) {
    if (!signedIn) {
      return {
        reply:
          "Halo SobatGovra! Untuk mengecek berapa banyak laporan yang pernah Anda ajukan beserta status terbarunya, silakan masuk ke akun Govra Anda terlebih dahulu ya.",
        sources: [],
        cards: [
          {
            id: "act-login-reports",
            type: "ACTION",
            title: "Masuk ke Akun Govra",
            subtitle: "Masuk untuk melihat riwayat dan progres laporan aduan Anda",
            href: "/masuk",
            actionLabel: "Masuk ke Akun",
          },
        ],
      };
    }

    if (myReportsResult.items.length === 0) {
      return {
        reply:
          "Halo SobatGovra! Setelah dicek di sistem, saat ini Anda belum memiliki laporan aduan yang pernah diajukan. Jika Anda menemukan fasilitas publik yang bermasalah, silakan ajukan laporan pertama Anda!",
        sources: [],
        cards: [
          {
            id: "act-create-report",
            type: "ACTION",
            title: "Buat Laporan Aduan Baru",
            subtitle: "Sampaikan keluhan fasilitas publik agar segera ditangani dinas",
            href: "/pelapor/lapor",
            actionLabel: "Mulai Buat Laporan",
          },
        ],
      };
    }

    const cards: ChatCard[] = myReportsResult.items.map((r) => {
      const statusLabel = ISSUE_STATUS[r.status]?.label || r.status;
      const isDone = r.status === "SELESAI";
      const isProc = r.status === "DIPROSES";
      return {
        id: `card-rep-${r.code}`,
        type: "REPORT",
        title: r.title || `Laporan ${r.code}`,
        subtitle: `Kode Tiket: ${r.code}`,
        status: statusLabel,
        statusTone: isDone ? "good" : isProc ? "warn" : "neutral",
        badge: statusLabel,
        href: `/pelapor/laporan/${r.code}`,
        actionLabel: "Lihat Linimasa & Bukti Laporan",
      };
    });

    return {
      reply: `Halo SobatGovra! Anda memiliki ${myReportsResult.items.length} laporan yang pernah diajukan di sistem Govra. Berikut adalah rincian laporan beserta status penanganannya saat ini:`,
      sources: myReportsResult.items.map((r) => ({
        kind: "ISSUE",
        title: r.title || r.code,
        path: `/pelapor/laporan/${r.code}`,
      })),
      cards,
    };
  }

  const isGreetingWord =
    /^(halo|hai|selamat\s+(pagi|siang|sore|malam)|pagi|siang|sore|malam|assalam|permisi|sampurasun|p|ping)[\s!.?]*$/i.test(
      lower.replace(/[!?.,]+/g, "").trim(),
    );

  if (isGreetingWord) {
    return {
      reply:
        "Halo, SobatGovra! Senang bisa menyapa Anda.\n\n" +
        "Saya adalah asisten cerdas Govra yang siap membantu Anda seputar:\n" +
        "1. Pengecekan status & antrean laporan tiket Anda\n" +
        "2. Progres dan realisasi program kerja (proker) Pemda\n" +
        "3. Isu darurat yang paling banyak dilaporkan warga\n" +
        "4. Pengecekan status masalah/fasilitas publik di wilayah Anda\n\n" +
        "Ada yang ingin SobatGovra tanyakan hari ini?",
      sources: [],
      cards: [],
    };
  }

  const isWhoAmI =
    lower.includes("kamu tahu saya siapa") ||
    lower.includes("saya siapa") ||
    lower.includes("siapa saya");

  if (isWhoAmI) {
    if (sessionUser) {
      return {
        reply: `Tentu saja, SobatGovra! Anda adalah ${sessionUser.name}, warga yang terdaftar di platform Govra. Anda dapat mengecek status laporan aktif Anda atau memantau progres transparansi proker kota.`,
        sources: [],
        cards: [],
      };
    }
    return {
      reply:
        "Saat ini SobatGovra belum masuk (login) ke akun Govra, sehingga saya belum mengetahui nama lengkap Anda.\n\n" +
        "Silakan masuk ke akun Govra Anda untuk melacak tiket aduan pribadi, atau Anda tetap bisa menanyakan informasi program kerja dan isu prioritas kota secara bebas!",
      sources: [],
      cards: [
        {
          id: "act-login-fallback",
          type: "ACTION",
          title: "Masuk ke Akun Govra",
          subtitle: "Akses riwayat tiket aduan pribadi Anda",
          href: "/masuk",
          actionLabel: "Masuk ke Akun",
        },
      ],
    };
  }

  return {
    reply:
      "Halo SobatGovra! Saya adalah asisten resmi Govra untuk transparansi kota dan pengaduan warga.\n\n" +
      "Saya siap membantu Anda untuk:\n" +
      "1. Mengecek status tiket aduan dan penjelasan antreannya\n" +
      "2. Memantau progres program kerja (proker) Pemda dan anggaran\n" +
      "3. Mengetahui isu paling mendesak yang dilaporkan warga\n" +
      "4. Mengecek apakah suatu masalah fasilitas di wilayah Anda sudah dilaporkan\n\n" +
      "Silakan tanyakan topik yang ingin Anda ketahui seputar hal di atas ya, SobatGovra!",
    sources: [],
    cards: [],
  };
}
