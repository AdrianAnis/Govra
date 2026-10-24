"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { AsideCard } from "@/components/aside-card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { FIELD_CLASS } from "@/lib/field-style";
import { formatDateTime } from "@/lib/format";
import { cn } from "@/lib/utils";
import { sendFeedback } from "@/lib/report-client";
import type { Schema } from "@/lib/schema";

interface ResolutionFeedbackProps {
  code: string;
  feedback: Schema<"FeedbackState">;
}

const NOTE_MAX = 500;

function ResolutionFeedback({ code, feedback }: ResolutionFeedbackProps) {
  const router = useRouter();
  const [note, setNote] = useState("");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (feedback.submitted) {
    return (
      <AsideCard title="Penyelesaian">
        <p className="font-semibold">
          {feedback.submitted === "CONFIRM"
            ? "Anda sudah mengonfirmasi bahwa masalah ini selesai."
            : "Anda sudah menyanggah penyelesaian ini."}
        </p>
        <p className="text-sm text-fg-muted">Terima kasih. Masukan Anda membantu dinas menilai hasil pekerjaannya.</p>
      </AsideCard>
    );
  }

  if (!feedback.can_submit) {
    return null;
  }

  const send = async (outcome: "CONFIRM" | "DISPUTE") => {
    setPending(true);
    setError(null);
    try {
      await sendFeedback(code, outcome, note);
      router.refresh();
    } catch (failure) {
      setError(failure instanceof Error ? failure.message : "Terjadi kendala. Coba lagi.");
      setPending(false);
    }
  };

  return (
    <AsideCard title="Apakah masalahnya sudah selesai?">
      <p className="text-sm text-fg-muted">
        Dinas menandai isu ini selesai. Konfirmasi jika sudah beres, atau sanggah jika belum
        {feedback.deadline ? `, paling lambat ${formatDateTime(feedback.deadline)}` : ""}.
      </p>
      <div className="flex flex-col gap-2">
        <label htmlFor="feedback-note" className="text-sm font-semibold">
          Catatan (opsional)
        </label>
        <Textarea
          id="feedback-note"
          value={note}
          maxLength={NOTE_MAX}
          onChange={(event) => setNote(event.target.value)}
          className={cn(FIELD_CLASS, "min-h-24 py-3")}
        />
      </div>
      <div className="flex flex-wrap gap-3">
        <Button type="button" disabled={pending} onClick={() => send("CONFIRM")}>
          Sudah selesai
        </Button>
        <Button type="button" variant="outline" disabled={pending} onClick={() => send("DISPUTE")}>
          Belum selesai
        </Button>
      </div>
      {error && (
        <p role="alert" className="text-sm font-medium text-fg">
          {error}
        </p>
      )}
    </AsideCard>
  );
}

export { ResolutionFeedback };
