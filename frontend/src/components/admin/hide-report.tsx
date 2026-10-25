"use client";

import { useState } from "react";
import { FormDialog } from "@/components/form-dialog";
import { SelectField } from "@/components/select-field";
import { Textarea } from "@/components/ui/textarea";
import { adminCall } from "@/lib/admin-client";
import { MODERATION_OPTIONS, type ModerationReason } from "@/lib/admin";
import { FIELD_CLASS } from "@/lib/field-style";
import { cn } from "@/lib/utils";

interface HideReportProps {
  id: string;
  code: string;
}

function HideReport({ id, code }: HideReportProps) {
  const [reason, setReason] = useState<ModerationReason | null>(null);
  const [note, setNote] = useState("");

  return (
    <FormDialog
      triggerLabel="Sembunyikan"
      title={`Sembunyikan laporan ${code}`}
      description="Laporan yang disembunyikan tidak lagi tampil di publik. Tindakan ini tercatat di audit."
      submitLabel="Sembunyikan"
      onSubmit={async () => {
        if (!reason) {
          throw new Error("Pilih alasan terlebih dahulu.");
        }
        await adminCall("POST", `/moderation/reports/${id}/hide`, { reason, ...(note.trim() ? { note } : {}) });
      }}
      onReset={() => {
        setReason(null);
        setNote("");
      }}
    >
      <SelectField
        id={`hide-${id}`}
        label="Alasan"
        value={reason}
        options={MODERATION_OPTIONS}
        placeholder="Pilih alasan"
        onChange={setReason}
      />
      <div className="flex flex-col gap-2">
        <label htmlFor={`note-${id}`} className="text-sm font-semibold">
          Catatan <span className="font-normal text-fg-muted">(opsional)</span>
        </label>
        <Textarea
          id={`note-${id}`}
          value={note}
          maxLength={500}
          onChange={(event) => setNote(event.target.value)}
          className={cn(FIELD_CLASS, "min-h-24 py-3")}
        />
      </div>
    </FormDialog>
  );
}

export { HideReport };
