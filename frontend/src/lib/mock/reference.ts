import type { Schema } from "@/lib/schema";

export const DISTRICT_ID = {
  utara: "0197a000-0000-7000-8000-000000000001",
  selatan: "0197a000-0000-7000-8000-000000000002",
  timur: "0197a000-0000-7000-8000-000000000003",
  barat: "0197a000-0000-7000-8000-000000000004",
} as const;

export const VILLAGE_ID = {
  melati: "0197a000-0000-7000-8000-000000000011",
  kenanga: "0197a000-0000-7000-8000-000000000012",
  anggrek: "0197a000-0000-7000-8000-000000000013",
  teratai: "0197a000-0000-7000-8000-000000000014",
  mawar: "0197a000-0000-7000-8000-000000000015",
  cempaka: "0197a000-0000-7000-8000-000000000016",
  dahlia: "0197a000-0000-7000-8000-000000000017",
  flamboyan: "0197a000-0000-7000-8000-000000000018",
} as const;

interface VillageSeed {
  id: string;
  name: string;
  point: Schema<"GeoPoint">;
}

interface DistrictSeed {
  id: string;
  name: string;
  villages: readonly VillageSeed[];
}

const DISTRICT_SEEDS: readonly DistrictSeed[] = [
  {
    id: DISTRICT_ID.utara,
    name: "Kecamatan Utara",
    villages: [
      { id: VILLAGE_ID.melati, name: "Kelurahan Melati", point: { lat: -6.865, lng: 107.61 } },
      { id: VILLAGE_ID.kenanga, name: "Desa Kenanga", point: { lat: -6.875, lng: 107.635} },
    ],
  },
  {
    id: DISTRICT_ID.selatan,
    name: "Kecamatan Selatan",
    villages: [
      { id: VILLAGE_ID.anggrek, name: "Kelurahan Anggrek", point: { lat: -6.965, lng: 107.62 } },
      { id: VILLAGE_ID.teratai, name: "Desa Teratai", point: { lat: -6.98, lng: 107.645 } },
    ],
  },
  {
    id: DISTRICT_ID.timur,
    name: "Kecamatan Timur",
    villages: [
      { id: VILLAGE_ID.mawar, name: "Desa Mawar", point: { lat: -6.91, lng: 107.68 } },
      { id: VILLAGE_ID.cempaka, name: "Kelurahan Cempaka", point: { lat: -6.93, lng: 107.7 } },
    ],
  },
  {
    id: DISTRICT_ID.barat,
    name: "Kecamatan Barat",
    villages: [
      { id: VILLAGE_ID.dahlia, name: "Kelurahan Dahlia", point: { lat: -6.91, lng: 107.57 } },
      { id: VILLAGE_ID.flamboyan, name: "Desa Flamboyan", point: { lat: -6.925, lng: 107.55 } },
    ],
  },
];

export const REGION: Schema<"Region"> = {
  name: "Kota Contoh",
  head_label: "Wali Kota",
  is_simulation: true,
  period: { start_year: 2025, end_year: 2030 },
  bounds: [107.52, -7.0, 107.75, -6.84],
};

export const DISTRICTS: Schema<"District">[] = DISTRICT_SEEDS.map((district) => ({
  id: district.id,
  name: district.name,
  villages: district.villages.map(({ id, name }) => ({ id, name })),
}));

export const GOALS: Schema<"Goal">[] = [
  { code: "INFRA_JALAN", name: "Infrastruktur jalan mantap" },
  { code: "LINGKUNGAN", name: "Lingkungan bersih dan sehat" },
  { code: "KESEHATAN", name: "Layanan kesehatan merata" },
  { code: "PENDIDIKAN", name: "Pendidikan berkualitas" },
];

interface OpdSeed {
  ref: Schema<"OpdRef">;
  categories: Schema<"CategoryRef">[];
}

export const OPDS: readonly OpdSeed[] = [
  {
    ref: { code: "BMSDA", slug: "dinas-bina-marga-sda", name: "Dinas Bina Marga dan Sumber Daya Air" },
    categories: [
      { code: "JALAN_RUSAK", name: "Jalan rusak" },
      { code: "DRAINASE", name: "Saluran dan drainase" },
    ],
  },
  {
    ref: { code: "LHK", slug: "dinas-lingkungan-hidup", name: "Dinas Lingkungan Hidup dan Kebersihan" },
    categories: [{ code: "SAMPAH", name: "Sampah menumpuk" }],
  },
  {
    ref: { code: "KES", slug: "dinas-kesehatan", name: "Dinas Kesehatan" },
    categories: [{ code: "PUSKESMAS", name: "Layanan puskesmas" }],
  },
  {
    ref: { code: "PERHUB", slug: "dinas-perhubungan", name: "Dinas Perhubungan" },
    categories: [{ code: "LAMPU_LALIN", name: "Lampu lalu lintas" }],
  },
  {
    ref: { code: "DIKBUD", slug: "dinas-pendidikan-kebudayaan", name: "Dinas Pendidikan dan Kebudayaan" },
    categories: [{ code: "SEKOLAH_RUSAK", name: "Fasilitas sekolah rusak" }],
  },
];

export function must<T>(value: T | undefined, what: string): T {
  if (value === undefined) {
    throw new Error(`Data contoh tidak ditemukan: ${what}`);
  }
  return value;
}

export function opdRef(code: string): Schema<"OpdRef"> {
  return must(OPDS.find((opd) => opd.ref.code === code)?.ref, code);
}

export function categoryRef(code: string): Schema<"CategoryRef"> {
  return must(OPDS.flatMap((opd) => opd.categories).find((item) => item.code === code), code);
}

export function goalRef(code: string): Schema<"Goal"> {
  return must(GOALS.find((goal) => goal.code === code), code);
}

export function districtRef(id: string): Schema<"AreaRef"> {
  const district = must(DISTRICT_SEEDS.find((item) => item.id === id), id);
  return { id: district.id, name: district.name };
}

export function locationOf(villageId: string): Schema<"PublicLocation"> {
  const district = must(
    DISTRICT_SEEDS.find((item) => item.villages.some((village) => village.id === villageId)),
    villageId,
  );
  const village = must(district.villages.find((item) => item.id === villageId), villageId);
  return {
    village: { id: village.id, name: village.name },
    district: { id: district.id, name: district.name },
    point: village.point,
  };
}
