"use client";

import { Check, Copy } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { Button, buttonVariants } from "@/components/ui/button";
import { formatNumber } from "@/lib/format";
import { cn } from "@/lib/utils";
import { reportHref, REPORTER_HOME } from "@/lib/routes";

interface ReportSuccessProps {
  code: string;
  reporters: number | null;
}

function ReportSuccess({ code, reporters }: ReportSuccessProps) {
  const [copied, setCopied] = useState(false);
  const supported = reporters !== null;

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
    } catch {
      setCopied(false);
    }
  };

  return (
    <div className="mx-auto flex w-full max-w-xl flex-col items-center gap-8 py-8 text-center">
      <span className="grid size-16 place-items-center rounded-full bg-secondary text-secondary-fg">
        <Check aria-hidden className="size-8" />
      </span>
      <div className="flex flex-col gap-3">
        <h1 className="text-3xl font-bold tracking-tight lg:text-4xl">
          {supported ? "Dukungan Anda tercatat" : "Laporan terkirim"}
        </h1>
        <p className="text-fg-muted">
          {supported
            ? `Laporan Anda tergabung ke isu yang sudah ada. Kini ${formatNumber(reporters)} warga melaporkannya.`
            : "Dinas yang berwenang akan menerimanya setelah diverifikasi. Simpan kode ini untuk melacak laporan Anda."}
        </p>
      </div>
      <div className="flex w-full flex-col items-center gap-4 rounded-lg border bg-surface-muted p-8">
        <p className="text-sm font-semibold text-fg-muted">Kode laporan</p>
        <p className="text-3xl font-bold tracking-tight whitespace-nowrap tabular-nums sm:text-4xl lg:text-5xl">{code}</p>
        <Button type="button" variant="outline" onClick={copy}>
          {copied ? <Check aria-hidden /> : <Copy aria-hidden />}
          {copied ? "Kode tersalin" : "Salin kode"}
        </Button>
      </div>
      <div className="flex flex-wrap justify-center gap-3">
        <Link href={reportHref(code)} className={buttonVariants()}>
          Lacak laporan
        </Link>
        <Link href={REPORTER_HOME} className={cn(buttonVariants({ variant: "outline" }))}>
          Semua laporan saya
        </Link>
      </div>
    </div>
  );
}

export { ReportSuccess };
