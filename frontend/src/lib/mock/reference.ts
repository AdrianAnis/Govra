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

export interface VillageSeed {
  id: string;
  name: string;
  point: Schema<"GeoPoint">;
}

export interface DistrictSeed {
  id: string;
  name: string;
  point: Schema<"GeoPoint">;
  villages: readonly VillageSeed[];
}

const RAW_BANDUNG: { name: string; lat: number; lng: number; v: string[] }[] = [
  { name: "Andir", lat: -6.9126, lng: 107.5833, v: ["Campaka", "Ciroyom", "Dunguscariang", "Garuda", "Kebonjeruk", "Maleber"] },
  { name: "Antapani", lat: -6.9158, lng: 107.6622, v: ["Antapani Kidul", "Antapani Kulon", "Antapani Tengah", "Antapani Wetan"] },
  { name: "Arcamanik", lat: -6.9213, lng: 107.6834, v: ["Cisaranten Bina Harapan", "Cisaranten Endah", "Cisaranten Kulon", "Sukamiskin"] },
  { name: "Astanaanyar", lat: -6.9388, lng: 107.5997, v: ["Cibadak", "Karanganyar", "Karasak", "Nyengseret", "Panjunan", "Pelindunghewan"] },
  { name: "Babakan Ciparay", lat: -6.9455, lng: 107.5758, v: ["Babakan", "Babakanciparay", "Cirangrang", "Margahayu Utara", "Margasuka", "Sukahaji"] },
  { name: "Bandung Kidul", lat: -6.9582, lng: 107.6331, v: ["Batununggal", "Kujangsari", "Mengger", "Wates"] },
  { name: "Bandung Kulon", lat: -6.9238, lng: 107.5672, v: ["Caringin", "Cibuntu", "Cigondewah Kaler", "Cigondewah Kidul", "Cigondewah Rahayu", "Cijerah", "Gempolsari", "Warungmuncang"] },
  { name: "Bandung Wetan", lat: -6.9064, lng: 107.6189, v: ["Cihapit", "Citarum", "Tamansari"] },
  { name: "Batununggal", lat: -6.9283, lng: 107.6366, v: ["Binong", "Cibangkong", "Gumuruh", "Kacapiring", "Kebongedang", "Kebonwaru", "Maleer", "Samoja"] },
  { name: "Bojongloa Kaler", lat: -6.9317, lng: 107.5922, v: ["Babakan Asih", "Babakan Tarogong", "Jamika", "Kopo", "Suka Asih"] },
  { name: "Bojongloa Kidul", lat: -6.9542, lng: 107.5975, v: ["Cibaduyut", "Cibaduyut Kidul", "Cibaduyut Wetan", "Kebon Lega", "Mekarwangi", "Situsaeur"] },
  { name: "Buahbatu", lat: -6.9531, lng: 107.6644, v: ["Cijawura", "Jatisari", "Margasari", "Sekejati"] },
  { name: "Cibeunying Kaler", lat: -6.8906, lng: 107.6319, v: ["Cigadung", "Cihaurgeulis", "Neglasari", "Sukaluyu"] },
  { name: "Cibeunying Kidul", lat: -6.9022, lng: 107.6433, v: ["Cicadas", "Cikutra", "Padasuka", "Pasirlayung", "Sukamaju", "Sukapada"] },
  { name: "Cibiru", lat: -6.9247, lng: 107.7144, v: ["Cipadung", "Cisurupan", "Palasari", "Pasirbiru"] },
  { name: "Cicendo", lat: -6.9042, lng: 107.5947, v: ["Arjuna", "Husen Sastranegara", "Pajajaran", "Pamoyanan", "Pasirkaliki", "Sukaraja"] },
  { name: "Cidadap", lat: -6.8581, lng: 107.6022, v: ["Ciumbuleuit", "Hegarmanah", "Ledeng"] },
  { name: "Cinambo", lat: -6.9319, lng: 107.6975, v: ["Babakan Penghulu", "Cisaranten Wetan", "Pakemitan", "Sukamulya"] },
  { name: "Coblong", lat: -6.8833, lng: 107.6167, v: ["Cipaganti", "Dago", "Lebakgede", "Lebaksiliwangi", "Sadangserang", "Sekeloa"] },
  { name: "Gedebage", lat: -6.9589, lng: 107.6922, v: ["Cimincrang", "Cisaranten Rancabungur", "Rancabolang", "Rancanumpang"] },
  { name: "Kiaracondong", lat: -6.9228, lng: 107.6492, v: ["Babakansari", "Babakansurabaya", "Cicaheum", "Kebonkangkung", "Kebonjayanti", "Sukapura"] },
  { name: "Lengkong", lat: -6.9325, lng: 107.6206, v: ["Burangrang", "Cijagra", "Cikawao", "Lingkar Selatan", "Malabar", "Paledang", "Turangga"] },
  { name: "Mandalajati", lat: -6.9047, lng: 107.6719, v: ["Jatihandap", "Karangpamulang", "Pasir Impun", "Sindangjaya"] },
  { name: "Panyileukan", lat: -6.9406, lng: 107.7083, v: ["Cipadung Kidul", "Cipadung Kulon", "Cipadung Wetan", "Mekarmulya"] },
  { name: "Rancasari", lat: -6.9558, lng: 107.6756, v: ["Cipamokolan", "Darwati", "Manjahlega", "Mekar Jaya"] },
  { name: "Regol", lat: -6.9392, lng: 107.6111, v: ["Ancol", "Balonggede", "Ciateul", "Cigereleng", "Ciseureuh", "Pasirluyu", "Pungkur"] },
  { name: "Sukajadi", lat: -6.8867, lng: 107.5897, v: ["Cipedes", "Pasteur", "Sukabungah", "Sukagalih", "Sukawarna"] },
  { name: "Sukasari", lat: -6.8681, lng: 107.5856, v: ["Gegerkalong", "Isola", "Sarijadi", "Sukarasa"] },
  { name: "Sumur Bandung", lat: -6.9178, lng: 107.6117, v: ["Babakanciamis", "Braga", "Kebonpisang", "Merdeka"] },
  { name: "Ujungberung", lat: -6.9142, lng: 107.7008, v: ["Cigending", "Pasanggrahan", "Pasirendah", "Pasirjati", "Pasirwangi"] },
];

const FALLBACK_DISTRICTS = [DISTRICT_ID.utara, DISTRICT_ID.selatan, DISTRICT_ID.timur, DISTRICT_ID.barat];
const FALLBACK_VILLAGES = [
  VILLAGE_ID.melati,
  VILLAGE_ID.kenanga,
  VILLAGE_ID.anggrek,
  VILLAGE_ID.teratai,
  VILLAGE_ID.mawar,
  VILLAGE_ID.cempaka,
  VILLAGE_ID.dahlia,
  VILLAGE_ID.flamboyan,
];

let globalVillageCounter = 0;

export const DISTRICT_SEEDS: readonly DistrictSeed[] = RAW_BANDUNG.map((d, dIdx) => {
  const dHex = String(dIdx + 1).padStart(4, "0");
  const districtId = FALLBACK_DISTRICTS[dIdx] ?? `0197a000-0000-7000-8000-${dHex}00000000`;
  return {
    id: districtId,
    name: `Kecamatan ${d.name}`,
    point: { lat: d.lat, lng: d.lng },
    villages: d.v.map((vName, vIdx) => {
      const vHex = String(vIdx + 1).padStart(4, "0");
      const vId = FALLBACK_VILLAGES[globalVillageCounter] ?? `0197b000-0000-7000-8000-${dHex}${vHex}0000`;
      globalVillageCounter++;
      const offsetLat = (vIdx - (d.v.length - 1) / 2) * 0.005;
      const offsetLng = vIdx % 2 === 0 ? 0.004 : -0.004;
      return {
        id: vId,
        name: `Kelurahan ${vName}`,
        point: { lat: Math.round((d.lat + offsetLat) * 10000) / 10000, lng: Math.round((d.lng + offsetLng) * 10000) / 10000 },
      };
    }),
  };
});

export const REGION: Schema<"Region"> = {
  name: "Kota Bandung",
  head_label: "Wali Kota Bandung",
  is_simulation: true,
  period: { start_year: 2025, end_year: 2030 },
  bounds: [107.54, -6.97, 107.74, -6.84],
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
    ref: { code: "DBM-SDA", slug: "bina-marga-sda", name: "Dinas Bina Marga & SDA" },
    categories: [
      { code: "JALAN-RUSAK", name: "Jalan Rusak & Berlubang" },
      { code: "DRAINASE-TERSUMBAT", name: "Saluran Air & Drainase Tersumbat" },
    ],
  },
  {
    ref: { code: "DLHK", slug: "lingkungan-hidup", name: "Dinas Lingkungan Hidup & Kebersihan" },
    categories: [{ code: "SAMPAH-LIAR", name: "Tumpukan Sampah Liar" }],
  },
  {
    ref: { code: "DISHUB", slug: "perhubungan", name: "Dinas Perhubungan" },
    categories: [
      { code: "LAMPU-JALAN", name: "Lampu Penerangan Jalan Padam" },
      { code: "RAMBU-RUSAK", name: "Rambu & Traffic Light Rusak" },
    ],
  },
  {
    ref: { code: "DINKES", slug: "kesehatan", name: "Dinas Kesehatan" },
    categories: [{ code: "FASILITAS-KESEHATAN", name: "Layanan Kesehatan & Faskes" }],
  },
  {
    ref: { code: "PUPR", slug: "pupr", name: "Dinas PUPR" },
    categories: [{ code: "INFRASTRUKTUR-GEDUNG", name: "Infrastruktur & Gedung" }],
  },
];

const OPD_ALIASES: Record<string, string> = {
  BMSDA: "DBM-SDA",
  LHK: "DLHK",
  PERHUB: "DISHUB",
  KES: "DINKES",
  DIKBUD: "PUPR",
};

const CAT_ALIASES: Record<string, string> = {
  JALAN_RUSAK: "JALAN-RUSAK",
  DRAINASE: "DRAINASE-TERSUMBAT",
  SAMPAH: "SAMPAH-LIAR",
  LAMPU_LALIN: "LAMPU-JALAN",
  PUSKESMAS: "FASILITAS-KESEHATAN",
  SEKOLAH_RUSAK: "INFRASTRUKTUR-GEDUNG",
};

export function must<T>(value: T | undefined, what: string): T {
  if (value === undefined) {
    throw new Error(`Data contoh tidak ditemukan: ${what}`);
  }
  return value;
}

export function opdRef(code: string): Schema<"OpdRef"> {
  const resolved = OPD_ALIASES[code] ?? code;
  return must(OPDS.find((opd) => opd.ref.code === resolved || opd.ref.code === code)?.ref, code);
}

export function categoryRef(code: string): Schema<"CategoryRef"> {
  const resolved = CAT_ALIASES[code] ?? code;
  return must(
    OPDS.flatMap((opd) => opd.categories).find((item) => item.code === resolved || item.code === code),
    code,
  );
}

export function goalRef(code: string): Schema<"Goal"> {
  return must(GOALS.find((goal) => goal.code === code), code);
}

export function districtRef(id: string): Schema<"AreaRef"> {
  const district = DISTRICT_SEEDS.find((item) => item.id === id) ?? DISTRICT_SEEDS[0]!;
  return { id: district.id, name: district.name };
}

export function locationOf(villageId: string): Schema<"PublicLocation"> {
  const district = DISTRICT_SEEDS.find((item) => item.villages.some((v) => v.id === villageId)) ?? DISTRICT_SEEDS[0]!;
  const village = district.villages.find((v) => v.id === villageId) ?? district.villages[0]!;
  return {
    village: { id: village.id, name: village.name },
    district: { id: district.id, name: district.name },
    point: village.point,
  };
}
