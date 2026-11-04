import Link from "next/link";
import React, { Fragment, type ReactNode } from "react";

interface MarkdownLiteProps {
  text: string;
  onNavigate?: () => void;
}

function parseFormattedText(text: string, onNavigate?: () => void): ReactNode[] {
  const clean = text.replace(/[*_]{3,}/g, "");
  const pattern = /(!?\[[^\]]+\]\([^\)]+\)|\*\*[^*]+\*\*|__[^_]+__|\*[^*]+\*|_[^_]+_|`[^`]+`)/g;
  const parts = clean.split(pattern);

  return parts.map((part, index) => {
    if (!part) return null;

    const linkMatch = /^\[([^\]]+)\]\(([^)\s]+)\)$/.exec(part);
    if (linkMatch && linkMatch[1] && linkMatch[2]) {
      const label = linkMatch[1];
      const href = linkMatch[2];
      const isInternal = href.startsWith("/");
      if (isInternal) {
        return (
          <Link
            key={index}
            href={href}
            {...(onNavigate ? { onClick: onNavigate } : {})}
            className="font-medium text-primary underline underline-offset-4 hover:text-primary/80 transition-colors"
          >
            {label}
          </Link>
        );
      }
      return (
        <a
          key={index}
          href={href}
          target="_blank"
          rel="noopener noreferrer"
          className="font-medium text-primary underline underline-offset-4 hover:text-primary/80 transition-colors"
        >
          {label}
        </a>
      );
    }

    if ((part.startsWith("**") && part.endsWith("**")) || (part.startsWith("__") && part.endsWith("__"))) {
      const inner = part.slice(2, -2);
      return (
        <strong key={index} className="font-semibold text-foreground">
          {inner}
        </strong>
      );
    }

    if ((part.startsWith("*") && part.endsWith("*")) || (part.startsWith("_") && part.endsWith("_"))) {
      const inner = part.slice(1, -1);
      return (
        <em key={index} className="italic text-foreground/90">
          {inner}
        </em>
      );
    }

    if (part.startsWith("`") && part.endsWith("`")) {
      const inner = part.slice(1, -1);
      return (
        <code key={index} className="rounded bg-muted px-1.5 py-0.5 font-mono text-[11.5px] text-primary">
          {inner}
        </code>
      );
    }

    const sanitizedPart = part.replace(/[*_]/g, "");
    return <Fragment key={index}>{sanitizedPart}</Fragment>;
  });
}

function MarkdownLite({ text, onNavigate }: MarkdownLiteProps) {
  if (!text) return null;

  const lines = text.split("\n");
  const blocks: ReactNode[] = [];
  let currentList: { type: "ul" | "ol"; items: string[] } | null = null;

  const flushList = () => {
    if (!currentList) return;
    if (currentList.type === "ul") {
      blocks.push(
        <ul key={`list-${blocks.length}`} className="my-1.5 flex list-disc flex-col gap-1 pl-5 text-sm marker:text-primary">
          {currentList.items.map((item, idx) => (
            <li key={idx} className="leading-relaxed">
              {parseFormattedText(item, onNavigate)}
            </li>
          ))}
        </ul>,
      );
    } else {
      blocks.push(
        <ol key={`list-${blocks.length}`} className="my-1.5 flex list-decimal flex-col gap-1 pl-5 text-sm marker:text-primary font-medium">
          {currentList.items.map((item, idx) => (
            <li key={idx} className="leading-relaxed font-normal">
              {parseFormattedText(item, onNavigate)}
            </li>
          ))}
        </ol>,
      );
    }
    currentList = null;
  };

  for (let i = 0; i < lines.length; i++) {
    const rawLine = lines[i] ?? "";
    const line = rawLine.trim();

    if (!line) {
      flushList();
      continue;
    }

    const bulletMatch = /^[-*•]\s+(.*)$/.exec(line);
    if (bulletMatch && bulletMatch[1]) {
      if (currentList && currentList.type !== "ul") {
        flushList();
      }
      if (!currentList) {
        currentList = { type: "ul", items: [] };
      }
      currentList.items.push(bulletMatch[1]);
      continue;
    }

    const numberMatch = /^\d+[.)]\s+(.*)$/.exec(line);
    if (numberMatch && numberMatch[1]) {
      if (currentList && currentList.type !== "ol") {
        flushList();
      }
      if (!currentList) {
        currentList = { type: "ol", items: [] };
      }
      currentList.items.push(numberMatch[1]);
      continue;
    }

    flushList();

    if (line.startsWith("### ")) {
      blocks.push(
        <h4 key={`h-${blocks.length}`} className="mt-2 text-sm font-bold text-foreground">
          {parseFormattedText(line.slice(4), onNavigate)}
        </h4>,
      );
    } else if (line.startsWith("## ")) {
      blocks.push(
        <h3 key={`h-${blocks.length}`} className="mt-2.5 text-base font-bold text-foreground">
          {parseFormattedText(line.slice(3), onNavigate)}
        </h3>,
      );
    } else {
      blocks.push(
        <p key={`p-${blocks.length}`} className="text-sm leading-relaxed text-foreground/90">
          {parseFormattedText(line, onNavigate)}
        </p>,
      );
    }
  }

  flushList();

  return <div className="flex flex-col gap-2">{blocks}</div>;
}

export { MarkdownLite };
