import { X } from "lucide-react";
import Link from "next/link";
import type { ReactNode } from "react";
import { Container } from "@/components/layout/container";
import { Wordmark } from "@/components/layout/wordmark";
import { buttonVariants } from "@/components/ui/button";

function FocusHeader({ children }: { children?: ReactNode }) {
  return (
    <header className="sticky top-0 z-30 border-b bg-surface">
      <Container className="flex flex-wrap items-center justify-between xl:flex-nowrap">
        <div className="flex h-16 items-center">
          <Wordmark />
        </div>
        {children && (
          <div className="order-last w-full pb-4 xl:absolute xl:inset-x-10 xl:order-none xl:w-auto xl:pb-0">
            <div className="mx-auto max-w-3xl">{children}</div>
          </div>
        )}
        <div className="flex h-16 items-center">
          <Link href="/" aria-label="Keluar" className={buttonVariants({ variant: "ghost" })}>
            <X aria-hidden />
            <span className="max-sm:sr-only">Keluar</span>
          </Link>
        </div>
      </Container>
    </header>
  );
}

export { FocusHeader };
