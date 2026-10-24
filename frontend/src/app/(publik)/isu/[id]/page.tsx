import { ArrowLeft, ArrowRight } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { AsideCard } from "@/components/aside-card";
import { IssueHero } from "@/components/issue-hero";
import { IssueTimeline } from "@/components/issue-timeline";
import { Container } from "@/components/layout/container";
import { currentTime } from "@/lib/clock";
import { getIssue } from "@/lib/data/issues";
import { formatNumber } from "@/lib/format";

export async function generateMetadata({ params }: PageProps<"/isu/[id]">): Promise<Metadata> {
  const issue = await getIssue((await params).id);
  return { title: issue ? issue.title : "Isu tidak ditemukan" };
}

export default async function IssueDetailPage({ params }: PageProps<"/isu/[id]">) {
  const issue = await getIssue((await params).id);
  if (!issue) {
    notFound();
  }

  return (
    <Container className="flex flex-col gap-8 py-6 lg:py-8">
      <Link
        href="/isu"
        className="inline-flex min-h-11 w-fit items-center gap-2 text-sm font-medium text-fg-muted hover:text-primary"
      >
        <ArrowLeft aria-hidden className="size-4" />
        Semua isu
      </Link>
      <IssueHero issue={issue} />
      <div className="grid gap-10 py-4 lg:grid-cols-3 lg:gap-12 lg:py-8">
        <section className="flex flex-col gap-8 lg:col-span-2">
          <h2 className="text-2xl font-bold tracking-tight">Perkembangan penanganan</h2>
          <IssueTimeline events={issue.timeline} now={currentTime()} />
        </section>
        <aside className="flex flex-col gap-4">
          <AsideCard title="Pelapor">
            <p className="flex flex-col gap-1">
              <span className="text-5xl leading-none font-bold tracking-tight tabular-nums">
                {formatNumber(issue.reporter_count)}
              </span>
              <span className="text-sm text-fg-muted">warga melaporkan masalah yang sama</span>
            </p>
          </AsideCard>
          <Link
            href={`/opd/${issue.opd.slug}`}
            className="group flex items-center justify-between gap-4 rounded-lg bg-surface-muted p-6 transition-colors duration-200 ease-ui hover:bg-primary-soft"
          >
            <span className="flex flex-col">
              <span className="text-sm font-semibold text-fg-muted">Ditangani oleh</span>
              <span className="text-lg font-semibold">{issue.opd.name}</span>
            </span>
            <ArrowRight
              aria-hidden
              className="size-5 shrink-0 text-primary transition-transform duration-200 ease-ui group-hover:translate-x-1"
            />
          </Link>
          <AsideCard title="Kategori">
            <p className="text-lg font-semibold">{issue.category.name}</p>
          </AsideCard>
        </aside>
      </div>
    </Container>
  );
}
