import { CircleCheck } from "lucide-react";
import { LocationPicker } from "@/components/report/location-picker";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { Schema } from "@/lib/schema";
import type { FieldErrors, ReportDraft } from "@/lib/report-draft";

interface LocationStepProps {
  draft: ReportDraft;
  errors: FieldErrors;
  districts: readonly Schema<"District">[];
  bounds: readonly number[];
  onChange: (patch: Partial<ReportDraft>) => void;
}

interface AreaSelectProps {
  id: string;
  label: string;
  placeholder: string;
  value: string;
  items: readonly { id: string; name: string }[];
  error: string | undefined;
  disabled?: boolean;
  onValueChange: (value: string) => void;
}

function AreaSelect({ id, label, placeholder, value, items, error, disabled = false, onValueChange }: AreaSelectProps) {
  const options = items.map((item) => ({ value: item.id, label: item.name }));
  return (
    <div className="flex flex-col gap-2">
      <label htmlFor={id} className="font-semibold">
        {label}
      </label>
      <Select
        value={value || null}
        items={options}
        disabled={disabled}
        onValueChange={(next) => onValueChange(next ?? "")}
      >
        <SelectTrigger id={id} aria-invalid={error ? true : undefined} className="h-12 rounded-lg px-4 text-base">
          <SelectValue placeholder={placeholder} />
        </SelectTrigger>
        <SelectContent>
          {options.map((option) => (
            <SelectItem key={option.value} value={option.value}>
              {option.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      {error && (
        <p role="alert" className="text-sm font-medium text-fg">
          {error}
        </p>
      )}
    </div>
  );
}

function LocationStep({ draft, errors, districts, bounds, onChange }: LocationStepProps) {
  const villages = districts.find((district) => district.id === draft.districtId)?.villages ?? [];
  return (
    <div className="flex flex-col gap-8">
      <div className="grid gap-6 sm:grid-cols-2">
        <AreaSelect
          id="district"
          label="Kecamatan"
          placeholder="Pilih kecamatan"
          value={draft.districtId}
          items={districts}
          error={errors.districtId}
          onValueChange={(districtId) => onChange({ districtId, villageId: "" })}
        />
        <AreaSelect
          id="village"
          label="Kelurahan atau desa"
          placeholder="Pilih kelurahan atau desa"
          value={draft.villageId}
          items={villages}
          error={errors.villageId}
          disabled={!draft.districtId}
          onValueChange={(villageId) => onChange({ villageId })}
        />
      </div>
      <div className="flex flex-col gap-3">
        <div className="flex flex-col gap-1">
          <p className="font-semibold">Tandai titik kejadian</p>
          <p className="text-sm text-fg-muted">
            Ketuk peta untuk menaruh pin. Di halaman publik, lokasi hanya ditampilkan sampai tingkat kelurahan.
          </p>
        </div>
        <LocationPicker bounds={bounds} point={draft.point} onPick={(point) => onChange({ point })} />
        {draft.point && !errors.point && (
          <p className="inline-flex items-center gap-2 text-sm font-medium text-fg">
            <CircleCheck aria-hidden className="size-4 text-primary" />
            Titik sudah ditandai
          </p>
        )}
        {errors.point && (
          <p role="alert" className="text-sm font-medium text-fg">
            {errors.point}
          </p>
        )}
      </div>
    </div>
  );
}

export { LocationStep };
