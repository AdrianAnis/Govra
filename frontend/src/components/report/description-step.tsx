import { AttachmentsField } from "@/components/report/attachments-field";
import { VoiceRecorder } from "@/components/report/voice-recorder";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { FIELD_CLASS, FIELD_HEIGHT } from "@/lib/field-style";
import { BODY_MAX, BODY_MIN, TITLE_MAX, type FieldErrors, type ReportDraft } from "@/lib/report-draft";
import { cn } from "@/lib/utils";

interface DescriptionStepProps {
  draft: ReportDraft;
  errors: FieldErrors;
  onChange: (patch: Partial<ReportDraft>) => void;
}

function DescriptionStep({ draft, errors, onChange }: DescriptionStepProps) {
  const bodyError = errors.body;
  const titleError = errors.title;

  const handleVoiceTranscript = (text: string) => {
    const trimmed = text.trim();
    if (!trimmed) return;
    const updated = draft.body.trim() ? `${draft.body.trim()}\n\n${trimmed}` : trimmed;
    onChange({ body: updated });
  };

  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-col gap-2">
        <label htmlFor="title" className="font-semibold">
          Judul singkat <span className="font-normal text-fg-muted">(opsional)</span>
        </label>
        <Input
          id="title"
          value={draft.title}
          maxLength={TITLE_MAX + 20}
          aria-invalid={titleError ? true : undefined}
          aria-describedby={titleError ? "title-error" : undefined}
          onChange={(event) => onChange({ title: event.target.value })}
          className={cn(FIELD_HEIGHT, FIELD_CLASS)}
        />
        {titleError && (
          <p id="title-error" role="alert" className="text-sm font-medium text-fg">
            {titleError}
          </p>
        )}
      </div>

      <div className="flex flex-col gap-3">
        <label htmlFor="body" className="font-semibold">
          Ceritakan apa yang terjadi
        </label>

        <VoiceRecorder onTranscript={handleVoiceTranscript} />

        <Textarea
          id="body"
          value={draft.body}
          rows={4}
          aria-invalid={bodyError ? true : undefined}
          aria-describedby={bodyError ? "body-error body-hint" : "body-hint"}
          onChange={(event) => onChange({ body: event.target.value })}
          className={cn(FIELD_CLASS, "min-h-32 py-3")}
        />
        <div className="flex items-start justify-between gap-4 text-sm">
          <p id="body-hint" className="text-fg-muted">
            Minimal {BODY_MIN} karakter. Hindari menulis nomor telepon atau alamat rumah.
          </p>
          <p
            className={cn("shrink-0 tabular-nums", draft.body.length > BODY_MAX ? "font-semibold text-fg" : "text-fg-muted")}
          >
            {draft.body.length}/{BODY_MAX}
          </p>
        </div>
        {bodyError && (
          <p id="body-error" role="alert" className="text-sm font-medium text-fg">
            {bodyError}
          </p>
        )}
      </div>

      <AttachmentsField files={draft.files} onChange={(files) => onChange({ files })} />
    </div>
  );
}

export { DescriptionStep };
