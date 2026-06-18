//admin
// src/contexts/NotificationContext.jsx
import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { getCurrentUser } from '../utils/api';

const API_BASE = import.meta.env.VITE_APP_API_URL || 'http://localhost:8080/api';

const NotificationContext = createContext(null);

export const useNotifications = () => {
  const ctx = useContext(NotificationContext);
  if (!ctx) throw new Error('useNotifications must be used within NotificationProvider');
  return ctx;
};

async function apiFetch(path, options = {}) {
  const token = localStorage.getItem('accessToken');
  const res = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
      ...(options.headers || {}),
    },
  });
  return res.json();
}

export function NotificationProvider({ children }) {
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const pollRef = useRef(null);

  const fetchNotifications = useCallback(async (pg = 1) => {
    const user = getCurrentUser();
    if (!user) return;
    setLoading(true);
    try {
      const data = await apiFetch(`/admin/notifications?page=${pg}&limit=20`);
      if (data.success) {
        if (pg === 1) {
          setNotifications(data.data);
        } else {
          setNotifications((prev) => [...prev, ...data.data]);
        }
        setUnreadCount(data.unreadCount || 0);
        setTotalPages(data.totalPages || 1);
        setPage(pg);
      }
    } catch (e) {
      console.error('Failed to fetch notifications', e);
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchUnreadCount = useCallback(async () => {
    const user = getCurrentUser();
    if (!user) return;
    try {
      const data = await apiFetch('/admin/notifications/count');
      if (data.success) setUnreadCount(data.unreadCount || 0);
    } catch (e) { /* silent */ }
  }, []);

  const markRead = useCallback(async (id) => {
    await apiFetch(`/admin/notifications/${id}/read`, { method: 'PUT' });
    setNotifications((prev) =>
      prev.map((n) => (n._id === id ? { ...n, isRead: true } : n))
    );
    setUnreadCount((c) => Math.max(0, c - 1));
  }, []);

  const markAllRead = useCallback(async () => {
    await apiFetch('/admin/notifications/mark-all-read', { method: 'PUT' });
    setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
    setUnreadCount(0);
  }, []);

  const deleteNotification = useCallback(async (id) => {
    await apiFetch(`/admin/notifications/${id}`, { method: 'DELETE' });
    setNotifications((prev) => prev.filter((n) => n._id !== id));
    setUnreadCount((c) => Math.max(0, c - 1));
  }, []);

  const createNotification = useCallback(async (payload) => {
    const data = await apiFetch('/admin/notifications', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
    return data;
  }, []);

  const loadMore = useCallback(() => {
    if (page < totalPages) fetchNotifications(page + 1);
  }, [page, totalPages, fetchNotifications]);

  // Initial load + polling every 60 seconds
  useEffect(() => {
    fetchNotifications(1);
    pollRef.current = setInterval(fetchUnreadCount, 60000);
    return () => clearInterval(pollRef.current);
  }, [fetchNotifications, fetchUnreadCount]);

  return (
    <NotificationContext.Provider
      value={{
        notifications,
        unreadCount,
        loading,
        page,
        totalPages,
        fetchNotifications,
        markRead,
        markAllRead,
        deleteNotification,
        createNotification,
        loadMore,
      }}
    >
      {children}
    </NotificationContext.Provider>
  );
}
