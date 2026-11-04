"use client";

import React, { useState, useRef, useEffect, type FormEvent } from "react";
import Link from "next/link";
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
import { Logo } from "@/components/brand/logo";
import { MarkdownLite } from "@/components/chat/markdown-lite";
import { ChatCardList } from "@/components/chat/chat-card";
import { SourceLink } from "@/components/chat/source-link";
import { MAX_MESSAGES, MAX_QUESTION_LENGTH, type ChatTurn } from "@/lib/chat";
import { askAssistant, isRateLimited } from "@/lib/chat-client";
import { cn } from "@/lib/utils";

export interface AssistantPageViewProps {
  signedIn: boolean;
  userName?: string | undefined;
}

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

export function AssistantPageView({ signedIn }: AssistantPageViewProps) {
  const router = useRouter();
  const [turns, setTurns] = useState<ChatTurn[]>([]);
  const [input, setInput] = useState("");
  const [pending, setPending] = useState(false);
  const [errorNotice, setErrorNotice] = useState<string | null>(null);

  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    try {
      localStorage.removeItem("govra_assistant_turns_v3");
      localStorage.removeItem("govra_assistant_turns_v2");
      localStorage.removeItem("govra_assistant_turns_v1");
    } catch { }
  }, []);

  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [turns, pending]);

  useEffect(() => {
    textareaRef.current?.focus();
  }, [pending]);

  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInput(e.target.value);
    const el = e.target;
    el.style.height = "auto";
    const nextHeight = Math.min(el.scrollHeight, 128);
    el.style.height = `${Math.max(38, nextHeight)}px`;
  };

  const onKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      if (input.trim() && !pending) {
        submitQuery(input);
        if (textareaRef.current) {
          textareaRef.current.style.height = "auto";
        }
      }
    }
  };

  const handleReset = () => {
    setTurns([]);
    setInput("");
    setErrorNotice(null);
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.focus();
    }
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
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
    }
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
    if (input.trim() && !pending) {
      submitQuery(input);
      if (textareaRef.current) {
        textareaRef.current.style.height = "auto";
      }
    }
  };

  const visibleSuggestions = SUGGESTIONS.filter((s) => !s.signedInOnly || signedIn);

  return (
    <div className="flex h-dvh w-full max-w-full flex-col bg-background text-foreground overflow-hidden">
      <header className="shrink-0 border-b border-border px-3 sm:px-6 z-30 h-14 sm:h-16 flex items-center w-full max-w-full overflow-hidden">
        <div className="flex items-center justify-between w-full min-w-0">
          <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
            <button
              type="button"
              onClick={handleBack}
              aria-label="Kembali"
              className="flex size-9 shrink-0 items-center justify-center rounded-lg border border-border bg-background text-foreground transition-all duration-150 hover:border-border-strong hover:bg-muted active:scale-95 cursor-pointer"
            >
              <ArrowLeft className="size-4.5" />
            </button>
            <div className="flex items-center gap-2 min-w-0">
              <Link href="/" aria-label="Govra, ke beranda" className="inline-flex items-center shrink-0">
                <Logo className="h-7 sm:h-8" />
              </Link>
              <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[10px] sm:text-xs font-semibold text-primary shrink-0">
                AI
              </span>
            </div>
          </div>

          <div className="flex items-center justify-end shrink-0">
            {turns.length > 0 ? (
              <button
                type="button"
                onClick={handleReset}
                className="flex items-center gap-1.5 rounded-lg border border-border bg-background px-3 py-1.5 text-xs font-medium text-muted-foreground transition-all duration-150 hover:border-border-strong hover:text-foreground hover:bg-muted active:scale-95 shadow-2xs cursor-pointer"
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

      <main className="flex-1 overflow-y-auto overflow-x-hidden px-3 py-4 sm:px-6 w-full max-w-full">
        <div className="mx-auto flex w-full max-w-3xl min-w-0 flex-col min-h-full">
          {turns.length === 0 ? (
            <div className="my-auto flex flex-col items-center justify-center py-8 text-center w-full max-w-full overflow-hidden">

              <h2 className="text-lg font-bold text-foreground sm:text-xl">
                Halo, SobatGovra!
              </h2>
              <p className="mt-1.5 max-w-md text-xs sm:text-sm text-muted-foreground px-4 leading-relaxed">
                Ada yang bisa saya bantu hari ini seputar program kota atau laporan warga Anda?
              </p>

              <div className="mt-6 flex flex-wrap justify-center gap-2 max-w-xl px-2 w-full">
                {visibleSuggestions.map((item) => {
                  const ItemIcon = item.icon;
                  return (
                    <button
                      key={item.label}
                      type="button"
                      onClick={() => submitQuery(item.query)}
                      className="flex items-center gap-1.5 rounded-full border border-border bg-card px-3.5 py-2 text-xs font-medium text-foreground transition-all duration-150 hover:border-border-strong hover:bg-muted active:scale-98 cursor-pointer"
                    >
                      <ItemIcon className="size-3.5 text-primary shrink-0" />
                      <span>{item.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          ) : (
            <div className="flex flex-col gap-4 pb-4 w-full max-w-full overflow-hidden">
              {turns.map((turn) => {
                const isUser = turn.role === "USER";
                return (
                  <div
                    key={turn.id}
                    className={cn("flex w-full min-w-0 gap-2 sm:gap-3 overflow-hidden", isUser ? "justify-end" : "justify-start")}
                  >


                    <div
                      className={cn(
                        "flex min-w-0 flex-col gap-2 rounded-2xl px-3.5 py-2.5 sm:px-4 sm:py-3 text-sm shadow-2xs break-words overflow-hidden",
                        isUser
                          ? "max-w-[85%] sm:max-w-[80%] bg-primary text-primary-foreground rounded-tr-xs"
                          : "max-w-[88%] sm:max-w-[85%] bg-card text-foreground rounded-tl-xs",
                      )}
                    >
                      {isUser ? (
                        <p className="whitespace-pre-wrap leading-relaxed break-words">{turn.content}</p>
                      ) : (
                        <div className="flex flex-col gap-2 w-full min-w-0 max-w-full overflow-hidden">
                          <MarkdownLite text={turn.content} />

                          {turn.cards && turn.cards.length > 0 && (
                            <ChatCardList cards={turn.cards} />
                          )}

                          {turn.sources && turn.sources.length > 0 && (
                            <div className="mt-2 flex flex-col gap-1.5 w-full min-w-0 max-w-full border-t border-border pt-2 text-xs text-muted-foreground">
                              <span className="font-medium text-[11px]">Tautan terkait:</span>
                              {turn.sources.map((s) => (
                                <SourceLink key={s.path} source={s} onNavigate={() => { }} />
                              ))}
                            </div>
                          )}
                        </div>
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

              {pending && (
                <div className="flex w-full min-w-0 items-start gap-2 sm:gap-3 overflow-hidden">
                  <div className="flex size-7 sm:size-8 shrink-0 items-center justify-center rounded-lg bg-muted text-foreground border border-border mt-0.5">
                    <Bot className="size-4" />
                  </div>
                  <div className="flex items-center gap-2 rounded-2xl border border-border bg-card px-3.5 py-2.5 text-xs text-muted-foreground shadow-2xs rounded-tl-xs min-w-0 max-w-[88%] break-words">
                    <Loader2 className="size-3.5 animate-spin text-primary shrink-0" />
                    <span>SobatGovra, mohon tunggu sebentar saya sedang mengecek data...</span>
                  </div>
                </div>
              )}

              {errorNotice && (
                <div className="rounded-xl border border-rose-500/30 bg-rose-500/10 p-3 text-xs text-rose-600 dark:text-rose-400 w-full break-words">
                  {errorNotice}
                </div>
              )}

              <div ref={scrollRef} />
            </div>
          )}
        </div>
      </main>

      <footer className="shrink-0  p-3 sm:p-4 backdrop-blur-md z-30 w-full max-w-full overflow-hidden">
        <div className="mx-auto max-w-3xl w-full">
          <form onSubmit={onSubmit} className="w-full">
            <div className="flex items-center gap-2 rounded-2xl border border-border bg-background px-3.5 py-1.5 transition-colors hover:border-border-strong focus-within:border-border-strong focus-within:outline-none shadow-2xs">
              <textarea
                ref={textareaRef}
                rows={1}
                value={input}
                maxLength={MAX_QUESTION_LENGTH}
                onChange={handleInputChange}
                onKeyDown={onKeyDown}
                disabled={pending}
                placeholder="Ketik pertanyaan atau sapaan..."
                style={{ outline: "none", boxShadow: "none" }}
                className="flex-1 min-h-[38px] max-h-32 resize-none bg-transparent py-2 text-sm text-foreground transition-colors placeholder:text-muted-foreground outline-none border-none focus:outline-none focus:ring-0 focus-visible:outline-none focus-visible:ring-0 [outline:none] focus:[outline:none] disabled:opacity-50 overflow-y-auto leading-relaxed"
              />

              <button
                type="submit"
                disabled={!input.trim() || pending}
                aria-label="Kirim pesan"
                className="flex size-9 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground transition-all duration-150 hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-40 cursor-pointer shadow-xs my-auto"
              >
                {pending ? (
                  <Loader2 className="size-4 animate-spin" />
                ) : (
                  <Send className="size-4" />
                )}
              </button>
            </div>
          </form>

          <p className="mt-2 text-center text-[10.5px] text-muted-foreground">
            Govra AI menjawab berdasarkan data resmi program dan laporan sistem.
          </p>
        </div>
      </footer>
    </div>
  );
}
