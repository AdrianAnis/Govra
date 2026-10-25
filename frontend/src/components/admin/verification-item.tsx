"use client";

import { useState } from "react";
import { FormDialog } from "@/components/form-dialog";
import { SelectField } from "@/components/select-field";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { adminCall } from "@/lib/admin-client";
import { REJECTION_OPTIONS, TRANSFER_LABEL, type RejectionReason } from "@/lib/agency";
import { FIELD_CLASS } from "@/lib/field-style";
import { formatNumber, formatRelativeTime } from "@/lib/format";
import type { Schema } from "@/lib/schema";
import { cn } from "@/lib/utils";

interface VerificationItemProps {
  item: Schema<"VerificationItem">;
  opds: readonly Schema<"OpdDetail">[];
  now: string;
}

function VerificationItem({ item, opds, now }: VerificationItemProps) {
  const suggestion = item.ai_suggestion;
  const [opdCode, setOpdCode] = useState<string | null>(suggestion?.opd.code ?? null);
  const [categoryCode, setCategoryCode] = useState<string | null>(suggestion?.category.code ?? null);
  const [reason, setReason] = useState<RejectionReason | null>(null);
  const [explanation, setExplanation] = useState("");

  const activeOpds = opds.filter((opd) => opd.active);
  const categories = activeOpds.find((opd) => opd.code === opdCode)?.categories.filter((category) => category.active) ?? [];

  const reset = () => {
    setOpdCode(suggestion?.opd.code ?? null);
    setCategoryCode(suggestion?.category.code ?? null);
    setReason(null);
    setExplanation("");
  };

  const route = async () => {
    if (!opdCode || !categoryCode) {
      throw new Error("Pilih OPD dan kategori terlebih dahulu.");
    }
    await adminCall("POST", `/issues/${item.issue_id}/route`, { opd_code: opdCode, category_code: categoryCode });
  };

  const reject = async () => {
    if (!reason) {
      throw new Error("Pilih alasan penolakan.");
    }
    await adminCall("POST", `/issues/${item.issue_id}/reject`, { reason, explanation });
  };

  return (
    <article className="flex flex-col gap-5 rounded-lg border bg-surface p-6 lg:flex-row lg:items-start lg:justify-between lg:gap-8">
      <div className="flex min-w-0 flex-col gap-3">
        <div className="flex flex-wrap items-center gap-3">
          <Badge weight={item.kind === "VERIFIKASI" ? "netral" : "perhatian"}>
            {item.kind === "VERIFIKASI" ? "Verifikasi" : "Pengalihan"}
          </Badge>
          <p className="text-sm text-fg-muted">
            {formatNumber(item.reporter_count)} pelapor · {formatRelativeTime(item.created_at, new Date(now))}
          </p>
        </div>
        <h2 className="text-xl leading-snug font-semibold">{item.title}</h2>
        {suggestion && (
          <p className="text-sm text-fg-muted">
            Saran AI: <span className="font-semibold text-fg">{suggestion.opd.name}</span>, {suggestion.category.name}{" "}
            (keyakinan {Math.round(suggestion.confidence * 100)}%)
          </p>
        )}
        {item.current_opd && (
          <p className="text-sm text-fg-muted">
            Dialihkan oleh <span className="font-semibold text-fg">{item.current_opd.name}</span>
            {item.transfer_reason ? `: ${TRANSFER_LABEL[item.transfer_reason]}.` : "."}
            {item.transfer_note ? ` ${item.transfer_note}` : ""}
          </p>
        )}
      </div>
      <div className="flex shrink-0 gap-2">
        <FormDialog
          triggerLabel="Teruskan"
          triggerVariant="primary"
          triggerSize="default"
          title="Teruskan ke OPD"
          description="Keputusan ini disimpan sebagai koreksi untuk evaluasi AI."
          submitLabel="Teruskan"
          onSubmit={route}
          onReset={reset}
        >
          <SelectField
            id={`opd-${item.issue_id}`}
            label="OPD tujuan"
            value={opdCode}
            options={activeOpds.map((opd) => ({ value: opd.code, label: opd.name }))}
            placeholder="Pilih OPD"
            onChange={(value) => {
              setOpdCode(value);
              setCategoryCode(null);
            }}
          />
          <SelectField
            id={`category-${item.issue_id}`}
            label="Kategori"
            value={categoryCode}
            options={categories.map((category) => ({ value: category.code, label: category.name }))}
            placeholder={opdCode ? "Pilih kategori" : "Pilih OPD dahulu"}
            disabled={!opdCode}
            onChange={setCategoryCode}
          />
        </FormDialog>
        <FormDialog
          triggerLabel="Tolak"
          triggerSize="default"
          title="Tolak isu"
          description="Penjelasan ini terlihat oleh pelapor."
          submitLabel="Tolak isu"
          onSubmit={reject}
          onReset={reset}
        >
          <SelectField
            id={`reason-${item.issue_id}`}
            label="Alasan penolakan"
            value={reason}
            options={REJECTION_OPTIONS}
            placeholder="Pilih alasan"
            onChange={setReason}
          />
          <div className="flex flex-col gap-2">
            <label htmlFor={`explanation-${item.issue_id}`} className="text-sm font-semibold">
              Penjelasan
            </label>
            <Textarea
              id={`explanation-${item.issue_id}`}
              value={explanation}
              maxLength={1000}
              onChange={(event) => setExplanation(event.target.value)}
              className={cn(FIELD_CLASS, "min-h-28 py-3")}
            />
          </div>
        </FormDialog>
      </div>
    </article>
  );
}

export { VerificationItem };
