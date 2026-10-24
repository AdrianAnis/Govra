import { CircleCheck, Globe, Lock, type LucideIcon } from "lucide-react";
import type { ReportDraft } from "@/lib/report-draft";
import type { Schema } from "@/lib/schema";

interface SubmitStepProps {
  draft: ReportDraft;
  onChange: (patch: Partial<ReportDraft>) => void;
}

interface VisibilityOption {
  value: Schema<"Visibility">;
  icon: LucideIcon;
  label: string;
  text: string;
}

const OPTIONS: readonly VisibilityOption[] = [
  {
    value: "PUBLIK",
    icon: Globe,
    label: "Publik",
    text: "Laporan boleh tampil di halaman isu. Identitas Anda selalu disamarkan.",
  },
  {
    value: "RAHASIA",
    icon: Lock,
    label: "Rahasia",
    text: "Isi laporan hanya terlihat oleh dinas dan Admin, tetapi tetap dihitung di statistik.",
  },
];

function SubmitStep({ draft, onChange }: SubmitStepProps) {
  return (
    <fieldset className="flex flex-col gap-3">
      <legend className="mb-1 font-semibold">Siapa yang boleh melihat laporan ini?</legend>
      <div className="grid gap-4 sm:grid-cols-2">
        {OPTIONS.map((option) => (
          <label
            key={option.value}
            className="group relative flex cursor-pointer flex-col gap-4 rounded-lg border p-5 transition-all duration-200 ease-ui hover:border-fg-muted has-checked:border-primary has-checked:ring-4 has-checked:ring-primary-soft has-focus-visible:outline-2 has-focus-visible:outline-offset-2 has-focus-visible:outline-primary"
          >
            <input
              type="radio"
              name="visibility"
              value={option.value}
              checked={draft.visibility === option.value}
              onChange={() => onChange({ visibility: option.value })}
              className="sr-only"
            />
            <span className="grid size-10 place-items-center rounded-full bg-primary-soft text-primary">
              <option.icon aria-hidden className="size-5" />
            </span>
            <CircleCheck
              aria-hidden
              className="absolute top-5 right-5 size-5 text-primary opacity-0 transition-opacity duration-200 group-has-checked:opacity-100"
            />
            <span className="flex flex-col gap-1">
              <span className="font-semibold">{option.label}</span>
              <span className="text-sm text-fg-muted">{option.text}</span>
            </span>
          </label>
        ))}
      </div>
    </fieldset>
  );
}

export { SubmitStep };
