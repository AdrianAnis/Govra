"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { adminCall } from "@/lib/admin-client";
import { FIELD_CLASS } from "@/lib/field-style";
import { formatThreshold } from "@/lib/format";
import type { Schema } from "@/lib/schema";
import { cn } from "@/lib/utils";

function SettingRow({ setting }: { setting: Schema<"Setting"> }) {
  const router = useRouter();
  const [text, setText] = useState(String(setting.value));
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [failed, setFailed] = useState(false);
  const inputId = `setting-${setting.key}`;
  const next = Number(text);
  const changed = text.trim() !== "" && Number.isFinite(next) && next !== setting.value;

  const save = async () => {
    setBusy(true);
    setMessage(null);
    try {
      await adminCall("PUT", `/settings/${setting.key}`, { value: next });
      setFailed(false);
      setMessage("Tersimpan");
      router.refresh();
    } catch (failure) {
      setFailed(true);
      setMessage(failure instanceof Error ? failure.message : "Terjadi kendala. Coba lagi.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <form
      className="flex flex-col gap-3 py-5 sm:flex-row sm:items-center sm:justify-between sm:gap-8"
      onSubmit={(event) => {
        event.preventDefault();
        void save();
      }}
    >
      <div className="flex flex-col gap-0.5">
        <label htmlFor={inputId} className="font-semibold">
          {setting.label}
        </label>
        <p className="text-sm text-fg-muted">Saat ini {formatThreshold(setting.value, setting.unit)}</p>
      </div>
      <div className="flex shrink-0 items-center gap-3">
        <Input
          id={inputId}
          type="number"
          inputMode="decimal"
          step="any"
          min={0}
          value={text}
          aria-invalid={failed}
          onChange={(event) => {
            setText(event.target.value);
            setMessage(null);
          }}
          className={cn(FIELD_CLASS, "h-11 w-28 text-right tabular-nums")}
        />
        <Button type="submit" size="default" variant={changed ? "primary" : "outline"} disabled={busy || !changed}>
          Simpan
        </Button>
      </div>
      {message && (
        <p role={failed ? "alert" : "status"} className="text-sm font-medium sm:basis-full sm:text-right">
          {message}
        </p>
      )}
    </form>
  );
}

export { SettingRow };
