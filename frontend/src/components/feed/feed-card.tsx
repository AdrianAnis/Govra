"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { Heart, MessageSquare, Share2, Users } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { FeedComments } from "@/components/feed/feed-comments";
import { SupportersDialog } from "@/components/feed/supporters-dialog";
import { formatRelativeTime } from "@/lib/format";
import {
  shareFeed,
  toggleLikeFeed,
  toggleSupportFeed,
  type FeedItem,
} from "@/lib/data/feeds";
import { cn } from "@/lib/utils";

interface FeedCardProps {
  item: FeedItem;
  now: Date;
}

function renderStatusBadge(status?: string) {
  switch (status) {
    case "SELESAI":
      return (
        <span className="inline-flex items-center rounded-md px-2 py-0.5 text-[11px] sm:text-xs font-semibold bg-emerald-100 text-emerald-800 border border-emerald-300">
          Selesai
        </span>
      );
    case "DITOLAK":
      return (
        <span className="inline-flex items-center rounded-md px-2 py-0.5 text-[11px] sm:text-xs font-semibold bg-red-100 text-red-800 border border-red-300">
          Ditolak
        </span>
      );
    case "DITERUSKAN":
      return (
        <span className="inline-flex items-center rounded-md px-2 py-0.5 text-[11px] sm:text-xs font-semibold bg-blue-100 text-blue-800 border border-blue-300">
          Diteruskan
        </span>
      );
    case "DALAM_PENANGANAN":
    case "DIPROSES":
      return (
        <span className="inline-flex items-center rounded-md px-2 py-0.5 text-[11px] sm:text-xs font-semibold bg-indigo-100 text-indigo-800 border border-indigo-300">
          Dalam Penanganan
        </span>
      );
    case "DIAJUKAN":
    case "MENUNGGU_VERIFIKASI":
      return (
        <span className="inline-flex items-center rounded-md px-2 py-0.5 text-[11px] sm:text-xs font-semibold bg-amber-100 text-amber-800 border border-amber-300">
          Diajukan
        </span>
      );
    default:
      return (
        <span className="inline-flex items-center rounded-md px-2 py-0.5 text-[11px] sm:text-xs font-semibold bg-zinc-100 text-zinc-800 border border-zinc-300">
          {status || "Laporan"}
        </span>
      );
  }
}

export function FeedCard({ item, now }: FeedCardProps) {
  const [liked, setLiked] = useState(item.is_liked);
  const [likesCount, setLikesCount] = useState(item.likes_count);
  const [supported, setSupported] = useState(item.is_supported);
  const [supportCount, setSupportCount] = useState(item.support_count);
  const [commentsCount, setCommentsCount] = useState(item.comments_count);
  const [showComments, setShowComments] = useState(false);
  const [showSupporters, setShowSupporters] = useState(false);
  const [supporting, setSupporting] = useState(false);
  const [liking, setLiking] = useState(false);
  const [copied, setCopied] = useState(false);

  const [activePhotoModalIndex, setActivePhotoModalIndex] = useState<number | null>(null);

  const photos =
    item.media_urls && item.media_urls.length > 0
      ? item.media_urls
      : item.media_url
        ? [item.media_url]
        : [];

  const handleLike = async () => {
    if (liking) return;
    const nextState = !liked;
    setLiked(nextState);
    setLikesCount((prev) => (nextState ? prev + 1 : Math.max(0, prev - 1)));
    setLiking(true);

    try {
      const res = await toggleLikeFeed(item.id);
      setLiked(res.liked);
      setLikesCount(res.likes_count);
    } catch {
      setLiked(!nextState);
      setLikesCount((prev) => (!nextState ? prev + 1 : Math.max(0, prev - 1)));
    } finally {
      setLiking(false);
    }
  };

  const handleSupport = async () => {
    if (supporting) return;
    const nextState = !supported;
    setSupported(nextState);
    setSupportCount((prev) => (nextState ? prev + 1 : Math.max(0, prev - 1)));
    setSupporting(true);

    try {
      const res = await toggleSupportFeed(item.id);
      setSupported(res.supported);
      setSupportCount(res.support_count);
    } catch {
      setSupported(!nextState);
      setSupportCount((prev) => (!nextState ? prev + 1 : Math.max(0, prev - 1)));
    } finally {
      setSupporting(false);
    }
  };

  const handleShare = async () => {
    try {
      await shareFeed(item.id);
    } catch { }

    const shareUrl =
      typeof window !== "undefined"
        ? `${window.location.origin}/pelapor/laporan/${item.report_code || item.id}`
        : "";

    if (typeof navigator !== "undefined" && navigator.share) {
      try {
        await navigator.share({
          title: item.issue_title || "Laporan Warga di Govra",
          text: item.content,
          url: shareUrl,
        });
        return;
      } catch { }
    }

    if (typeof navigator !== "undefined" && navigator.clipboard) {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const isUrgent = item.issue_urgency === "URGENT" || supportCount >= 20;
  const isDone = item.status === "SELESAI";
  const isRejected = item.status === "DITOLAK";

  return (
    <>
      <article
        id={item.id}
        className="flex flex-col overflow-hidden rounded-lg border border-border bg-surface shadow-xs transition-colors hover:border-border-strong"
      >
        <div className="flex flex-col gap-3 p-3.5 sm:p-5">
          <div className="flex items-start justify-between gap-2.5">
            <div className="flex items-start gap-2.5 sm:gap-3 min-w-0">
              <div className="flex size-9 sm:size-10 shrink-0 items-center justify-center rounded-full bg-secondary text-xs sm:text-sm font-bold text-secondary-fg">
                {item.author_name.charAt(0).toUpperCase()}
              </div>
              <div className="flex flex-col min-w-0">
                <div className="flex items-center gap-1.5 flex-wrap">
                  <span className="font-semibold text-fg text-sm truncate max-w-[150px] sm:max-w-xs">
                    {item.author_name}
                  </span>
                  {item.report_code && (
                    <Link
                      href={`/pelapor/laporan/${item.report_code}`}
                      className="rounded bg-primary-soft px-1.5 py-0.5 text-[11px] font-mono font-semibold text-primary hover:underline"
                    >
                      #{item.report_code}
                    </Link>
                  )}
                </div>
                <div className="flex flex-col sm:flex-row sm:items-center gap-0.5 sm:gap-2 text-[11px] sm:text-xs text-fg-muted mt-0.5">
                  <span className="tabular-nums shrink-0">{formatRelativeTime(item.created_at, now)}</span>
                  {item.location && (
                    <>
                      <span className="hidden sm:inline">•</span>
                      <span className="truncate max-w-[200px] sm:max-w-sm">Lokasi: {item.location}</span>
                    </>
                  )}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-1.5 shrink-0 justify-end">
              {isUrgent && (
                <Badge weight="serius" className="text-[11px] sm:text-xs font-semibold px-2 py-0.5">
                  Mendesak
                </Badge>
              )}
              {renderStatusBadge(item.status)}
            </div>
          </div>

          {item.issue_title && (
            <h3 className="text-sm sm:text-base font-bold text-fg tracking-tight leading-snug">
              {item.issue_title}
            </h3>
          )}

          <p className="text-xs sm:text-sm text-fg leading-relaxed whitespace-pre-line break-words">
            {item.content}
          </p>

          {isRejected && (
            <div className="flex flex-col gap-1.5 rounded-lg bg-red-50 p-3 sm:p-3.5 shadow-2xs">
              <div className="flex items-center gap-1.5 font-bold text-xs sm:text-sm text-red-900">
                <span>Laporan Ditolak</span>
              </div>
              <p className="text-xs font-medium text-red-800 bg-red-50 leading-relaxed">
                Laporan ini tidak dapat diteruskan ke dinas terkait dan telah ditolak oleh Administrator Pusat.
              </p>
              {item.hide_reason && (
                <div className="mt-1 rounded-md  bg-white p-2.5 shadow-2xs">
                  <span className="text-[12px] font-bold  shrink-0 text-red-600">
                    Alasan Penolakan:
                  </span>
                  <p className="text-xs font-semibold text-zinc-900 mt-0.5 leading-relaxed break-words">
                    {item.hide_reason}
                  </p>
                </div>
              )}
            </div>
          )}

          {(item.status === "DIPROSES" || item.status === "DALAM_PENANGANAN") && (
            <div className="flex flex-col gap-1.5 rounded-lg border border-primary/30 bg-primary-soft p-3 sm:p-3.5 shadow-2xs">
              <div className="flex items-center gap-2 font-bold text-xs sm:text-sm text-secondary">
                <span className="flex size-2 rounded-full bg-primary animate-pulse" />
                <span>Sedang Dikerjakan oleh Dinas</span>
              </div>
              <p className="text-xs font-medium text-secondary/90 leading-relaxed">
                Isu ini telah masuk tahap proses pengerjaan teknis di lapangan.
              </p>
              {item.action_note && (
                <div className="mt-1 rounded-md bg-white p-2.5 shadow-2xs">
                  <span className="text-[11px] font-bold text-primary block">
                    Jadwal Pengerjaan:
                  </span>
                  <p className="text-xs font-semibold text-zinc-900 mt-0.5 leading-relaxed whitespace-pre-line break-words">
                    {item.action_note}
                  </p>
                </div>
              )}
            </div>
          )}

          {photos.length > 0 && (
            <div className="flex flex-col gap-1.5 pt-1">
              {photos.length === 1 && photos[0] ? (
                <button
                  type="button"
                  onClick={() => setActivePhotoModalIndex(0)}
                  className="group relative w-full overflow-hidden rounded-md border border-border bg-surface-muted aspect-16/9 sm:aspect-16/10 text-left focus:outline-none focus:ring-2 focus:ring-primary"
                >
                  <Image
                    src={photos[0]}
                    alt={item.issue_title || "Dokumentasi Laporan"}
                    fill
                    unoptimized
                    className="object-cover transition-transform duration-300 group-hover:scale-102"
                    sizes="(max-width: 768px) 100vw, 640px"
                  />
                  <div className="absolute bottom-2 right-2 rounded bg-black/60 px-2 py-1 text-[10px] sm:text-[11px] font-medium text-white backdrop-blur-xs">
                    Klik untuk memperbesar
                  </div>
                </button>
              ) : photos.length === 2 ? (
                <div className="grid grid-cols-2 gap-1.5 sm:gap-2">
                  {photos.map((src, idx) => (
                    <button
                      key={src + idx}
                      type="button"
                      onClick={() => setActivePhotoModalIndex(idx)}
                      className="group relative aspect-4/3 w-full overflow-hidden rounded-md border border-border bg-surface-muted focus:outline-none focus:ring-2 focus:ring-primary"
                    >
                      <Image
                        src={src}
                        alt={`${item.issue_title || "Foto Laporan"} ${idx + 1}`}
                        fill
                        unoptimized
                        className="object-cover transition-transform duration-300 group-hover:scale-102"
                        sizes="(max-width: 768px) 50vw, 320px"
                      />
                    </button>
                  ))}
                </div>
              ) : (
                <div className="flex flex-col gap-1.5">
                  <div className="grid grid-cols-3 gap-1.5 sm:gap-2">
                    {photos.slice(0, 3).map((src, idx) => (
                      <button
                        key={src + idx}
                        type="button"
                        onClick={() => setActivePhotoModalIndex(idx)}
                        className="group relative aspect-square w-full overflow-hidden rounded-md border border-border bg-surface-muted focus:outline-none focus:ring-2 focus:ring-primary"
                      >
                        <Image
                          src={src}
                          alt={`${item.issue_title || "Foto Laporan"} ${idx + 1}`}
                          fill
                          unoptimized
                          className="object-cover transition-transform duration-300 group-hover:scale-102"
                          sizes="(max-width: 768px) 33vw, 210px"
                        />
                        {idx === 2 && photos.length > 3 && (
                          <div className="absolute inset-0 flex items-center justify-center bg-black/60 font-semibold text-white text-xs sm:text-sm">
                            +{photos.length - 3} Foto
                          </div>
                        )}
                      </button>
                    ))}
                  </div>
                  <div className="text-right text-[10px] sm:text-[11px] text-fg-muted font-medium">
                    Total {photos.length} foto • Ketuk untuk melihat semua
                  </div>
                </div>
              )}
            </div>
          )}

          <div className="flex flex-col gap-2.5 pt-2">
            <div className="flex items-center justify-between gap-2 border-b border-border/70 pb-2.5 text-xs text-fg-muted">
              <button
                type="button"
                onClick={() => setShowSupporters(true)}
                className="group inline-flex items-center gap-1.5 hover:text-primary transition-colors text-left"
              >
                <Users className="size-3.5 text-primary shrink-0 transition-transform group-hover:scale-110" />
                <span className="font-semibold text-fg tabular-nums">{supportCount}</span>
                <span>warga mendukung</span>
                <span className="text-[11px] text-primary underline ml-0.5">Lihat</span>
              </button>

              <div className="flex items-center gap-2 tabular-nums text-[11px] sm:text-xs">
                <span>{likesCount} suka</span>
                <span>•</span>
                <span>{commentsCount} tanggapan</span>
              </div>
            </div>

            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-1 sm:gap-3">
                <button
                  type="button"
                  onClick={handleLike}
                  disabled={liking}
                  aria-label="Suka atau batal suka laporan"
                  className={cn(
                    "inline-flex items-center gap-1.5 px-2 py-1.5 rounded-md text-xs sm:text-sm font-medium transition-all active:scale-95",
                    liked
                      ? "text-red-600 bg-red-50/60 font-semibold"
                      : "text-fg-muted hover:text-red-500 hover:bg-surface-muted",
                  )}
                >
                  <Heart
                    className={cn(
                      "size-4 sm:size-5 transition-transform",
                      liked ? "fill-red-500 text-red-500 scale-110" : "text-fg-muted",
                    )}
                  />
                  <span className="tabular-nums font-semibold">{likesCount}</span>
                </button>

                <button
                  type="button"
                  onClick={() => setShowComments(!showComments)}
                  aria-label="Tanggapan laporan"
                  className={cn(
                    "inline-flex items-center gap-1.5 px-2 py-1.5 rounded-md text-xs sm:text-sm font-medium transition-all active:scale-95",
                    showComments
                      ? "text-primary bg-primary-soft font-semibold"
                      : "text-fg-muted hover:text-primary hover:bg-surface-muted",
                  )}
                >
                  <MessageSquare className="size-4 sm:size-5 transition-transform" />
                  <span className="tabular-nums font-semibold">{commentsCount}</span>
                </button>

                <button
                  type="button"
                  onClick={handleShare}
                  aria-label="Bagikan tautan laporan"
                  className="inline-flex items-center gap-1.5 px-2 py-1.5 rounded-md text-xs sm:text-sm font-medium text-fg-muted hover:text-fg hover:bg-surface-muted transition-all active:scale-95"
                >
                  <Share2 className="size-4 sm:size-5" />
                  <span className="text-[11px] sm:text-xs font-medium">
                    {copied ? "Disalin!" : "Bagikan"}
                  </span>
                </button>
              </div>

              {isDone ? (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  disabled
                  className="h-9 px-3 sm:px-4 font-semibold text-xs sm:text-sm bg-emerald-50 border border-emerald-300 text-emerald-800 cursor-default shrink-0"
                >
                  Selesai Ditangani ({supportCount})
                </Button>
              ) : isRejected ? (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  disabled
                  className="h-9 px-3 sm:px-4 font-semibold text-xs sm:text-sm bg-red-50 border border-red-300 text-red-800 cursor-default shrink-0"
                >
                  Laporan Ditolak
                </Button>
              ) : (
                <Button
                  type="button"
                  variant={supported ? "primary" : "outline"}
                  size="sm"
                  onClick={handleSupport}
                  disabled={supporting}
                  className={cn(
                    "h-9 px-3 sm:px-4 font-semibold text-xs sm:text-sm transition-all shrink-0 active:scale-98",
                    supported
                      ? "bg-primary text-primary-fg shadow-xs"
                      : "border border-border-strong text-fg hover:border-primary hover:text-primary hover:bg-surface-muted",
                  )}
                >
                  {supported ? `Didukung (${supportCount})` : `Dukung Isu (${supportCount})`}
                </Button>
              )}
            </div>
          </div>
        </div>

        {showComments && (
          <FeedComments
            feedId={item.id}
            onCommentAdded={() => setCommentsCount((prev) => prev + 1)}
          />
        )}
      </article>

      <SupportersDialog
        feedId={item.id}
        reportTitle={item.issue_title}
        open={showSupporters}
        onOpenChange={setShowSupporters}
      />

      {activePhotoModalIndex !== null && photos.length > 0 && (
        <Dialog open={true} onOpenChange={() => setActivePhotoModalIndex(null)}>
          <DialogContent className="max-w-3xl p-3 sm:p-6">
            <DialogHeader>
              <div className="flex items-center justify-between pr-6">
                <DialogTitle className="text-sm sm:text-base font-semibold truncate max-w-[240px] sm:max-w-md">
                  {item.issue_title || "Dokumentasi Laporan"}
                </DialogTitle>
                <span className="text-xs text-fg-muted tabular-nums font-medium">
                  Foto {activePhotoModalIndex + 1} dari {photos.length}
                </span>
              </div>
            </DialogHeader>

            <div className="relative mt-2 aspect-16/9 w-full overflow-hidden rounded-md bg-black">
              {photos[activePhotoModalIndex] && (
                <Image
                  src={photos[activePhotoModalIndex]}
                  alt={`Foto ${activePhotoModalIndex + 1}`}
                  fill
                  unoptimized
                  className="object-contain"
                />
              )}
            </div>

            {photos.length > 1 && (
              <div className="flex items-center justify-between gap-2 pt-3">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() =>
                    setActivePhotoModalIndex((prev) =>
                      prev !== null && prev > 0 ? prev - 1 : photos.length - 1,
                    )
                  }
                  className="text-xs px-2.5 h-8"
                >
                  Sebelumnya
                </Button>

                <div className="flex items-center gap-1.5 overflow-x-auto py-1 max-w-[160px] sm:max-w-xs">
                  {photos.map((src, idx) => (
                    <button
                      key={src + idx}
                      type="button"
                      onClick={() => setActivePhotoModalIndex(idx)}
                      className={cn(
                        "relative size-9 sm:size-11 shrink-0 overflow-hidden rounded border focus:outline-none",
                        activePhotoModalIndex === idx
                          ? "border-primary ring-2 ring-primary"
                          : "border-border opacity-70 hover:opacity-100",
                      )}
                    >
                      <Image
                        src={src}
                        alt={`Thumbnail ${idx + 1}`}
                        fill
                        unoptimized
                        className="object-cover"
                      />
                    </button>
                  ))}
                </div>

                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() =>
                    setActivePhotoModalIndex((prev) =>
                      prev !== null && prev < photos.length - 1 ? prev + 1 : 0,
                    )
                  }
                  className="text-xs px-2.5 h-8"
                >
                  Selanjutnya
                </Button>
              </div>
            )}
          </DialogContent>
        </Dialog>
      )}
    </>
  );
}
