"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { MessageCircle } from "lucide-react";

export function LazyChatWidget({ signedIn }: { signedIn: boolean }) {
  const pathname = usePathname();

  // Jangan tampilkan tombol melayang jika sudah berada di halaman /asisten
  if (pathname === "/asisten") {
    return null;
  }

  return (
    <Link
      href="/asisten"
      aria-label="Buka asisten Govra"
      className="fixed right-4 bottom-20 z-40 inline-flex size-12 sm:size-auto sm:h-14 items-center justify-center gap-2 rounded-full bg-secondary font-semibold text-secondary-fg shadow-lg transition-colors duration-200 ease-ui hover:bg-primary sm:right-6 sm:bottom-6 sm:px-6"
    >
      <MessageCircle aria-hidden className="size-5" />
      <span className="max-sm:sr-only text-sm font-semibold">Tanya Govra</span>
    </Link>
  );
}
