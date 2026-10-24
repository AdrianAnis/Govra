"use client";

import { ImagePlus, X } from "lucide-react";
import Image from "next/image";
import { useRef, useState } from "react";
import { checkFile, MAX_FILE_MB, MAX_FILES, type DraftFile } from "@/lib/report-draft";

interface AttachmentsFieldProps {
  files: readonly DraftFile[];
  onChange: (files: readonly DraftFile[]) => void;
}

function AttachmentsField({ files, onChange }: AttachmentsFieldProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [problems, setProblems] = useState<string[]>([]);
  const full = files.length >= MAX_FILES;

  const add = (list: FileList | null) => {
    if (!list) {
      return;
    }
    const accepted: DraftFile[] = [];
    const rejected = new Set<string>();
    for (const file of Array.from(list)) {
      const problem = checkFile(file);
      if (problem) {
        rejected.add(problem);
      } else if (files.length + accepted.length >= MAX_FILES) {
        rejected.add(`Maksimal ${MAX_FILES} foto.`);
      } else {
        accepted.push({ id: crypto.randomUUID(), file, url: URL.createObjectURL(file) });
      }
    }
    setProblems([...rejected]);
    if (accepted.length > 0) {
      onChange([...files, ...accepted]);
    }
    if (inputRef.current) {
      inputRef.current.value = "";
    }
  };

  const remove = (id: string) => {
    const target = files.find((item) => item.id === id);
    if (target) {
      URL.revokeObjectURL(target.url);
    }
    setProblems([]);
    onChange(files.filter((item) => item.id !== id));
  };

  return (
    <div className="flex flex-col gap-3">
      <p className="font-semibold">
        Foto <span className="font-normal text-fg-muted">(opsional, maksimal {MAX_FILES})</span>
      </p>
      <label className="flex cursor-pointer flex-col items-center gap-2 rounded-lg border border-dashed border-border-strong px-4 py-8 text-center transition-colors duration-200 ease-ui hover:border-fg-muted hover:bg-surface-muted has-disabled:cursor-not-allowed has-disabled:opacity-60 has-focus-visible:outline-2 has-focus-visible:outline-offset-2 has-focus-visible:outline-primary">
        <ImagePlus aria-hidden className="size-6 text-fg-muted" />
        <span className="font-semibold">{full ? "Batas foto tercapai" : "Pilih foto"}</span>
        <span className="text-sm text-fg-muted">JPEG, PNG, atau WebP, maksimal {MAX_FILE_MB} MB per foto.</span>
        <input
          ref={inputRef}
          type="file"
          multiple
          disabled={full}
          accept="image/jpeg,image/png,image/webp"
          onChange={(event) => add(event.target.files)}
          className="sr-only"
        />
      </label>
      {problems.length > 0 && (
        <ul role="alert" className="flex flex-col gap-1 text-sm font-medium text-fg">
          {problems.map((problem) => (
            <li key={problem}>{problem}</li>
          ))}
        </ul>
      )}
      {files.length > 0 && (
        <ul className="grid grid-cols-3 gap-3">
          {files.map((item, index) => (
            <li key={item.id} className="relative aspect-square overflow-hidden rounded-lg border bg-surface-muted">
              <Image
                src={item.url}
                alt={`Pratinjau foto ${index + 1}`}
                fill
                unoptimized
                sizes="160px"
                className="object-cover"
              />
              <button
                type="button"
                onClick={() => remove(item.id)}
                aria-label={`Hapus foto ${index + 1}`}
                className="absolute top-2 right-2 grid size-8 place-items-center rounded-full bg-secondary text-secondary-fg transition-colors hover:bg-primary"
              >
                <X aria-hidden className="size-4" />
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export { AttachmentsField };
