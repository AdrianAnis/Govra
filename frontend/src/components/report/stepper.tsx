import { Check } from "lucide-react";
import { Fragment } from "react";
import { cn } from "@/lib/utils";

interface StepperProps {
  labels: readonly string[];
  current: number;
}

function Stepper({ labels, current }: StepperProps) {
  return (
    <ol aria-label="Langkah laporan" className="flex w-full items-center">
      {labels.map((label, index) => (
        <Fragment key={label}>
          {index > 0 && (
            <li
              aria-hidden
              className={cn(
                "mx-2 min-w-3 flex-1 border-t-2 border-dotted sm:mx-4",
                index <= current ? "border-primary" : "border-border-strong",
              )}
            />
          )}
          <li aria-current={index === current ? "step" : undefined} className="flex shrink-0 items-center gap-3">
            <span
              className={cn(
                "grid size-8 shrink-0 place-items-center rounded-full border-2 bg-surface text-xs font-semibold tabular-nums transition-colors duration-300 ease-ui",
                index < current && "border-secondary bg-secondary text-secondary-fg",
                index === current && "border-secondary text-fg ring-4 ring-primary-soft",
                index > current && "border-border-strong text-fg-subtle",
              )}
            >
              {index < current ? <Check aria-hidden className="size-4" /> : index + 1}
            </span>
            <span className={cn("text-sm max-md:sr-only", index === current ? "font-semibold text-fg" : "text-fg-muted")}>
              {label}
            </span>
          </li>
        </Fragment>
      ))}
    </ol>
  );
}

export { Stepper };
