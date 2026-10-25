import Link from "next/link";
import { Fragment, type ReactNode } from "react";

interface MarkdownLiteProps {
  text: string;
  onNavigate?: () => void;
}

const TOKEN = /(\*\*[^*]+\*\*|\[[^\]]+\]\(\/[^)\s]*\))/g;
const LINK = /^\[([^\]]+)\]\((\/[^)\s]*)\)$/;
const BULLET = /^[-*]\s+/;
const BOLD_MARK = 2;

function inline(text: string, onNavigate: (() => void) | undefined): ReactNode[] {
  return text.split(TOKEN).map((part, index) => {
    const link = LINK.exec(part);
    if (link?.[1] && link[2] && !link[2].startsWith("//")) {
      return (
        <Link
          key={index}
          href={link[2]}
          {...(onNavigate ? { onClick: onNavigate } : {})}
          className="font-semibold text-primary underline underline-offset-4"
        >
          {link[1]}
        </Link>
      );
    }
    if (part.length > BOLD_MARK * 2 && part.startsWith("**") && part.endsWith("**")) {
      return (
        <strong key={index} className="font-semibold">
          {part.slice(BOLD_MARK, -BOLD_MARK)}
        </strong>
      );
    }
    return <Fragment key={index}>{part}</Fragment>;
  });
}

function MarkdownLite({ text, onNavigate }: MarkdownLiteProps) {
  const blocks: ReactNode[] = [];
  let items: string[] = [];

  const flush = () => {
    if (items.length === 0) {
      return;
    }
    const current = items;
    items = [];
    blocks.push(
      <ul key={blocks.length} className="flex list-disc flex-col gap-1.5 pl-5 marker:text-primary">
        {current.map((item, index) => (
          <li key={index}>{inline(item, onNavigate)}</li>
        ))}
      </ul>,
    );
  };

  for (const line of text.split("\n")) {
    if (BULLET.test(line)) {
      items.push(line.replace(BULLET, ""));
    } else {
      flush();
      if (line.trim()) {
        blocks.push(<p key={blocks.length}>{inline(line, onNavigate)}</p>);
      }
    }
  }
  flush();

  return <div className="flex flex-col gap-2">{blocks}</div>;
}

export { MarkdownLite };
