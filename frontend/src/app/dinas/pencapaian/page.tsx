import type { Metadata } from "next";
import Link from "next/link";
import {
  AlertCircle,
  ArrowLeft,
  Calendar,
  CheckCircle2,
  Clock,
  Coins,
  MapPin,
  TrendingUp,
} from "lucide-react";
import { PageHeader } from "@/components/page-header";
import { EmptyState } from "@/components/state-message";
import { getSessionUser } from "@/lib/data/session";
import { formatNumber, formatRupiah } from "@/lib/format";
import { cn } from "@/lib/utils";

export const metadata: Metadata = { title: "Pencapaian Proker" };

interface ProgramItem {
  id: string;
  code: string;
  name: string;
  description: string;
  target_output: number;
  target_unit: string;
  realization_output: number;
  budget_pagu: number;
  budget_realization: number;
  start_date: string;
  end_date: string;
  status: string;
  district_name?: string;
}

const OPD_UUID_MAP: Record<string, string> = {
  "e0000000-0000-0000-0000-000000000001": "DBM-SDA",
  "e0000000-0000-0000-0000-000000000002": "DLHK",
  "e0000000-0000-0000-0000-000000000003": "DISHUB",
  "e0000000-0000-0000-0000-000000000004": "DINKES",
  "e0000000-0000-0000-0000-000000000007": "PUPR",
};

async function fetchAgencyPrograms(opdId?: string): Promise<ProgramItem[]> {
  const supabaseUrl = process.env.SUPABASE_URL || "https://gtsskmxircedhfggqena.supabase.co";
  const supabaseKey =
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imd0c3NrbXhpcmNlZGhmZ2dxZW5hIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc5MjY2MzM1MywiZXhwIjoyMTA4MjM5MzUzfQ.ATvm9u6Dm2cSZ_IiUkajOiIGgXA13jJgC8lU-LrXTXY";

  try {
    let endpoint = `${supabaseUrl}/rest/v1/programs?order=code.asc`;
    if (opdId) {
      endpoint += `&opd_id=eq.${encodeURIComponent(opdId)}`;
    }
    const res = await fetch(endpoint, {
      headers: {
        apikey: supabaseKey,
        Authorization: `Bearer ${supabaseKey}`,
        "Accept-Profile": "app",
      },
      next: { revalidate: 10 },
    });

    if (res.ok) {
      const rows = await res.json();
      if (Array.isArray(rows) && rows.length > 0) {
        return rows.map((r: any) => ({
          id: r.id,
          code: r.code,
          name: r.name,
          description: r.description || "",
          target_output: Number(r.target_output) || 100,
          target_unit: r.target_unit || "%",
          realization_output: Number(r.realization_output) || 0,
          budget_pagu: Number(r.budget_pagu) || 0,
          budget_realization: Number(r.budget_realization) || 0,
          start_date: r.start_date || "2026-01-01",
          end_date: r.end_date || "2026-12-31",
          status: r.status || "SESUAI_JADWAL",
          district_name: "Kota Bandung",
        }));
      }
    }
  } catch {}

  return [
    {
      id: "p-01",
      code: "PRK-001",
      name: "Perbaikan Jalan Poros dan Drainase Utama",
      description: "Peningkatan kualitas jalan aspal dan normalisasi saluran air di jalan protokol.",
      target_output: 12,
      target_unit: "km",
      realization_output: 5.4,
      budget_pagu: 4500000000,
      budget_realization: 2100000000,
      start_date: "2026-01-05",
      end_date: "2026-12-20",
      status: "SESUAI_JADWAL",
      district_name: "Kecamatan Andir",
    },
    {
      id: "p-02",
      code: "PRK-002",
      name: "Pembangunan Saluran Drainase Resapan & Pompa Air",
      description: "Pembangunan sistem pompa pengendali genangan banjir dan sumur retensi komunal.",
      target_output: 8,
      target_unit: "titik",
      realization_output: 6,
      budget_pagu: 3200000000,
      budget_realization: 2500000000,
      start_date: "2026-02-01",
      end_date: "2026-10-31",
      status: "SESUAI_JADWAL",
      district_name: "Kecamatan Antapani",
    },
    {
      id: "p-03",
      code: "PRK-003",
      name: "Rehabilitasi Jembatan Penghubung Antar Wilayah",
      description: "Penguatan struktur jembatan beton dan penambahan pengaman tepi jembatan.",
      target_output: 4,
      target_unit: "jembatan",
      realization_output: 1,
      budget_pagu: 5800000000,
      budget_realization: 1600000000,
      start_date: "2026-03-10",
      end_date: "2026-11-25",
      status: "TERLAMBAT",
      district_name: "Kecamatan Arcamanik",
    },
  ];
}

export default async function AgencyPencapaianPage() {
  const user = await getSessionUser();
  const programs = await fetchAgencyPrograms(user?.opdId || undefined);

  const totalPrograms = programs.length;
  const onScheduleCount = programs.filter(
    (p) => p.status === "SESUAI_JADWAL" || p.status === "BERJALAN"
  ).length;
  const lateCount = programs.filter((p) => p.status === "TERLAMBAT").length;

  const totalPagu = programs.reduce((acc, p) => acc + p.budget_pagu, 0);
  const totalRealisasi = programs.reduce((acc, p) => acc + p.budget_realization, 0);
  const avgProgress =
    totalPrograms > 0
      ? Math.round(
          programs.reduce(
            (acc, p) => acc + (p.target_output > 0 ? (p.realization_output / p.target_output) * 100 : 0),
            0
          ) / totalPrograms
        )
      : 0;

  return (
    <div className="flex flex-col gap-8 pb-12">
      <div className="flex items-center gap-2">
        <Link
          href="/dinas"
          className="inline-flex min-h-11 items-center gap-2 text-sm font-medium text-fg-muted hover:text-primary"
        >
          <ArrowLeft className="size-4" />
          Kembali ke Ringkasan
        </Link>
      </div>

      <PageHeader
        title="Pencapaian Program Kerja (Proker)"
        description={`Pantau dan kelola progres pencapaian proyek strategis ${user?.opdName ?? "OPD Anda"}.`}
      />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="flex flex-col justify-between rounded-xl border border-border bg-surface p-5 shadow-xs">
          <span className="text-sm font-semibold text-fg-muted">Total Program Kerja</span>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-4xl font-bold tracking-tight tabular-nums text-fg">
              {formatNumber(totalPrograms)}
            </span>
            <span className="text-xs text-fg-muted">kegiatan terdaftar</span>
          </div>
        </div>

        <div className="flex flex-col justify-between rounded-xl border border-border bg-surface p-5 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-sm font-semibold text-fg-muted">Rata-rata Capaian Fisik</span>
            <TrendingUp className="size-5 text-primary" />
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-4xl font-bold tracking-tight tabular-nums text-primary">
              {avgProgress}%
            </span>
            <span className="text-xs text-fg-muted">dari total target</span>
          </div>
        </div>

        <div className="flex flex-col justify-between rounded-xl border border-border bg-surface p-5 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-sm font-semibold text-fg-muted">Status Pelaksanaan</span>
            <Clock className="size-5 text-emerald-600" />
          </div>
          <div className="mt-3 flex items-baseline gap-3">
            <div className="flex items-baseline gap-1">
              <span className="text-2xl font-bold tabular-nums text-emerald-600">
                {formatNumber(onScheduleCount)}
              </span>
              <span className="text-xs text-fg-muted">sesuai</span>
            </div>
            {lateCount > 0 && (
              <div className="flex items-baseline gap-1">
                <span className="text-2xl font-bold tabular-nums text-amber-600">
                  {formatNumber(lateCount)}
                </span>
                <span className="text-xs text-fg-muted">terlambat</span>
              </div>
            )}
          </div>
        </div>

        <div className="flex flex-col justify-between rounded-xl border border-border bg-surface p-5 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-sm font-semibold text-fg-muted">Serapan Anggaran</span>
            <Coins className="size-5 text-fg-muted" />
          </div>
          <div className="mt-3 flex flex-col">
            <span className="text-xl font-bold tracking-tight tabular-nums text-fg">
              {formatRupiah(totalRealisasi)}
            </span>
            <span className="text-xs text-fg-muted tabular-nums">
              Pagu: {formatRupiah(totalPagu)}
            </span>
          </div>
        </div>
      </div>

      <section className="flex flex-col gap-5">
        <h2 className="text-xl font-bold tracking-tight text-fg">
          Daftar Proker & Capaian Kinerja
        </h2>

        {programs.length > 0 ? (
          <div className="flex flex-col gap-4">
            {programs.map((program) => {
              const progressPct =
                program.target_output > 0
                  ? Math.min(
                      100,
                      Math.round((program.realization_output / program.target_output) * 100)
                    )
                  : 0;
              const budgetPct =
                program.budget_pagu > 0
                  ? Math.min(
                      100,
                      Math.round((program.budget_realization / program.budget_pagu) * 100)
                    )
                  : 0;

              const isLate = program.status === "TERLAMBAT";

              return (
                <div
                  key={program.id}
                  className="flex flex-col gap-5 rounded-xl border border-border bg-surface p-6 shadow-xs transition-colors hover:border-border-strong"
                >
                  <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                    <div className="flex flex-col gap-1">
                      <div className="flex items-center gap-2">
                        <span className="rounded bg-primary-soft px-2 py-0.5 font-mono text-xs font-bold text-primary">
                          {program.code}
                        </span>
                        <span
                          className={cn(
                            "inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-xs font-semibold",
                            isLate
                              ? "bg-amber-100 text-amber-800 border border-amber-300"
                              : "bg-emerald-100 text-emerald-800 border border-emerald-300"
                          )}
                        >
                          {isLate ? (
                            <>
                              <AlertCircle className="size-3" />
                              Perlu Atensi / Terlambat
                            </>
                          ) : (
                            <>
                              <CheckCircle2 className="size-3" />
                              Sesuai Jadwal
                            </>
                          )}
                        </span>
                      </div>
                      <h3 className="text-lg font-bold text-fg">{program.name}</h3>
                      <p className="text-sm text-fg-muted max-w-2xl">{program.description}</p>
                    </div>

                    <div className="flex items-center gap-2 text-xs text-fg-muted shrink-0 mt-2 sm:mt-0">
                      <Calendar className="size-3.5" />
                      <span className="tabular-nums">
                        {program.start_date} s/d {program.end_date}
                      </span>
                    </div>
                  </div>

                  <div className="grid gap-6 border-t border-border pt-5 sm:grid-cols-2 lg:grid-cols-3">
                    <div className="flex flex-col gap-2">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-semibold text-fg">Realisasi Fisik</span>
                        <span className="font-bold tabular-nums text-primary">{progressPct}%</span>
                      </div>
                      <div className="h-2.5 w-full overflow-hidden rounded-full bg-surface-muted">
                        <div
                          className="h-full rounded-full bg-primary transition-all duration-500"
                          style={{ width: `${progressPct}%` }}
                        />
                      </div>
                      <p className="text-xs text-fg-muted tabular-nums">
                        Output: <span className="font-semibold text-fg">{program.realization_output}</span> dari {program.target_output} {program.target_unit}
                      </p>
                    </div>

                    <div className="flex flex-col gap-2">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-semibold text-fg">Serapan Anggaran</span>
                        <span className="font-bold tabular-nums text-secondary">{budgetPct}%</span>
                      </div>
                      <div className="h-2.5 w-full overflow-hidden rounded-full bg-surface-muted">
                        <div
                          className="h-full rounded-full bg-secondary transition-all duration-500"
                          style={{ width: `${budgetPct}%` }}
                        />
                      </div>
                      <p className="text-xs text-fg-muted tabular-nums">
                        Realisasi: <span className="font-semibold text-fg">{formatRupiah(program.budget_realization)}</span>
                      </p>
                    </div>

                    <div className="flex flex-col justify-center rounded-lg bg-surface-muted p-3">
                      <span className="text-xs font-semibold text-fg-muted uppercase tracking-wider">
                        Pagu Anggaran Disetujui
                      </span>
                      <span className="text-base font-bold tabular-nums text-fg mt-0.5">
                        {formatRupiah(program.budget_pagu)}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <EmptyState
            title="Belum ada program kerja"
            description="Tidak ada program kerja yang tercatat untuk dinas ini."
          />
        )}
      </section>
    </div>
  );
}
