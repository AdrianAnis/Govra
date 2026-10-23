"use client";

import { ErrorPage } from "@/components/error-page";
import { Button } from "@/components/ui/button";

export default function ErrorBoundary({ retry }: { retry: () => void }) {
  return (
    <ErrorPage
      code="500"
      title="Terjadi gangguan"
      description="Halaman ini belum bisa dimuat. Coba lagi beberapa saat, atau kembali ke beranda."
    >
      <Button onClick={() => retry()}>Coba lagi</Button>
    </ErrorPage>
  );
}
