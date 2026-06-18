//admin
// src/pages/notifications/NotificationManagement.jsx
import React, { useState, useEffect } from 'react';
import { Bell, Plus, Trash2, CheckCheck, Filter, RefreshCw, Send } from 'lucide-react';
import { useNotifications } from '../../contexts/NotificationContext';
import { getCurrentUser } from '../../utils/api';
import toast from 'react-hot-toast';

const TYPE_OPTIONS = [
  'ORDER','SHIPMENT','TRACKING','USER_REGISTRATION','PASSWORD_RESET',
  'PRODUCT','STOCK','PRICING','PURCHASE_ORDER','BLOG',
  'SUPPORT_TICKET','SYSTEM','ANNOUNCEMENT','FEATURE','CUSTOM',
];

const ALL_ROLES = ['IT','DIRECTOR','SALES','HR','LOGISTICS','WAREHOUSE','EDITOR','ACCOUNTANT','MANAGER','DESIGNER'];

const STATUS_COLORS = {
  ORDER: 'bg-blue-100 text-blue-700',
  SHIPMENT: 'bg-cyan-100 text-cyan-700',
  TRACKING: 'bg-teal-100 text-teal-700',
  USER_REGISTRATION: 'bg-purple-100 text-purple-700',
  PASSWORD_RESET: 'bg-orange-100 text-orange-700',
  PRODUCT: 'bg-green-100 text-green-700',
  STOCK: 'bg-yellow-100 text-yellow-700',
  PRICING: 'bg-emerald-100 text-emerald-700',
  PURCHASE_ORDER: 'bg-indigo-100 text-indigo-700',
  SUPPORT_TICKET: 'bg-red-100 text-red-700',
  SYSTEM: 'bg-gray-100 text-gray-700',
  ANNOUNCEMENT: 'bg-pink-100 text-pink-700',
  FEATURE: 'bg-violet-100 text-violet-700',
  CUSTOM: 'bg-gray-100 text-gray-700',
};

function timeAgo(dateStr) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

const EMPTY_FORM = {
  type: 'ANNOUNCEMENT',
  title: '',
  message: '',
  link: '',
  targetType: 'role',
  targetRoles: [],
  priority: 'medium',
};

export default function NotificationManagement() {
  const currentUser = getCurrentUser();
  const { notifications, unreadCount, loading, fetchNotifications, markRead, markAllRead, deleteNotification, createNotification } = useNotifications();
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [sending, setSending] = useState(false);
  const [filterType, setFilterType] = useState('');
  const [filterRead, setFilterRead] = useState('');

  const isITorDirector = ['IT', 'DIRECTOR'].includes(currentUser?.subRole);

  useEffect(() => { fetchNotifications(1); }, []);

  const toggleRole = (role) => {
    setForm((f) => ({
      ...f,
      targetRoles: f.targetRoles.includes(role)
        ? f.targetRoles.filter((r) => r !== role)
        : [...f.targetRoles, role],
    }));
  };

  const handleCreate = async () => {
    if (!form.title.trim() || !form.message.trim()) {
      toast.error('Title and message are required');
      return;
    }
    if (form.targetType === 'role' && form.targetRoles.length === 0) {
      toast.error('Select at least one target role');
      return;
    }
    setSending(true);
    try {
      const res = await createNotification(form);
      if (res.success) {
        toast.success('Notification sent!');
        setForm(EMPTY_FORM);
        setShowCreate(false);
        fetchNotifications(1);
      } else {
        toast.error(res.message || 'Failed to send');
      }
    } catch (e) {
      toast.error('Error sending notification');
    } finally {
      setSending(false);
    }
  };

  const filtered = notifications.filter((n) => {
    if (filterType && n.type !== filterType) return false;
    if (filterRead === 'unread' && n.isRead) return false;
    if (filterRead === 'read' && !n.isRead) return false;
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <Bell className="h-6 w-6 text-blue-600" />
            Notification Center
          </h1>
          <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">
            {unreadCount > 0 ? `${unreadCount} unread notification${unreadCount !== 1 ? 's' : ''}` : 'All caught up'}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {unreadCount > 0 && (
            <button
              onClick={markAllRead}
              className="flex items-center gap-1 px-3 py-2 text-sm bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300"
            >
              <CheckCheck className="h-4 w-4" /> Mark all read
            </button>
          )}
          <button onClick={() => fetchNotifications(1)} className="p-2 rounded-lg border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700">
            <RefreshCw className={`h-4 w-4 text-gray-500 ${loading ? 'animate-spin' : ''}`} />
          </button>
          {isITorDirector && (
            <button
              onClick={() => setShowCreate(true)}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm font-medium"
            >
              <Plus className="h-4 w-4" /> Send Notification
            </button>
          )}
        </div>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-3 flex-wrap bg-white dark:bg-gray-800 p-4 rounded-xl border border-gray-200 dark:border-gray-700">
        <Filter className="h-4 w-4 text-gray-400" />
        <select
          value={filterType}
          onChange={(e) => setFilterType(e.target.value)}
          className="text-sm border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-1.5 bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300"
        >
          <option value="">All Types</option>
          {TYPE_OPTIONS.map((t) => <option key={t} value={t}>{t.replace('_', ' ')}</option>)}
        </select>
        <select
          value={filterRead}
          onChange={(e) => setFilterRead(e.target.value)}
          className="text-sm border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-1.5 bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300"
        >
          <option value="">All</option>
          <option value="unread">Unread</option>
          <option value="read">Read</option>
        </select>
        <span className="text-sm text-gray-500 ml-auto">{filtered.length} notification{filtered.length !== 1 ? 's' : ''}</span>
      </div>

      {/* Notification List */}
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
        {filtered.length === 0 ? (
          <div className="p-12 text-center text-gray-400 dark:text-gray-500">
            <Bell className="h-10 w-10 mx-auto mb-3 opacity-30" />
            <p>No notifications found</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-100 dark:divide-gray-700">
            {filtered.map((n) => (
              <div
                key={n._id}
                className={`p-4 transition-colors ${!n.isRead ? 'bg-blue-50/40 dark:bg-blue-900/10' : ''} hover:bg-gray-50 dark:hover:bg-gray-700/30`}
              >
                <div className="flex items-start gap-4">
                  <div className="flex-1">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${STATUS_COLORS[n.type] || 'bg-gray-100 text-gray-700'}`}>
                          {n.type?.replace(/_/g, ' ')}
                        </span>
                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                          n.priority === 'urgent' ? 'bg-red-100 text-red-700' :
                          n.priority === 'high' ? 'bg-orange-100 text-orange-700' :
                          n.priority === 'medium' ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-600'
                        }`}>
                          {n.priority}
                        </span>
                        {!n.isRead && <span className="w-2 h-2 bg-blue-500 rounded-full inline-block" />}
                      </div>
                      <div className="flex items-center gap-1 flex-shrink-0">
                        {!n.isRead && (
                          <button
                            onClick={() => markRead(n._id)}
                            className="text-xs text-blue-600 dark:text-blue-400 hover:underline px-2 py-1"
                          >
                            Mark read
                          </button>
                        )}
                        <button
                          onClick={() => deleteNotification(n._id)}
                          className="p-1 rounded hover:bg-red-50 dark:hover:bg-red-900/20 text-gray-400 hover:text-red-500"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                    <p className="font-semibold text-gray-900 dark:text-white mt-1">{n.title}</p>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mt-0.5">{n.message}</p>
                    <div className="flex items-center gap-3 mt-2 text-xs text-gray-400">
                      <span>{timeAgo(n.createdAt)}</span>
                      {n.triggeredByName && <span>by {n.triggeredByName}</span>}
                      {n.targetRoles?.length > 0 && (
                        <span>→ {n.targetRoles.join(', ')}</span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Create Notification Modal */}
      {showCreate && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl w-full max-w-lg">
            <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Send Notification</h2>
              <button onClick={() => setShowCreate(false)} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 text-2xl leading-none">&times;</button>
            </div>
            <div className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Type</label>
                  <select
                    value={form.type}
                    onChange={(e) => setForm((f) => ({ ...f, type: e.target.value }))}
                    className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-sm bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300"
                  >
                    {TYPE_OPTIONS.map((t) => <option key={t} value={t}>{t.replace(/_/g, ' ')}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Priority</label>
                  <select
                    value={form.priority}
                    onChange={(e) => setForm((f) => ({ ...f, priority: e.target.value }))}
                    className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-sm bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300"
                  >
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                    <option value="urgent">Urgent</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Title *</label>
                <input
                  value={form.title}
                  onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
                  placeholder="Notification title"
                  className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-sm bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Message *</label>
                <textarea
                  value={form.message}
                  onChange={(e) => setForm((f) => ({ ...f, message: e.target.value }))}
                  rows={3}
                  placeholder="Notification message"
                  className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-sm bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Link (optional)</label>
                <input
                  value={form.link}
                  onChange={(e) => setForm((f) => ({ ...f, link: e.target.value }))}
                  placeholder="/admin/dashboard/orders"
                  className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-sm bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Target</label>
                <div className="flex gap-3 mb-3">
                  {['all', 'role'].map((t) => (
                    <label key={t} className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="radio"
                        checked={form.targetType === t}
                        onChange={() => setForm((f) => ({ ...f, targetType: t, targetRoles: [] }))}
                        className="text-blue-600"
                      />
                      <span className="text-sm text-gray-700 dark:text-gray-300 capitalize">
                        {t === 'all' ? 'All Roles' : 'Specific Roles'}
                      </span>
                    </label>
                  ))}
                </div>
                {form.targetType === 'role' && (
                  <div className="flex flex-wrap gap-2">
                    {ALL_ROLES.map((role) => (
                      <button
                        key={role}
                        onClick={() => toggleRole(role)}
                        className={`px-3 py-1 rounded-full text-xs font-medium border transition-colors ${
                          form.targetRoles.includes(role)
                            ? 'bg-blue-600 text-white border-blue-600'
                            : 'bg-white dark:bg-gray-700 text-gray-600 dark:text-gray-300 border-gray-300 dark:border-gray-600 hover:border-blue-400'
                        }`}
                      >
                        {role}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
            <div className="flex items-center justify-end gap-3 p-6 border-t border-gray-200 dark:border-gray-700">
              <button onClick={() => setShowCreate(false)} className="px-4 py-2 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-800">Cancel</button>
              <button
                onClick={handleCreate}
                disabled={sending}
                className="flex items-center gap-2 px-5 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm font-medium disabled:opacity-50"
              >
                {sending ? 'Sending...' : (<><Send className="h-4 w-4" /> Send</>)}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
