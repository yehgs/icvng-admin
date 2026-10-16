//admin
// src/pages/contact/ContactMessages.jsx
//
// Item #1 — admin view of ContactForm submissions and newsletter
// subscribers. Country scoping is enforced server-side (countryScope
// middleware + countryScopedPlugin on both models) — this page just
// renders whatever the API returns, which is already narrowed to the
// logged-in admin's country unless they're GLOBAL-scoped (IT/DIRECTOR).
import React, { useState, useEffect, useCallback } from "react";
import { Mail, Users, RefreshCw, Globe, Eye, X, Phone, MessageCircle, Copy, Building2 } from "lucide-react";
import toast from "react-hot-toast";
import { useAdminTranslation } from "../../hooks/useAdminTranslation.js";
import { useAdminCountry } from "../../contexts/AdminCountryContext.jsx";

const API_BASE = import.meta.env.VITE_APP_API_URL || "http://localhost:8080/api";

async function apiFetch(path, options = {}) {
  const token = localStorage.getItem("accessToken");
  const res = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}`, ...(options.headers || {}) },
  });
  return res.json();
}

const STATUS_OPTIONS = ["NEW", "IN_PROGRESS", "RESOLVED", "ARCHIVED"];

const STATUS_COLORS = {
  NEW: "bg-blue-100 text-blue-700 dark:bg-blue-900/50 dark:text-blue-300",
  IN_PROGRESS: "bg-amber-100 text-amber-700 dark:bg-amber-900/50 dark:text-amber-300",
  RESOLVED: "bg-green-100 text-green-700 dark:bg-green-900/50 dark:text-green-300",
  ARCHIVED: "bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400",
};

const fmtDateTime = (d) => (d ? new Date(d).toLocaleString() : "—");

function waLink(phone) {
  const digits = String(phone || "").replace(/[^\d]/g, "");
  return digits ? `https://wa.me/${digits}` : null;
}

function DetailRow({ label, children }) {
  if (children === undefined || children === null || children === "") return null;
  return (
    <div>
      <div className="text-xs uppercase tracking-wide text-gray-400 dark:text-gray-500 mb-0.5">{label}</div>
      <div className="text-sm text-gray-900 dark:text-gray-100 break-words">{children}</div>
    </div>
  );
}

function MessageModal({ message: m, isGlobalAdmin, onClose, onStatusChange }) {
  useEffect(() => {
    const onKey = (e) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  const copy = (text) => {
    try {
      navigator.clipboard.writeText(text);
      toast.success("Copied");
    } catch {
      toast.error("Copy failed");
    }
  };
  const wa = waLink(m.phone);
  const subject = encodeURIComponent(m.subject ? `Re: ${m.subject}` : "Re: your message");

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
    >
      <div
        className="w-full max-w-2xl max-h-[90vh] overflow-y-auto bg-white dark:bg-gray-900 rounded-xl shadow-xl border border-gray-200 dark:border-gray-700"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="sticky top-0 flex items-start justify-between gap-3 px-6 py-4 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700">
          <div className="min-w-0">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white truncate">{m.subject || "Message details"}</h2>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">Received {fmtDateTime(m.createdAt)}</p>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800" aria-label="Close">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="px-6 py-5 space-y-6">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs font-medium px-2 py-1 rounded-full capitalize bg-purple-50 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300">{m.formType}</span>
            <span className="text-xs font-medium px-2 py-1 rounded-full bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-300">
              {m.source === "mobile-app" ? "Mobile App" : "Web"}
            </span>
            {m.countryCode && (
              <span className="text-xs font-medium px-2 py-1 rounded-full bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-300 inline-flex items-center gap-1">
                <Globe className="w-3 h-3" /> {m.countryCode}
              </span>
            )}
            <div className="ml-auto flex items-center gap-2">
              <span className="text-xs text-gray-500 dark:text-gray-400">Status</span>
              <select
                value={m.status}
                onChange={(e) => onStatusChange(m._id, e.target.value)}
                className={`text-xs font-medium rounded-full px-2 py-1 border-0 ${STATUS_COLORS[m.status]}`}
              >
                {STATUS_OPTIONS.map((s) => (
                  <option key={s} value={s}>{s.replace("_", " ")}</option>
                ))}
              </select>
            </div>
          </div>

          <section className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <DetailRow label="Name">{m.name}</DetailRow>
            <DetailRow label="Company">
              {m.company && <span className="inline-flex items-center gap-1"><Building2 className="w-3.5 h-3.5 text-gray-400" />{m.company}</span>}
            </DetailRow>
            <DetailRow label="Email">
              <span className="inline-flex items-center gap-2">
                <a href={`mailto:${m.email}?subject=${subject}`} className="text-blue-600 dark:text-blue-400 hover:underline">{m.email}</a>
                <button onClick={() => copy(m.email)} className="text-gray-400 hover:text-gray-700 dark:hover:text-white" title="Copy"><Copy className="w-3.5 h-3.5" /></button>
              </span>
            </DetailRow>
            <DetailRow label="Phone">
              <span className="inline-flex items-center gap-2">
                <a href={`tel:${m.phone}`} className="text-blue-600 dark:text-blue-400 hover:underline">{m.phone}</a>
                <button onClick={() => copy(m.phone)} className="text-gray-400 hover:text-gray-700 dark:hover:text-white" title="Copy"><Copy className="w-3.5 h-3.5" /></button>
              </span>
            </DetailRow>
            <DetailRow label="Preferred contact method"><span className="capitalize">{m.preferredContact}</span></DetailRow>
            <DetailRow label="Language submitted">{m.submittedLanguage && m.submittedLanguage.toUpperCase()}</DetailRow>
            <DetailRow label="How they heard about us">{m.howDidYouHear}</DetailRow>
            {m.formType === "partner" && <DetailRow label="Business type">{m.businessType}</DetailRow>}
            {m.formType === "partner" && <DetailRow label="Product categories">{m.productCategories}</DetailRow>}
          </section>

          <section>
            <div className="text-xs uppercase tracking-wide text-gray-400 dark:text-gray-500 mb-1.5">Message</div>
            <div className="whitespace-pre-wrap break-words text-sm text-gray-800 dark:text-gray-100 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4">
              {m.message}
            </div>
          </section>

          <div className="text-xs text-gray-400 dark:text-gray-500 flex flex-wrap gap-x-6 gap-y-1">
            <span>Created: {fmtDateTime(m.createdAt)}</span>
            {m.updatedAt && m.updatedAt !== m.createdAt && <span>Last updated: {fmtDateTime(m.updatedAt)}</span>}
            {isGlobalAdmin && <span>ID: {m._id}</span>}
          </div>
        </div>

        <div className="sticky bottom-0 flex flex-wrap justify-end gap-2 px-6 py-4 bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-700">
          {wa && (
            <a href={wa} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1.5 px-3 py-2 text-sm rounded-lg bg-green-600 text-white hover:bg-green-700">
              <MessageCircle className="w-4 h-4" /> WhatsApp
            </a>
          )}
          <a href={`tel:${m.phone}`} className="inline-flex items-center gap-1.5 px-3 py-2 text-sm rounded-lg border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-800">
            <Phone className="w-4 h-4" /> Call
          </a>
          <a href={`mailto:${m.email}?subject=${subject}`} className="inline-flex items-center gap-1.5 px-3 py-2 text-sm rounded-lg bg-blue-600 text-white hover:bg-blue-700">
            <Mail className="w-4 h-4" /> Reply by email
          </a>
        </div>
      </div>
    </div>
  );
}

export default function ContactMessages() {
  const { t } = useAdminTranslation();
  const { isGlobalAdmin, countryScope } = useAdminCountry();

  const [tab, setTab] = useState("messages"); // messages | subscribers
  const [messages, setMessages] = useState([]);
  const [subscribers, setSubscribers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [formTypeFilter, setFormTypeFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [sourceFilter, setSourceFilter] = useState("");
  const [selectedId, setSelectedId] = useState(null);
  const selected = messages.find((m) => m._id === selectedId) || null;

  const fetchMessages = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (formTypeFilter) params.set("formType", formTypeFilter);
      if (statusFilter) params.set("status", statusFilter);
      if (sourceFilter) params.set("source", sourceFilter);
      const res = await apiFetch(`/admin/contact-messages?${params.toString()}`);
      if (res.success) setMessages(res.data || []);
      else toast.error(res.message || "Failed to load messages");
    } catch {
      toast.error("Failed to load messages");
    } finally {
      setLoading(false);
    }
  }, [formTypeFilter, statusFilter, sourceFilter]);

  const fetchSubscribers = useCallback(async () => {
    setLoading(true);
    try {
      const res = await apiFetch(`/admin/subscribers`);
      if (res.success) setSubscribers(res.data || []);
      else toast.error(res.message || "Failed to load subscribers");
    } catch {
      toast.error("Failed to load subscribers");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (tab === "messages") fetchMessages();
    else fetchSubscribers();
  }, [tab, fetchMessages, fetchSubscribers]);

  const handleStatusChange = async (id, status) => {
    const res = await apiFetch(`/admin/contact-messages/${id}/status`, {
      method: "PATCH",
      body: JSON.stringify({ status }),
    });
    if (res.success) {
      setMessages((prev) => prev.map((m) => (m._id === id ? { ...m, status } : m)));
      toast.success("Status updated");
    } else {
      toast.error(res.message || "Failed to update status");
    }
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <Mail className="w-6 h-6" /> {t("nav.contactMessages") || "Contact & Subscribers"}
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            {isGlobalAdmin ? (
              <span className="inline-flex items-center gap-1"><Globe className="w-4 h-4" /> All countries</span>
            ) : (
              <span>Scoped to {countryScope}</span>
            )}
          </p>
        </div>
        <button
          onClick={() => (tab === "messages" ? fetchMessages() : fetchSubscribers())}
          className="p-2 text-gray-500 hover:text-gray-800 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg"
          title="Refresh"
        >
          <RefreshCw className={`w-5 h-5 ${loading ? "animate-spin" : ""}`} />
        </button>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b border-gray-200 dark:border-gray-700">
        <button
          onClick={() => setTab("messages")}
          className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
            tab === "messages"
              ? "border-blue-500 text-blue-600 dark:text-blue-400"
              : "border-transparent text-gray-500 hover:text-gray-800 dark:hover:text-gray-200"
          }`}
        >
          <Mail className="w-4 h-4 inline mr-1.5 -mt-0.5" /> Messages
        </button>
        <button
          onClick={() => setTab("subscribers")}
          className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
            tab === "subscribers"
              ? "border-blue-500 text-blue-600 dark:text-blue-400"
              : "border-transparent text-gray-500 hover:text-gray-800 dark:hover:text-gray-200"
          }`}
        >
          <Users className="w-4 h-4 inline mr-1.5 -mt-0.5" /> Newsletter subscribers
        </button>
      </div>

      {tab === "messages" ? (
        <>
          <div className="flex flex-wrap gap-3">
            <select
              value={formTypeFilter}
              onChange={(e) => setFormTypeFilter(e.target.value)}
              className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm bg-white dark:bg-gray-800 dark:text-white"
            >
              <option value="">All form types</option>
              <option value="contact">Contact</option>
              <option value="partner">Partner</option>
            </select>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm bg-white dark:bg-gray-800 dark:text-white"
            >
              <option value="">All statuses</option>
              {STATUS_OPTIONS.map((s) => (
                <option key={s} value={s}>{s.replace("_", " ")}</option>
              ))}
            </select>
            <select
              value={sourceFilter}
              onChange={(e) => setSourceFilter(e.target.value)}
              className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm bg-white dark:bg-gray-800 dark:text-white"
            >
              <option value="">All sources</option>
              <option value="web">Web</option>
              <option value="mobile-app">Mobile App</option>
            </select>
          </div>

          <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm min-w-[720px]">
                <thead className="bg-gray-50 dark:bg-gray-800 text-left text-gray-500 dark:text-gray-400">
                  <tr>
                    <th className="px-4 py-3 font-medium">Name</th>
                    <th className="px-4 py-3 font-medium">Email / Phone</th>
                    <th className="px-4 py-3 font-medium">Type</th>
                    {isGlobalAdmin && <th className="px-4 py-3 font-medium">Country</th>}
                    <th className="px-4 py-3 font-medium">Source</th>
                    <th className="px-4 py-3 font-medium">Subject / Message</th>
                    <th className="px-4 py-3 font-medium">Status</th>
                    <th className="px-4 py-3 font-medium">Received</th>
                    <th className="px-4 py-3 font-medium text-right">View</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                  {messages.length === 0 && !loading && (
                    <tr><td colSpan={isGlobalAdmin ? 9 : 8} className="px-4 py-8 text-center text-gray-400">No messages yet.</td></tr>
                  )}
                  {messages.map((m) => (
                    <tr key={m._id} onClick={() => setSelectedId(m._id)} className="cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800/50">
                      <td className="px-4 py-3 font-medium text-gray-900 dark:text-white">
                        {m.name}
                        {m.company && <div className="text-xs text-gray-400">{m.company}</div>}
                      </td>
                      <td className="px-4 py-3 text-gray-600 dark:text-gray-300">
                        <div>{m.email}</div>
                        <div className="text-xs text-gray-400">{m.phone}</div>
                      </td>
                      <td className="px-4 py-3 capitalize text-gray-600 dark:text-gray-300">{m.formType}</td>
                      {isGlobalAdmin && <td className="px-4 py-3 text-gray-600 dark:text-gray-300">{m.countryCode}</td>}
                      <td className="px-4 py-3">
                        {m.source === 'mobile-app' ? (
                          <span className="inline-flex items-center gap-1 text-xs font-medium px-2 py-1 rounded-full bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300">
                            Mobile App
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-xs font-medium px-2 py-1 rounded-full bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-300">
                            Web
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-gray-600 dark:text-gray-300 max-w-xs">
                        {m.subject && <div className="font-medium text-gray-800 dark:text-gray-200">{m.subject}</div>}
                        <div className="truncate">{m.message}</div>
                      </td>
                      <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
                        <select
                          value={m.status}
                          onChange={(e) => handleStatusChange(m._id, e.target.value)}
                          className={`text-xs font-medium rounded-full px-2 py-1 border-0 ${STATUS_COLORS[m.status]}`}
                        >
                          {STATUS_OPTIONS.map((s) => (
                            <option key={s} value={s}>{s.replace("_", " ")}</option>
                          ))}
                        </select>
                      </td>
                      <td className="px-4 py-3 text-gray-400 whitespace-nowrap">
                        {new Date(m.createdAt).toLocaleDateString()}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <button
                          onClick={(e) => { e.stopPropagation(); setSelectedId(m._id); }}
                          className="p-1.5 rounded-lg text-gray-500 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-gray-800"
                          title="View details"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      ) : (
        <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm min-w-[720px]">
              <thead className="bg-gray-50 dark:bg-gray-800 text-left text-gray-500 dark:text-gray-400">
                <tr>
                  <th className="px-4 py-3 font-medium">Email</th>
                  {isGlobalAdmin && <th className="px-4 py-3 font-medium">Country</th>}
                  <th className="px-4 py-3 font-medium">Source</th>
                  <th className="px-4 py-3 font-medium">Status</th>
                  <th className="px-4 py-3 font-medium">Subscribed</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                {subscribers.length === 0 && !loading && (
                  <tr><td colSpan={isGlobalAdmin ? 5 : 4} className="px-4 py-8 text-center text-gray-400">No subscribers yet.</td></tr>
                )}
                {subscribers.map((s) => (
                  <tr key={s._id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50">
                    <td className="px-4 py-3 font-medium text-gray-900 dark:text-white">{s.email}</td>
                    {isGlobalAdmin && <td className="px-4 py-3 text-gray-600 dark:text-gray-300">{s.countryCode}</td>}
                    <td className="px-4 py-3 text-gray-600 dark:text-gray-300">{s.source}</td>
                    <td className="px-4 py-3">
                      <span className={`text-xs font-medium rounded-full px-2 py-1 ${s.isActive ? "bg-green-100 text-green-700 dark:bg-green-900/50 dark:text-green-300" : "bg-gray-100 text-gray-500 dark:bg-gray-700"}`}>
                        {s.isActive ? "Active" : "Unsubscribed"}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-gray-400 whitespace-nowrap">
                      {new Date(s.createdAt).toLocaleDateString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {selected && (
        <MessageModal
          message={selected}
          isGlobalAdmin={isGlobalAdmin}
          onClose={() => setSelectedId(null)}
          onStatusChange={handleStatusChange}
        />
      )}
    </div>
  );
}
