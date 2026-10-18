//admin
// src/pages/bookings/BookingRequests.jsx
//
// Admin response page for the storefront "Barista Training" and "Rent a Coffee
// Machine" requests. Same idea as the Contact Messages page: every submission is
// stored, and Sales / Sales Manager / Manager / IT / Director can respond,
// track status and leave internal notes.
//
// NIGERIA ONLY. The API refuses any country-scoped admin that is not NG
// (middleware/nigeriaOnly.js) and filters data by country as well; this page also
// shows a "not available" notice and the sidebar hides the link for those admins.
import React, { useState, useEffect, useCallback } from "react";
import {
  CalendarCheck, RefreshCw, Eye, X, Phone, MessageCircle, Mail, Copy,
  GraduationCap, Coffee, Search, Send, Clock, Ban,
} from "lucide-react";
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

const STATUS_OPTIONS = ["NEW", "CONTACTED", "CONFIRMED", "COMPLETED", "CANCELLED"];
const STATUS_LABELS = {
  NEW: "New", CONTACTED: "Contacted", CONFIRMED: "Confirmed", COMPLETED: "Completed", CANCELLED: "Cancelled",
};
const STATUS_COLORS = {
  NEW: "bg-blue-100 text-blue-700 dark:bg-blue-900/50 dark:text-blue-300",
  CONTACTED: "bg-amber-100 text-amber-700 dark:bg-amber-900/50 dark:text-amber-300",
  CONFIRMED: "bg-purple-100 text-purple-700 dark:bg-purple-900/50 dark:text-purple-300",
  COMPLETED: "bg-green-100 text-green-700 dark:bg-green-900/50 dark:text-green-300",
  CANCELLED: "bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400",
};
const SERVICE_META = {
  training: { label: "Barista Training", short: "Training", icon: GraduationCap, cls: "bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300" },
  rental: { label: "Machine Rental", short: "Rental", icon: Coffee, cls: "bg-orange-50 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300" },
};

const fmtDateTime = (d) => (d ? new Date(d).toLocaleString() : "—");
const fmtDay = (iso) => {
  if (!iso) return "—";
  const d = new Date(`${iso}T00:00:00`);
  return isNaN(d) ? iso : d.toLocaleDateString(undefined, { weekday: "short", day: "numeric", month: "short", year: "numeric" });
};
const waDigits = (phone) => String(phone || "").replace(/[^\d]/g, "");

function DetailRow({ label, children }) {
  if (children === undefined || children === null || children === "") return null;
  return (
    <div>
      <div className="text-xs uppercase tracking-wide text-gray-400 dark:text-gray-500 mb-0.5">{label}</div>
      <div className="text-sm text-gray-900 dark:text-gray-100 break-words">{children}</div>
    </div>
  );
}

function StatusSelect({ value, onChange, className = "" }) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className={`text-xs font-medium rounded-full px-2 py-1 border-0 ${STATUS_COLORS[value]} ${className}`}
    >
      {STATUS_OPTIONS.map((s) => (
        <option key={s} value={s}>{STATUS_LABELS[s]}</option>
      ))}
    </select>
  );
}

function BookingModal({ booking: b, onClose, onUpdate }) {
  const [note, setNote] = useState("");
  const [saving, setSaving] = useState(false);
  const meta = SERVICE_META[b.service] || SERVICE_META.training;

  useEffect(() => {
    const onKey = (e) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  const copy = (text) => {
    try { navigator.clipboard.writeText(text); toast.success("Copied"); } catch { toast.error("Copy failed"); }
  };

  const subject = encodeURIComponent(`Your ${meta.label.toLowerCase()} request - I-Coffee Nigeria`);
  const greeting = `Hello ${b.name}, this is I-Coffee Nigeria about your ${meta.label.toLowerCase()} request for ${fmtDay(b.preferredDate)} (${String(b.timeSlot).toLowerCase()}).`;
  const wa = waDigits(b.whatsapp || b.phone);
  const prefers = b.contactMode; // what the customer asked for

  const actionCls = (mode, base) =>
    `inline-flex items-center gap-1.5 px-3 py-2 text-sm rounded-lg ${base} ${prefers === mode ? "ring-2 ring-offset-2 ring-amber-400 dark:ring-offset-gray-900" : ""}`;

  const addNote = async () => {
    const text = note.trim();
    if (!text) return;
    setSaving(true);
    const ok = await onUpdate(b._id, { note: text });
    if (ok) setNote("");
    setSaving(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50" onClick={onClose} role="dialog" aria-modal="true">
      <div
        className="w-full max-w-2xl max-h-[90vh] overflow-y-auto bg-white dark:bg-gray-900 rounded-xl shadow-xl border border-gray-200 dark:border-gray-700"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="sticky top-0 z-10 flex items-start justify-between gap-3 px-6 py-4 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700">
          <div className="min-w-0">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white truncate">{meta.label} · {b.name}</h2>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">Received {fmtDateTime(b.createdAt)}</p>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800" aria-label="Close">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="px-6 py-5 space-y-6">
          <div className="flex flex-wrap items-center gap-2">
            <span className={`text-xs font-medium px-2 py-1 rounded-full inline-flex items-center gap-1 ${meta.cls}`}>
              <meta.icon className="w-3 h-3" /> {meta.label}
            </span>
            <div className="ml-auto flex items-center gap-2">
              <span className="text-xs text-gray-500 dark:text-gray-400">Status</span>
              <StatusSelect value={b.status} onChange={(s) => onUpdate(b._id, { status: s })} />
            </div>
          </div>

          {/* What the customer wants — most important for the responder */}
          <section className="rounded-lg border border-amber-200 dark:border-amber-800/60 bg-amber-50 dark:bg-amber-900/20 p-4 grid grid-cols-1 sm:grid-cols-3 gap-4">
            <DetailRow label="Preferred date">{fmtDay(b.preferredDate)}</DetailRow>
            <DetailRow label="Time of day">{b.timeSlot}</DetailRow>
            <DetailRow label="Wants to be reached by"><span className="font-semibold">{b.contactMode}</span></DetailRow>
          </section>

          <section className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <DetailRow label="Name">{b.name}</DetailRow>
            <DetailRow label="Language submitted">{b.submittedLanguage && b.submittedLanguage.toUpperCase()}</DetailRow>
            <DetailRow label="Email">
              <span className="inline-flex items-center gap-2">
                <a href={`mailto:${b.email}?subject=${subject}`} className="text-blue-600 dark:text-blue-400 hover:underline">{b.email}</a>
                <button onClick={() => copy(b.email)} className="text-gray-400 hover:text-gray-700 dark:hover:text-white" title="Copy"><Copy className="w-3.5 h-3.5" /></button>
              </span>
            </DetailRow>
            <DetailRow label="Phone">
              <span className="inline-flex items-center gap-2">
                <a href={`tel:${b.phone}`} className="text-blue-600 dark:text-blue-400 hover:underline">{b.phone}</a>
                <button onClick={() => copy(b.phone)} className="text-gray-400 hover:text-gray-700 dark:hover:text-white" title="Copy"><Copy className="w-3.5 h-3.5" /></button>
              </span>
            </DetailRow>
            {b.whatsapp && b.whatsapp !== b.phone && <DetailRow label="WhatsApp">{b.whatsapp}</DetailRow>}
          </section>

          {b.extras?.length > 0 && (
            <section>
              <div className="text-xs uppercase tracking-wide text-gray-400 dark:text-gray-500 mb-1.5">Request details</div>
              <dl className="bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg divide-y divide-gray-200 dark:divide-gray-700">
                {b.extras.map((x, i) => (
                  <div key={i} className="grid grid-cols-3 gap-3 px-4 py-2.5 text-sm">
                    <dt className="text-gray-500 dark:text-gray-400">{x.label}</dt>
                    <dd className="col-span-2 text-gray-900 dark:text-gray-100 whitespace-pre-wrap break-words">{x.value}</dd>
                  </div>
                ))}
              </dl>
            </section>
          )}

          {/* Internal notes + response log */}
          <section>
            <div className="text-xs uppercase tracking-wide text-gray-400 dark:text-gray-500 mb-1.5">Internal notes</div>
            {b.respondedAt && (
              <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">
                First response {fmtDateTime(b.respondedAt)}{b.respondedByName ? ` by ${b.respondedByName}` : ""}{b.respondedByRole ? ` (${b.respondedByRole})` : ""}
              </p>
            )}
            <div className="space-y-2">
              {(b.notes || []).length === 0 && <p className="text-sm text-gray-400">No notes yet.</p>}
              {(b.notes || []).map((n) => (
                <div key={n._id} className="text-sm bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-2">
                  <div className="whitespace-pre-wrap break-words text-gray-800 dark:text-gray-100">{n.text}</div>
                  <div className="text-[11px] text-gray-400 mt-1">{n.byName}{n.byRole ? ` · ${n.byRole}` : ""} · {fmtDateTime(n.at)}</div>
                </div>
              ))}
            </div>
            <div className="mt-3 flex gap-2 items-end">
              <textarea
                rows={2}
                value={note}
                maxLength={2000}
                onChange={(e) => setNote(e.target.value)}
                placeholder="e.g. Called, confirmed Tuesday 10am, deposit pending…"
                className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm bg-white dark:bg-gray-800 dark:text-white"
              />
              <button
                onClick={addNote}
                disabled={saving || !note.trim()}
                className="inline-flex items-center gap-1.5 px-3 py-2 text-sm rounded-lg bg-gray-900 text-white dark:bg-white dark:text-gray-900 disabled:opacity-40"
              >
                <Send className="w-4 h-4" /> Add
              </button>
            </div>
          </section>

          <div className="text-xs text-gray-400 dark:text-gray-500 flex flex-wrap gap-x-6 gap-y-1">
            <span>Created: {fmtDateTime(b.createdAt)}</span>
            {b.updatedAt && b.updatedAt !== b.createdAt && <span>Last updated: {fmtDateTime(b.updatedAt)}</span>}
            <span>Team email: {b.emailSent ? "sent" : "not sent"}</span>
          </div>
        </div>

        <div className="sticky bottom-0 flex flex-wrap justify-end gap-2 px-6 py-4 bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-700">
          {wa && (
            <a
              href={`https://wa.me/${wa}?text=${encodeURIComponent(greeting)}`}
              target="_blank" rel="noreferrer"
              className={actionCls("WhatsApp", "bg-green-600 text-white hover:bg-green-700")}
            >
              <MessageCircle className="w-4 h-4" /> WhatsApp
            </a>
          )}
          <a href={`tel:${b.phone}`} className={actionCls("Phone call", "border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-800")}>
            <Phone className="w-4 h-4" /> Call
          </a>
          <a
            href={`mailto:${b.email}?subject=${subject}&body=${encodeURIComponent(greeting)}`}
            className={actionCls("Email", "bg-blue-600 text-white hover:bg-blue-700")}
          >
            <Mail className="w-4 h-4" /> Reply by email
          </a>
        </div>
      </div>
    </div>
  );
}

export default function BookingRequests() {
  const { t } = useAdminTranslation();
  const { isGlobalAdmin, countryScope } = useAdminCountry();
  const allowed = isGlobalAdmin || countryScope === "NG";

  const [items, setItems] = useState([]);
  const [newCount, setNewCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [service, setService] = useState("");
  const [status, setStatus] = useState("");
  const [search, setSearch] = useState("");
  const [query, setQuery] = useState("");
  const [selectedId, setSelectedId] = useState(null);
  const selected = items.find((x) => x._id === selectedId) || null;

  useEffect(() => {
    const id = setTimeout(() => setQuery(search.trim()), 350);
    return () => clearTimeout(id);
  }, [search]);

  const load = useCallback(async () => {
    if (!allowed) return;
    setLoading(true);
    try {
      const p = new URLSearchParams();
      if (service) p.set("service", service);
      if (status) p.set("status", status);
      if (query) p.set("q", query);
      const res = await apiFetch(`/admin/booking-requests?${p.toString()}`);
      if (res.success) {
        setItems(res.data || []);
        setNewCount(res.newCount || 0);
      } else {
        toast.error(res.message || "Failed to load requests");
      }
    } catch {
      toast.error("Failed to load requests");
    } finally {
      setLoading(false);
    }
  }, [allowed, service, status, query]);

  useEffect(() => { load(); }, [load]);

  const update = async (id, body) => {
    const res = await apiFetch(`/admin/booking-requests/${id}`, { method: "PATCH", body: JSON.stringify(body) });
    if (res.success) {
      setItems((prev) => prev.map((x) => (x._id === id ? res.data : x)));
      if (body.status) {
        toast.success("Status updated");
        load(); // refresh the "new" counter
      } else {
        toast.success("Note added");
      }
      return true;
    }
    toast.error(res.message || "Update failed");
    return false;
  };

  if (!allowed) {
    return (
      <div className="p-6">
        <div className="max-w-lg mx-auto mt-16 text-center bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl p-8">
          <Ban className="w-10 h-10 mx-auto text-gray-400 mb-3" />
          <h1 className="text-lg font-semibold text-gray-900 dark:text-white">Not available for your account</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Barista training and machine rental requests are handled by the Nigeria team only.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <CalendarCheck className="w-6 h-6" /> {t("nav.bookingRequests") || "Booking Requests"}
            {newCount > 0 && (
              <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-red-600 text-white">{newCount} new</span>
            )}
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Barista training registrations and coffee machine rentals · Nigeria
          </p>
        </div>
        <button onClick={load} className="p-2 text-gray-500 hover:text-gray-800 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg" title="Refresh">
          <RefreshCw className={`w-5 h-5 ${loading ? "animate-spin" : ""}`} />
        </button>
      </div>

      <div className="flex flex-wrap gap-3">
        <div className="relative">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search name, email, phone"
            className="pl-9 pr-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm bg-white dark:bg-gray-800 dark:text-white w-64"
          />
        </div>
        <select value={service} onChange={(e) => setService(e.target.value)} className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm bg-white dark:bg-gray-800 dark:text-white">
          <option value="">All services</option>
          <option value="training">Barista Training</option>
          <option value="rental">Machine Rental</option>
        </select>
        <select value={status} onChange={(e) => setStatus(e.target.value)} className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm bg-white dark:bg-gray-800 dark:text-white">
          <option value="">All statuses</option>
          {STATUS_OPTIONS.map((s) => <option key={s} value={s}>{STATUS_LABELS[s]}</option>)}
        </select>
      </div>

      <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm min-w-[860px]">
            <thead className="bg-gray-50 dark:bg-gray-800 text-left text-gray-500 dark:text-gray-400">
              <tr>
                <th className="px-4 py-3 font-medium">Name</th>
                <th className="px-4 py-3 font-medium">Email / Phone</th>
                <th className="px-4 py-3 font-medium">Service</th>
                <th className="px-4 py-3 font-medium">Preferred slot</th>
                <th className="px-4 py-3 font-medium">Reach by</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 font-medium">Received</th>
                <th className="px-4 py-3 font-medium text-right">View</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
              {items.length === 0 && !loading && (
                <tr><td colSpan={8} className="px-4 py-8 text-center text-gray-400">No requests yet.</td></tr>
              )}
              {items.map((b) => {
                const meta = SERVICE_META[b.service] || SERVICE_META.training;
                return (
                  <tr key={b._id} onClick={() => setSelectedId(b._id)} className="cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800/50">
                    <td className="px-4 py-3 font-medium text-gray-900 dark:text-white">
                      {b.name}
                      {b.status === "NEW" && <span className="ml-2 inline-block w-2 h-2 rounded-full bg-blue-500 align-middle" title="New" />}
                    </td>
                    <td className="px-4 py-3 text-gray-600 dark:text-gray-300">
                      <div>{b.email}</div>
                      <div className="text-xs text-gray-400">{b.phone}</div>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center gap-1 text-xs font-medium px-2 py-1 rounded-full ${meta.cls}`}>
                        <meta.icon className="w-3 h-3" /> {meta.short}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-gray-600 dark:text-gray-300 whitespace-nowrap">
                      <div>{fmtDay(b.preferredDate)}</div>
                      <div className="text-xs text-gray-400 inline-flex items-center gap-1"><Clock className="w-3 h-3" />{b.timeSlot}</div>
                    </td>
                    <td className="px-4 py-3 text-gray-600 dark:text-gray-300">{b.contactMode}</td>
                    <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
                      <StatusSelect value={b.status} onChange={(s) => update(b._id, { status: s })} />
                    </td>
                    <td className="px-4 py-3 text-gray-400 whitespace-nowrap">{new Date(b.createdAt).toLocaleDateString()}</td>
                    <td className="px-4 py-3 text-right">
                      <button
                        onClick={(e) => { e.stopPropagation(); setSelectedId(b._id); }}
                        className="p-1.5 rounded-lg text-gray-500 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-gray-800"
                        title="View & respond"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {selected && (
        <BookingModal
          booking={selected}
          onClose={() => setSelectedId(null)}
          onUpdate={update}
        />
      )}
    </div>
  );
}
