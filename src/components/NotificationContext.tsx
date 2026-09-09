import { createContext, useContext, useState, useEffect, useCallback, useRef, type ReactNode } from 'react';
import {
  fetchNotifications,
  fetchUnreadCount,
  markNotificationRead,
  markAllNotificationsRead,
  type ApiNotification,
} from '../api';
import { useAuth } from './AuthContext';

interface NotificationContextType {
  items: ApiNotification[];
  unread: number;
  loading: boolean;
  refresh: () => Promise<void>;
  markRead: (id: number) => Promise<void>;
  markAllRead: () => Promise<void>;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

const POLL_INTERVAL = 30_000;

export function NotificationProvider({ children }: { children: ReactNode }) {
  const { isAuthenticated } = useAuth();
  const [items, setItems] = useState<ApiNotification[]>([]);
  const [unread, setUnread] = useState(0);
  const [loading, setLoading] = useState(false);
  const busyRef = useRef(false);

  const refresh = useCallback(async () => {
    if (!isAuthenticated || busyRef.current) return;
    busyRef.current = true;
    setLoading(true);
    try {
      const [feed, count] = await Promise.all([
        fetchNotifications({ page_size: 20 }),
        fetchUnreadCount(),
      ]);
      setItems(feed.items);
      setUnread(count);
    } catch {
      // Keep previous state on transient failures (e.g. offline).
    } finally {
      busyRef.current = false;
      setLoading(false);
    }
  }, [isAuthenticated]);

  // Initial load + lightweight polling for the bell dot.
  useEffect(() => {
    if (!isAuthenticated) {
      setItems([]);
      setUnread(0);
      return;
    }
    refresh();
    const timer = window.setInterval(refresh, POLL_INTERVAL);
    return () => window.clearInterval(timer);
  }, [isAuthenticated, refresh]);

  const markRead = useCallback(async (id: number) => {
    setItems((prev) => prev.map((n) => (n.id === id ? { ...n, is_read: true } : n)));
    setUnread((prev) => Math.max(0, prev - items.filter((n) => n.id === id && !n.is_read).length));
    try {
      await markNotificationRead(id);
      const count = await fetchUnreadCount();
      setUnread(count);
    } catch {
      /* best-effort */
    }
  }, [items]);

  const markAllRead = useCallback(async () => {
    setItems((prev) => prev.map((n) => ({ ...n, is_read: true })));
    setUnread(0);
    try {
      await markAllNotificationsRead();
    } catch {
      /* best-effort */
    }
  }, []);

  return (
    <NotificationContext.Provider value={{ items, unread, loading, refresh, markRead, markAllRead }}>
      {children}
    </NotificationContext.Provider>
  );
}

export const useNotifications = () => {
  const ctx = useContext(NotificationContext);
  if (!ctx) throw new Error('useNotifications must be used within a NotificationProvider');
  return ctx;
};