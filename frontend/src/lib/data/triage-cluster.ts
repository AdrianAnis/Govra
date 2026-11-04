import { directSupabase } from "@/lib/supabase-direct";

export interface TriageResult {
  opdCode: string;
  opdName: string;
  categoryCode: string;
  categoryName: string;
  confidence: number;
  summary: string;
  recommendedAction: string;
  isAbstract: boolean;
  problemType: string;
}

export interface ReportCluster {
  themeId: string;
  themeTitle: string;
  problemType: string;
  opdCode: string;
  locationName: string;
  similarityScore: number;
  reportIds: string[];
  reportCodes: string[];
  totalCount: number;
  resolvedCount: number;
  isResolved: boolean;
  resolutionNote?: string | null;
  resolutionEvidence?: Array<{ id: string; url: string }> | null;
}

export interface ClusteredReportItem {
  id: string;
  code: string;
  title: string | null;
  summary?: string | null;
  description?: string | null;
  status: string;
  opdCode: string;
  opdName: string;
  categoryCode: string;
  categoryName: string;
  confidence: number;
  isAbstract: boolean;
  themeId: string;
  themeTitle: string;
  clusterSimilarity: number;
  siblingCodes: string[];
  resolvedViaCluster?: boolean;
}

const SUPPORTED_OPDS: Record<string, string> = {
  "DBM-SDA": "Dinas Bina Marga & SDA",
  "DLHK": "Dinas Lingkungan Hidup & Kebersihan",
  "DISHUB": "Dinas Perhubungan",
  "DINKES": "Dinas Kesehatan",
  "PUPR": "Dinas PUPR",
  "BPBD": "Badan Penanggulangan Bencana Daerah",
  "SATPOL-PP": "Satuan Polisi Pamong Praja",
};

const CATEGORY_NAMES: Record<string, string> = {
  "JALAN-RUSAK": "Jalan Rusak & Berlubang",
  "DRAINASE-TERSUMBAT": "Saluran Air & Drainase Tersumbat",
  "SAMPAH-LIAR": "Tumpukan Sampah Liar",
  "LAMPU-JALAN": "Lampu Penerangan Jalan Umum",
  "RAMBU-RUSAK": "Rambu Lalu Lintas & Traffic Light",
  "INFRASTRUKTUR-GEDUNG": "Infrastruktur Gedung Publik",
  "FASILITAS-KESEHATAN": "Fasilitas & Pelayanan Kesehatan",
  "PENERTIBAN-UMUM": "Ketertiban Umum & PKL Liar",
  "BENCANA-ALAM": "Bencana Alam & Longsor",
};

const STOPWORDS = new Set([
  "yang", "di", "dan", "ini", "itu", "ke", "dari", "untuk", "pada", "adalah",
  "ada", "karena", "saat", "oleh", "dengan", "saya", "kami", "bisa", "sudah",
  "telah", "laporan", "mohon", "tolong", "bapak", "ibu", "admin", "terima",
  "kasih", "kota", "kabupaten", "daerah", "wilayah", "kelurahan", "kecamatan",
]);

export function isAbstractText(title?: string | null, description?: string | null): boolean {
  const t = (title || "").trim();
  const d = (description || "").trim();
  const combined = `${t} ${d}`.trim().toLowerCase();

  if (combined.length < 8) return true;

  if (/^(asasasas|testing|test\s*\d*|asdf|qwerty|12345|aaaa+|bbbb+|cccc+|zzzz+)$/i.test(t)) {
    return true;
  }

  if (t.length < 15 && d.length < 15) {
    const hasConcreteKeyword = /(jalan|lubang|aspal|amblas|sampah|tps|limbah|bau|lampu|pju|traffic|rambu|banjir|air|drainase|saluran|gorong|tanggul|faskes|puskesmas|posyandu|obat|penyakit|dbd|longsor|ambruk|gedung|trotoar|pkl|parkir|bencana)/i.test(
      combined
    );
    if (!hasConcreteKeyword) return true;
  }

  const words = combined.split(/\s+/).filter((w) => w.length >= 3);
  if (words.length <= 1 && combined.length < 20) return true;

  return false;
}

export function extractProblemKeywords(text: string): string[] {
  const clean = text
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, " ")
    .split(/\s+/)
    .filter((w) => w.length >= 3 && !STOPWORDS.has(w));
  return Array.from(new Set(clean));
}

function calculateJaccard(setA: Set<string>, setB: Set<string>): number {
  if (setA.size === 0 || setB.size === 0) return 0;
  let intersection = 0;
  for (const item of setA) {
    if (setB.has(item)) intersection++;
  }
  const union = setA.size + setB.size - intersection;
  return union > 0 ? intersection / union : 0;
}

function calculateDistanceMeters(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371000;
  const dLat = ((lat2 - lat1) * Math.PI) / 180.0;
  const dLon = ((lon2 - lon1) * Math.PI) / 180.0;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180.0) *
      Math.cos((lat2 * Math.PI) / 180.0) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

export function calculateReportSimilarity(
  a: { title?: string | null | undefined; description?: string | null | undefined; lat?: number | null | undefined; lng?: number | null | undefined; categoryCode?: string | null | undefined; locationStr?: string | null | undefined },
  b: { title?: string | null | undefined; description?: string | null | undefined; lat?: number | null | undefined; lng?: number | null | undefined; categoryCode?: string | null | undefined; locationStr?: string | null | undefined }
): { similarity: number; isMatch90: boolean } {
  const textA = `${a.title || ""} ${a.description || ""}`;
  const textB = `${b.title || ""} ${b.description || ""}`;

  const wordsA = new Set(extractProblemKeywords(textA));
  const wordsB = new Set(extractProblemKeywords(textB));

  const textJaccard = calculateJaccard(wordsA, wordsB);

  let categoryBonus = 0;
  if (a.categoryCode && b.categoryCode && a.categoryCode === b.categoryCode) {
    categoryBonus = 0.25;
  }

  const topicSimilarity = Math.min(1.0, textJaccard * 0.75 + categoryBonus);

  let locationSimilarity = 0.5;
  if (typeof a.lat === "number" && typeof a.lng === "number" && typeof b.lat === "number" && typeof b.lng === "number") {
    const dist = calculateDistanceMeters(a.lat, a.lng, b.lat, b.lng);
    if (dist <= 150) {
      locationSimilarity = 1.0;
    } else if (dist <= 400) {
      locationSimilarity = 0.95;
    } else if (dist <= 1000) {
      locationSimilarity = 0.85;
    } else if (dist <= 2500) {
      locationSimilarity = 0.7;
    } else {
      locationSimilarity = 0.4;
    }
  } else if (a.locationStr && b.locationStr && a.locationStr.toLowerCase() === b.locationStr.toLowerCase()) {
    locationSimilarity = 0.95;
  }

  const total = topicSimilarity * 0.65 + locationSimilarity * 0.35;
  const isMatch90 = total >= 0.88;

  return {
    similarity: Math.min(0.99, Math.round(total * 100) / 100),
    isMatch90,
  };
}

export async function triageWithGemini(
  title: string,
  description?: string | null,
  district?: string | null,
  village?: string | null
): Promise<TriageResult> {
  const apiKey =
    process.env.GEMINI_API_KEY_TRIAGE ||
    process.env.GEMINI_API_KEY_ASSISTANT ||
    "";

  const isAbs = isAbstractText(title, description);
  if (isAbs) {
    return {
      opdCode: "TIDAK_TERDAFTAR",
      opdName: "Tidak Masuk ke Dinas Manapun yang Terdaftar",
      categoryCode: "ABSTRAK",
      categoryName: "Abstrak / Kurang Jelas",
      confidence: 0.98,
      summary: title || "Laporan tidak memuat rincian masalah yang jelas",
      recommendedAction: "Masukkan ke tab Abstrak atau tolak laporan karena informasi kurang spesifik.",
      isAbstract: true,
      problemType: "Abstrak / Kurang Jelas",
    };
  }

  if (!apiKey || apiKey.startsWith("mock")) {
    return getLocalTriageFallback(title, description, district, village);
  }

  const prompt = `Anda adalah AI Triage Pengaduan Pemerintah Daerah Kota (Govra).
Tugas Anda adalah membaca judul dan deskripsi masalah warga, lalu mengklasifikasikannya ke salah satu dinas resmi:
1. DBM-SDA: Dinas Bina Marga & SDA (Jalan berlubang, aspal amblas, jembatan rusak, drainase banjir, gorong-gorong, tanggul jebol)
2. DLHK: Dinas Lingkungan Hidup & Kebersihan (Tumpukan sampah liar, limbah beracun, bau busuk, pencemaran)
3. DISHUB: Dinas Perhubungan (Lampu penerangan jalan PJU padam, rambu roboh, traffic light mati, parkir liar)
4. DINKES: Dinas Kesehatan (Pelayanan faskes/puskesmas, wabah DBD, sanitasi air, ambulans)
5. PUPR: Dinas PUPR (Infrastruktur fisik gedung pelayanan publik, tata ruang, fasilitas bangunan)
6. BPBD: Badan Penanggulangan Bencana Daerah (Tanah longsor, pohon tumbang badai, banjir bandang evakuasi darurat)
7. SATPOL-PP: Satuan Polisi Pamong Praja (PKL liar menutup trotoar, reklame liar, penertiban lapak liar)

Jika tidak masuk dinas di atas, berikan opd_code "TIDAK_TERDAFTAR".
Jika isi laporan tidak jelas, ngawur, atau tanpa substansi masalah nyata, set is_abstract true.

Judul: ${title}
Deskripsi: ${description || title}
Lokasi: Kecamatan ${district || "Kota"}, Kelurahan ${village || ""}

Keluarkan HANYA JSON:
{
  "opd_code": "DBM-SDA",
  "category_code": "JALAN-RUSAK",
  "confidence": 0.95,
  "summary": "Ringkasan padat laporan maks 120 karakter",
  "recommended_action": "Rekomendasi tindakan",
  "is_abstract": false,
  "problem_type": "Kerusakan Jalan & Aspal Berlubang"
}`;

  const models = [
    process.env.GEMINI_MODEL || "gemini-3-flash-preview",
    "gemini-3-flash-preview",
    "gemini-3.5-flash",
    "gemini-2.5-flash",
  ];

  for (const model of Array.from(new Set(models))) {
    try {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), 7000);
      const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;

      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ role: "user", parts: [{ text: prompt }] }],
          generationConfig: { temperature: 0.2, maxOutputTokens: 500 },
        }),
        signal: controller.signal,
      });
      clearTimeout(timer);

      if (res.ok) {
        const json = await res.json();
        const rawText = json?.candidates?.[0]?.content?.parts?.[0]?.text;
        if (rawText) {
          const clean = rawText
            .replace(/```json/gi, "")
            .replace(/```/g, "")
            .trim();
          const parsed = JSON.parse(clean);
          const opdCode = parsed.opd_code || "DBM-SDA";
          const opdName = SUPPORTED_OPDS[opdCode] || "Tidak Masuk ke Dinas Manapun yang Terdaftar";
          const catCode = parsed.category_code || "UMUM";
          const catName = CATEGORY_NAMES[catCode] || parsed.problem_type || "Umum";

          return {
            opdCode,
            opdName,
            categoryCode: catCode,
            categoryName: catName,
            confidence: typeof parsed.confidence === "number" ? parsed.confidence : 0.92,
            summary: parsed.summary || title,
            recommendedAction: parsed.recommended_action || `Teruskan ke ${opdName} untuk penanganan teknis lapangan.`,
            isAbstract: Boolean(parsed.is_abstract),
            problemType: parsed.problem_type || catName,
          };
        }
      }
    } catch {
      continue;
    }
  }

  return getLocalTriageFallback(title, description, district, village);
}

function getLocalTriageFallback(
  title: string,
  description?: string | null,
  district?: string | null,
  village?: string | null
): TriageResult {
  const combined = `${title} ${description || ""}`.toLowerCase();

  if (isAbstractText(title, description)) {
    return {
      opdCode: "TIDAK_TERDAFTAR",
      opdName: "Tidak Masuk ke Dinas Manapun yang Terdaftar",
      categoryCode: "ABSTRAK",
      categoryName: "Abstrak / Kurang Jelas",
      confidence: 0.95,
      summary: title || "Laporan tidak memuat rincian masalah yang jelas",
      recommendedAction: "Masukkan ke tab Abstrak atau tolak laporan karena informasi kurang spesifik.",
      isAbstract: true,
      problemType: "Abstrak / Kurang Jelas",
    };
  }

  if (/(jalan|aspal|lubang|amblas|jembatan)/.test(combined)) {
    return {
      opdCode: "DBM-SDA",
      opdName: SUPPORTED_OPDS["DBM-SDA"] || "Dinas Bina Marga & SDA",
      categoryCode: "JALAN-RUSAK",
      categoryName: "Jalan Rusak & Berlubang",
      confidence: 0.94,
      summary: title,
      recommendedAction: "Teruskan ke Dinas Bina Marga & SDA untuk inspeksi dan penambalan aspal.",
      isAbstract: false,
      problemType: "Kerusakan Jalan & Aspal Berlubang",
    };
  }

  if (/(drainase|saluran|gorong|banjir|tanggul|air\s*meluap)/.test(combined)) {
    return {
      opdCode: "DBM-SDA",
      opdName: SUPPORTED_OPDS["DBM-SDA"] || "Dinas Bina Marga & SDA",
      categoryCode: "DRAINASE-TERSUMBAT",
      categoryName: "Saluran Air & Drainase Tersumbat",
      confidence: 0.93,
      summary: title,
      recommendedAction: "Teruskan ke Dinas Bina Marga & SDA untuk pengerukan sedimentasi drainase.",
      isAbstract: false,
      problemType: "Saluran Air & Drainase Tersumbat",
    };
  }

  if (/(sampah|tps|limbah|bau|kotor)/.test(combined)) {
    return {
      opdCode: "DLHK",
      opdName: SUPPORTED_OPDS["DLHK"] || "Dinas Lingkungan Hidup & Kebersihan",
      categoryCode: "SAMPAH-LIAR",
      categoryName: "Tumpukan Sampah Liar",
      confidence: 0.95,
      summary: title,
      recommendedAction: "Teruskan ke Dinas Lingkungan Hidup & Kebersihan untuk pengangkutan armada sampah.",
      isAbstract: false,
      problemType: "Tumpukan Sampah Liar",
    };
  }

  if (/(lampu|pju|rambu|traffic|padam|gelap|mati|parkir)/.test(combined)) {
    return {
      opdCode: "DISHUB",
      opdName: SUPPORTED_OPDS["DISHUB"] || "Dinas Perhubungan",
      categoryCode: "LAMPU-JALAN",
      categoryName: "Lampu Penerangan Jalan Umum",
      confidence: 0.94,
      summary: title,
      recommendedAction: "Teruskan ke Dinas Perhubungan untuk penggantian bohlam PJU atau perbaikan rambu.",
      isAbstract: false,
      problemType: "Lampu Penerangan Jalan Umum (PJU)",
    };
  }

  if (/(puskesmas|posyandu|obat|dokter|faskes|dbd|jentik|penyakit)/.test(combined)) {
    return {
      opdCode: "DINKES",
      opdName: SUPPORTED_OPDS["DINKES"] || "Dinas Kesehatan",
      categoryCode: "FASILITAS-KESEHATAN",
      categoryName: "Fasilitas & Pelayanan Kesehatan",
      confidence: 0.92,
      summary: title,
      recommendedAction: "Teruskan ke Dinas Kesehatan untuk tindak lanjut layanan faskes dan logistik obat.",
      isAbstract: false,
      problemType: "Fasilitas & Pelayanan Kesehatan",
    };
  }

  if (/(longsor|pohon\s*tumbang|bencana|badai|evakuasi)/.test(combined)) {
    return {
      opdCode: "BPBD",
      opdName: SUPPORTED_OPDS["BPBD"] || "Badan Penanggulangan Bencana Daerah",
      categoryCode: "BENCANA-ALAM",
      categoryName: "Bencana Alam & Longsor",
      confidence: 0.96,
      summary: title,
      recommendedAction: "Teruskan ke BPBD untuk evakuasi darurat dan penanganan material bencana.",
      isAbstract: false,
      problemType: "Bencana Alam & Evakuasi Darurat",
    };
  }

  if (/(pkl|lapak|reklame|spanduk|sound\s*system|ketertiban)/.test(combined)) {
    return {
      opdCode: "SATPOL-PP",
      opdName: SUPPORTED_OPDS["SATPOL-PP"] || "Satuan Polisi Pamong Praja",
      categoryCode: "PENERTIBAN-UMUM",
      categoryName: "Ketertiban Umum & PKL Liar",
      confidence: 0.92,
      summary: title,
      recommendedAction: "Teruskan ke Satpol PP untuk penertiban dan penegakan perda ketertiban umum.",
      isAbstract: false,
      problemType: "Ketertiban Umum & Penertiban",
    };
  }

  return {
    opdCode: "PUPR",
    opdName: SUPPORTED_OPDS["PUPR"] || "Dinas PUPR",
    categoryCode: "INFRASTRUKTUR-GEDUNG",
    categoryName: "Infrastruktur Gedung Publik",
    confidence: 0.88,
    summary: title,
    recommendedAction: "Teruskan ke Dinas PUPR untuk verifikasi fasilitas fisik publik.",
    isAbstract: false,
    problemType: "Infrastruktur Fasilitas Publik",
  };
}

export function buildClustersAndThemes<T extends {
  id: string;
  code: string;
  title: string | null;
  summary?: string | null;
  description?: string | null;
  status?: string;
  lat?: number;
  lng?: number;
  district_name?: string | null;
  village_name?: string | null;
  opd_code?: string;
  opd_name?: string;
  category_code?: string;
  category_name?: string;
  ai_confidence?: number;
  ai_recommendation?: string;
}>(rawReports: T[]): {
  clusters: ReportCluster[];
  items: Array<T & {
    clusterTheme: string;
    clusterThemeId: string;
    clusterSimilarity: number;
    isAbstract: boolean;
    clusterSiblingCodes: string[];
    aiTriage: TriageResult;
    resolvedViaCluster?: boolean;
  }>;
} {
  const triaged = rawReports.map((r) => {
    const isAbs = isAbstractText(r.title, r.description || r.summary);
    const triage = getLocalTriageFallback(r.title || "", r.description || r.summary, r.district_name, r.village_name);
    return {
      ...r,
      isAbstract: isAbs,
      aiTriage: triage,
    };
  });

  const abstractItems: typeof triaged = [];
  const normalItems: typeof triaged = [];

  for (const item of triaged) {
    if (item.isAbstract) {
      abstractItems.push(item);
    } else {
      normalItems.push(item);
    }
  }

  const clusters: ReportCluster[] = [];
  const visited = new Set<string>();

  for (let i = 0; i < normalItems.length; i++) {
    const current = normalItems[i];
    if (!current || visited.has(current.id)) continue;

    const group = [current];
    visited.add(current.id);

    for (let j = i + 1; j < normalItems.length; j++) {
      const candidate = normalItems[j];
      if (!candidate || visited.has(candidate.id)) continue;

      const evalSim = calculateReportSimilarity(
        {
          title: current.title,
          description: current.description ?? current.summary ?? null,
          lat: current.lat,
          lng: current.lng,
          categoryCode: current.aiTriage.categoryCode,
          locationStr: current.village_name ?? current.district_name ?? null,
        },
        {
          title: candidate.title,
          description: candidate.description ?? candidate.summary ?? null,
          lat: candidate.lat,
          lng: candidate.lng,
          categoryCode: candidate.aiTriage.categoryCode,
          locationStr: candidate.village_name ?? candidate.district_name ?? null,
        }
      );

      if (evalSim.isMatch90) {
        group.push(candidate);
        visited.add(candidate.id);
      }
    }

    const opdCode = current.aiTriage.opdCode;
    const loc = current.village_name || current.district_name || "Wilayah Kota";
    const prob = current.aiTriage.problemType || "Isu Fasilitas";
    const themeId = `tema-${opdCode.toLowerCase()}-${loc.toLowerCase().replace(/[^a-z0-9]/g, "-")}-${current.code.slice(-4).toLowerCase()}`;
    const themeTitle = `${prob} di ${loc}`;

    const resolvedCount = group.filter((g) => g && g.status === "SELESAI").length;
    const isClusterResolved = resolvedCount > 0;

    clusters.push({
      themeId,
      themeTitle,
      problemType: prob,
      opdCode,
      locationName: loc,
      similarityScore: group.length > 1 ? 0.92 : 0.95,
      reportIds: group.filter((g): g is NonNullable<typeof g> => Boolean(g)).map((g) => g.id),
      reportCodes: group.filter((g): g is NonNullable<typeof g> => Boolean(g)).map((g) => g.code),
      totalCount: group.length,
      resolvedCount,
      isResolved: isClusterResolved,
    });
  }

  if (abstractItems.length > 0) {
    clusters.unshift({
      themeId: "ABSTRAK",
      themeTitle: "Abstrak / Kurang Jelas",
      problemType: "Informasi Tidak Spesifik",
      opdCode: "TIDAK_TERDAFTAR",
      locationName: "Beragam",
      similarityScore: 0.9,
      reportIds: abstractItems.map((a) => a.id),
      reportCodes: abstractItems.map((a) => a.code),
      totalCount: abstractItems.length,
      resolvedCount: abstractItems.filter((a) => a.status === "SELESAI").length,
      isResolved: false,
    });
  }

  const clusterMap = new Map<string, ReportCluster>();
  for (const c of clusters) {
    for (const rId of c.reportIds) {
      clusterMap.set(rId, c);
    }
  }

  const finalItems = triaged.map((item) => {
    const c = clusterMap.get(item.id);
    const themeId = c?.themeId || (item.isAbstract ? "ABSTRAK" : "TEMA-UMUM");
    const themeTitle = c?.themeTitle || (item.isAbstract ? "Abstrak / Kurang Jelas" : "Isu Laporan Warga");
    const clusterSimilarity = c?.similarityScore || 0.9;
    const siblingCodes = (c?.reportCodes || [item.code]).filter((code) => code !== item.code);
    const resolvedViaCluster = c ? c.isResolved && item.status !== "SELESAI" : false;

    return {
      ...item,
      clusterTheme: themeTitle,
      clusterThemeId: themeId,
      clusterSimilarity,
      isAbstract: item.isAbstract,
      clusterSiblingCodes: siblingCodes,
      resolvedViaCluster,
    };
  });

  return {
    clusters,
    items: finalItems,
  };
}

export async function resolveClusterSiblingReports(
  primaryIdentifier: string,
  resolution: {
    note: string;
    evidenceUrls: string[];
    actorName?: string;
  }
): Promise<{ resolvedCount: number; siblingCodes: string[] }> {
  const { url: supabaseUrl, key: supabaseKey } = directSupabase();
  const nowIso = new Date().toISOString();

  let targetIssueId: string | null = null;
  let targetReportCode: string | null = null;
  let targetTitle: string = "";
  let targetDistrictId: string | null = null;
  let targetVillageId: string | null = null;

  try {
    const [repRes, issRes] = await Promise.all([
      fetch(`${supabaseUrl}/rest/v1/reports?or=(id.eq.${encodeURIComponent(primaryIdentifier)},code.eq.${encodeURIComponent(primaryIdentifier)})&select=*`, {
        headers: { apikey: supabaseKey, Authorization: `Bearer ${supabaseKey}`, "Accept-Profile": "app" },
      }),
      fetch(`${supabaseUrl}/rest/v1/issues?id=eq.${encodeURIComponent(primaryIdentifier)}&select=*`, {
        headers: { apikey: supabaseKey, Authorization: `Bearer ${supabaseKey}`, "Accept-Profile": "app" },
      }),
    ]);

    if (repRes.ok) {
      const rows = await repRes.json();
      if (Array.isArray(rows) && rows.length > 0) {
        targetReportCode = rows[0].code;
        targetIssueId = rows[0].issue_id;
        targetTitle = rows[0].title;
        targetDistrictId = rows[0].district_id;
        targetVillageId = rows[0].village_id;
      }
    }

    if (!targetIssueId && issRes.ok) {
      const rows = await issRes.json();
      if (Array.isArray(rows) && rows.length > 0) {
        targetIssueId = rows[0].id;
        targetTitle = rows[0].title;
        targetDistrictId = rows[0].district_id;
        targetVillageId = rows[0].village_id;
      }
    }
  } catch {}

  const siblingIds: string[] = [];
  const siblingCodes: string[] = [];

  try {
    const allOpenRes = await fetch(`${supabaseUrl}/rest/v1/reports?status=neq.SELESAI&select=id,code,title,description,lat,lng,issue_id,district_id,village_id`, {
      headers: { apikey: supabaseKey, Authorization: `Bearer ${supabaseKey}`, "Accept-Profile": "app" },
    });

    if (allOpenRes.ok) {
      const allOpen = await allOpenRes.json();
      if (Array.isArray(allOpen)) {
        for (const candidate of allOpen) {
          if (candidate.code === targetReportCode || candidate.id === primaryIdentifier) continue;

          let isMatch = false;
          if (targetIssueId && candidate.issue_id && candidate.issue_id === targetIssueId) {
            isMatch = true;
          } else if (targetTitle && candidate.title) {
            const sim = calculateReportSimilarity(
              { title: targetTitle, locationStr: targetVillageId ?? null },
              { title: candidate.title, description: candidate.description ?? null, locationStr: candidate.village_id ?? null }
            );
            if (sim.isMatch90) {
              isMatch = true;
            }
          }

          if (isMatch) {
            siblingIds.push(candidate.id);
            siblingCodes.push(candidate.code);
          }
        }
      }
    }
  } catch {}

  const clusterNotice = `Laporan ini telah diselesaikan bersamaan melalui penanganan terpadu klaster isu (Rujukan Penanganan Utama: ${targetReportCode || primaryIdentifier}).\n\nCatatan Dinas: ${resolution.note}`;

  const patchPayload = {
    status: "SELESAI",
    updated_at: nowIso,
    hide_reason: clusterNotice,
  };

  const patchPromises: Promise<unknown>[] = [];

  for (const sId of siblingIds) {
    patchPromises.push(
      fetch(`${supabaseUrl}/rest/v1/reports?id=eq.${encodeURIComponent(sId)}`, {
        method: "PATCH",
        headers: {
          apikey: supabaseKey,
          Authorization: `Bearer ${supabaseKey}`,
          "Content-Type": "application/json",
          "Content-Profile": "app",
        },
        body: JSON.stringify(patchPayload),
      }).catch(() => null)
    );
  }

  if (targetIssueId) {
    patchPromises.push(
      fetch(`${supabaseUrl}/rest/v1/issues?id=eq.${encodeURIComponent(targetIssueId)}`, {
        method: "PATCH",
        headers: {
          apikey: supabaseKey,
          Authorization: `Bearer ${supabaseKey}`,
          "Content-Type": "application/json",
          "Content-Profile": "app",
        },
        body: JSON.stringify({
          status: "SELESAI",
          resolved_at: nowIso,
          updated_at: nowIso,
        }),
      }).catch(() => null)
    );
  }

  await Promise.allSettled(patchPromises);

  return {
    resolvedCount: siblingCodes.length,
    siblingCodes,
  };
}
