import { ArrowLeft, MapPin, Users } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { DetailSection } from "@/components/detail-section";
import { IssueTimeline } from "@/components/issue-timeline";
import { Container } from "@/components/layout/container";
import { IssueStatusBadge } from "@/components/status-badge";
import { TextLink } from "@/components/text-link";
import { UrgencyMarker } from "@/components/urgency-marker";
import { currentTime } from "@/lib/clock";
import { getIssue } from "@/lib/data/issues";
import { formatDateTime, formatNumber } from "@/lib/format";

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
    <Container className="flex flex-col gap-6 py-10">
      <Link
        href="/isu"
        className="inline-flex min-h-11 w-fit items-center gap-2 text-sm font-medium text-fg-muted hover:text-primary"
      >
        <ArrowLeft aria-hidden className="size-4" />
        Semua isu
      </Link>
      <header className="flex flex-col gap-3">
        <div className="flex flex-wrap items-center gap-2">
          <IssueStatusBadge status={issue.status} />
          <UrgencyMarker urgency={issue.urgency} />
        </div>
        <h1 className="text-4xl font-bold tracking-tight">{issue.title}</h1>
        <ul className="flex flex-wrap gap-x-6 gap-y-1 text-fg-muted">
          <li className="inline-flex items-center gap-2">
            <MapPin aria-hidden className="size-4" />
            {issue.location.village.name}, {issue.location.district.name}
          </li>
          <li className="inline-flex items-center gap-2">
            <Users aria-hidden className="size-4" />
            {formatNumber(issue.reporter_count)} pelapor
          </li>
          <li>Dilaporkan {formatDateTime(issue.created_at)}</li>
        </ul>
        <p className="text-fg-muted">
          Ditangani oleh{" "}
          <TextLink href={`/opd/${issue.opd.slug}`} className="min-h-0">
            {issue.opd.name}
          </TextLink>{" "}
          · Kategori {issue.category.name}
        </p>
      </header>
      <DetailSection title="Perkembangan penanganan">
        <IssueTimeline events={issue.timeline} now={currentTime()} />
      </DetailSection>
    </Container>
  );
}
