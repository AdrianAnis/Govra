import { DOT_PATH, LOGO_SIZE, MARK_PATH, WORD_PATH } from "@/components/brand/logo-paths";
import { cn } from "@/lib/utils";

type LogoTone = "color" | "light";

interface LogoProps {
  tone?: LogoTone;
  className?: string;
}

const MARK_FILL: Record<LogoTone, string> = { color: "fill-primary", light: "fill-secondary-fg" };
const DOT_FILL: Record<LogoTone, string> = { color: "fill-secondary", light: "fill-primary" };
const WORD_FILL: Record<LogoTone, string> = { color: "fill-secondary", light: "fill-secondary-fg" };

function Logo({ tone = "color", className }: LogoProps) {
  return (
    <svg
      viewBox={`0 0 ${LOGO_SIZE.width} ${LOGO_SIZE.height}`}
      role="img"
      aria-label="Govra"
      className={cn("h-8 w-auto", className)}
    >
      <path fillRule="evenodd" d={MARK_PATH} className={MARK_FILL[tone]} />
      <path d={DOT_PATH} className={DOT_FILL[tone]} />
      <path fillRule="evenodd" d={WORD_PATH} className={WORD_FILL[tone]} />
    </svg>
  );
}

export { Logo };
