export interface FeedItem {
  id: string;
  author_id: string;
  author_name: string;
  author_avatar?: string;
  report_id?: string;
  report_code?: string;
  issue_id?: string;
  issue_title?: string;
  issue_urgency?: string;
  status?: string;
  hide_reason?: string;
  location?: string;
  content: string;
  media_type: "IMAGE" | "VIDEO" | "REEL";
  media_url: string;
  media_urls?: string[];
  likes_count: number;
  shares_count: number;
  support_count: number;
  comments_count: number;
  is_liked: boolean;
  is_supported: boolean;
  created_at: string;
}

export interface CommentItem {
  id: string;
  feed_id: string;
  user_id: string;
  author_name: string;
  content: string;
  created_at: string;
}

export interface SupporterItem {
  id: string;
  feed_id: string;
  user_id: string;
  supporter_name: string;
  created_at: string;
}

export interface CreateFeedPayload {
  report_id?: string | undefined;
  issue_id?: string | undefined;
  content: string;
  media_type?: ("IMAGE" | "VIDEO" | "REEL") | undefined;
  media_url: string;
}

export async function fetchFeeds(tab: "trending" | "latest" = "trending"): Promise<FeedItem[]> {
  try {
    const res = await fetch(`/api/feeds?tab=${encodeURIComponent(tab)}`, {
      method: "GET",
      cache: "no-store",
    });
    if (!res.ok) return [];
    const data = await res.json();
    return Array.isArray(data.items) ? data.items : [];
  } catch {
    return [];
  }
}

export async function toggleLikeFeed(id: string): Promise<{ liked: boolean; likes_count: number }> {
  const res = await fetch(`/api/feeds/${encodeURIComponent(id)}/like`, {
    method: "POST",
  });
  if (res.status === 401) {
    if (typeof window !== "undefined") {
      window.location.href = `/masuk?kembali=${encodeURIComponent(window.location.pathname)}`;
    }
    throw new Error("Wajib masuk terlebih dahulu");
  }
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.message || "Gagal menyukai postingan");
  }
  return res.json();
}

export async function toggleSupportFeed(id: string): Promise<{ supported: boolean; support_count: number }> {
  const res = await fetch(`/api/feeds/${encodeURIComponent(id)}/support`, {
    method: "POST",
  });
  if (res.status === 401) {
    if (typeof window !== "undefined") {
      window.location.href = `/masuk?kembali=${encodeURIComponent(window.location.pathname)}`;
    }
    throw new Error("Wajib masuk terlebih dahulu");
  }
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.message || "Gagal mendukung laporan");
  }
  return res.json();
}

export async function fetchComments(id: string): Promise<CommentItem[]> {
  try {
    const res = await fetch(`/api/feeds/${encodeURIComponent(id)}/comments`, {
      method: "GET",
      cache: "no-store",
    });
    if (!res.ok) return [];
    const data = await res.json();
    return Array.isArray(data.items) ? data.items : [];
  } catch {
    return [];
  }
}

export async function postComment(id: string, content: string): Promise<CommentItem> {
  const res = await fetch(`/api/feeds/${encodeURIComponent(id)}/comments`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ content }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.message || "Gagal mengirim komentar");
  }
  return res.json();
}

export async function fetchSupporters(id: string): Promise<SupporterItem[]> {
  try {
    const res = await fetch(`/api/feeds/${encodeURIComponent(id)}/supporters`, {
      method: "GET",
      cache: "no-store",
    });
    if (!res.ok) return [];
    const data = await res.json();
    return Array.isArray(data.items) ? data.items : [];
  } catch {
    return [];
  }
}

export async function shareFeed(id: string): Promise<{ shares_count: number }> {
  const res = await fetch(`/api/feeds/${encodeURIComponent(id)}/share`, {
    method: "POST",
  });
  if (!res.ok) {
    return { shares_count: 0 };
  }
  return res.json();
}

export async function createFeed(payload: CreateFeedPayload): Promise<FeedItem> {
  const res = await fetch("/api/feeds", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.message || "Gagal membuat postingan");
  }
  return res.json();
}
