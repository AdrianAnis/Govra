import Link from "next/link";
import type { ReactNode } from "react";
import { buttonVariants } from "@/components/ui/button";

interface ErrorPageProps {
  code: string;
  title: string;
  description: string;
  children?: ReactNode;
}

function ErrorPage({ code, title, description, children }: ErrorPageProps) {
  return (
    <main
      id="konten"
      tabIndex={-1}
      className="mx-auto flex min-h-dvh w-full max-w-content outline-none flex-col items-center justify-center gap-3 px-4 py-16 text-center sm:px-6 lg:px-10"
    >
      <p className="text-sm font-semibold tracking-wide text-fg-subtle">{code}</p>
      <h1 className="text-3xl font-bold tracking-tight">{title}</h1>
      <p className="max-w-prose text-fg-muted">{description}</p>
      <div className="mt-4 flex flex-wrap justify-center gap-3">
        {children}
        <Link href="/" className={buttonVariants({ variant: "secondary" })}>
          Kembali ke beranda
        </Link>
      </div>
    </main>
  );
}

export { ErrorPage };
