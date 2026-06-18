//admin
// src/components/notifications/AnnouncementPopup.jsx
// Displays unread FEATURE or ANNOUNCEMENT notifications as a modal popup
// Import and use this in each dashboard component
import React, { useState, useEffect } from 'react';
import { X, Bell, Megaphone, Zap } from 'lucide-react';
import { getCurrentUser } from '../../utils/api';

const API_BASE = import.meta.env.VITE_APP_API_URL || 'http://localhost:8080/api';

async function apiFetch(path, options = {}) {
  const token = localStorage.getItem('accessToken');
  const res = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}`, ...(options.headers || {}) },
  });
  return res.json();
}

const POPUP_KEY = 'icvng_seen_announcements';

function getSeenIds() {
  try { return JSON.parse(localStorage.getItem(POPUP_KEY) || '[]'); } catch { return []; }
}
function markSeenId(id) {
  const seen = getSeenIds();
  if (!seen.includes(id)) { seen.push(id); localStorage.setItem(POPUP_KEY, JSON.stringify(seen)); }
}

export default function AnnouncementPopup() {
  const [announcements, setAnnouncements] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const load = async () => {
      const user = getCurrentUser();
      if (!user) return;
      try {
        const data = await apiFetch('/admin/notifications?limit=50');
        if (!data.success) return;

        const seen = getSeenIds();
        const popups = data.data.filter(
          (n) => ['FEATURE', 'ANNOUNCEMENT'].includes(n.type) && !seen.includes(n._id)
        );
        if (popups.length > 0) {
          setAnnouncements(popups);
          setCurrentIndex(0);
          setVisible(true);
        }
      } catch (e) {
        // silent
      }
    };
    load();
  }, []);

  const dismiss = async () => {
    const current = announcements[currentIndex];
    if (current) {
      markSeenId(current._id);
      // Also mark as read on server
      await apiFetch(`/admin/notifications/${current._id}/read`, { method: 'PUT' }).catch(() => {});
    }

    if (currentIndex < announcements.length - 1) {
      setCurrentIndex((i) => i + 1);
    } else {
      setVisible(false);
    }
  };

  if (!visible || announcements.length === 0) return null;

  const current = announcements[currentIndex];
  const isFeature = current.type === 'FEATURE';

  return (
    <div className="fixed inset-0 bg-black/40 z-[100] flex items-center justify-center p-4">
      <div className={`bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-md overflow-hidden ${
        isFeature ? 'border-2 border-blue-500' : 'border-2 border-purple-400'
      }`}>
        {/* Top colour band */}
        <div className={`px-6 py-4 ${isFeature ? 'bg-gradient-to-r from-blue-600 to-indigo-600' : 'bg-gradient-to-r from-purple-600 to-pink-600'}`}>
          <div className="flex items-center gap-3">
            <div className="p-2 bg-white/20 rounded-lg">
              {isFeature ? <Zap className="h-5 w-5 text-white" /> : <Megaphone className="h-5 w-5 text-white" />}
            </div>
            <div>
              <p className="text-white/70 text-xs uppercase tracking-wider font-medium">
                {isFeature ? 'New Feature' : 'Announcement'}
              </p>
              {announcements.length > 1 && (
                <p className="text-white/60 text-xs">{currentIndex + 1} of {announcements.length}</p>
              )}
            </div>
          </div>
        </div>

        <div className="p-6">
          <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-3">{current.title}</h3>
          <p className="text-gray-600 dark:text-gray-300 leading-relaxed">{current.message}</p>

          {current.triggeredByName && current.triggeredByName !== 'System' && (
            <p className="text-xs text-gray-400 mt-4">Posted by {current.triggeredByName}</p>
          )}
        </div>

        <div className="px-6 pb-6 flex items-center justify-between">
          <button
            onClick={dismiss}
            className={`px-6 py-2.5 rounded-xl text-white font-medium ${
              isFeature ? 'bg-blue-600 hover:bg-blue-700' : 'bg-purple-600 hover:bg-purple-700'
            }`}
          >
            {currentIndex < announcements.length - 1 ? 'Next →' : 'Got it!'}
          </button>
          <button onClick={dismiss} className="text-sm text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">
            Dismiss
          </button>
        </div>
      </div>
    </div>
  );
}
