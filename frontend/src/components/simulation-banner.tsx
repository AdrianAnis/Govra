import { Info } from "lucide-react";
import { Container } from "@/components/layout/container";

function SimulationBanner() {
  return (
    <div role="note" className="bg-primary-soft">
      <Container className="flex items-center gap-2 py-2 text-sm">
        <Info aria-hidden className="size-4 shrink-0" />
        <p>Data simulasi untuk keperluan demonstrasi</p>
      </Container>
    </div>
  );
}

export { SimulationBanner };
