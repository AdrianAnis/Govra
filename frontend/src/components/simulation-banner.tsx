import { Info } from "lucide-react";

function SimulationBanner() {
  return (
    <div role="note" className="bg-primary-soft">
      <p className="mx-auto flex w-full max-w-content items-center gap-2 px-4 py-2 text-sm">
        <Info aria-hidden className="size-4 shrink-0" />
        Data simulasi untuk keperluan demonstrasi
      </p>
    </div>
  );
}

export { SimulationBanner };
