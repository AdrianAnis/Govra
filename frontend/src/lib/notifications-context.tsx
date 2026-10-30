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
  deleteNotification: (id: string) => void;
  clearAllNotifications: () => void;
  refresh: () => Promise<void>;
  loading: boolean;
}

const NotificationsContext = createContext<NotificationsContextValue | null>(null);

const STORAGE_VISITED_KEY = "govra_tab_visited_v1";
const STORAGE_READ_KEY = "govra_read_notifications_v1";
const STORAGE_DELETED_KEY = "govra_deleted_notifications_v1";

export function NotificationsProvider({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const [feed, setFeed] = useState<NotificationFeed>({
    items: [],
    unreadCount: 0,
    tabActivity: {},
  });
  const [visitedTabs, setVisitedTabs] = useState<Record<string, number>>({});
  const [readIds, setReadIds] = useState<Set<string>>(new Set());
  const [deletedIds, setDeletedIds] = useState<Set<string>>(new Set());
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
      const storedDeleted = localStorage.getItem(STORAGE_DELETED_KEY);
      if (storedDeleted) {
        setDeletedIds(new Set(JSON.parse(storedDeleted)));
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

    setReadIds((prev) => {
      const updated = new Set(prev);
      for (const item of feed.items) {
        if (item.tabKey === tabHref) {
          updated.add(item.id);
        }
      }
      try {
        localStorage.setItem(STORAGE_READ_KEY, JSON.stringify(Array.from(updated)));
      } catch {}
      return updated;
    });
  }, [feed.items]);

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
    for (const item of feed.items) {
      if (item.tabKey) {
        newVisited[item.tabKey] = now;
      }
    }
    setVisitedTabs((prev) => {
      const updated = { ...prev, ...newVisited };
      try {
        localStorage.setItem(STORAGE_VISITED_KEY, JSON.stringify(updated));
      } catch {}
      return updated;
    });
  }, [feed]);

  const deleteNotification = useCallback((id: string) => {
    setDeletedIds((prev) => {
      const updated = new Set(prev);
      updated.add(id);
      try {
        localStorage.setItem(STORAGE_DELETED_KEY, JSON.stringify(Array.from(updated)));
      } catch {}
      return updated;
    });
  }, []);

  const clearAllNotifications = useCallback(() => {
    setDeletedIds((prev) => {
      const updated = new Set(prev);
      for (const item of feed.items) {
        updated.add(item.id);
      }
      try {
        localStorage.setItem(STORAGE_DELETED_KEY, JSON.stringify(Array.from(updated)));
      } catch {}
      return updated;
    });
  }, [feed.items]);

  const activeItems = feed.items.filter((item) => !deletedIds.has(item.id));

  const notificationsWithReadState = activeItems.map((item) => {
    if (readIds.has(item.id)) {
      return { ...item, unread: false };
    }
    const lastVisited = visitedTabs[item.tabKey] ?? 0;
    const itemTime = new Date(item.timestamp).getTime();
    if (lastVisited >= itemTime) {
      return { ...item, unread: false };
    }
    return { ...item, unread: true };
  });

  const dynamicUnreadCount = notificationsWithReadState.filter((i) => i.unread).length;

  const hasTabUnread = useCallback(
    (tabHref: string): boolean => {
      return notificationsWithReadState.some((item) => item.tabKey === tabHref && item.unread);
    },
    [notificationsWithReadState],
  );

  return (
    <NotificationsContext.Provider
      value={{
        notifications: notificationsWithReadState,
        unreadCount: dynamicUnreadCount,
        hasTabUnread,
        markTabVisited,
        markAsRead,
        markAllAsRead,
        deleteNotification,
        clearAllNotifications,
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
      deleteNotification: () => {},
      clearAllNotifications: () => {},
      refresh: async () => {},
      loading: false,
    };
  }
  return ctx;
}
