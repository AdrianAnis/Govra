"use client";

import { useEffect, useMemo, useRef, useState, type ChangeEvent } from "react";
import { CircleCheck } from "lucide-react";
import { LocationPicker } from "@/components/report/location-picker";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { getStreetsForVillage } from "@/lib/bandung-streets";
import { FIELD_CLASS, FIELD_HEIGHT } from "@/lib/field-style";
import type { Schema } from "@/lib/schema";
import { cn } from "@/lib/utils";
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
  error?: string | undefined;
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
        <SelectTrigger id={id} aria-invalid={error ? true : undefined} className={cn(FIELD_HEIGHT, FIELD_CLASS)}>
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

function parseAddressDetail(addressDetail: string, streets: readonly { name: string }[]) {
  if (!addressDetail) {
    return { street: "", note: "" };
  }
  const matched = [...streets]
    .sort((a, b) => b.name.length - a.name.length)
    .find((s) => addressDetail.startsWith(s.name));
  if (!matched) {
    return { street: "LAINNYA", note: addressDetail };
  }
  const prefix = `${matched.name}, `;
  if (addressDetail.startsWith(prefix)) {
    return { street: matched.name, note: addressDetail.slice(prefix.length) };
  }
  if (addressDetail === matched.name) {
    return { street: matched.name, note: "" };
  }
  if (addressDetail.startsWith(`${matched.name},`)) {
    return { street: matched.name, note: addressDetail.slice(matched.name.length + 1).trimStart() };
  }
  return { street: matched.name, note: addressDetail.slice(matched.name.length).trimStart() };
}

function LocationStep({ draft, errors, districts, bounds, onChange }: LocationStepProps) {
  const selectedDistrict = districts.find((district) => district.id === draft.districtId);
  const villages = selectedDistrict?.villages ?? [];
  const selectedVillage = villages.find((item) => item.id === draft.villageId);

  const streetList = useMemo(() => {
    if (!selectedVillage) return [];
    return getStreetsForVillage(selectedVillage.name, selectedDistrict?.name);
  }, [selectedVillage, selectedDistrict]);

  const streetSelectItems = useMemo(() => {
    if (!draft.villageId || streetList.length === 0) return [];
    const items = streetList.map((s) => ({ id: s.name, name: s.name }));
    items.push({ id: "LAINNYA", name: "Jalan lainnya (tulis di patokan)" });
    return items;
  }, [draft.villageId, streetList]);

  const [selectedStreet, setSelectedStreet] = useState<string>(() => {
    return parseAddressDetail(draft.addressDetail, streetList).street;
  });

  const [note, setNote] = useState<string>(() => {
    return parseAddressDetail(draft.addressDetail, streetList).note;
  });

  const prevVillageIdRef = useRef(draft.villageId);
  useEffect(() => {
    if (prevVillageIdRef.current !== draft.villageId) {
      prevVillageIdRef.current = draft.villageId;
      setSelectedStreet("");
      setNote("");
    }
  }, [draft.villageId]);

  const handleStreetChange = (chosenName: string) => {
    if (!chosenName) return;
    setSelectedStreet(chosenName);

    if (chosenName === "LAINNYA") {
      onChange({ addressDetail: note });
      return;
    }

    const streetObj = streetList.find((s) => s.name === chosenName);
    if (!streetObj) return;

    let baseLat = -6.9175;
    let baseLng = 107.6191;

    if (selectedVillage && "point" in selectedVillage && selectedVillage.point) {
      const pt = selectedVillage.point as { lat: number; lng: number };
      baseLat = pt.lat;
      baseLng = pt.lng;
    } else if (selectedDistrict && "point" in selectedDistrict && selectedDistrict.point) {
      const pt = selectedDistrict.point as { lat: number; lng: number };
      baseLat = pt.lat;
      baseLng = pt.lng;
    } else if (draft.point) {
      baseLat = draft.point.lat;
      baseLng = draft.point.lng;
    }

    const targetLat = Number((baseLat + streetObj.deltaLat).toFixed(5));
    const targetLng = Number((baseLng + streetObj.deltaLng).toFixed(5));
    const fullAddress = note ? `${streetObj.name}, ${note}` : streetObj.name;

    onChange({
      point: { lat: targetLat, lng: targetLng },
      addressDetail: fullAddress,
    });
  };

  const handleNoteChange = (e: ChangeEvent<HTMLInputElement>) => {
    const nextNote = e.target.value;
    setNote(nextNote);
    const fullAddress =
      selectedStreet && selectedStreet !== "LAINNYA"
        ? nextNote
          ? `${selectedStreet}, ${nextNote}`
          : selectedStreet
        : nextNote;
    onChange({ addressDetail: fullAddress });
  };

  return (
    <div className="flex flex-col gap-6">
      <div className="grid gap-6 sm:grid-cols-2">
        <AreaSelect
          id="district"
          label="Kecamatan"
          placeholder="Pilih kecamatan"
          value={draft.districtId}
          items={districts}
          error={errors.districtId}
          onValueChange={(districtId) => {
            setSelectedStreet("");
            setNote("");
            onChange({ districtId, villageId: "", addressDetail: "" });
          }}
        />
        <AreaSelect
          id="village"
          label="Kelurahan atau desa"
          placeholder="Pilih kelurahan atau desa"
          value={draft.villageId}
          items={villages}
          error={errors.villageId}
          disabled={!draft.districtId}
          onValueChange={(villageId) => {
            setSelectedStreet("");
            setNote("");
            onChange({ villageId, addressDetail: "" });
          }}
        />
      </div>

      <div className="grid gap-6 sm:grid-cols-2">
        <AreaSelect
          id="street"
          label="Nama jalan"
          placeholder={draft.villageId ? "Pilih nama jalan" : "Pilih kelurahan terlebih dahulu"}
          value={selectedStreet}
          items={streetSelectItems}
          disabled={!draft.villageId}
          onValueChange={handleStreetChange}
        />
        <div className="flex flex-col gap-2">
          <label htmlFor="address-detail" className="font-semibold">
            Nomor atau patokan (opsional)
          </label>
          <Input
            id="address-detail"
            disabled={!draft.villageId}
            placeholder="Contoh: No. 12, depan ruko, dekat pertigaan"
            value={note}
            onChange={handleNoteChange}
            className={cn(FIELD_HEIGHT, FIELD_CLASS)}
          />
        </div>
      </div>

      <div className="flex flex-col gap-3">
        <div className="flex flex-col gap-1">
          <p className="font-semibold">Tandai titik kejadian</p>
          <p className="text-sm text-fg-muted">
            Ketuk peta untuk menyesuaikan pin jika diperlukan. Di halaman publik, lokasi hanya ditampilkan sampai tingkat kelurahan.
          </p>
        </div>
        <LocationPicker
          bounds={bounds}
          point={draft.point}
          districts={districts}
          selectedDistrictId={draft.districtId}
          selectedVillageId={draft.villageId}
          onPick={(point) => onChange({ point })}
        />
        {draft.point && !errors.point && (
          <p className="inline-flex items-center gap-2 text-sm font-medium text-fg">
            <CircleCheck aria-hidden className="size-4 text-primary shrink-0" />
            <span>
              Titik lokasi sudah ditandai
              {[draft.addressDetail, selectedVillage?.name].filter(Boolean).length > 0
                ? ` (${[draft.addressDetail, selectedVillage?.name].filter(Boolean).join(", ")})`
                : ""}
            </span>
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
