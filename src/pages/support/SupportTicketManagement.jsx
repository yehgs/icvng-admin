//admin
// src/pages/support/SupportTicketManagement.jsx  (UPDATED — image attachments in thread)
import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  LifeBuoy, Plus, RefreshCw, Search, Send, X,
  Clock, CheckCircle, AlertCircle, Wrench, Eye, Image, Paperclip,
} from 'lucide-react';
import { getCurrentUser } from '../../utils/api';
import toast from 'react-hot-toast';

const API_BASE = import.meta.env.VITE_APP_API_URL || 'http://localhost:8080/api';

async function apiFetch(path, options = {}) {
  const token = localStorage.getItem('accessToken');
  const res = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}`, ...(options.headers || {}) },
  });
  return res.json();
}

async function uploadImageMessage(ticketId, file) {
  const token = localStorage.getItem('accessToken');
  const fd = new FormData();
  fd.append('image', file);
  const res = await fetch(`${API_BASE}/admin/support-tickets/${ticketId}/message-image`, {
    method: 'POST', headers: { Authorization: `Bearer ${token}` }, body: fd,
  });
  return res.json();
}

const STATUS_CONFIG = {
  open: { label: 'Open', color: 'bg-blue-100 text-blue-700 dark:bg-blue-900/50 dark:text-blue-300', icon: AlertCircle },
  working_on: { label: 'Working On', color: 'bg-orange-100 text-orange-700 dark:bg-orange-900/50 dark:text-orange-300', icon: Wrench },
  pending: { label: 'Pending', color: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/50 dark:text-yellow-300', icon: Clock },
  completed: { label: 'Completed', color: 'bg-green-100 text-green-700 dark:bg-green-900/50 dark:text-green-300', icon: CheckCircle },
  fixed: { label: 'Fixed', color: 'bg-teal-100 text-teal-700 dark:bg-teal-900/50 dark:text-teal-300', icon: CheckCircle },
  closed: { label: 'Closed', color: 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400', icon: X },
};

const PRIORITY_CONFIG = {
  low: 'bg-gray-100 text-gray-600', medium: 'bg-blue-100 text-blue-700',
  high: 'bg-orange-100 text-orange-700', critical: 'bg-red-100 text-red-700',
};

const EMPTY_FORM = { title: '', description: '', category: 'Other', priority: 'medium' };

function timeAgo(dateStr) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

export default function SupportTicketManagement() {
  const currentUser = getCurrentUser();
  const isIT = ['IT', 'DIRECTOR'].includes(currentUser?.subRole);

  const [tickets, setTickets] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(false);
  const [total, setTotal] = useState(0);
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [filterCategory, setFilterCategory] = useState('');
  const [filterPriority, setFilterPriority] = useState('');

  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [submitting, setSubmitting] = useState(false);

  const [selectedTicket, setSelectedTicket] = useState(null);
  const [replyMsg, setReplyMsg] = useState('');
  const [replying, setReplying] = useState(false);
  const [uploadingImg, setUploadingImg] = useState(false);
  const [updatingStatus, setUpdatingStatus] = useState(false);

  // Image upload in thread
  const imageInputRef = useRef();
  const [imagePreview, setImagePreview] = useState(null);
  const [imageFile, setImageFile] = useState(null);

  // Create form image attachments
  const createImgRef = useRef();
  const [createImages, setCreateImages] = useState([]);

  const fetchCategories = useCallback(async () => {
    const data = await apiFetch('/admin/support-tickets/categories');
    if (data.success) setCategories(data.data);
  }, []);

  const fetchTickets = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ limit: 50 });
      if (search) params.set('search', search);
      if (filterStatus) params.set('status', filterStatus);
      if (filterCategory) params.set('category', filterCategory);
      if (filterPriority) params.set('priority', filterPriority);
      const data = await apiFetch(`/admin/support-tickets?${params}`);
      if (data.success) { setTickets(data.data); setTotal(data.total); }
    } finally { setLoading(false); }
  }, [search, filterStatus, filterCategory, filterPriority]);

  useEffect(() => { fetchCategories(); fetchTickets(); }, [fetchTickets, fetchCategories]);

  const handleCreate = async () => {
    if (!form.title.trim() || !form.description.trim()) { toast.error('Title and description required'); return; }
    setSubmitting(true);
    try {
      const data = await apiFetch('/admin/support-tickets', { method: 'POST', body: JSON.stringify(form) });
      if (!data.success) { toast.error(data.message || 'Failed'); return; }
      // Upload any images attached to the create form
      if (createImages.length > 0 && data.data?._id) {
        for (const file of createImages) {
          await uploadImageMessage(data.data._id, file);
        }
      }
      toast.success('Ticket created!');
      setForm(EMPTY_FORM); setShowCreate(false); setCreateImages([]);
      fetchTickets();
    } finally { setSubmitting(false); }
  };

  const openTicket = async (ticket) => {
    const data = await apiFetch(`/admin/support-tickets/${ticket._id}`);
    if (data.success) setSelectedTicket(data.data);
  };

  const handleReply = async () => {
    if (!replyMsg.trim() && !imageFile) return;
    if (imageFile) {
      setUploadingImg(true);
      try {
        const data = await uploadImageMessage(selectedTicket._id, imageFile);
        if (data.success) {
          setSelectedTicket(data.data); setImageFile(null); setImagePreview(null);
          toast.success('Image sent'); fetchTickets();
        }
      } finally { setUploadingImg(false); }
      return;
    }
    setReplying(true);
    try {
      const data = await apiFetch(`/admin/support-tickets/${selectedTicket._id}/message`, {
        method: 'POST', body: JSON.stringify({ message: replyMsg }),
      });
      if (data.success) { setSelectedTicket(data.data); setReplyMsg(''); toast.success('Message sent'); fetchTickets(); }
    } finally { setReplying(false); }
  };

  const handleStatusUpdate = async (status) => {
    if (!isIT) return;
    setUpdatingStatus(true);
    try {
      const data = await apiFetch(`/admin/support-tickets/${selectedTicket._id}/status`, {
        method: 'PUT', body: JSON.stringify({ status }),
      });
      if (data.success) { setSelectedTicket(data.data); toast.success(`Status: ${STATUS_CONFIG[status]?.label}`); fetchTickets(); }
    } finally { setUpdatingStatus(false); }
  };

  const handleImageSelect = (file) => {
    if (!file) return;
    setImageFile(file);
    const reader = new FileReader();
    reader.onload = (e) => setImagePreview(e.target.result);
    reader.readAsDataURL(file);
  };

  return (
    <div className="flex gap-6 h-full">
      {/* ── Left: ticket list ── */}
      <div className={`${selectedTicket ? 'w-1/2' : 'w-full'} space-y-4 transition-all`}>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
              <LifeBuoy className="h-6 w-6 text-blue-600" /> Support Tickets
            </h1>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">{total} ticket{total !== 1 ? 's' : ''}</p>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={fetchTickets} className="p-2 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700">
              <RefreshCw className={`h-4 w-4 text-gray-500 ${loading ? 'animate-spin' : ''}`} />
            </button>
            <button onClick={() => setShowCreate(true)}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm font-medium">
              <Plus className="h-4 w-4" /> New Ticket
            </button>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4 space-y-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search tickets..."
              className="w-full pl-9 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300" />
          </div>
          <div className="flex gap-2 flex-wrap">
            <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)}
              className="text-sm border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-1.5 bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300">
              <option value="">All Status</option>
              {Object.entries(STATUS_CONFIG).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
            </select>
            <select value={filterCategory} onChange={(e) => setFilterCategory(e.target.value)}
              className="text-sm border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-1.5 bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300">
              <option value="">All Categories</option>
              {categories.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
            <select value={filterPriority} onChange={(e) => setFilterPriority(e.target.value)}
              className="text-sm border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-1.5 bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300">
              <option value="">All Priority</option>
              {['low','medium','high','critical'].map((p) => <option key={p} value={p}>{p}</option>)}
            </select>
          </div>
        </div>

        {/* Ticket list */}
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
          {loading && tickets.length === 0 ? (
            <div className="p-10 text-center text-gray-400">Loading...</div>
          ) : tickets.length === 0 ? (
            <div className="p-10 text-center text-gray-400"><LifeBuoy className="h-10 w-10 mx-auto mb-3 opacity-30" /><p>No tickets found</p></div>
          ) : (
            <div className="divide-y divide-gray-100 dark:divide-gray-700">
              {tickets.map((t) => {
                const sc = STATUS_CONFIG[t.status] || STATUS_CONFIG.open;
                const Icon = sc.icon;
                return (
                  <div key={t._id} onClick={() => openTicket(t)}
                    className={`p-4 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700/30 transition-colors ${selectedTicket?._id === t._id ? 'bg-blue-50 dark:bg-blue-900/10 border-l-2 border-blue-500' : ''}`}>
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-xs font-mono text-gray-400">{t.ticketNumber}</span>
                          <span className={`text-xs px-2 py-0.5 rounded-full font-medium flex items-center gap-1 ${sc.color}`}>
                            <Icon className="h-3 w-3" /> {sc.label}
                          </span>
                          <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${PRIORITY_CONFIG[t.priority]}`}>{t.priority}</span>
                        </div>
                        <p className="font-medium text-gray-900 dark:text-white mt-1 truncate">{t.title}</p>
                        <div className="flex items-center gap-3 text-xs text-gray-400 mt-1">
                          <span>{t.category}</span><span>{t.createdByName}</span><span>{timeAgo(t.createdAt)}</span>
                          {t.messages?.length > 1 && <span className="flex items-center gap-0.5"><Paperclip className="h-3 w-3" />{t.messages.length}</span>}
                        </div>
                      </div>
                      <Eye className="h-4 w-4 text-gray-400 flex-shrink-0 mt-1" />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* ── Right: ticket detail ── */}
      {selectedTicket && (
        <div className="w-1/2 flex flex-col bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden" style={{ maxHeight: '80vh' }}>
          {/* Header */}
          <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex-shrink-0">
            <div className="flex items-start justify-between gap-2">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-xs font-mono text-gray-400">{selectedTicket.ticketNumber}</span>
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${STATUS_CONFIG[selectedTicket.status]?.color}`}>
                    {STATUS_CONFIG[selectedTicket.status]?.label}
                  </span>
                </div>
                <h3 className="font-semibold text-gray-900 dark:text-white">{selectedTicket.title}</h3>
                <p className="text-xs text-gray-400 mt-0.5">{selectedTicket.category} · {selectedTicket.priority} · by {selectedTicket.createdByName} ({selectedTicket.createdBySubRole})</p>
              </div>
              <button onClick={() => setSelectedTicket(null)} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"><X className="h-5 w-5" /></button>
            </div>
            {isIT && (
              <div className="flex gap-2 mt-3 flex-wrap">
                {Object.entries(STATUS_CONFIG).map(([key, cfg]) => (
                  <button key={key} onClick={() => handleStatusUpdate(key)} disabled={updatingStatus || selectedTicket.status === key}
                    className={`text-xs px-3 py-1 rounded-full border font-medium transition-colors disabled:opacity-40 ${selectedTicket.status === key ? cfg.color + ' border-transparent' : 'border-gray-300 dark:border-gray-600 text-gray-600 dark:text-gray-400 hover:border-blue-400'}`}>
                    {cfg.label}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {selectedTicket.messages?.map((m) => {
              const isMine = m.sender?._id === currentUser?._id || m.sender === currentUser?._id;
              const hasImage = m.attachments?.length > 0;
              return (
                <div key={m._id} className={`flex ${isMine ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-xs rounded-xl px-4 py-2 text-sm ${isMine ? 'bg-blue-600 text-white' : 'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200'}`}>
                    {!isMine && <p className="text-xs font-medium mb-1 opacity-70">{m.senderName} ({m.senderSubRole})</p>}
                    {hasImage ? (
                      m.attachments.map((a, i) => (
                        <a key={i} href={a.url} target="_blank" rel="noopener noreferrer">
                          <img src={a.url} alt={a.name} className="rounded-lg max-w-full mb-1 cursor-pointer hover:opacity-90" />
                        </a>
                      ))
                    ) : (
                      <p>{m.message}</p>
                    )}
                    <p className={`text-xs mt-1 ${isMine ? 'text-blue-200' : 'text-gray-400'}`}>{timeAgo(m.createdAt)}</p>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Image preview above input */}
          {imagePreview && (
            <div className="px-4 pb-2 flex-shrink-0">
              <div className="relative inline-block">
                <img src={imagePreview} alt="preview" className="h-20 rounded-lg border border-gray-300 dark:border-gray-600" />
                <button onClick={() => { setImageFile(null); setImagePreview(null); }}
                  className="absolute -top-1.5 -right-1.5 bg-red-500 text-white rounded-full h-5 w-5 flex items-center justify-center text-xs">×</button>
              </div>
            </div>
          )}

          {/* Reply box */}
          <div className="p-4 border-t border-gray-200 dark:border-gray-700 flex-shrink-0">
            <div className="flex gap-2 items-end">
              {/* Image attach button */}
              <button onClick={() => imageInputRef.current?.click()}
                className="p-2 text-gray-400 hover:text-blue-500 rounded-lg border border-gray-300 dark:border-gray-600 flex-shrink-0"
                title="Attach image">
                <Image className="h-4 w-4" />
              </button>
              <input ref={imageInputRef} type="file" accept="image/*" className="hidden"
                onChange={(e) => handleImageSelect(e.target.files[0])} />
              <textarea value={replyMsg} onChange={(e) => setReplyMsg(e.target.value)}
                placeholder={imageFile ? 'Image ready to send — click send' : 'Type a message...'}
                rows={2} disabled={!!imageFile}
                className="flex-1 border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-sm bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 resize-none disabled:opacity-50"
                onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleReply(); } }} />
              <button onClick={handleReply} disabled={(!replyMsg.trim() && !imageFile) || replying || uploadingImg}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-40 flex-shrink-0">
                {(replying || uploadingImg) ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Create Modal ── */}
      {showCreate && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl w-full max-w-lg">
            <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Create Support Ticket</h2>
              <button onClick={() => setShowCreate(false)} className="text-gray-400 hover:text-gray-600 text-2xl leading-none">&times;</button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Title *</label>
                <input value={form.title} onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
                  placeholder="Brief description of the issue"
                  className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-sm bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Category</label>
                  <select value={form.category} onChange={(e) => setForm((f) => ({ ...f, category: e.target.value }))}
                    className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-sm bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300">
                    {categories.map((c) => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Priority</label>
                  <select value={form.priority} onChange={(e) => setForm((f) => ({ ...f, priority: e.target.value }))}
                    className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-sm bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300">
                    <option value="low">Low</option><option value="medium">Medium</option>
                    <option value="high">High</option><option value="critical">Critical</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Description *</label>
                <textarea value={form.description} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                  rows={4} placeholder="Describe the issue in detail..."
                  className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-sm bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300" />
              </div>
              {/* Images */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Attach Screenshots (optional)</label>
                <div onClick={() => createImgRef.current?.click()}
                  className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-3 text-center cursor-pointer hover:border-blue-400">
                  <Image className="h-5 w-5 mx-auto text-gray-400 mb-1" />
                  <p className="text-xs text-gray-500">Click to attach images</p>
                </div>
                <input ref={createImgRef} type="file" multiple accept="image/*" className="hidden"
                  onChange={(e) => setCreateImages((prev) => [...prev, ...Array.from(e.target.files)])} />
                {createImages.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-2">
                    {createImages.map((f, i) => (
                      <div key={i} className="relative">
                        <img src={URL.createObjectURL(f)} alt="" className="h-16 w-16 object-cover rounded-lg" />
                        <button onClick={() => setCreateImages((prev) => prev.filter((_, j) => j !== i))}
                          className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full h-4 w-4 text-xs flex items-center justify-center">×</button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
            <div className="flex items-center justify-end gap-3 p-6 border-t border-gray-200 dark:border-gray-700">
              <button onClick={() => setShowCreate(false)} className="px-4 py-2 text-sm text-gray-600 dark:text-gray-400">Cancel</button>
              <button onClick={handleCreate} disabled={submitting}
                className="px-5 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm font-medium disabled:opacity-50">
                {submitting ? 'Submitting...' : 'Submit Ticket'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
