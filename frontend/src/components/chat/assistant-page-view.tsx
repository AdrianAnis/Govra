"use client";

import React, { useState, useRef, useEffect, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import {
  Send,
  RotateCcw,
  Bot,
  User,
  ArrowLeft,
  FileText,
  Target,
  AlertTriangle,
  Loader2,
  MapPin,
  Sparkles,
} from "lucide-react";
import { MarkdownLite } from "@/components/chat/markdown-lite";
import { ChatCardList } from "@/components/chat/chat-card";
import { SourceLink } from "@/components/chat/source-link";
import { MAX_MESSAGES, MAX_QUESTION_LENGTH, persistedTurnsSchema, type ChatTurn } from "@/lib/chat";
import { askAssistant, isRateLimited } from "@/lib/chat-client";
import { cn } from "@/lib/utils";

export interface AssistantPageViewProps {
  signedIn: boolean;
  userName?: string | undefined;
}

const STORAGE_KEY = "govra_assistant_turns_v3";

const SUGGESTIONS = [
  {
    icon: FileText,
    label: "Cek status laporan saya",
    query: "Bagaimana status laporan saya dan kenapa belum diproses?",
    signedInOnly: true,
  },
  {
    icon: AlertTriangle,
    label: "Isu apa yang paling urgent saat ini?",
    query: "Isu apa saja yang lagi urgent di kota dan paling banyak laporannya?",
  },
  {
    icon: Target,
    label: "Proker pemda apa yang sedang berjalan?",
    query: "Apa saja program kerja pemda yang sedang berjalan dan progresnya?",
  },
  {
    icon: MapPin,
    label: "Status perbaikan jalan di Bojongsoang",
    query: "Apakah ada laporan perbaikan jalan rusak di Bojongsoang?",
  },
];

function loadSavedTurns(): ChatTurn[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = persistedTurnsSchema.safeParse(JSON.parse(raw));
      if (parsed.success) return parsed.data;
    }
  } catch {}
  return [];
}

export function AssistantPageView({ signedIn }: AssistantPageViewProps) {
  const router = useRouter();
  const [turns, setTurns] = useState<ChatTurn[]>(loadSavedTurns);
  const [input, setInput] = useState("");
  const [pending, setPending] = useState(false);
  const [errorNotice, setErrorNotice] = useState<string | null>(null);

  const inputRef = useRef<HTMLInputElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (typeof window !== "undefined") {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(turns));
    }
  }, [turns]);

  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [turns, pending]);

  useEffect(() => {
    inputRef.current?.focus();
  }, [pending]);

  const handleReset = () => {
    setTurns([]);
    setInput("");
    setErrorNotice(null);
    if (typeof window !== "undefined") {
      localStorage.removeItem(STORAGE_KEY);
    }
    inputRef.current?.focus();
  };

  const handleBack = () => {
    if (typeof window !== "undefined" && window.history.length > 1) {
      router.back();
    } else {
      router.push("/");
    }
  };

  const submitQuery = async (queryText: string) => {
    const trimmed = queryText.trim();
    if (!trimmed || pending) return;

    if (turns.length >= MAX_MESSAGES) {
      setErrorNotice("Percakapan telah mencapai batas maksimal. Silakan mulai sesi baru.");
      return;
    }

    const userTurn: ChatTurn = {
      id: crypto.randomUUID(),
      role: "USER",
      content: trimmed,
      sources: [],
      cards: [],
    };

    const nextTurns = [...turns, userTurn];
    setTurns(nextTurns);
    setInput("");
    setPending(true);
    setErrorNotice(null);

    try {
      const res = await askAssistant(nextTurns);
      const assistantTurn: ChatTurn = {
        id: crypto.randomUUID(),
        role: "ASSISTANT",
        content: res.reply,
        sources: res.sources || [],
        cards: res.cards || [],
      };
      setTurns([...nextTurns, assistantTurn]);
    } catch (err) {
      if (isRateLimited(err)) {
        setErrorNotice("Terlalu banyak pertanyaan dalam waktu singkat. Mohon tunggu beberapa saat ya, SobatGovra.");
      } else {
        setErrorNotice("Mohon maaf, terjadi kendala saat memproses jawaban. Silakan coba lagi sebentar.");
      }
    } finally {
      setPending(false);
    }
  };

  const onSubmit = (e: FormEvent) => {
    e.preventDefault();
    submitQuery(input);
  };

  const visibleSuggestions = SUGGESTIONS.filter((s) => !s.signedInOnly || signedIn);

  return (
    <div className="flex h-dvh w-full flex-col bg-background text-foreground overflow-hidden">
      {/* NAVBAR: BUTTON KEMBALI DI UJUNG KIRI SEJAJAR DENGAN PERCAKAPAN BARU DI UJUNG KANAN */}
      <header className="shrink-0 border-b border-border bg-card/90 backdrop-blur-md px-3 sm:px-5 py-2.5 z-30">
        <div className="flex items-center justify-between w-full">
          {/* UJUNG KIRI: BUTTON BACK DENGAN PADDING KECIL */}
          <button
            type="button"
            onClick={handleBack}
            aria-label="Kembali"
            className="flex items-center gap-1.5 rounded-lg border border-border/80 bg-background px-2.5 py-1.5 text-xs font-semibold text-foreground transition-all duration-150 hover:bg-muted active:scale-95 shadow-xs cursor-pointer"
          >
            <ArrowLeft className="size-4" />
            <span className="text-xs">Kembali</span>
          </button>

          {/* TENGAH: IDENTITAS GOVRA AI */}
          <div className="flex items-center gap-2">
            <div className="flex size-7 sm:size-8 items-center justify-center rounded-lg bg-primary text-primary-foreground shadow-xs shrink-0">
              <Bot className="size-4 sm:size-4.5" />
            </div>
            <div className="text-left">
              <h1 className="text-xs sm:text-sm font-bold text-foreground leading-tight">Govra AI</h1>
              <p className="text-[10px] text-muted-foreground hidden sm:block">Asisten Transparansi & Laporan Kota</p>
            </div>
          </div>

          {/* UJUNG KANAN: PERCAKAPAN BARU (SEJAJAR DENGAN BACK BUTTON) */}
          <div className="flex items-center justify-end">
            {turns.length > 0 ? (
              <button
                type="button"
                onClick={handleReset}
                className="flex items-center gap-1.5 rounded-lg border border-border/80 bg-background px-2.5 py-1.5 text-xs font-medium text-muted-foreground transition-all duration-150 hover:text-foreground hover:bg-muted active:scale-95 shadow-xs cursor-pointer"
                title="Mulai percakapan baru"
              >
                <RotateCcw className="size-3.5" />
                <span className="hidden sm:inline">Percakapan Baru</span>
              </button>
            ) : (
              <div className="w-16 sm:w-20" aria-hidden />
            )}
          </div>
        </div>
      </header>

      {/* CHAT BODY AREA */}
      <main className="flex-1 overflow-y-auto px-3 py-4 sm:px-6">
        <div className="mx-auto flex w-full max-w-3xl flex-col min-h-full">
          {turns.length === 0 ? (
            /* CLEAN MINIMALIST WELCOME STATE (NO BROCHURE SLOP) */
            <div className="my-auto flex flex-col items-center justify-center py-8 text-center">
              <div className="mb-3 flex size-12 items-center justify-center rounded-xl bg-primary/10 text-primary">
                <Sparkles className="size-6" />
              </div>

              <h2 className="text-lg font-bold text-foreground sm:text-xl">
                Halo, SobatGovra! 👋
              </h2>
              <p className="mt-1.5 max-w-md text-xs sm:text-sm text-muted-foreground px-4 leading-relaxed">
                Ada yang bisa saya bantu hari ini seputar program kota atau laporan warga Anda?
              </p>

              {/* QUICK SUGGESTION PILLS */}
              <div className="mt-6 flex flex-wrap justify-center gap-2 max-w-xl px-2">
                {visibleSuggestions.map((item) => {
                  const ItemIcon = item.icon;
                  return (
                    <button
                      key={item.label}
                      type="button"
                      onClick={() => submitQuery(item.query)}
                      className="flex items-center gap-1.5 rounded-full border border-border bg-card px-3.5 py-2 text-xs font-medium text-foreground transition-all duration-150 hover:border-primary/60 hover:bg-muted active:scale-98 cursor-pointer shadow-2xs"
                    >
                      <ItemIcon className="size-3.5 text-primary shrink-0" />
                      <span>{item.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          ) : (
            /* CHAT MESSAGES LIST */
            <div className="flex flex-col gap-4 pb-4">
              {turns.map((turn) => {
                const isUser = turn.role === "USER";
                return (
                  <div
                    key={turn.id}
                    className={cn("flex w-full gap-2.5 sm:gap-3", isUser ? "justify-end" : "justify-start")}
                  >
                    {!isUser && (
                      <div className="flex size-7 sm:size-8 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary border border-primary/20 mt-0.5">
                        <Bot className="size-4" />
                      </div>
                    )}

                    <div
                      className={cn(
                        "flex max-w-[90%] sm:max-w-[82%] flex-col gap-2 rounded-2xl px-3.5 py-2.5 sm:px-4 sm:py-3 text-sm shadow-xs",
                        isUser
                          ? "bg-primary text-primary-foreground rounded-tr-xs"
                          : "border border-border bg-card text-foreground rounded-tl-xs",
                      )}
                    >
                      {isUser ? (
                        <p className="whitespace-pre-wrap leading-relaxed">{turn.content}</p>
                      ) : (
                        <>
                          <MarkdownLite text={turn.content} />

                          {/* INTERACTIVE CARDS RENDERER */}
                          {turn.cards && turn.cards.length > 0 && (
                            <ChatCardList cards={turn.cards} />
                          )}

                          {/* SOURCES TAGS */}
                          {turn.sources && turn.sources.length > 0 && (
                            <div className="mt-2 flex flex-wrap items-center gap-1.5 border-t border-border/60 pt-2 text-xs text-muted-foreground">
                              <span className="font-medium text-[11px]">Tautan terkait:</span>
                              {turn.sources.map((s) => (
                                <SourceLink key={s.path} source={s} onNavigate={() => {}} />
                              ))}
                            </div>
                          )}
                        </>
                      )}
                    </div>

                    {isUser && (
                      <div className="flex size-7 sm:size-8 shrink-0 items-center justify-center rounded-lg bg-muted text-muted-foreground border border-border mt-0.5">
                        <User className="size-4" />
                      </div>
                    )}
                  </div>
                );
              })}

              {/* PENDING INDICATOR */}
              {pending && (
                <div className="flex w-full items-start gap-2.5 sm:gap-3">
                  <div className="flex size-7 sm:size-8 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary border border-primary/20 mt-0.5">
                    <Bot className="size-4" />
                  </div>
                  <div className="flex items-center gap-2 rounded-2xl border border-border bg-card px-3.5 py-2.5 text-xs text-muted-foreground shadow-xs rounded-tl-xs">
                    <Loader2 className="size-3.5 animate-spin text-primary" />
                    <span>SobatGovra, mohon tunggu sebentar saya sedang mengecek data...</span>
                  </div>
                </div>
              )}

              {/* ERROR NOTICE */}
              {errorNotice && (
                <div className="rounded-xl border border-rose-500/30 bg-rose-500/10 p-3 text-xs text-rose-600 dark:text-rose-400">
                  {errorNotice}
                </div>
              )}

              <div ref={scrollRef} />
            </div>
          )}
        </div>
      </main>

      {/* INPUT AREA (STICKY BOTTOM) */}
      <footer className="shrink-0 border-t border-border bg-card/95 p-3 sm:p-4 backdrop-blur-md z-30">
        <div className="mx-auto max-w-3xl">
          <form onSubmit={onSubmit} className="relative flex items-center gap-2">
            <input
              ref={inputRef}
              type="text"
              value={input}
              maxLength={MAX_QUESTION_LENGTH}
              onChange={(e) => setInput(e.target.value)}
              disabled={pending}
              placeholder="Ketik pertanyaan atau sapaan, misal: Halo, cek status tiket TLK-..., atau proker jalan..."
              className="h-11 sm:h-12 w-full rounded-xl border border-border bg-background px-3.5 pr-12 text-sm text-foreground shadow-xs transition-colors placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary disabled:opacity-50"
            />

            <button
              type="submit"
              disabled={!input.trim() || pending}
              aria-label="Kirim pesan"
              className="absolute right-1.5 top-1/2 -translate-y-1/2 flex size-8 sm:size-9 items-center justify-center rounded-lg bg-primary text-primary-foreground transition-all duration-150 hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-40 cursor-pointer shadow-xs"
            >
              {pending ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <Send className="size-3.5 sm:size-4" />
              )}
            </button>
          </form>

          <p className="mt-1.5 text-center text-[10.5px] text-muted-foreground">
            Govra AI menjawab berdasarkan data resmi program dan laporan sistem.
          </p>
        </div>
      </footer>
    </div>
  );
}
