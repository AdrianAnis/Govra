"use client";

import { useEffect, useState } from "react";
import { Users } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { formatRelativeTime } from "@/lib/format";
import { fetchSupporters, type SupporterItem } from "@/lib/data/feeds";

interface SupportersDialogProps {
  feedId: string | null;
  reportTitle?: string | undefined;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function SupportersDialog({
  feedId,
  reportTitle,
  open,
  onOpenChange,
}: SupportersDialogProps) {
  const [supporters, setSupporters] = useState<SupporterItem[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!open || !feedId) return;
    let active = true;
    fetchSupporters(feedId)
      .then((items) => {
        if (active) {
          setSupporters(items);
          setLoading(false);
        }
      })
      .catch(() => {
        if (active) {
          setLoading(false);
        }
      });
    return () => {
      active = false;
    };
  }, [open, feedId]);

  const now = new Date();

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <div className="flex items-center gap-2.5">
            <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-primary-soft text-primary">
              <Users className="size-4" />
            </div>
            <div>
              <DialogTitle>Warga Pendukung</DialogTitle>
              <DialogDescription className="line-clamp-1">
                {reportTitle ? `Laporan: ${reportTitle}` : "Daftar warga yang memperkuat urgensi laporan ini"}
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="flex max-h-72 flex-col gap-2 overflow-y-auto pr-1">
          {loading ? (
            <div className="flex items-center justify-center py-8 text-fg-muted">
              <div className="size-5 animate-spin rounded-full border-2 border-primary border-t-transparent" />
            </div>
          ) : supporters.length === 0 ? (
            <div className="py-8 text-center text-fg-muted">
              <p className="text-sm">Belum ada warga yang mendukung secara publik.</p>
              <p className="text-xs text-fg-subtle mt-1">Jadilah warga pertama yang memberikan dukungan!</p>
            </div>
          ) : (
            supporters.map((item) => (
              <div
                key={item.id}
                className="flex items-center justify-between rounded-md border border-border bg-surface px-3 py-2 text-sm"
              >
                <div className="flex items-center gap-2.5">
                  <div className="flex size-7 shrink-0 items-center justify-center rounded-full bg-secondary text-xs font-semibold text-secondary-fg">
                    {item.supporter_name.charAt(0).toUpperCase()}
                  </div>
                  <span className="font-medium text-fg">{item.supporter_name}</span>
                </div>
                <span className="text-xs text-fg-subtle tabular-nums">
                  {formatRelativeTime(item.created_at, now)}
                </span>
              </div>
            ))
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
