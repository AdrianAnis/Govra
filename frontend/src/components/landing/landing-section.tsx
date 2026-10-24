import type { ReactNode } from "react";
import { Reveal } from "@/components/bits/reveal";
import { Container } from "@/components/layout/container";
import { cn } from "@/lib/utils";

interface LandingSectionProps {
  eyebrow: string;
  title: string;
  action?: ReactNode;
  tone?: "plain" | "muted";
  id?: string;
  children: ReactNode;
}

function LandingSection({
  eyebrow,
  title,
  action,
  tone = "plain",
  id,
  children,
}: LandingSectionProps) {
  return (
    <section id={id} className={cn("scroll-mt-16", tone === "muted" ? "bg-surface-muted py-20 lg:py-28" : "py-10 lg:py-14")}>
      <Container className="flex flex-col gap-12">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <Reveal variant="clip" className="flex flex-col gap-2">
            <p className="text-sm font-semibold tracking-wide text-primary-hover uppercase">{eyebrow}</p>
            <h2 className="max-w-2xl text-3xl font-bold tracking-tight lg:text-4xl">{title}</h2>
          </Reveal>
          {action && <Reveal delay={400}>{action}</Reveal>}
        </div>
        {children}
      </Container>
    </section>
  );
}

export { LandingSection };
