import type { Schema } from "@/lib/schema";
import type { ReportDraft } from "@/lib/report-draft";

interface SubmitStepProps {
  draft: ReportDraft;
  districts: readonly Schema<"District">[];
  error: string | null;
  onChange: (patch: Partial<ReportDraft>) => void;
}

interface VisibilityOption {
  value: Schema<"Visibility">;
  label: string;
  text: string;
}

const OPTIONS: readonly VisibilityOption[] = [
  {
    value: "PUBLIK",
    label: "Publik",
    text: "Laporan boleh tampil di halaman isu. Identitas Anda selalu disamarkan.",
  },
  {
    value: "RAHASIA",
    label: "Rahasia",
    text: "Isi laporan hanya terlihat oleh dinas dan Admin, tetapi tetap dihitung di statistik.",
  },
];

function SubmitStep({ draft, districts, error, onChange }: SubmitStepProps) {
  const district = districts.find((item) => item.id === draft.districtId);
  const village = district?.villages.find((item) => item.id === draft.villageId);
  const rows: ReadonlyArray<readonly [string, string]> = [
    ["Judul", draft.title.trim() || "Tanpa judul"],
    ["Isi", draft.body.trim()],
    ["Lokasi", [village?.name, district?.name].filter(Boolean).join(", ")],
    ["Foto", draft.files.length > 0 ? `${draft.files.length} foto` : "Tanpa foto"],
  ];
  return (
    <div className="flex flex-col gap-8">
      <fieldset className="flex flex-col gap-3">
        <legend className="mb-1 font-semibold">Siapa yang boleh melihat laporan ini?</legend>
        {OPTIONS.map((option) => (
          <label
            key={option.value}
            className="flex cursor-pointer gap-4 rounded-lg border p-4 transition-colors duration-200 ease-ui hover:bg-surface-muted has-checked:border-fg has-checked:bg-surface-muted has-focus-visible:outline-2 has-focus-visible:outline-offset-2 has-focus-visible:outline-primary"
          >
            <input
              type="radio"
              name="visibility"
              value={option.value}
              checked={draft.visibility === option.value}
              onChange={() => onChange({ visibility: option.value })}
              className="mt-1 size-4 accent-primary"
            />
            <span className="flex flex-col gap-1">
              <span className="font-semibold">{option.label}</span>
              <span className="text-sm text-fg-muted">{option.text}</span>
            </span>
          </label>
        ))}
      </fieldset>
      <dl className="flex flex-col divide-y rounded-lg border">
        {rows.map(([term, detail]) => (
          <div key={term} className="grid gap-1 p-4 sm:grid-cols-4 sm:gap-4">
            <dt className="text-sm font-semibold text-fg-muted">{term}</dt>
            <dd className="line-clamp-3 sm:col-span-3">{detail}</dd>
          </div>
        ))}
      </dl>
      {error && (
        <p role="alert" className="text-sm font-medium text-fg">
          {error}
        </p>
      )}
    </div>
  );
}

export { SubmitStep };
