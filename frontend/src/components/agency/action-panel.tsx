"use client";

import { useRouter } from "next/navigation";
import { useRef, useState } from "react";
import { AsideCard } from "@/components/aside-card";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { SelectField } from "@/components/select-field";
import { Textarea } from "@/components/ui/textarea";
import {
  MAX_EVIDENCE,
  MAX_RESPONSE_LENGTH,
  REJECTION_LABEL,
  REJECTION_OPTIONS,
  TRANSFER_LABEL,
  TRANSFER_OPTIONS,
  TRANSITION_LABEL,
  TRANSITION_TITLE,
  transitionSchema,
  type AgencyTransition,
  type RejectionReason,
  type TransferReason,
} from "@/lib/agency";
import { submitTransition, uploadEvidence } from "@/lib/agency-client";
import { FIELD_CLASS } from "@/lib/field-style";
import { MAX_FILE_MB } from "@/lib/report-draft";
import { cn } from "@/lib/utils";

interface ActionPanelProps {
  issueId: string;
  transitions: readonly AgencyTransition[];
}

interface Evidence {
  id: string;
  url: string;
}

type ErrorField = "response" | "rejection_reason" | "transfer_reason" | "evidence_ids";
type Errors = { [K in ErrorField]?: string | undefined };

function isErrorField(value: unknown): value is ErrorField {
  return value === "response" || value === "rejection_reason" || value === "transfer_reason" || value === "evidence_ids";
}

function ActionPanel({ issueId, transitions }: ActionPanelProps) {
  const router = useRouter();
  const fileRef = useRef<HTMLInputElement>(null);
  const [active, setActive] = useState<AgencyTransition | null>(null);
  const [confirming, setConfirming] = useState(false);
  const [response, setResponse] = useState("");
  const [rejection, setRejection] = useState<RejectionReason | null>(null);
  const [transfer, setTransfer] = useState<TransferReason | null>(null);
  const [evidence, setEvidence] = useState<Evidence[]>([]);
  const [errors, setErrors] = useState<Errors>({});
  const [failure, setFailure] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const open = (to: AgencyTransition) => {
    setActive(to);
    setConfirming(false);
    setResponse("");
    setRejection(null);
    setTransfer(null);
    setEvidence([]);
    setErrors({});
    setFailure(null);
  };

  if (transitions.length === 0) {
    return (
      <AsideCard title="Tindakan">
        <p className="text-sm text-fg-muted">Tidak ada tindakan yang tersedia untuk status ini.</p>
      </AsideCard>
    );
  }

  const payload = (to: AgencyTransition) => ({
    to,
    response,
    ...(rejection ? { rejection_reason: rejection } : {}),
    ...(transfer ? { transfer_reason: transfer } : {}),
    ...(to === "SELESAI" ? { evidence_ids: evidence.map((item) => item.id) } : {}),
  });

  const addFiles = async (list: FileList | null) => {
    if (!list || list.length === 0) {
      return;
    }
    setBusy(true);
    setErrors((current) => ({ ...current, evidence_ids: undefined }));
    try {
      const added: Evidence[] = [];
      for (const file of Array.from(list).slice(0, MAX_EVIDENCE - evidence.length)) {
        added.push(await uploadEvidence(issueId, file));
      }
      setEvidence((current) => [...current, ...added]);
    } catch (problem) {
      setErrors((current) => ({
        ...current,
        evidence_ids: problem instanceof Error ? problem.message : "Gagal mengunggah foto.",
      }));
    } finally {
      setBusy(false);
      if (fileRef.current) {
        fileRef.current.value = "";
      }
    }
  };

  const review = () => {
    if (!active) {
      return;
    }
    const parsed = transitionSchema.safeParse(payload(active));
    if (parsed.success) {
      setErrors({});
      setConfirming(true);
      return;
    }
    const next: Errors = {};
    for (const issue of parsed.error.issues) {
      const key = issue.path[0];
      if (isErrorField(key)) {
        next[key] = issue.message;
      }
    }
    setErrors(next);
  };

  const send = async () => {
    if (!active) {
      return;
    }
    const parsed = transitionSchema.safeParse(payload(active));
    if (!parsed.success) {
      setConfirming(false);
      return;
    }
    setBusy(true);
    setFailure(null);
    try {
      await submitTransition(issueId, parsed.data);
      setActive(null);
      router.refresh();
    } catch (problem) {
      setFailure(problem instanceof Error ? problem.message : "Terjadi kendala. Coba lagi.");
    } finally {
      setBusy(false);
    }
  };

  const reasonLabel = rejection ? REJECTION_LABEL[rejection] : transfer ? TRANSFER_LABEL[transfer] : null;

  return (
    <AsideCard title="Tindakan">
      <div className="flex flex-col gap-2">
        {transitions.map((item, index) => (
          <Button key={item} type="button" variant={index === 0 ? "primary" : "outline"} onClick={() => open(item)}>
            {TRANSITION_LABEL[item]}
          </Button>
        ))}
      </div>

      <Dialog open={active !== null} onOpenChange={(next) => !next && !busy && setActive(null)}>
        <DialogContent className="max-h-[90dvh] max-w-xl overflow-y-auto">
          {active && !confirming && (
            <>
              <DialogHeader>
                <DialogTitle>{TRANSITION_TITLE[active]}</DialogTitle>
                <DialogDescription>
                  Tanggapan ini tampil di perkembangan penanganan yang dilihat publik.
                </DialogDescription>
              </DialogHeader>
              <div className="flex flex-col gap-5">
                {active === "DITOLAK" && (
                  <SelectField
                    id="rejection"
                    label="Alasan penolakan"
                    value={rejection}
                    options={REJECTION_OPTIONS}
                    error={errors.rejection_reason}
                    placeholder="Pilih alasan"
                    onChange={setRejection}
                  />
                )}
                {active === "DIALIHKAN" && (
                  <SelectField
                    id="transfer"
                    label="Alasan pengalihan"
                    value={transfer}
                    options={TRANSFER_OPTIONS}
                    error={errors.transfer_reason}
                    placeholder="Pilih alasan"
                    onChange={setTransfer}
                  />
                )}
                <div className="flex flex-col gap-2">
                  <label htmlFor="response" className="text-sm font-semibold">
                    {active === "DITOLAK" ? "Penjelasan" : "Tanggapan"}
                  </label>
                  <Textarea
                    id="response"
                    value={response}
                    maxLength={MAX_RESPONSE_LENGTH}
                    aria-invalid={Boolean(errors.response)}
                    onChange={(event) => setResponse(event.target.value)}
                    className={cn(FIELD_CLASS, "min-h-28 py-3")}
                  />
                  <p className="text-xs text-fg-muted">
                    {errors.response ?? `${response.length} dari ${MAX_RESPONSE_LENGTH} karakter`}
                  </p>
                </div>
                {active === "SELESAI" && (
                  <div className="flex flex-col gap-2">
                    <p className="text-sm font-semibold">
                      Foto bukti{" "}
                      <span className="font-normal text-fg-muted">(minimal 1, maksimal {MAX_EVIDENCE})</span>
                    </p>
                    <label className="flex min-h-11 w-fit cursor-pointer items-center rounded-md border border-border-strong px-4 text-sm font-medium hover:bg-primary-soft has-disabled:opacity-60 has-focus-visible:outline-2 has-focus-visible:outline-offset-2 has-focus-visible:outline-primary">
                      Pilih foto
                      <input
                        ref={fileRef}
                        type="file"
                        multiple
                        accept="image/jpeg,image/png,image/webp"
                        disabled={busy || evidence.length >= MAX_EVIDENCE}
                        onChange={(event) => void addFiles(event.target.files)}
                        className="sr-only"
                      />
                    </label>
                    <p className="text-xs text-fg-muted">JPEG, PNG, atau WebP, maksimal {MAX_FILE_MB} MB per foto.</p>
                    {errors.evidence_ids && (
                      <p role="alert" className="text-sm font-medium">
                        {errors.evidence_ids}
                      </p>
                    )}
                    {evidence.length > 0 && (
                      <ul className="flex flex-wrap gap-3">
                        {evidence.map((item, index) => (
                          <li key={item.id} className="flex items-center gap-2 text-sm">
                            <a
                              href={item.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="font-semibold text-primary underline-offset-4 hover:underline"
                            >
                              Bukti {index + 1}
                            </a>
                            <button
                              type="button"
                              onClick={() => setEvidence((current) => current.filter((entry) => entry.id !== item.id))}
                              className="min-h-11 px-1 text-fg-muted hover:text-fg"
                            >
                              Lepas
                            </button>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                )}
              </div>
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setActive(null)}>
                  Tutup
                </Button>
                <Button type="button" disabled={busy} onClick={review}>
                  Tinjau
                </Button>
              </DialogFooter>
            </>
          )}
          {active && confirming && (
            <>
              <DialogHeader>
                <DialogTitle>Konfirmasi perubahan</DialogTitle>
                <DialogDescription>
                  Periksa ringkasan ini sebelum dikirim. Perubahan langsung terlihat oleh publik.
                </DialogDescription>
              </DialogHeader>
              <dl className="grid gap-3 rounded-lg bg-surface-muted p-4 text-sm">
                <div className="flex flex-col gap-0.5">
                  <dt className="text-fg-muted">Tindakan</dt>
                  <dd className="font-semibold">{TRANSITION_TITLE[active]}</dd>
                </div>
                {reasonLabel && (
                  <div className="flex flex-col gap-0.5">
                    <dt className="text-fg-muted">Alasan</dt>
                    <dd className="font-semibold">{reasonLabel}</dd>
                  </div>
                )}
                <div className="flex flex-col gap-0.5">
                  <dt className="text-fg-muted">Tanggapan</dt>
                  <dd className="whitespace-pre-line">{response.trim()}</dd>
                </div>
                {active === "SELESAI" && (
                  <div className="flex flex-col gap-0.5">
                    <dt className="text-fg-muted">Foto bukti</dt>
                    <dd>{evidence.length} foto</dd>
                  </div>
                )}
              </dl>
              {failure && (
                <p role="alert" className="text-sm font-medium">
                  {failure}
                </p>
              )}
              <DialogFooter>
                <Button type="button" variant="outline" disabled={busy} onClick={() => setConfirming(false)}>
                  Ubah
                </Button>
                <Button type="button" disabled={busy} onClick={() => void send()}>
                  {busy ? "Mengirim" : "Kirim"}
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>
    </AsideCard>
  );
}

export { ActionPanel };
