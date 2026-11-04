"use client";

import React, { useState, useRef, useEffect, type FormEvent } from "react";
import Link from "next/link";
import {
  Sparkles,
  Send,
  RotateCcw,
  Bot,
  User,
  FileText,
  Target,
  AlertTriangle,
  Loader2,
  MapPin,
} from "lucide-react";
import { MarkdownLite } from "@/components/chat/markdown-lite";
import { ChatCardList } from "@/components/chat/chat-card";
import { SourceLink } from "@/components/chat/source-link";
import { Button } from "@/components/ui/button";
import { MAX_MESSAGES, MAX_QUESTION_LENGTH, persistedTurnsSchema, type ChatTurn } from "@/lib/chat";
import { askAssistant, isRateLimited } from "@/lib/chat-client";
import { cn } from "@/lib/utils";

export interface AssistantPageViewProps {
  signedIn: boolean;
  userName?: string | undefined;
}

const STORAGE_KEY = "govra_assistant_turns_v2";

const SUGGESTIONS = [
  {
    icon: FileText,
    label: "Status laporan saya",
    query: "Bagaimana status laporan saya dan kenapa belum diproses?",
    signedInOnly: true,
  },
  {
    icon: AlertTriangle,
    label: "Isu paling urgent saat ini",
    query: "Isu apa saja yang lagi urgent di kota dan paling banyak laporannya?",
  },
  {
    icon: Target,
    label: "Proker pemda yang sedang berjalan",
    query: "Apa saja program kerja pemda yang sedang berjalan dan progresnya?",
  },
  {
    icon: MapPin,
    label: "Cek jalan rusak Bojongsoang",
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

export function AssistantPageView({ signedIn, userName }: AssistantPageViewProps) {
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
    <div className="flex min-h-[calc(100dvh-4rem)] flex-col bg-background">
      {/* HEADER SECTION */}
      <div className="sticky top-16 z-30 border-b border-border/80 bg-background/80 backdrop-blur-md">
        <div className="mx-auto flex w-full max-w-4xl items-center justify-between px-4 py-3 sm:px-6">
          <div className="flex items-center gap-3">
            <div className="relative flex size-10 items-center justify-center rounded-xl bg-gradient-to-tr from-primary to-primary/80 text-primary-foreground shadow-md">
              <Bot className="size-5" />
              <span className="absolute -bottom-0.5 -right-0.5 flex size-3 items-center justify-center">
                <span className="absolute inline-flex size-full animate-ping rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex size-2 rounded-full bg-emerald-500 ring-2 ring-background" />
              </span>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-sm font-bold text-foreground sm:text-base">Govra AI Assistant</h1>
                <span className="hidden sm:inline-flex rounded-full bg-primary/10 px-2 py-0.5 text-[11px] font-semibold text-primary">
                  Official 24/7
                </span>
              </div>
              <p className="text-xs text-muted-foreground">
                Asisten Cerdas Proker, Anggaran & Pelaporan Kota
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {turns.length > 0 && (
              <Button
                variant="outline"
                size="sm"
                onClick={handleReset}
                className="h-8 gap-1.5 text-xs text-muted-foreground hover:text-foreground"
                title="Mulai percakapan baru"
              >
                <RotateCcw className="size-3.5" />
                <span className="hidden sm:inline">Percakapan Baru</span>
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* CHAT BODY AREA */}
      <div className="mx-auto flex w-full max-w-4xl flex-1 flex-col px-4 py-4 sm:px-6">
        {turns.length === 0 ? (
          /* EMPTY STATE / WELCOME CARD */
          <div className="my-auto flex flex-col items-center justify-center py-6 text-center">
            <div className="mb-4 flex size-16 items-center justify-center rounded-2xl bg-primary/10 text-primary shadow-inner">
              <Sparkles className="size-8 animate-pulse" />
            </div>

            <h2 className="text-xl font-bold tracking-tight text-foreground sm:text-2xl">
              Halo, SobatGovra!
            </h2>
            <p className="mt-2 max-w-md text-sm leading-relaxed text-muted-foreground">
              Saya adalah asisten kecerdasan buatan resmi Govra. Tanyakan apa saja seputar transparansi program kota dan laporan masyarakat:
            </p>

            {/* 4 CORE CAPABILITIES HIGHLIGHT */}
            <div className="mt-6 grid w-full max-w-lg gap-2.5 text-left text-xs sm:grid-cols-2">
              <div className="flex items-start gap-2.5 rounded-xl border border-border/80 bg-card p-3 shadow-xs">
                <FileText className="size-4 shrink-0 text-primary mt-0.5" />
                <div>
                  <strong className="font-semibold text-foreground">Status Tiket Laporan</strong>
                  <p className="text-[11px] text-muted-foreground">Cek perkembangan & antrean laporan aduan Anda.</p>
                </div>
              </div>

              <div className="flex items-start gap-2.5 rounded-xl border border-border/80 bg-card p-3 shadow-xs">
                <Target className="size-4 shrink-0 text-blue-500 mt-0.5" />
                <div>
                  <strong className="font-semibold text-foreground">Proker & Anggaran</strong>
                  <p className="text-[11px] text-muted-foreground">Cek progres fisik proyek pemda dan anggarannya.</p>
                </div>
              </div>

              <div className="flex items-start gap-2.5 rounded-xl border border-border/80 bg-card p-3 shadow-xs">
                <AlertTriangle className="size-4 shrink-0 text-amber-500 mt-0.5" />
                <div>
                  <strong className="font-semibold text-foreground">Isu Paling Urgent</strong>
                  <p className="text-[11px] text-muted-foreground">Ketahui masalah darurat dengan pelapor terbanyak.</p>
                </div>
              </div>

              <div className="flex items-start gap-2.5 rounded-xl border border-border/80 bg-card p-3 shadow-xs">
                <MapPin className="size-4 shrink-0 text-emerald-500 mt-0.5" />
                <div>
                  <strong className="font-semibold text-foreground">Status Masalah Lokasi</strong>
                  <p className="text-[11px] text-muted-foreground">Cek perbaikan jalan/fasilitas di daerah tertentu.</p>
                </div>
              </div>
            </div>

            {/* QUICK SUGGESTIONS */}
            <div className="mt-8 flex w-full max-w-lg flex-col gap-2">
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Pertanyaan Cepat
              </p>
              <div className="flex flex-wrap justify-center gap-2">
                {visibleSuggestions.map((item) => {
                  const ItemIcon = item.icon;
                  return (
                    <button
                      key={item.label}
                      type="button"
                      onClick={() => submitQuery(item.query)}
                      className="flex items-center gap-1.5 rounded-lg border border-border/80 bg-card px-3 py-2 text-xs font-medium text-foreground transition-all duration-150 hover:border-primary/60 hover:bg-muted hover:shadow-xs active:scale-98 cursor-pointer"
                    >
                      <ItemIcon className="size-3.5 text-primary" />
                      <span>{item.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        ) : (
          /* CHAT MESSAGES LIST */
          <div className="flex flex-col gap-5 pb-6">
            {turns.map((turn) => {
              const isUser = turn.role === "USER";
              return (
                <div
                  key={turn.id}
                  className={cn("flex w-full gap-3", isUser ? "justify-end" : "justify-start")}
                >
                  {!isUser && (
                    <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary border border-primary/20">
                      <Bot className="size-4" />
                    </div>
                  )}

                  <div
                    className={cn(
                      "flex max-w-[88%] sm:max-w-[80%] flex-col gap-2 rounded-2xl px-4 py-3 text-sm shadow-xs",
                      isUser
                        ? "bg-primary text-primary-foreground rounded-tr-xs"
                        : "border border-border/80 bg-card text-foreground rounded-tl-xs",
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
                    <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-muted text-muted-foreground border border-border">
                      <User className="size-4" />
                    </div>
                  )}
                </div>
              );
            })}

            {/* PENDING INDICATOR */}
            {pending && (
              <div className="flex w-full items-start gap-3">
                <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary border border-primary/20">
                  <Bot className="size-4" />
                </div>
                <div className="flex items-center gap-2 rounded-2xl border border-border/80 bg-card px-4 py-3 text-xs text-muted-foreground shadow-xs rounded-tl-xs">
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

      {/* INPUT AREA (STICKY BOTTOM) */}
      <div className="sticky bottom-0 z-30 border-t border-border/80 bg-background/90 p-3 backdrop-blur-md sm:p-4">
        <div className="mx-auto max-w-4xl">
          <form onSubmit={onSubmit} className="relative flex items-center gap-2">
            <input
              ref={inputRef}
              type="text"
              value={input}
              maxLength={MAX_QUESTION_LENGTH}
              onChange={(e) => setInput(e.target.value)}
              disabled={pending}
              placeholder="Tanyakan status tiket, proker daerah, atau masalah jalan rusak..."
              className="h-12 w-full rounded-xl border border-border/80 bg-card px-4 pr-12 text-sm text-foreground shadow-xs transition-colors placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary disabled:opacity-50"
            />

            <button
              type="submit"
              disabled={!input.trim() || pending}
              aria-label="Kirim pertanyaan"
              className="absolute right-1.5 top-1/2 -translate-y-1/2 flex size-9 items-center justify-center rounded-lg bg-primary text-primary-foreground transition-all duration-150 hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-40"
            >
              {pending ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <Send className="size-4" />
              )}
            </button>
          </form>

          <p className="mt-2 text-center text-[11px] text-muted-foreground">
            Govra AI memberikan informasi berdasarkan data resmi proker, anggaran, dan laporan sistem.
          </p>
        </div>
      </div>
    </div>
  );
}
