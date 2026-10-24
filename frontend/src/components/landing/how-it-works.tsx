import { Reveal } from "@/components/bits/reveal";
import { RingDecor } from "@/components/bits/ring-decor";
import { Container } from "@/components/layout/container";
import { cn } from "@/lib/utils";

interface Step {
  title: string;
  status: string;
  text: string;
  className: string;
  tone: string;
}

const STEPS: readonly Step[] = [
  {
    title: "Lapor",
    status: "Diajukan",
    text: "Ceritakan masalah yang Anda lihat, tandai lokasinya, dan unggah foto. Anda bisa memilih laporan Publik atau Rahasia.",
    className: "lg:col-span-2",
    tone: "bg-secondary text-secondary-fg",
  },
  {
    title: "Dicek otomatis",
    status: "Diteruskan",
    text: "AI menentukan urgensi dan mengarahkan laporan ke dinas yang tepat. Laporan serupa digabung.",
    className: "",
    tone: "bg-surface-muted",
  },
  {
    title: "Ditangani dinas",
    status: "Diproses",
    text: "Dinas menanggapi, memproses, dan mengunggah bukti penyelesaian. Setiap perubahan status tercatat.",
    className: "",
    tone: "border bg-surface",
  },
  {
    title: "Dipantau publik",
    status: "Selesai",
    text: "Semua orang bisa melihat perkembangan isu dan menilai apakah penyelesaiannya benar-benar terasa.",
    className: "lg:col-span-2",
    tone: "bg-primary text-primary-fg",
  },
];

function StepCard({ step, index }: { step: Step; index: number }) {
  const dark = step.tone.includes("text-");
  return (
    <article
      className={cn(
        "relative isolate flex h-full min-h-72 flex-col justify-between gap-10 overflow-hidden rounded-lg p-8",
        step.tone,
      )}
    >
      {index === 0 && <RingDecor />}
      <div className="flex items-start justify-between gap-4">
        <p className={cn("text-7xl leading-none font-bold tracking-tight tabular-nums", dark ? "opacity-30" : "text-border-strong")}>
          {String(index + 1).padStart(2, "0")}
        </p>
        <span
          className={cn(
            "rounded-sm border px-2 py-0.5 text-sm font-semibold",
            dark ? "border-current/40" : "border-border-strong text-fg-muted",
          )}
        >
          {step.status}
        </span>
      </div>
      <div className="flex max-w-xl flex-col gap-3">
        <h3 className="text-3xl font-bold tracking-tight">{step.title}</h3>
        <p className={dark ? "opacity-85" : "text-fg-muted"}>{step.text}</p>
      </div>
    </article>
  );
}

function HowItWorks() {
  return (
    <section id="cara-kerja" className="scroll-mt-16 py-10 lg:py-14">
      <Container className="flex flex-col gap-12">
        <Reveal variant="clip" className="flex flex-col gap-2">
          <p className="text-sm font-semibold tracking-wide text-primary-hover uppercase">Cara kerja</p>
          <h2 className="max-w-2xl text-3xl font-bold tracking-tight lg:text-4xl">
            Dari laporan sampai selesai, semuanya terlihat
          </h2>
        </Reveal>
        <ol className="grid gap-4 lg:grid-cols-3">
          {STEPS.map((step, index) => (
            <li key={step.title} className={step.className}>
              <Reveal variant="blur" delay={index * 120} className="h-full">
                <StepCard step={step} index={index} />
              </Reveal>
            </li>
          ))}
        </ol>
      </Container>
    </section>
  );
}

export { HowItWorks };
