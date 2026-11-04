import type { ChatCard, ChatSource } from "@/lib/chat";
import { listIssues } from "@/lib/data/issues";
import { listPrograms } from "@/lib/data/programs";
import { getMyReport, listMyReports } from "@/lib/data/reports";
import { formatPercent } from "@/lib/format";
import { ISSUE_STATUS, PROGRAM_STATUS } from "@/lib/status";

export interface AssistantAnswer {
  reply: string;
  sources: ChatSource[];
  cards: ChatCard[];
}

const REPORT_CODE_PATTERN = /TLK-\d{4}-[A-Z0-9]{4}/i;

const OUT_OF_SCOPE_WORDS = [
  "resep", "masak", "koding", "coding", "javascript", "python", "php", "lagu", "lirik",
  "puisi", "pantun", "cerpen", "zodiak", "horoskop", "game", "steam", "pacar", "jodoh",
  "ramalan", "translate", "terjemah", "matematika", "hitung", "presiden", "politik",
  "pemilu", "pilkada", "capres", "cawapres", "artis", "film", "bioskop"
];

function isOutOfScope(q: string): boolean {
  const lower = q.toLowerCase();
  return OUT_OF_SCOPE_WORDS.some((word) => lower.includes(word));
}

async function callGeminiAssistant(systemPrompt: string, userPrompt: string): Promise<string | null> {
  const apiKey =
    process.env.GEMINI_API_KEY_ASSISTANT ||
    process.env.GEMINI_API_KEY_TRIAGE ||
    "";

  if (!apiKey || apiKey.startsWith("mock")) {
    return null;
  }

  const model = process.env.GEMINI_MODEL || "gemini-2.5-flash";
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;

  const body = {
    system_instruction: {
      parts: [{ text: systemPrompt }],
    },
    contents: [
      {
        role: "user",
        parts: [{ text: userPrompt }],
      },
    ],
    generationConfig: {
      temperature: 0.2,
      maxOutputTokens: 800,
    },
  };

  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 12000);

    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
      signal: controller.signal,
    });

    clearTimeout(timer);

    if (!res.ok) {
      return null;
    }

    const data = await res.json();
    const candidate = data?.candidates?.[0]?.content?.parts?.[0]?.text;
    if (typeof candidate === "string" && candidate.trim()) {
      return candidate.trim();
    }
    return null;
  } catch {
    return null;
  }
}

export async function answerQuestion(
  question: string,
  signedIn: boolean,
): Promise<AssistantAnswer> {
  const lower = question.toLowerCase().trim();

  if (isOutOfScope(lower)) {
    return {
      reply:
        "Halo SobatGovra! Maaf sekali, saya adalah asisten resmi Govra yang dirancang khusus untuk 4 topik utama:\n\n" +
        "1. Cek status dan penjelasan tiket laporan aduan Anda\n" +
        "2. Informasi dan progres program kerja (proker) Pemda\n" +
        "3. Informasi isu darurat / paling mendesak di kota\n" +
        "4. Pengecekan apakah suatu masalah fasilitas publik sudah dilaporkan atau belum\n\n" +
        "Silakan tanyakan hal-hal yang berkaitan dengan 4 topik di atas ya, SobatGovra!",
      sources: [],
      cards: [],
    };
  }

  const codeMatch = REPORT_CODE_PATTERN.exec(question);
  if (codeMatch) {
    const code = codeMatch[0].toUpperCase();
    if (!signedIn) {
      return {
        reply: `Halo SobatGovra! Untuk melihat rincian dan status laporan ${code}, silakan masuk ke akun Anda terlebih dahulu.`,
        sources: [],
        cards: [
          {
            id: `auth-${code}`,
            type: "ACTION",
            title: "Masuk untuk Cek Laporan",
            subtitle: "Masuk dengan akun pelapor untuk mengakses riwayat tiket Anda",
            href: "/masuk",
            actionLabel: "Masuk ke Akun Govra",
          },
        ],
      };
    }

    const report = await getMyReport(code);
    if (!report) {
      return {
        reply: `Halo SobatGovra, laporan dengan kode tiket ${code} tidak ditemukan di akun Anda. Mohon pastikan kode yang dimasukkan sudah benar ya!`,
        sources: [],
        cards: [],
      };
    }

    let statusExplanation = "";
    let statusTone: "good" | "warn" | "bad" | "neutral" = "neutral";
    const statusLabel = ISSUE_STATUS[report.status]?.label || report.status;

    if (report.status === "DIAJUKAN" || report.status === "MENUNGGU_VERIFIKASI") {
      statusTone = "warn";
      statusExplanation =
        "Laporan Anda saat ini sedang dalam antrean verifikasi oleh dinas terkait. " +
        "Proses ini memerlukan waktu karena dinas melakukan pengecekan validitas dan bukti lokasi di tengah tingginya volume laporan yang masuk.";
    } else if (report.status === "DIPROSES") {
      statusTone = "warn";
      statusExplanation =
        "Kabar baik, laporan Anda sudah diverifikasi dan saat ini sedang dalam penanganan aktif oleh tim teknis dinas terkait di lapangan.";
    } else if (report.status === "SELESAI") {
      statusTone = "good";
      statusExplanation =
        "Pengerjaan atau perbaikan untuk laporan ini telah dinyatakan selesai oleh dinas dengan dokumentasi lapangan terlampir. " +
        "SobatGovra dapat memeriksa hasil pengerjaannya dan memberikan konfirmasi kepuasan atau sanggahan jika belum tuntas.";
    } else if (report.status === "DITOLAK") {
      statusTone = "bad";
      statusExplanation = report.rejection_reason
        ? `Laporan ditolak oleh dinas dengan alasan: "${report.rejection_reason}".`
        : "Laporan belum dapat ditindaklanjuti karena tidak memenuhi kriteria pelaporan dinas.";
    }

    const lastEvent = report.timeline?.[report.timeline.length - 1];
    const lastNote = lastEvent?.note ? ` Catatan terakhir petugas: "${lastEvent.note}".` : "";

    const rawReply =
      `Halo SobatGovra! Laporan tiket ${report.code} Anda saat ini berstatus ${statusLabel}.\n\n` +
      `${statusExplanation}${lastNote}\n\n` +
      "SobatGovra dapat memantau linimasa lengkap dan bukti penanganannya melalui kartu di bawah ini:";

    const sysPrompt =
      "Anda adalah Govra AI, asisten transparansi kota yang sangat ramah, personal, dan empatik. " +
      "Selalu sapa pengguna dengan sebutan SobatGovra. " +
      "Jelaskan status laporan ini dengan santun, berikan alasan mengapa statusnya demikian, dan dorong mereka untuk mengecek linimasa. " +
      "JANGAN gunakan simbol bintang ganda (**) atau garis bawah ganda (__) dalam jawaban Anda.";

    const userPrompt = `Data laporan: Kode ${report.code}, Judul "${report.title || 'Laporan Warga'}", Status: ${statusLabel}, Penjelasan: ${statusExplanation}, Catatan: ${lastNote}.`;
    const aiText = await callGeminiAssistant(sysPrompt, userPrompt);

    return {
      reply: aiText || rawReply,
      sources: [{ kind: "ISSUE", title: report.title || report.code, path: `/pelapor/laporan/${report.code}` }],
      cards: [
        {
          id: `rep-${report.code}`,
          type: "REPORT",
          title: report.title || `Laporan ${report.code}`,
          subtitle: `${report.location?.district?.name || 'Kecamatan'}, ${report.location?.village?.name || 'Kelurahan'}`,
          status: statusLabel,
          statusTone,
          badge: statusLabel,
          meta: lastEvent?.note || statusExplanation,
          href: `/pelapor/laporan/${report.code}`,
          actionLabel: "Lihat Linimasa & Bukti Laporan",
        },
      ],
    };
  }

  const isAskingMyReports =
    lower.includes("laporan saya") ||
    lower.includes("status laporan") ||
    lower.includes("laporanku") ||
    lower.includes("tiket saya");

  if (isAskingMyReports) {
    if (!signedIn) {
      return {
        reply: "Halo SobatGovra! Untuk melihat daftar laporan dan tiket pengaduan aktif Anda, silakan masuk ke akun Govra Anda terlebih dahulu ya.",
        sources: [],
        cards: [
          {
            id: "auth-my-reports",
            type: "ACTION",
            title: "Masuk ke Akun Govra",
            subtitle: "Masuk untuk melihat semua riwayat aduan dan progres perbaikannya",
            href: "/masuk",
            actionLabel: "Masuk Sekarang",
          },
        ],
      };
    }

    const myReps = await listMyReports({ page: 1, limit: 5 });
    if (myReps.total === 0) {
      return {
        reply:
          "Halo SobatGovra! Saat ini Anda belum memiliki laporan aduan yang diajukan. " +
          "Jika menemukan fasilitas publik yang rusak atau kendala di lingkungan sekitar, SobatGovra dapat langsung membuat laporan baru!",
        sources: [],
        cards: [
          {
            id: "new-report-act",
            type: "ACTION",
            title: "Buat Laporan Aduan Baru",
            subtitle: "Laporkan masalah fasilitas atau lingkungan di sekitar Anda",
            href: "/pelapor/lapor",
            actionLabel: "Mulai Buat Laporan",
          },
        ],
      };
    }

    const cards: ChatCard[] = myReps.items.map((r) => {
      const statusLabel = ISSUE_STATUS[r.status]?.label || r.status;
      const isDone = r.status === "SELESAI";
      const isProc = r.status === "DIPROSES";
      return {
        id: `my-${r.code}`,
        type: "REPORT",
        title: r.title || `Laporan ${r.code}`,
        subtitle: `Kode Tiket: ${r.code}`,
        status: statusLabel,
        statusTone: isDone ? "good" : isProc ? "warn" : "neutral",
        badge: statusLabel,
        href: `/pelapor/laporan/${r.code}`,
        actionLabel: "Cek Progres Laporan",
      };
    });

    const reply =
      `Halo SobatGovra! Anda memiliki ${myReps.total} laporan yang terdaftar di sistem. ` +
      "Berikut adalah daftar laporan terbaru Anda beserta status penanganannya:";

    return {
      reply,
      sources: [],
      cards,
    };
  }

  const isAskingUrgent =
    lower.includes("urgent") ||
    lower.includes("mendesak") ||
    lower.includes("paling banyak") ||
    lower.includes("banyak lapor") ||
    lower.includes("isu darurat") ||
    lower.includes("prioritas");

  if (isAskingUrgent) {
    const issuesData = await listIssues({ limit: 50 });
    const sorted = [...issuesData.items].sort((a, b) => (b.reporter_count || 1) - (a.reporter_count || 1));
    const topIssues = sorted.slice(0, 3);

    if (topIssues.length > 0) {
      const cards: ChatCard[] = topIssues.map((issue) => {
        const isUrgent = issue.urgency === "URGENT" || (issue.reporter_count || 1) > 20;
        return {
          id: `urg-${issue.id}`,
          type: "ISSUE",
          title: issue.title,
          subtitle: `${issue.location?.district?.name || 'Kecamatan'}, ${issue.location?.village?.name || 'Kelurahan'}`,
          status: ISSUE_STATUS[issue.status]?.label || issue.status,
          statusTone: isUrgent ? "bad" : "warn",
          badge: isUrgent ? "Mendesak / Prioritas" : "Banyak Didukung",
          meta: `Telah didukung oleh ${issue.reporter_count} warga sekitar. Permasalahan ini sangat mendesak karena berdampak langsung pada aktivitas publik.`,
          href: `/isu/${issue.id}`,
          actionLabel: "Lihat Isu & Berikan Dukungan",
        };
      });

      const issueSummaries = topIssues
        .map((iss, i) => `${i + 1}. ${iss.title} di ${iss.location?.district?.name || 'Kota'} (${iss.reporter_count} pelapor)`)
        .join("\n");

      const sysPrompt =
        "Anda adalah Govra AI. Selalu sapa pengguna dengan sebutan SobatGovra. " +
        "Jelaskan masalah-masalah yang paling mendesak/urgent di kota saat ini berdasarkan data laporan warga terbanyak, " +
        "dan jelaskan mengapa masalah tersebut urgent bagi warga. " +
        "Gunakan bahasa Indonesia santun dan JANGAN gunakan format bintang ganda (**) atau garis bawah ganda (__).";

      const userPrompt = `Isu paling urgent saat ini:\n${issueSummaries}`;
      const aiReply = await callGeminiAssistant(sysPrompt, userPrompt);

      return {
        reply:
          aiReply ||
          "Halo SobatGovra! Berdasarkan data laporan masyarakat terkini, berikut adalah isu-isu yang paling mendesak dan paling banyak dilaporkan warga:",
        sources: topIssues.map((iss) => ({ kind: "ISSUE", title: iss.title, path: `/isu/${iss.id}` })),
        cards,
      };
    }
  }

  const isAskingProker =
    lower.includes("proker") ||
    lower.includes("program kerja") ||
    lower.includes("proyek") ||
    lower.includes("anggaran pemda") ||
    lower.includes("kinerja pemda");

  if (isAskingProker) {
    const progs = await listPrograms({ limit: 100 });
    let matched = progs.items;

    const terms = lower
      .replace(/(proker|program|kerja|pemda|pemerintah|kota|daerah|sedang|berjalan|apa|saja|tolong|update|status)/g, "")
      .trim()
      .split(/\s+/)
      .filter((w) => w.length >= 3);

    if (terms.length > 0) {
      matched = progs.items.filter((p) => {
        const text = `${p.name} ${p.opd?.name || ''} ${p.district?.name || ''}`.toLowerCase();
        return terms.some((t) => text.includes(t));
      });
      if (matched.length === 0) matched = progs.items;
    }

    const topProgs = matched.slice(0, 3);
    const cards: ChatCard[] = topProgs.map((p) => {
      const isDone = p.status === "SELESAI";
      const isLate = p.status === "TERLAMBAT";
      const statusLabel = PROGRAM_STATUS[p.status]?.label || p.status;
      return {
        id: `prog-${p.code}`,
        type: "PROGRAM",
        title: p.name,
        subtitle: p.opd?.name || "Pemerintah Daerah",
        status: statusLabel,
        statusTone: isDone ? "good" : isLate ? "bad" : "warn",
        badge: statusLabel,
        progress: p.progress_percent,
        meta: `Realisasi: ${formatPercent(p.progress_percent)} • Target Waktu: ${formatPercent(p.expected_percent)}`,
        href: `/proker/${p.code}`,
        actionLabel: "Lihat Detail Program & Realisasi",
      };
    });

    const progSummary = topProgs
      .map(
        (p) =>
          `- ${p.name} (${p.opd?.name}): Progres ${formatPercent(p.progress_percent)}, status ${PROGRAM_STATUS[p.status]?.label}. Target ${formatPercent(p.expected_percent)}.`
      )
      .join("\n");

    const sysPrompt =
      "Anda adalah Govra AI. Selalu sapa pengguna dengan sebutan SobatGovra. " +
      "Jelaskan program kerja pemda yang sedang berjalan ini dengan transparan dan informatif. " +
      "Sebutkan dinas penanggung jawab dan progresnya. " +
      "JANGAN gunakan tanda bintang ganda (**) atau garis bawah ganda (__).";

    const userPrompt = `Program kerja pemda:\n${progSummary}`;
    const aiReply = await callGeminiAssistant(sysPrompt, userPrompt);

    return {
      reply:
        aiReply ||
        "Halo SobatGovra! Berikut adalah pembaruan program kerja pemerintah daerah yang sedang berjalan beserta persentase progres dan target capaiannya:",
      sources: topProgs.map((p) => ({ kind: "PROGRAM", title: p.name, path: `/proker/${p.code}` })),
      cards,
    };
  }

  const allIssues = await listIssues({ limit: 100 });
  const searchTerms = lower
    .replace(/(status|laporan|isu|bagaimana|apakah|ada|tentang|tolong|cek|sudah|belum|di|ke|yang)/g, "")
    .trim()
    .split(/\s+/)
    .filter((w) => w.length >= 3);

  let matchedIssues = allIssues.items.filter((iss) => {
    const text = `${iss.title} ${iss.category?.name || ''} ${iss.location?.district?.name || ''} ${iss.location?.village?.name || ''}`.toLowerCase();
    return searchTerms.some((t) => text.includes(t));
  });

  if (matchedIssues.length > 0) {
    const topMatch = matchedIssues.slice(0, 3);
    const cards: ChatCard[] = topMatch.map((iss) => {
      const statusLabel = ISSUE_STATUS[iss.status]?.label || iss.status;
      const isDone = iss.status === "SELESAI";
      const isProc = iss.status === "DIPROSES";
      return {
        id: `iss-match-${iss.id}`,
        type: "ISSUE",
        title: iss.title,
        subtitle: `${iss.location?.district?.name || 'Kecamatan'}, ${iss.location?.village?.name || 'Kelurahan'}`,
        status: statusLabel,
        statusTone: isDone ? "good" : isProc ? "warn" : "neutral",
        badge: statusLabel,
        meta: `Status saat ini: ${statusLabel}. Didukung oleh ${iss.reporter_count} warga sekitar.`,
        href: `/isu/${iss.id}`,
        actionLabel: "Buka Isu & Cek Riwayat Penanganan",
      };
    });

    const issueText = topMatch
      .map(
        (iss) =>
          `Isu: "${iss.title}" di ${iss.location?.district?.name}, Status: ${ISSUE_STATUS[iss.status]?.label}, Pelapor: ${iss.reporter_count} orang.`
      )
      .join("\n");

    const sysPrompt =
      "Anda adalah Govra AI. Selalu sapa pengguna dengan sebutan SobatGovra. " +
      "Jelaskan status dari masalah/laporan yang ditanyakan pengguna secara spesifik: apakah sudah selesai, sedang diproses, atau masih menunggu. " +
      "JANGAN gunakan tanda bintang ganda (**) atau garis bawah ganda (__).";

    const userPrompt = `Pertanyaan pengguna: "${question}". Data isu terkait yang ditemukan:\n${issueText}`;
    const aiReply = await callGeminiAssistant(sysPrompt, userPrompt);

    return {
      reply:
        aiReply ||
        `Halo SobatGovra! Mengenai ${question}, laporan terkait masalah tersebut sudah terdaftar di sistem Govra. Berikut adalah rincian status penanganannya:`,
      sources: topMatch.map((iss) => ({ kind: "ISSUE", title: iss.title, path: `/isu/${iss.id}` })),
      cards,
    };
  }

  const notFoundReply =
    `Halo SobatGovra! Setelah dicek di sistem, saat ini belum ada laporan atau aduan yang terdaftar mengenai "${question}".\n\n` +
    "Jika fasilitas atau kendala tersebut membutuhkan penanganan dari pemerintah daerah, SobatGovra dapat langsung menjadi orang pertama yang mengajukan laporan agar segera didisposisikan ke dinas terkait!";

  return {
    reply: notFoundReply,
    sources: [],
    cards: [
      {
        id: "act-new-report-query",
        type: "ACTION",
        title: "Ajukan Laporan Terkait",
        subtitle: `Laporkan keluhan "${question}" agar segera ditangani dinas terkait`,
        href: "/pelapor/lapor",
        actionLabel: "Buat Laporan Baru Sekarang",
      },
    ],
  };
}
