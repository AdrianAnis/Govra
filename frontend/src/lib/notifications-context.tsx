"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  type ReactNode,
} from "react";
import { usePathname } from "next/navigation";
import type { NotificationItem, NotificationFeed } from "@/lib/data/notifications";

interface NotificationsContextValue {
  notifications: NotificationItem[];
  unreadCount: number;
  hasTabUnread: (tabHref: string) => boolean;
  markTabVisited: (tabHref: string) => void;
  markAsRead: (id: string) => void;
  markAllAsRead: () => void;
  refresh: () => Promise<void>;
  loading: boolean;
}

const NotificationsContext = createContext<NotificationsContextValue | null>(null);

const STORAGE_VISITED_KEY = "govra_tab_visited_v1";
const STORAGE_READ_KEY = "govra_read_notifications_v1";

export function NotificationsProvider({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const [feed, setFeed] = useState<NotificationFeed>({
    items: [],
    unreadCount: 0,
    tabActivity: {},
  });
  const [visitedTabs, setVisitedTabs] = useState<Record<string, number>>({});
  const [readIds, setReadIds] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    try {
      const storedVisited = localStorage.getItem(STORAGE_VISITED_KEY);
      if (storedVisited) {
        setVisitedTabs(JSON.parse(storedVisited));
      }
      const storedRead = localStorage.getItem(STORAGE_READ_KEY);
      if (storedRead) {
        setReadIds(new Set(JSON.parse(storedRead)));
      }
    } catch {}
  }, []);

  const fetchNotifications = useCallback(async () => {
    try {
      const res = await fetch("/api/notifications", { cache: "no-store" });
      if (res.ok) {
        const data: NotificationFeed = await res.json();
        setFeed(data);
      }
    } catch {
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 30000);
    return () => clearInterval(interval);
  }, [fetchNotifications]);

  const markTabVisited = useCallback((tabHref: string) => {
    const now = Date.now();
    setVisitedTabs((prev) => {
      const updated = { ...prev, [tabHref]: now };
      try {
        localStorage.setItem(STORAGE_VISITED_KEY, JSON.stringify(updated));
      } catch {}
      return updated;
    });
  }, []);

  useEffect(() => {
    if (pathname) {
      markTabVisited(pathname);
    }
  }, [pathname, markTabVisited]);

  const markAsRead = useCallback((id: string) => {
    setReadIds((prev) => {
      const updated = new Set(prev);
      updated.add(id);
      try {
        localStorage.setItem(STORAGE_READ_KEY, JSON.stringify(Array.from(updated)));
      } catch {}
      return updated;
    });
  }, []);

  const markAllAsRead = useCallback(() => {
    const allIds = new Set(feed.items.map((i) => i.id));
    setReadIds(allIds);
    try {
      localStorage.setItem(STORAGE_READ_KEY, JSON.stringify(Array.from(allIds)));
    } catch {}

    const now = Date.now();
    const newVisited: Record<string, number> = {};
    for (const key of Object.keys(feed.tabActivity)) {
      newVisited[key] = now;
    }
    setVisitedTabs((prev) => {
      const updated = { ...prev, ...newVisited };
      try {
        localStorage.setItem(STORAGE_VISITED_KEY, JSON.stringify(updated));
      } catch {}
      return updated;
    });
  }, [feed]);

  const hasTabUnread = useCallback(
    (tabHref: string): boolean => {
      const lastVisited = visitedTabs[tabHref] ?? 0;
      const activityTime = feed.tabActivity[tabHref];
      if (activityTime) {
        const actMs = new Date(activityTime).getTime();
        if (actMs > lastVisited) {
          return true;
        }
      }

      const hasUnreadItem = feed.items.some((item) => {
        if (item.tabKey !== tabHref) return false;
        if (readIds.has(item.id)) return false;
        const itemMs = new Date(item.timestamp).getTime();
        return itemMs > lastVisited;
      });

      return hasUnreadItem;
    },
    [feed, visitedTabs, readIds],
  );

  const notificationsWithReadState = feed.items.map((item) => ({
    ...item,
    unread: (item.unread || !visitedTabs[item.tabKey]) && !readIds.has(item.id),
  }));

  const dynamicUnreadCount = notificationsWithReadState.filter((i) => i.unread).length;

  return (
    <NotificationsContext.Provider
      value={{
        notifications: notificationsWithReadState,
        unreadCount: dynamicUnreadCount,
        hasTabUnread,
        markTabVisited,
        markAsRead,
        markAllAsRead,
        refresh: fetchNotifications,
        loading,
      }}
    >
      {children}
    </NotificationsContext.Provider>
  );
}

export function useNotifications() {
  const ctx = useContext(NotificationsContext);
  if (!ctx) {
    return {
      notifications: [],
      unreadCount: 0,
      hasTabUnread: () => false,
      markTabVisited: () => {},
      markAsRead: () => {},
      markAllAsRead: () => {},
      refresh: async () => {},
      loading: false,
    };
  }
  return ctx;
}
