"use client";

import { MapPin, Users } from "lucide-react";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { fetchSuggestions, supportIssue, type Suggestion } from "@/lib/report-client";
import type { ReportDraft } from "@/lib/report-draft";
import { ISSUE_STATUS, isIssueStatus } from "@/lib/status";
import { formatNumber } from "@/lib/format";

interface DuplicateStepProps {
  draft: ReportDraft;
  onSupported: (code: string, reporters: number) => void;
}

type Phase = "loading" | "ready" | "failed";

const METERS_PER_KM = 1000;

function formatDistance(meters: number): string {
  return meters < METERS_PER_KM
    ? `${formatNumber(meters)} m`
    : `${formatNumber(Math.round(meters / METERS_PER_KM))} km`;
}

function DuplicateStep({ draft, onSupported }: DuplicateStepProps) {
  const [phase, setPhase] = useState<Phase>("loading");
  const [items, setItems] = useState<Suggestion[]>([]);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    fetchSuggestions(draft)
      .then((result) => {
        if (active) {
          setItems(result);
          setPhase("ready");
        }
      })
      .catch(() => {
        if (active) {
          setPhase("failed");
        }
      });
    return () => {
      active = false;
    };
  }, [draft]);

  const support = async (issueId: string) => {
    setBusyId(issueId);
    setError(null);
    try {
      const result = await supportIssue(issueId);
      onSupported(result.report_code, result.reporter_count);
    } catch (failure) {
      setError(failure instanceof Error ? failure.message : "Terjadi kendala.");
      setBusyId(null);
    }
  };

  if (phase === "loading") {
    return (
      <p role="status" className="text-fg-muted">
        Mencari isu serupa di sekitar lokasi Anda...
      </p>
    );
  }

  if (phase === "failed" || items.length === 0) {
    return (
      <div className="flex flex-col gap-2 rounded-lg border border-dashed p-6">
        <p className="font-semibold">
          {phase === "failed" ? "Pencarian isu serupa belum tersedia" : "Belum ada isu serupa di sekitar Anda"}
        </p>
        <p className="text-fg-muted">Lanjutkan untuk mengirim laporan Anda sebagai laporan baru.</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <ul className="flex flex-col divide-y rounded-lg border">
        {items.map(({ issue, distance_m }) => {
          const label = isIssueStatus(issue.status) ? ISSUE_STATUS[issue.status].label : issue.status;
          return (
            <li key={issue.id} className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex flex-col gap-1.5">
                <p className="font-semibold">{issue.title}</p>
                <p className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-fg-muted">
                  <span className="inline-flex items-center gap-1.5">
                    <MapPin aria-hidden className="size-4" />
                    {issue.location.village.name} · {formatDistance(distance_m)} dari titik Anda
                  </span>
                  <span className="inline-flex items-center gap-1.5">
                    <Users aria-hidden className="size-4" />
                    {formatNumber(issue.reporter_count)} pelapor
                  </span>
                  <span className="font-semibold text-primary">{label}</span>
                </p>
              </div>
              <Button
                type="button"
                variant="outline"
                disabled={busyId !== null}
                onClick={() => support(issue.id)}
                className="shrink-0"
              >
                {busyId === issue.id ? "Mencatat..." : "Dukung isu ini"}
              </Button>
            </li>
          );
        })}
      </ul>
      {error && (
        <p role="alert" className="text-sm font-medium text-fg">
          {error}
        </p>
      )}
      <p className="text-sm text-fg-muted">
        Masalah Anda berbeda dari yang di atas? Tekan Lanjut untuk membuat laporan baru.
      </p>
    </div>
  );
}

export { DuplicateStep };
