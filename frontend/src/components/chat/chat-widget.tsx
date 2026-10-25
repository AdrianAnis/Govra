"use client";

import { MessageCircle, RotateCcw, X } from "lucide-react";
import Link from "next/link";
import { useEffect, useRef, useState, type FormEvent } from "react";
import { MarkdownLite } from "@/components/chat/markdown-lite";
import { SourceLink } from "@/components/chat/source-link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { MAX_MESSAGES, MAX_QUESTION_LENGTH, type ChatTurn } from "@/lib/chat";
import { askAssistant, isRateLimited } from "@/lib/chat-client";
import { FIELD_CLASS, FIELD_HEIGHT } from "@/lib/field-style";
import { REPORTER_HOME } from "@/lib/routes";
import { loginHref } from "@/lib/session";
import { cn } from "@/lib/utils";

interface ChatWidgetProps {
  signedIn: boolean;
}

type Notice = "error" | "limit";

const SMALL_SCREEN = "(max-width: 639px)";
const BASE_SUGGESTIONS: readonly string[] = [
  "Bagaimana cara membuat laporan?",
  "Proker apa saja di Kecamatan Utara?",
  "Isu banjir apa yang sedang ditangani?",
];

function ChatWidget({ signedIn }: ChatWidgetProps) {
  const [open, setOpen] = useState(false);
  const [turns, setTurns] = useState<ChatTurn[]>([]);
  const [input, setInput] = useState("");
  const [pending, setPending] = useState(false);
  const [notice, setNotice] = useState<Notice | null>(null);
  const launcherRef = useRef<HTMLButtonElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const endRef = useRef<HTMLDivElement>(null);
  const suggestions = signedIn ? ["Status laporan saya", ...BASE_SUGGESTIONS] : BASE_SUGGESTIONS;
  const full = turns.length >= MAX_MESSAGES;
  const trackHref = signedIn ? REPORTER_HOME : loginHref(REPORTER_HOME);

  useEffect(() => {
    endRef.current?.scrollIntoView({ block: "end" });
  }, [turns, pending, notice]);

  useEffect(() => {
    if (open && !pending) {
      inputRef.current?.focus();
    }
  }, [open, pending]);

  useEffect(() => {
    if (!open) {
      return;
    }
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setOpen(false);
        requestAnimationFrame(() => launcherRef.current?.focus());
      }
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open]);

  const close = () => {
    setOpen(false);
    requestAnimationFrame(() => launcherRef.current?.focus());
  };

  const leave = () => {
    if (window.matchMedia(SMALL_SCREEN).matches) {
      close();
    }
  };

  const reset = () => {
    setTurns([]);
    setInput("");
    setNotice(null);
  };

  const send = async (question: string) => {
    const text = question.trim();
    if (!text || pending || full) {
      return;
    }
    const next: ChatTurn[] = [...turns, { id: crypto.randomUUID(), role: "USER", content: text, sources: [] }];
    setTurns(next);
    setInput("");
    setPending(true);
    setNotice(null);
    try {
      const reply = await askAssistant(next);
      setTurns([...next, { id: crypto.randomUUID(), role: "ASSISTANT", content: reply.reply, sources: reply.sources }]);
    } catch (failure) {
      setTurns(turns);
      setInput(text);
      setNotice(isRateLimited(failure) ? "limit" : "error");
    } finally {
      setPending(false);
    }
  };

  const onSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    void send(input);
  };

  if (!open) {
    return (
      <button
        ref={launcherRef}
        type="button"
        aria-label="Buka asisten Govra"
        aria-expanded={false}
        aria-controls="asisten-govra"
        onClick={() => setOpen(true)}
        className="fixed right-4 bottom-4 z-40 inline-flex h-14 items-center justify-center gap-2 rounded-full bg-secondary font-semibold text-secondary-fg shadow-lg transition-colors duration-200 ease-ui hover:bg-primary max-sm:size-14 sm:right-6 sm:bottom-6 sm:px-6"
      >
        <MessageCircle aria-hidden className="size-5" />
        <span className="max-sm:sr-only">Tanya Govra</span>
      </button>
    );
  }

  return (
    <div
      id="asisten-govra"
      role="dialog"
      aria-label="Asisten Govra"
      className="fixed inset-0 z-50 flex flex-col overflow-hidden bg-surface text-fg shadow-lg sm:inset-auto sm:right-6 sm:bottom-6 sm:h-140 sm:w-100 sm:rounded-lg sm:border"
    >
      <header className="flex items-start justify-between gap-3 bg-secondary px-5 py-4 text-secondary-fg">
        <div className="flex flex-col">
          <p className="text-lg font-bold tracking-tight">Tanya Govra</p>
          <p className="text-sm text-secondary-fg/70">Menjawab dari data proker, isu, dan laporan.</p>
        </div>
        <div className="flex items-center gap-1">
          {turns.length > 0 && (
            <Button
              type="button"
              variant="ghost"
              size="icon"
              aria-label="Mulai percakapan baru"
              onClick={reset}
              className="text-secondary-fg hover:bg-secondary-fg/10"
            >
              <RotateCcw aria-hidden />
            </Button>
          )}
          <Button
            type="button"
            variant="ghost"
            size="icon"
            aria-label="Tutup asisten"
            onClick={close}
            className="text-secondary-fg hover:bg-secondary-fg/10"
          >
            <X aria-hidden />
          </Button>
        </div>
      </header>
      <div role="log" aria-live="polite" className="flex flex-1 flex-col gap-4 overflow-y-auto px-5 py-5">
        {turns.length === 0 ? (
          <div className="flex flex-col gap-4">
            <p className="text-fg-muted">
              Halo! Tanyakan tentang progres proker, isu warga, atau status laporan Anda.
            </p>
            <ul className="flex flex-col gap-2">
              {suggestions.map((suggestion) => (
                <li key={suggestion}>
                  <button
                    type="button"
                    onClick={() => void send(suggestion)}
                    className="w-full rounded-lg border px-4 py-2.5 text-left text-sm font-medium transition-colors duration-150 hover:border-fg-muted hover:bg-surface-muted"
                  >
                    {suggestion}
                  </button>
                </li>
              ))}
            </ul>
          </div>
        ) : (
          turns.map((turn) =>
            turn.role === "USER" ? (
              <p
                key={turn.id}
                className="max-w-11/12 self-end rounded-lg rounded-br-sm bg-secondary px-4 py-2.5 text-secondary-fg"
              >
                {turn.content}
              </p>
            ) : (
              <div key={turn.id} className="flex max-w-11/12 flex-col gap-2 self-start">
                <div className="rounded-lg rounded-bl-sm bg-surface-muted px-4 py-3">
                  <MarkdownLite text={turn.content} onNavigate={leave} />
                </div>
                {turn.sources.length > 0 && (
                  <ul className="flex flex-col gap-2">
                    {turn.sources.map((source) => (
                      <li key={source.path}>
                        <SourceLink source={source} onNavigate={leave} />
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            )
          )
        )}
        {pending && (
          <p role="status" className="self-start rounded-lg rounded-bl-sm bg-surface-muted px-4 py-3 text-fg-muted">
            Mencari data...
          </p>
        )}
        {notice === "error" && (
          <p role="alert" className="text-sm font-medium text-fg">
            Asisten sedang tidak bisa dihubungi. Pertanyaan Anda tetap ada di kolom, coba kirim lagi sebentar lagi.
          </p>
        )}
        {notice === "limit" && (
          <div role="alert" className="flex flex-col gap-2 rounded-lg border p-4 text-sm">
            <p className="font-medium">Anda sudah banyak bertanya. Coba lagi beberapa menit lagi.</p>
            <Link href={trackHref} onClick={leave} className="font-semibold text-primary underline underline-offset-4">
              Lacak laporan secara manual
            </Link>
          </div>
        )}
        {full && (
          <div className="flex flex-col items-start gap-2 rounded-lg border p-4 text-sm">
            <p className="font-medium">Percakapan ini sudah mencapai batas.</p>
            <Button type="button" variant="outline" size="sm" onClick={reset}>
              Mulai percakapan baru
            </Button>
          </div>
        )}
        <div ref={endRef} />
      </div>
      <form onSubmit={onSubmit} className="flex flex-col gap-2 border-t px-4 py-3">
        <div className="flex gap-2">
          <Input
            value={input}
            maxLength={MAX_QUESTION_LENGTH}
            disabled={full}
            ref={inputRef}
            aria-label="Tulis pertanyaan"
            placeholder="Tulis pertanyaan Anda"
            onChange={(event) => setInput(event.target.value)}
            className={cn(FIELD_HEIGHT, FIELD_CLASS, "min-w-0 flex-1")}
          />
          <Button type="submit" size="lg" disabled={pending || full || !input.trim()}>
            Kirim
          </Button>
        </div>
        <p className="text-xs text-fg-muted">Jawaban berasal dari data sistem. Jangan kirim data pribadi.</p>
      </form>
    </div>
  );
}

export { ChatWidget };
