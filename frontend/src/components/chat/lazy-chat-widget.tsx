"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Bot, Sparkles } from "lucide-react";

export function LazyChatWidget({ signedIn }: { signedIn: boolean }) {
  const pathname = usePathname();

  // Jangan tampilkan tombol floating jika sudah berada di halaman /asisten
  if (pathname === "/asisten") {
    return null;
  }

  return (
    <Link
      href="/asisten"
      aria-label="Buka Asisten AI Govra"
      className="fixed bottom-6 right-6 z-40 flex items-center gap-2.5 rounded-full bg-primary px-4 py-3 text-primary-foreground shadow-lg transition-all duration-200 hover:scale-105 hover:shadow-xl active:scale-95 group"
    >
      <div className="relative flex size-6 items-center justify-center">
        <Bot className="size-5" />
        <span className="absolute -top-1 -right-1 flex size-2.5">
          <span className="absolute inline-flex size-full animate-ping rounded-full bg-emerald-400 opacity-75" />
          <span className="relative inline-flex size-2.5 rounded-full bg-emerald-500 ring-2 ring-primary" />
        </span>
      </div>
      <span className="text-xs font-semibold tracking-wide">Tanya Govra AI</span>
      <Sparkles className="size-3.5 text-yellow-300 animate-pulse hidden sm:inline" />
    </Link>
  );
}
