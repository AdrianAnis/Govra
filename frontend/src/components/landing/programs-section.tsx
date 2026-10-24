import { Reveal } from "@/components/bits/reveal";
import { LandingSection } from "@/components/landing/landing-section";
import { ProgramCard } from "@/components/program-card";
import { TextLink } from "@/components/text-link";
import type { Schema } from "@/lib/schema";

const STAGGER_MS = 150;

function ProgramsSection({ programs }: { programs: readonly Schema<"ProgramSummary">[] }) {
  return (
    <LandingSection
      eyebrow="Program kerja"
      title="Proker yang sedang dipantau"
      action={<TextLink href="/proker">Lihat semua proker</TextLink>}
    >
      <ul className="grid gap-4 md:grid-cols-3">
        {programs.map((program, index) => (
          <li key={program.code}>
            <Reveal variant="blur" delay={index * STAGGER_MS} className="h-full">
              <ProgramCard program={program} />
            </Reveal>
          </li>
        ))}
      </ul>
    </LandingSection>
  );
}

export { ProgramsSection };
