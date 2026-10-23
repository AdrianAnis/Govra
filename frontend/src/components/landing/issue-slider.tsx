"use client";

import { ArrowLeft, ArrowRight } from "lucide-react";
import { useEffect, useRef, useState, type ReactNode } from "react";
import { TextLink } from "@/components/text-link";

const ARROW_CLASS =
  "grid size-12 place-items-center rounded-full border bg-surface transition-colors duration-150 ease-ui hover:border-primary hover:bg-primary hover:text-primary-fg focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary disabled:pointer-events-none disabled:opacity-40";

const DURATION_MS = 700;
const EDGE_PX = 2;

function easeInOutCubic(t: number): number {
  return t < 0.5 ? 4 * t * t * t : 1 - (-2 * t + 2) ** 3 / 2;
}

function IssueSlider({ children }: { children: ReactNode }) {
  const track = useRef<HTMLUListElement>(null);
  const frame = useRef(0);
  const [edge, setEdge] = useState({ start: true, end: false });

  const syncEdge = () => {
    const node = track.current;
    if (node) {
      setEdge({
        start: node.scrollLeft <= EDGE_PX,
        end: node.scrollLeft + node.clientWidth >= node.scrollWidth - EDGE_PX,
      });
    }
  };

  const step = (direction: 1 | -1) => {
    const node = track.current;
    const first = node?.firstElementChild;
    if (!node || !first) {
      return;
    }
    cancelAnimationFrame(frame.current);
    const from = node.scrollLeft;
    const distance = direction * first.getBoundingClientRect().width;
    const instant = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    node.style.scrollSnapType = "none";
    const startedAt = performance.now();
    const tick = (now: number) => {
      const progress = instant ? 1 : Math.min(1, (now - startedAt) / DURATION_MS);
      node.scrollLeft = from + distance * easeInOutCubic(progress);
      if (progress < 1) {
        frame.current = requestAnimationFrame(tick);
        return;
      }
      node.style.scrollSnapType = "";
    };
    frame.current = requestAnimationFrame(tick);
  };

  useEffect(() => () => cancelAnimationFrame(frame.current), []);

  return (
    <div className="flex flex-col gap-8">
      <ul
        ref={track}
        onScroll={syncEdge}
        className="no-scrollbar -mr-px flex snap-x snap-mandatory overflow-x-auto"
      >
        {children}
      </ul>
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <button type="button" aria-label="Isu sebelumnya" className={ARROW_CLASS} disabled={edge.start} onClick={() => step(-1)}>
            <ArrowLeft aria-hidden className="size-5" />
          </button>
          <button type="button" aria-label="Isu berikutnya" className={ARROW_CLASS} disabled={edge.end} onClick={() => step(1)}>
            <ArrowRight aria-hidden className="size-5" />
          </button>
        </div>
        <TextLink href="/isu">Lihat selengkapnya</TextLink>
      </div>
    </div>
  );
}

export { IssueSlider };
