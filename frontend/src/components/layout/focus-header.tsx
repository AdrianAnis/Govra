import { X } from "lucide-react";
import Link from "next/link";
import { Container } from "@/components/layout/container";
import { Wordmark } from "@/components/layout/wordmark";
import { buttonVariants } from "@/components/ui/button";

function FocusHeader() {
  return (
    <header className="border-b bg-surface">
      <Container className="flex h-16 items-center justify-between">
        <Wordmark />
        <Link href="/" className={buttonVariants({ variant: "ghost" })}>
          <X aria-hidden />
          Keluar
        </Link>
      </Container>
    </header>
  );
}

export { FocusHeader };
