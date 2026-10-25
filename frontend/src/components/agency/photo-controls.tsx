"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { updatePublication } from "@/lib/agency-client";
import type { Schema } from "@/lib/schema";

interface PhotoControlsProps {
  issueId: string;
  attachment: Schema<"AgencyAttachment">;
  index: number;
  locked: boolean;
}

function PhotoControls({ issueId, attachment, index, locked }: PhotoControlsProps) {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const change = async (state: { public_ok: boolean; is_cover: boolean }) => {
    setPending(true);
    setError(null);
    try {
      await updatePublication(issueId, attachment.id, state);
      router.refresh();
    } catch (failure) {
      setError(failure instanceof Error ? failure.message : "Terjadi kendala. Coba lagi.");
    } finally {
      setPending(false);
    }
  };

  return (
    <div className="flex flex-col gap-3">
      <a
        href={attachment.url}
        target="_blank"
        rel="noopener noreferrer"
        className="relative block aspect-4/3 overflow-hidden rounded-lg border bg-surface-muted"
      >
        <Image
          src={attachment.url}
          alt={`Foto laporan ${index}`}
          fill
          sizes="(min-width: 640px) 240px, 50vw"
          className="object-cover"
        />
        {attachment.is_cover && (
          <span className="absolute top-2 left-2 rounded-full bg-secondary px-3 py-1 text-xs font-semibold text-secondary-fg">
            Sampul
          </span>
        )}
      </a>
      {locked ? (
        <p className="text-sm text-fg-muted">Dari laporan Rahasia, tidak bisa ditampilkan di publik.</p>
      ) : (
        <div className="flex flex-col gap-2">
          <label className="flex min-h-11 cursor-pointer items-center gap-3 text-sm font-medium">
            <input
              type="checkbox"
              checked={attachment.public_ok}
              disabled={pending}
              onChange={(event) => void change({ public_ok: event.target.checked, is_cover: false })}
              className="size-5 accent-primary"
            />
            Layak publik
          </label>
          <Button
            type="button"
            size="sm"
            variant={attachment.is_cover ? "secondary" : "outline"}
            disabled={pending || !attachment.public_ok || attachment.is_cover}
            onClick={() => void change({ public_ok: true, is_cover: true })}
            className="w-fit"
          >
            {attachment.is_cover ? "Sampul isu" : "Jadikan sampul"}
          </Button>
        </div>
      )}
      {error && (
        <p role="alert" className="text-sm font-medium">
          {error}
        </p>
      )}
    </div>
  );
}

export { PhotoControls };
