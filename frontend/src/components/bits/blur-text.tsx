import { cn } from "@/lib/utils";

const STAGGER_MS = 70;

interface BlurTextProps {
  text: string;
  highlight?: readonly string[];
  startAt?: number;
}

function BlurText({ text, highlight = [], startAt = 0 }: BlurTextProps) {
  return (
    <>
      <span className="sr-only">{text}</span>
      <span aria-hidden>
        {text.split(" ").map((word, index) => (
          <span
            key={`${word}-${index}`}
            className={cn("inline-block animate-blur-in", highlight.includes(word) && "text-accent")}
            style={{ animationDelay: `${(startAt + index) * STAGGER_MS}ms` }}
          >
            {word}
            {" "}
          </span>
        ))}
      </span>
    </>
  );
}

export { BlurText };
