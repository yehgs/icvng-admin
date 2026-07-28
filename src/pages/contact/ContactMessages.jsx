//admin
// src/pages/contact/ContactMessages.jsx
//
// Item #1 — admin view of ContactForm submissions and newsletter
// subscribers. Country scoping is enforced server-side (countryScope
// middleware + countryScopedPlugin on both models) — this page just
// renders whatever the API returns, which is already narrowed to the
// logged-in admin's country unless they're GLOBAL-scoped (IT/DIRECTOR).
import React, { useState, useEffect, useCallback } from "react";
import { Mail, Users, RefreshCw, Globe } from "lucide-react";
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

export default function ContactMessages() {
  const { t } = useAdminTranslation();
  const { isGlobalAdmin, countryScope } = useAdminCountry();

  const [tab, setTab] = useState("messages"); // messages | subscribers
  const [messages, setMessages] = useState([]);
  const [subscribers, setSubscribers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [formTypeFilter, setFormTypeFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");

  const fetchMessages = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (formTypeFilter) params.set("formType", formTypeFilter);
      if (statusFilter) params.set("status", statusFilter);
      const res = await apiFetch(`/admin/contact-messages?${params.toString()}`);
      if (res.success) setMessages(res.data || []);
      else toast.error(res.message || "Failed to load messages");
    } catch {
      toast.error("Failed to load messages");
    } finally {
      setLoading(false);
    }
  }, [formTypeFilter, statusFilter]);

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
      <div className="flex items-center justify-between">
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
          </div>

          <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 dark:bg-gray-800 text-left text-gray-500 dark:text-gray-400">
                  <tr>
                    <th className="px-4 py-3 font-medium">Name</th>
                    <th className="px-4 py-3 font-medium">Email / Phone</th>
                    <th className="px-4 py-3 font-medium">Type</th>
                    {isGlobalAdmin && <th className="px-4 py-3 font-medium">Country</th>}
                    <th className="px-4 py-3 font-medium">Subject / Message</th>
                    <th className="px-4 py-3 font-medium">Status</th>
                    <th className="px-4 py-3 font-medium">Received</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                  {messages.length === 0 && !loading && (
                    <tr><td colSpan={isGlobalAdmin ? 7 : 6} className="px-4 py-8 text-center text-gray-400">No messages yet.</td></tr>
                  )}
                  {messages.map((m) => (
                    <tr key={m._id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50">
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
                      <td className="px-4 py-3 text-gray-600 dark:text-gray-300 max-w-xs">
                        {m.subject && <div className="font-medium text-gray-800 dark:text-gray-200">{m.subject}</div>}
                        <div className="truncate">{m.message}</div>
                      </td>
                      <td className="px-4 py-3">
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
            <table className="w-full text-sm">
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
    </div>
  );
}
