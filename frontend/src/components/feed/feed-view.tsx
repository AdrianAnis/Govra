"use client";

import { useState } from "react";
import { RotateCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { FeedCard } from "@/components/feed/feed-card";
import { fetchFeeds, type FeedItem } from "@/lib/data/feeds";
import { cn } from "@/lib/utils";

interface FeedViewProps {
  initialFeeds: FeedItem[];
  nowIso: string;
}

export function FeedView({ initialFeeds, nowIso }: FeedViewProps) {
  const [feeds, setFeeds] = useState<FeedItem[]>(initialFeeds);
  const [loading, setLoading] = useState(false);
  const now = new Date(nowIso);

  const loadFeeds = async () => {
    setLoading(true);
    try {
      const items = await fetchFeeds();
      setFeeds(items);
    } catch {
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between border-b border-border pb-3">
        <div>
          <span className="text-sm font-semibold text-fg">
            Laporan Publik Warga
          </span>
        </div>

        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={loadFeeds}
          disabled={loading}
          className="h-8 text-xs font-medium gap-1.5"
        >
          <RotateCw className={cn("size-3.5", loading && "animate-spin")} />
          <span>Segarkan</span>
        </Button>
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-16 gap-2 text-fg-muted">
          <div className="size-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
          <p className="text-sm">Memuat laporan publik warga...</p>
        </div>
      ) : feeds.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-border py-16 px-4 text-center bg-surface">
          <h3 className="text-base font-semibold text-fg">Belum Ada Laporan Publik</h3>
          <p className="mt-1 text-sm text-fg-muted max-w-sm">
            Semua laporan warga yang berstatus publik akan otomatis tampil di sini secara terpusat.
          </p>
        </div>
      ) : (
        <div className="mx-auto flex w-full max-w-2xl flex-col gap-4">
          {feeds.map((item) => (
            <FeedCard key={item.id} item={item} now={now} />
          ))}
        </div>
      )}
    </div>
  );
}
