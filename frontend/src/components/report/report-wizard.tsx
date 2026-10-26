"use client";

import { ArrowLeft, ArrowRight } from "lucide-react";
import { useEffect, useRef, useState, type FormEvent } from "react";
import { FocusPage } from "@/components/layout/focus-page";
import { DescriptionStep } from "@/components/report/description-step";
import { LocationStep } from "@/components/report/location-step";
import { PreviewDialog } from "@/components/report/preview-dialog";
import { ReportSuccess } from "@/components/report/report-success";
import { Stepper } from "@/components/report/stepper";
import { SubmitStep } from "@/components/report/submit-step";
import { Button } from "@/components/ui/button";
import { submitReport } from "@/lib/report-client";
import {
  EMPTY_DRAFT,
  validateDescription,
  validateLocation,
  type FieldErrors,
  type ReportDraft,
} from "@/lib/report-draft";
import type { Schema } from "@/lib/schema";

interface Step {
  label: string;
  title: string;
  hint: string;
}

const FIRST_STEP: Step = {
  label: "Cerita",
  title: "Ceritakan masalahnya",
  hint: "Tulis apa yang terjadi dengan jelas, dan tambahkan foto bila ada.",
};

const STEPS: readonly Step[] = [
  FIRST_STEP,
  {
    label: "Lokasi",
    title: "Tandai lokasinya",
    hint: "Pilih kecamatan, kelurahan, dan nama jalan, lalu sesuaikan titik kejadian.",
  },
  {
    label: "Kirim",
    title: "Atur privasi dan kirim",
    hint: "Pilih siapa yang boleh melihat laporan, lalu periksa dan kirim.",
  },
];

const LAST_STEP = STEPS.length - 1;

interface Outcome {
  code: string;
  reporters: number | null;
}

function stepAt(index: number): Step {
  return STEPS[index] ?? FIRST_STEP;
}

interface ReportWizardProps {
  districts: readonly Schema<"District">[];
  bounds: readonly number[];
}

function ReportWizard({ districts, bounds }: ReportWizardProps) {
  const [step, setStep] = useState(0);
  const [draft, setDraft] = useState<ReportDraft>(EMPTY_DRAFT);
  const [errors, setErrors] = useState<FieldErrors>({});
  const [pending, setPending] = useState(false);
  const [sendError, setSendError] = useState<string | null>(null);
  const [outcome, setOutcome] = useState<Outcome | null>(null);
  const [previewOpen, setPreviewOpen] = useState(false);
  const formRef = useRef<HTMLFormElement>(null);
  const filesRef = useRef(draft.files);
  const current = stepAt(step);

  useEffect(() => {
    filesRef.current = draft.files;
  });

  useEffect(
    () => () => {
      for (const item of filesRef.current) {
        URL.revokeObjectURL(item.url);
      }
    },
    [],
  );

  useEffect(() => {
    formRef.current?.querySelector<HTMLElement>("[aria-invalid='true']")?.focus();
  }, [errors]);

  const change = (patch: Partial<ReportDraft>) => {
    setDraft((previous) => ({ ...previous, ...patch }));
    setErrors((previous) => Object.fromEntries(Object.entries(previous).filter(([key]) => !(key in patch))));
  };

  const send = async () => {
    setPending(true);
    setSendError(null);
    try {
      const created = await submitReport(draft);
      setOutcome({ code: created.code, reporters: null });
    } catch (failure) {
      setSendError(failure instanceof Error ? failure.message : "Terjadi kendala. Coba lagi.");
    } finally {
      setPending(false);
    }
  };

  const advance = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (step === LAST_STEP) {
      setSendError(null);
      setPreviewOpen(true);
      return;
    }
    const found = step === 0 ? validateDescription(draft) : step === 1 ? validateLocation(draft, bounds) : {};
    setErrors(found);
    if (Object.keys(found).length === 0) {
      setStep((previous) => Math.min(previous + 1, LAST_STEP));
    }
  };

  const back = () => {
    setErrors({});
    setSendError(null);
    setStep((previous) => Math.max(previous - 1, 0));
  };

  if (outcome) {
    return (
      <FocusPage>
        <ReportSuccess code={outcome.code} reporters={outcome.reporters} />
      </FocusPage>
    );
  }

  const progress = <Stepper labels={STEPS.map((item) => item.label)} current={step} />;

  return (
    <FocusPage progress={progress}>
      <form ref={formRef} noValidate onSubmit={advance} className="mx-auto flex w-full max-w-3xl flex-1 flex-col gap-8">
        <div className="flex flex-col gap-2">
          <h1 className="text-2xl leading-tight font-bold tracking-tight text-balance lg:text-3xl">{current.title}</h1>
          <p className="text-fg-muted">{current.hint}</p>
        </div>
        <div key={step} className="animate-blur-in">
          {step === 0 && <DescriptionStep draft={draft} errors={errors} onChange={change} />}
          {step === 1 && (
            <LocationStep draft={draft} errors={errors} districts={districts} bounds={bounds} onChange={change} />
          )}
          {step === LAST_STEP && <SubmitStep draft={draft} onChange={change} />}
        </div>
        <div className="sticky bottom-0 z-20 mt-auto flex items-center justify-between gap-2 border-t bg-surface py-4 sm:gap-4">
          <Button type="button" variant="ghost" className="px-3 sm:px-6" onClick={back} disabled={step === 0 || pending}>
            <ArrowLeft aria-hidden />
            Kembali
          </Button>
          <Button type="submit" size="lg">
            {step === LAST_STEP ? "Kirim laporan" : `Lanjut ke ${stepAt(step + 1).label}`}
            {step !== LAST_STEP && <ArrowRight aria-hidden />}
          </Button>
        </div>
      </form>
      <PreviewDialog
        open={previewOpen}
        onOpenChange={setPreviewOpen}
        draft={draft}
        districts={districts}
        pending={pending}
        error={sendError}
        onConfirm={send}
      />
    </FocusPage>
  );
}

export { ReportWizard };
