import { ArrowLeft } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Container } from "@/components/layout/container";
import {
  MilestoneSection,
  ProgressSection,
  SummaryAside,
  UpdateSection,
} from "@/components/program-detail";
import { ProgramStatusBadge } from "@/components/status-badge";
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
    <>
      <Container className="flex flex-col gap-6 py-10">
        <Link
          href="/proker"
          className="inline-flex min-h-11 w-fit items-center gap-2 text-sm font-medium text-fg-muted hover:text-primary"
        >
          <ArrowLeft aria-hidden className="size-4" />
          Semua proker
        </Link>
        <header className="flex flex-col gap-3">
          <div className="flex flex-wrap items-center gap-3">
            <span className="text-sm font-medium text-fg-subtle">{program.code}</span>
            <ProgramStatusBadge status={program.status} />
          </div>
          <h1 className="text-4xl font-bold tracking-tight">{program.name}</h1>
          <p className="text-fg-muted">
            <Link href={`/opd/${program.opd.slug}`} className="font-medium text-primary underline-offset-4 hover:underline">
              {program.opd.name}
            </Link>{" "}
            · {program.district.name} · {program.goal.name}
          </p>
        </header>
        <div className="grid gap-6 lg:grid-cols-3">
          <div className="flex flex-col gap-6 lg:col-span-2">
            <ProgressSection program={program} />
            <MilestoneSection milestones={program.milestones} />
            <UpdateSection updates={program.updates} />
          </div>
          <SummaryAside program={program} />
        </div>
      </Container>
    </>
  );
}
