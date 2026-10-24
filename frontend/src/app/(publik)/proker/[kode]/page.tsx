import { ArrowLeft } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Container } from "@/components/layout/container";
import {
  MilestoneSection,
  ProgramHero,
  SummaryAside,
  UpdateSection,
} from "@/components/program-detail";
import { getProgram } from "@/lib/data/programs";

export async function generateMetadata({ params }: PageProps<"/proker/[kode]">): Promise<Metadata> {
  const program = await getProgram((await params).kode);
  return { title: program ? program.name : "Proker tidak ditemukan" };
}

export default async function ProgramDetailPage({ params }: PageProps<"/proker/[kode]">) {
  const program = await getProgram((await params).kode);
  if (!program) {
    notFound();
  }

  return (
    <Container className="flex flex-col gap-8 py-6 lg:py-8">
      <Link
        href="/proker"
        className="inline-flex min-h-11 w-fit items-center gap-2 text-sm font-medium text-fg-muted hover:text-primary"
      >
        <ArrowLeft aria-hidden className="size-4" />
        Semua proker
      </Link>
      <ProgramHero program={program} />
      <div className="grid gap-10 py-4 lg:grid-cols-3 lg:gap-12 lg:py-8">
        <div className="flex flex-col gap-14 lg:col-span-2">
          <MilestoneSection milestones={program.milestones} />
          <UpdateSection updates={program.updates} />
        </div>
        <SummaryAside program={program} />
      </div>
    </Container>
  );
}
