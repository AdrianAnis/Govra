"use client";

import { useEffect, useState, type FormEvent } from "react";
import { Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { formatRelativeTime } from "@/lib/format";
import { fetchComments, postComment, type CommentItem } from "@/lib/data/feeds";

interface FeedCommentsProps {
  feedId: string;
  onCommentAdded?: () => void;
}

export function FeedComments({ feedId, onCommentAdded }: FeedCommentsProps) {
  const [comments, setComments] = useState<CommentItem[]>([]);
  const [content, setContent] = useState("");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    fetchComments(feedId)
      .then((items) => {
        if (active) {
          setComments(items);
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
  }, [feedId]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!content.trim() || submitting) return;

    setError(null);
    setSubmitting(true);
    try {
      const created = await postComment(feedId, content.trim());
      setComments((prev) => [...prev, created]);
      setContent("");
      onCommentAdded?.();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Gagal mengirim komentar");
    } finally {
      setSubmitting(false);
    }
  };

  const now = new Date();

  return (
    <div className="flex flex-col gap-3 border-t border-border bg-surface-muted/30 p-4">
      <div className="flex flex-col gap-2.5">
        {loading ? (
          <div className="flex items-center justify-center py-4 text-fg-muted">
            <div className="size-4 animate-spin rounded-full border-2 border-primary border-t-transparent" />
          </div>
        ) : comments.length === 0 ? (
          <p className="py-2 text-center text-xs text-fg-muted">
            Belum ada tanggapan. Berikan tanggapan untuk laporan ini.
          </p>
        ) : (
          comments.map((cm) => (
            <div key={cm.id} className="flex gap-2.5 text-xs">
              <div className="flex size-6 shrink-0 items-center justify-center rounded-full bg-secondary text-[10px] font-bold text-secondary-fg">
                {cm.author_name.charAt(0).toUpperCase()}
              </div>
              <div className="flex flex-1 flex-col rounded-md border border-border/80 bg-surface px-3 py-2">
                <div className="flex items-center justify-between gap-2">
                  <span className="font-semibold text-fg">{cm.author_name}</span>
                  <span className="text-[10px] text-fg-subtle tabular-nums">
                    {formatRelativeTime(cm.created_at, now)}
                  </span>
                </div>
                <p className="mt-1 text-sm text-fg leading-relaxed break-words">{cm.content}</p>
              </div>
            </div>
          ))
        )}
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col gap-1.5 pt-2">
        <div className="flex gap-2">
          <Input
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="Tulis tanggapan warga..."
            maxLength={500}
            disabled={submitting}
            className="h-10 text-xs md:text-sm"
          />
          <Button
            type="submit"
            size="sm"
            disabled={!content.trim() || submitting}
            className="h-10 px-3.5 sm:px-4 shrink-0 font-medium gap-1.5"
          >
            <Send className="size-3.5" />
            <span className="hidden sm:inline">{submitting ? "Mengirim..." : "Kirim"}</span>
          </Button>
        </div>
        {error && <p className="text-xs text-secondary font-medium">{error}</p>}
      </form>
    </div>
  );
}
