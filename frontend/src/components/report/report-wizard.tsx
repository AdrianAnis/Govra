"use client";

import { ArrowLeft, ArrowRight } from "lucide-react";
import { useEffect, useRef, useState, type FormEvent } from "react";
import { DescriptionStep } from "@/components/report/description-step";
import { DuplicateStep } from "@/components/report/duplicate-step";
import { LocationStep } from "@/components/report/location-step";
import { ReportSuccess } from "@/components/report/report-success";
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
import { cn } from "@/lib/utils";

interface Step {
  label: string;
  title: string;
  hint: string;
}

const FIRST_STEP: Step = {
  label: "Cerita",
  title: "Ceritakan masalahnya",
  hint: "Tulis apa yang terjadi dengan jelas, dan tambahkan foto bila ada. Anda tidak perlu tahu dinas mana yang menangani, sistem yang akan mengarahkannya.",
};

const STEPS: readonly Step[] = [
  FIRST_STEP,
  {
    label: "Lokasi",
    title: "Tandai lokasinya",
    hint: "Pilih kecamatan dan kelurahan, lalu taruh pin di peta tepat di titik kejadian.",
  },
  {
    label: "Serupa",
    title: "Cek isu serupa",
    hint: "Mungkin warga lain sudah melaporkan hal yang sama di dekat lokasi Anda. Anda bisa mendukungnya.",
  },
  {
    label: "Kirim",
    title: "Atur privasi dan kirim",
    hint: "Pilih apakah laporan tampil di halaman publik atau hanya dilihat dinas, lalu periksa dan kirim.",
  },
];

const LAST_STEP = STEPS.length - 1;
const SUGGESTION_STEP = 2;

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
      void send();
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
    return <ReportSuccess code={outcome.code} reporters={outcome.reporters} />;
  }

  return (
    <div className="flex flex-col gap-10 lg:gap-14">
      <header className="flex flex-col gap-5">
        <div aria-hidden className="flex gap-1">
          {STEPS.map((item, index) => (
            <span
              key={item.label}
              className={cn("h-0.5 flex-1 rounded-full", index <= step ? "bg-primary" : "bg-border-strong")}
            />
          ))}
        </div>
        <ol className="flex items-center justify-center gap-6 text-sm sm:gap-12">
          {STEPS.map((item, index) => (
            <li
              key={item.label}
              aria-current={index === step ? "step" : undefined}
              className={cn(
                "flex items-center gap-2",
                index === step ? "font-semibold text-primary" : index < step ? "text-fg" : "text-fg-subtle",
              )}
            >
              <span
                aria-hidden
                className={cn("size-2 rounded-full", index <= step ? "bg-primary" : "bg-border-strong")}
              />
              {item.label}
            </li>
          ))}
        </ol>
      </header>
      <form ref={formRef} noValidate onSubmit={advance} className="mx-auto flex w-full max-w-xl flex-col gap-8">
        <div className="flex flex-col gap-2">
          <h1 className="text-3xl leading-tight font-bold tracking-tight text-balance lg:text-4xl">{current.title}</h1>
          <p className="text-fg-muted">{current.hint}</p>
        </div>
        <div key={step} className="animate-blur-in">
          {step === 0 && <DescriptionStep draft={draft} errors={errors} onChange={change} />}
          {step === 1 && (
            <LocationStep draft={draft} errors={errors} districts={districts} bounds={bounds} onChange={change} />
          )}
          {step === SUGGESTION_STEP && (
            <DuplicateStep
              draft={draft}
              onSupported={(code, reporters) => setOutcome({ code, reporters })}
            />
          )}
          {step === LAST_STEP && <SubmitStep draft={draft} districts={districts} error={sendError} onChange={change} />}
        </div>
        <div className="flex items-center justify-between gap-4 border-t pt-6">
          <Button type="button" variant="ghost" onClick={back} disabled={step === 0 || pending}>
            <ArrowLeft aria-hidden />
            Kembali
          </Button>
          <Button type="submit" disabled={pending}>
            {step === LAST_STEP ? (pending ? "Mengirim..." : "Kirim laporan") : "Lanjut"}
            {step !== LAST_STEP && <ArrowRight aria-hidden />}
          </Button>
        </div>
      </form>
    </div>
  );
}

export { ReportWizard };
