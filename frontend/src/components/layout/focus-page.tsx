import type { ReactNode } from "react";
import { Container } from "@/components/layout/container";
import { FocusHeader } from "@/components/layout/focus-header";

interface FocusPageProps {
  progress?: ReactNode;
  children: ReactNode;
}

function FocusPage({ progress, children }: FocusPageProps) {
  return (
    <>
      <FocusHeader>{progress}</FocusHeader>
      <main id="konten" tabIndex={-1} className="outline-none flex flex-1 flex-col">
        <Container className="flex flex-1 flex-col pt-8 lg:pt-12">{children}</Container>
      </main>
    </>
  );
}

export { FocusPage };
