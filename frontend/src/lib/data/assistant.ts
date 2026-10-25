import type { ChatSource } from "@/lib/chat";
import { listIssues } from "@/lib/data/issues";
import { listPrograms } from "@/lib/data/programs";
import { getMyReport, listMyReports } from "@/lib/data/reports";
import { formatPercent } from "@/lib/format";
import { ISSUE_STATUS, PROGRAM_STATUS } from "@/lib/status";

export interface Answer {
  reply: string;
  sources: ChatSource[];
}

const REPORT_CODE = /TLK-\d{4}-[A-Z0-9]{4}/i;
const MY_REPORTS = /laporan\s*(saya|ku)|status\s+laporan/i;
const GUIDE = /cara\s+(membuat|buat|lapor|melapor)|panduan|bagaimana\s+(cara\s+)?(lapor|melapor)/i;
const MIN_WORD_LENGTH = 4;
const MAX_RESULTS = 3;
const SEARCH_LIMIT = 100;
const RECENT_REPORTS = 3;

const TOPIC_WORDS: readonly string[] = [
  "proker",
  "program",
  "isu",
  "laporan",
  "lapor",
  "rapor",
  "dinas",
  "opd",
  "kecamatan",
  "kelurahan",
  "anggaran",
  "progres",
  "jalan",
  "banjir",
  "sampah",
];

const STOPWORDS: ReadonlySet<string> = new Set([
  "proker",
  "program",
  "dinas",
  "yang",
  "apa",
  "bagaimana",
  "status",
  "berapa",
  "kecamatan",
  "kelurahan",
  "tentang",
  "mengenai",
  "tolong",
  "saya",
  "dong",
  "laporan",
  "isu",
]);

const GUIDE_ANSWER = [
  "Cara membuat laporan:",
  "- Masuk atau daftar terlebih dahulu.",
  "- Buka halaman **Lapor**, lalu ceritakan masalahnya dan tambahkan foto bila ada.",
  "- Pilih kecamatan dan kelurahan, lalu taruh pin di peta.",
  "- Periksa isu serupa, pilih privasi Publik atau Rahasia, lalu kirim.",
  "Anda akan menerima kode laporan untuk melacak perkembangannya.",
].join("\n");

const REFUSAL = "Saya hanya bisa membantu seputar proker, isu, rapor, dan laporan di Govra.";
const NOT_FOUND = "Saya tidak menemukan data yang cocok di sistem. Coba gunakan kata kunci lain, misalnya nama proker atau kecamatan.";
const NEED_LOGIN = "Untuk melihat laporan Anda, silakan masuk terlebih dahulu.";

function keywords(text: string): string[] {
  const words = text
    .toLowerCase()
    .split(/[^a-z0-9]+/)
    .filter((word) => word.length >= MIN_WORD_LENGTH && !STOPWORDS.has(word));
  return [...new Set(words)];
}

function rank<T>(items: readonly T[], haystack: (item: T) => string, terms: readonly string[]): T[] {
  return items
    .map((item) => ({ item, score: terms.filter((term) => haystack(item).toLowerCase().includes(term)).length }))
    .filter((entry) => entry.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, MAX_RESULTS)
    .map((entry) => entry.item);
}

async function findPrograms(terms: readonly string[]): Promise<Answer | null> {
  const programs = await listPrograms({ limit: SEARCH_LIMIT });
  const found = rank(programs.items, (item) => `${item.name} ${item.opd.name} ${item.district.name}`, terms);
  if (found.length === 0) {
    return null;
  }
  const lines = found.map(
    (item) =>
      `- **${item.name}**: progres ${formatPercent(item.progress_percent)}, status ${PROGRAM_STATUS[item.status].label}.`,
  );
  return {
    reply: [`Saya menemukan ${found.length} proker yang cocok:`, ...lines].join("\n"),
    sources: found.map((item) => ({ kind: "PROGRAM", title: item.name, path: `/proker/${item.code}` })),
  };
}

async function findIssues(terms: readonly string[]): Promise<Answer | null> {
  const issues = await listIssues({ limit: SEARCH_LIMIT });
  const found = rank(
    issues.items,
    (item) => `${item.title} ${item.category.name} ${item.location.village.name} ${item.location.district.name}`,
    terms,
  );
  if (found.length === 0) {
    return null;
  }
  const lines = found.map(
    (item) => `- **${item.title}**: ${ISSUE_STATUS[item.status].label}, ${item.reporter_count} pelapor.`,
  );
  return {
    reply: [`Saya menemukan ${found.length} isu warga yang cocok:`, ...lines].join("\n"),
    sources: found.map((item) => ({ kind: "ISSUE", title: item.title, path: `/isu/${item.id}` })),
  };
}

async function reportByCode(code: string): Promise<Answer> {
  const report = await getMyReport(code.toUpperCase());
  if (!report) {
    return { reply: "Laporan dengan kode itu tidak ditemukan di akun Anda.", sources: [] };
  }
  const last = report.timeline[report.timeline.length - 1];
  const note = last?.note ? ` Catatan terakhir: ${last.note}` : "";
  const shared = report.issue && report.visibility === "PUBLIK";
  return {
    reply: `Laporan **${report.code}** berstatus **${ISSUE_STATUS[report.status].label}**.${note}`,
    sources: shared && report.issue ? [{ kind: "ISSUE", title: report.issue.title, path: `/isu/${report.issue.id}` }] : [],
  };
}

async function myReports(): Promise<Answer> {
  const reports = await listMyReports({ page: 1, limit: RECENT_REPORTS });
  if (reports.total === 0) {
    return { reply: "Anda belum memiliki laporan.", sources: [] };
  }
  const lines = reports.items.map(
    (item) => `- **${item.code}**: ${item.title ?? "Tanpa judul"}, ${ISSUE_STATUS[item.status].label}.`,
  );
  const sources: ChatSource[] = reports.items.flatMap((item) =>
    item.issue_id && item.visibility === "PUBLIK" && item.title
      ? [{ kind: "ISSUE" as const, title: item.title, path: `/isu/${item.issue_id}` }]
      : [],
  );
  return { reply: [`Anda memiliki ${reports.total} laporan. Yang terbaru:`, ...lines].join("\n"), sources };
}

export async function answerQuestion(question: string, signedIn: boolean): Promise<Answer> {
  const code = REPORT_CODE.exec(question);
  if (code) {
    return signedIn ? reportByCode(code[0]) : { reply: NEED_LOGIN, sources: [] };
  }
  if (MY_REPORTS.test(question)) {
    return signedIn ? myReports() : { reply: NEED_LOGIN, sources: [] };
  }
  if (GUIDE.test(question)) {
    return { reply: GUIDE_ANSWER, sources: [] };
  }
  const terms = keywords(question);
  const found = (await findPrograms(terms)) ?? (await findIssues(terms));
  if (found) {
    return found;
  }
  const onTopic = TOPIC_WORDS.some((word) => question.toLowerCase().includes(word));
  return { reply: onTopic ? NOT_FOUND : REFUSAL, sources: [] };
}
