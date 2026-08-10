//admin
// src/pages/crm/CrmManagement.jsx  (updated — delete requests, metrics, SALES_MANAGER)
import React, { useState, useEffect, useCallback } from "react";
import {
  Users,
  Plus,
  Search,
  Edit,
  Trash2,
  RefreshCw,
  Phone,
  Mail,
  Globe,
  Building2,
  MapPin,
  X,
  BarChart3,
  TrendingUp,
  Award,
  Target,
  AlertTriangle,
  Calendar,
  ExternalLink,
  Linkedin,
  Facebook,
  List,
  Kanban,
  CheckCircle,
  Clock,
  ShieldAlert,
  MessageSquare,
  UserCircle,
  FileDown,
  Upload,
  FileUp,
} from "lucide-react";
import toast from "react-hot-toast";
import { getCurrentUser } from "../../utils/api";
import { useAdminTranslation } from "../../hooks/useAdminTranslation.js";

const API_BASE =
  import.meta.env.VITE_APP_API_URL || "http://localhost:8080/api";

async function apiFetch(path, options = {}) {
  const token = localStorage.getItem("accessToken");
  const res = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
      ...(options.headers || {}),
    },
  });
  return res.json();
}

// For CSV endpoints (template/export) — these return a raw file, not JSON,
// so apiFetch's res.json() would break on them. Same blob-download pattern
// already used for shipping CSV exports (admin/src/utils/api.js).
async function downloadFile(path, filenameFallback) {
  const token = localStorage.getItem("accessToken");
  const res = await fetch(`${API_BASE}${path}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) throw new Error("Download failed");

  const blob = await res.blob();
  const blobUrl = window.URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = blobUrl;
  link.download = filenameFallback;
  document.body.appendChild(link);
  link.click();
  setTimeout(() => {
    document.body.removeChild(link);
    window.URL.revokeObjectURL(blobUrl);
  }, 100);
}

const STAGE_COLORS = {
  New: {
    bg: "bg-slate-100 dark:bg-slate-800",
    border: "border-slate-300 dark:border-slate-600",
    badge: "bg-slate-200 text-slate-700",
    dot: "bg-slate-400",
  },
  Contacted: {
    bg: "bg-blue-50 dark:bg-blue-900/20",
    border: "border-blue-300 dark:border-blue-700",
    badge: "bg-blue-100 text-blue-700",
    dot: "bg-blue-400",
  },
  Qualified: {
    bg: "bg-indigo-50 dark:bg-indigo-900/20",
    border: "border-indigo-300 dark:border-indigo-700",
    badge: "bg-indigo-100 text-indigo-700",
    dot: "bg-indigo-500",
  },
  "Proposal Sent": {
    bg: "bg-purple-50 dark:bg-purple-900/20",
    border: "border-purple-300 dark:border-purple-700",
    badge: "bg-purple-100 text-purple-700",
    dot: "bg-purple-500",
  },
  Negotiation: {
    bg: "bg-orange-50 dark:bg-orange-900/20",
    border: "border-orange-300 dark:border-orange-700",
    badge: "bg-orange-100 text-orange-700",
    dot: "bg-orange-500",
  },
  Won: {
    bg: "bg-green-50 dark:bg-green-900/20",
    border: "border-green-300 dark:border-green-700",
    badge: "bg-green-100 text-green-700",
    dot: "bg-green-500",
  },
  Lost: {
    bg: "bg-red-50 dark:bg-red-900/20",
    border: "border-red-300 dark:border-red-700",
    badge: "bg-red-100 text-red-700",
    dot: "bg-red-400",
  },
  "On Hold": {
    bg: "bg-yellow-50 dark:bg-yellow-900/20",
    border: "border-yellow-300 dark:border-yellow-700",
    badge: "bg-yellow-100 text-yellow-700",
    dot: "bg-yellow-400",
  },
};

const ACTIVITY_ICONS = {
  note: "📝",
  call: "📞",
  email: "✉️",
  meeting: "🤝",
  stage_change: "🔄",
  task: "✅",
  system: "⚙️",
};
const SUPER_DELETE_ROLES = ["IT", "DIRECTOR"];
const METRICS_ROLES = ["IT", "DIRECTOR", "MANAGER", "SALES_MANAGER"];

const EMPTY_FORM = {
  companyName: "",
  contactName: "",
  jobTitle: "",
  email: "",
  phone: "",
  website: "",
  address: "",
  city: "",
  country: "Nigeria",
  industry: "Other",
  linkedinUrl: "",
  facebookUrl: "",
  stage: "New",
  source: "Manual Entry",
  dealValue: "",
  currency: "NGN",
  probability: 0,
  notes: "",
  tags: "",
  nextFollowUpDate: "",
  expectedCloseDate: "",
};

function formatNGN(v) {
  return v ? `₦${Number(v).toLocaleString()}` : "₦0";
}
function timeAgo(d) {
  if (!d) return "";
  const diff = Date.now() - new Date(d).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return "just now";
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

// ── Delete Request Modal ──────────────────────────────────────────────────────
function DeleteRequestModal({ lead, onClose, onSubmit }) {
  const { t } = useAdminTranslation();
  const [reason, setReason] = useState("");
  const [submitting, setSubmitting] = useState(false);
  return (
    <div className="fixed inset-0 bg-black/60 z-[60] flex items-center justify-center p-4">
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl w-full max-w-md">
        <div className="p-6 border-b border-gray-200 dark:border-gray-700 flex items-start gap-3">
          <div className="p-2 bg-orange-100 dark:bg-orange-900/30 rounded-lg flex-shrink-0">
            <ShieldAlert className="h-5 w-5 text-orange-600" />
          </div>
          <div>
            <h3 className="font-semibold text-gray-900 dark:text-white">
              {t('crm.requestLeadDeletion')}
            </h3>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
              {t('crm.onlyItDirectorCanDelete')}
            </p>
          </div>
        </div>
        <div className="p-6 space-y-4">
          <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-3 text-sm text-gray-700 dark:text-gray-300">
            <span className="font-medium">{t('crm.leadColon')}</span>{" "}
            {lead.companyName || lead.contactName}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              {t('crm.reasonForDeletion')} <span className="text-red-500">*</span>
            </label>
            <textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              rows={4}
              placeholder={t('crm.explainWhyDeleted')}
              className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-sm bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 resize-none"
            />
          </div>
        </div>
        <div className="flex items-center justify-end gap-3 p-6 border-t border-gray-200 dark:border-gray-700">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-800"
          >
            {t('common.cancel')}
          </button>
          <button
            onClick={async () => {
              if (!reason.trim()) {
                toast.error(t('crm.reasonRequired'));
                return;
              }
              setSubmitting(true);
              await onSubmit(reason);
              setSubmitting(false);
            }}
            disabled={submitting || !reason.trim()}
            className="flex items-center gap-2 px-5 py-2 bg-orange-600 hover:bg-orange-700 text-white rounded-lg text-sm font-medium disabled:opacity-50"
          >
            {submitting ? (
              <RefreshCw className="h-4 w-4 animate-spin" />
            ) : (
              <ShieldAlert className="h-4 w-4" />
            )}
            {submitting ? t('crm.submittingEllipsis') : t('crm.submitRequest')}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Review Modal (IT / Director) ──────────────────────────────────────────────
function ReviewDeleteModal({ lead, onClose, onReview }) {
  const { t } = useAdminTranslation();
  const [reviewNote, setReviewNote] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const req = lead.pendingDeleteRequest;
  return (
    <div className="fixed inset-0 bg-black/60 z-[60] flex items-center justify-center p-4">
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl w-full max-w-md">
        <div className="p-6 border-b border-gray-200 dark:border-gray-700">
          <h3 className="font-semibold text-gray-900 dark:text-white">
            {t('crm.reviewDeleteRequest')}
          </h3>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
            {t('crm.wantsToDeleteLead', { name: req?.requestedByName, role: req?.requestedBySubRole })}
          </p>
        </div>
        <div className="p-6 space-y-4">
          <div className="bg-orange-50 dark:bg-orange-900/10 border border-orange-200 dark:border-orange-800 rounded-lg p-3 space-y-1">
            <p className="text-sm font-medium text-gray-800 dark:text-gray-200">
              {lead.companyName || lead.contactName}
            </p>
            <p className="text-xs text-gray-500">
              {lead.email} · {lead.phone}
            </p>
          </div>
          <div>
            <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">
              {t('crm.reasonGiven')}
            </p>
            <p className="text-sm text-gray-700 dark:text-gray-300 bg-gray-50 dark:bg-gray-700/50 rounded-lg p-3">
              {req?.reason}
            </p>
          </div>
          <p className="text-xs text-gray-400">
            {t('crm.requestedAgo', { time: timeAgo(req?.createdAt) })}
          </p>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              {t('crm.reviewNoteOptional')}
            </label>
            <textarea
              value={reviewNote}
              onChange={(e) => setReviewNote(e.target.value)}
              rows={2}
              placeholder={t('support.addNote')}
              className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-sm bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 resize-none"
            />
          </div>
        </div>
        <div className="flex items-center justify-end gap-3 p-6 border-t border-gray-200 dark:border-gray-700">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm text-gray-600 dark:text-gray-400"
          >
            {t('common.close')}
          </button>
          <button
            onClick={async () => {
              setSubmitting(true);
              await onReview("reject", reviewNote);
              setSubmitting(false);
            }}
            disabled={submitting}
            className="px-4 py-2 bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 rounded-lg text-sm font-medium disabled:opacity-50"
          >
            {t('crm.reject')}
          </button>
          <button
            onClick={async () => {
              setSubmitting(true);
              await onReview("approve", reviewNote);
              setSubmitting(false);
            }}
            disabled={submitting}
            className="flex items-center gap-2 px-5 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg text-sm font-medium disabled:opacity-50"
          >
            {submitting ? (
              <RefreshCw className="h-4 w-4 animate-spin" />
            ) : (
              <Trash2 className="h-4 w-4" />
            )}
            {t('crm.approveAndDelete')}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Import Leads CSV Modal ───────────────────────────────────────────────────
// File picker → read as text → send to bulkImportLeadsCsvController →
// show per-row results (created/failed with reasons). Country-scoped
// automatically server-side (see that controller's own comment) — a
// COUNTRY-scoped admin's import always lands in their own country
// regardless of anything in the file.
function ImportLeadsModal({ onClose, onDownloadTemplate, onImport }) {
  const [file, setFile] = useState(null);
  const [importing, setImporting] = useState(false);
  const [result, setResult] = useState(null);

  const handleFileChange = (e) => {
    setResult(null);
    setFile(e.target.files?.[0] || null);
  };

  const handleSubmit = async () => {
    if (!file) return;
    setImporting(true);
    setResult(null);
    try {
      const csvData = await file.text();
      const res = await onImport(csvData);
      setResult(res);
    } catch (err) {
      setResult({ success: false, message: err.message || "Import failed" });
    } finally {
      setImporting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-lg">
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-200 dark:border-gray-700">
          <h2 className="font-semibold text-gray-900 dark:text-white">Import Leads from CSV</h2>
          <button onClick={onClose}><X className="w-5 h-5 text-gray-400" /></button>
        </div>
        <div className="p-5 space-y-4">
          <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-3 text-sm text-blue-800 dark:text-blue-300">
            New here? Download the template first — it has every column,
            an example row, and the exact Stage/Source values that are
            accepted.
          </div>
          <button
            onClick={onDownloadTemplate}
            className="flex items-center gap-2 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 text-sm font-medium text-gray-700 dark:text-gray-300"
          >
            <FileDown className="h-4 w-4" /> Download CSV template
          </button>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              CSV file
            </label>
            <input
              type="file"
              accept=".csv,text/csv"
              onChange={handleFileChange}
              className="w-full text-sm text-gray-600 dark:text-gray-300 file:mr-3 file:py-2 file:px-3 file:rounded-lg file:border-0 file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
            />
          </div>

          {result && (
            <div className={`rounded-lg p-3 text-sm ${result.success ? "bg-green-50 dark:bg-green-900/20 text-green-800 dark:text-green-300" : "bg-red-50 dark:bg-red-900/20 text-red-800 dark:text-red-300"}`}>
              <p className="font-medium">{result.message}</p>
              {result.data?.failed?.length > 0 && (
                <ul className="mt-2 space-y-0.5 max-h-32 overflow-y-auto text-xs">
                  {result.data.failed.map((f, i) => (
                    <li key={i}>Row {f.row}: {f.reason}</li>
                  ))}
                </ul>
              )}
            </div>
          )}
        </div>
        <div className="flex justify-end gap-2 px-5 py-4 border-t border-gray-200 dark:border-gray-700">
          <button onClick={onClose} className="px-4 py-2 text-sm text-gray-600 dark:text-gray-400">
            Close
          </button>
          <button
            onClick={handleSubmit}
            disabled={!file || importing}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm font-medium disabled:opacity-50"
          >
            {importing ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
            Import
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Main Component ────────────────────────────────────────────────────────────
export default function CrmManagement() {
  const { t } = useAdminTranslation();
  const currentUser = getCurrentUser();
  const canHardDelete = SUPER_DELETE_ROLES.includes(currentUser?.subRole);
  const canSeeMetrics = METRICS_ROLES.includes(currentUser?.subRole);
  // "IT and the Manager... exposed to all countries' CRM but manager and
  // other roles are country-scoped" — matches getCurrentUser().scope, same
  // signal used throughout the admin app (AdminCountryContext.isGlobalAdmin)
  // for exactly this GLOBAL-vs-COUNTRY distinction. Used here only for the
  // Export button's tooltip — the actual scoping is enforced server-side
  // (buildCountryFilter in crm-lead.controller.js), this is just accurate
  // UI copy, not a security boundary.
  const isGlobalAdminForCrm = currentUser?.scope !== "COUNTRY";

  const [meta, setMeta] = useState({
    CRM_STAGES: [],
    LEAD_SOURCES: [],
    LEAD_INDUSTRIES: [],
  });
  const [leads, setLeads] = useState([]);
  const [stats, setStats] = useState(null);
  const [pendingDeletes, setPendingDeletes] = useState([]);
  const [loading, setLoading] = useState(false);
  const [total, setTotal] = useState(0);
  const [stageCounts, setStageCounts] = useState({});
  const [pipelineValue, setPipelineValue] = useState(0);
  const [pendingDeleteCount, setPendingDeleteCount] = useState(0);

  const [viewMode, setViewMode] = useState("board");
  const [search, setSearch] = useState("");
  const [filterStage, setFilterStage] = useState("");
  const [filterSource, setFilterSource] = useState("");
  const [activeTab, setActiveTab] = useState("pipeline"); // 'pipeline' | 'requests' | 'metrics'

  const [showForm, setShowForm] = useState(false);
  const [editLead, setEditLead] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);
  const [exporting, setExporting] = useState(false);

  const [selectedLead, setSelectedLead] = useState(null);
  const [activityInput, setActivityInput] = useState("");
  const [activityType, setActivityType] = useState("note");
  const [addingActivity, setAddingActivity] = useState(false);

  // Delete modals
  const [deleteRequestTarget, setDeleteRequestTarget] = useState(null); // lead for request modal
  const [reviewTarget, setReviewTarget] = useState(null); // lead for review modal
  const [dragOver, setDragOver] = useState(null);

  const fetchMeta = useCallback(async () => {
    const d = await apiFetch("/admin/crm/meta");
    if (d.success) setMeta(d.data);
  }, []);

  const fetchLeads = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ limit: 200 });
      if (search) params.set("search", search);
      if (filterStage) params.set("stage", filterStage);
      if (filterSource) params.set("source", filterSource);
      const d = await apiFetch(`/admin/crm/leads?${params}`);
      if (d.success) {
        setLeads(d.data);
        setTotal(d.total);
        setPipelineValue(d.pipelineValue || 0);
        setPendingDeleteCount(d.pendingDeleteCount || 0);
        const sc = {};
        (d.stageCounts || []).forEach((s) => {
          sc[s._id] = s;
        });
        setStageCounts(sc);
      }
    } finally {
      setLoading(false);
    }
  }, [search, filterStage, filterSource]);

  const fetchStats = useCallback(async () => {
    const d = await apiFetch("/admin/crm/stats");
    if (d.success) setStats(d.data);
  }, []);

  const handleDownloadTemplate = useCallback(async () => {
    try {
      await downloadFile("/admin/crm/leads/template/csv", "crm_leads_import_template.csv");
    } catch (err) {
      toast.error(err.message || "Failed to download template");
    }
  }, []);

  const handleExportCsv = useCallback(async () => {
    setExporting(true);
    try {
      const params = new URLSearchParams();
      if (filterStage) params.set("stage", filterStage);
      if (filterSource) params.set("source", filterSource);
      if (search) params.set("search", search);
      const qs = params.toString();
      await downloadFile(
        `/admin/crm/leads/export/csv${qs ? `?${qs}` : ""}`,
        `crm_leads_${new Date().toISOString().split("T")[0]}.csv`,
      );
    } catch (err) {
      toast.error(err.message || "Failed to export leads");
    } finally {
      setExporting(false);
    }
  }, [filterStage, filterSource, search]);

  const handleImportCsv = useCallback(async (csvData) => {
    const d = await apiFetch("/admin/crm/leads/import/csv", {
      method: "POST",
      body: JSON.stringify({ csvData }),
    });
    if (d.success) {
      toast.success(d.message || "Import complete");
      fetchLeads();
      fetchStats();
    } else {
      toast.error(d.message || "Import failed");
    }
    return d;
  }, [fetchLeads, fetchStats]);

  const fetchPendingDeletes = useCallback(async () => {
    if (!canHardDelete) return;
    const d = await apiFetch("/admin/crm/delete-requests");
    if (d.success) setPendingDeletes(d.data);
  }, [canHardDelete]);

  useEffect(() => {
    fetchMeta();
    fetchLeads();
    fetchStats();
    if (canHardDelete) fetchPendingDeletes();
  }, [fetchMeta, fetchLeads, fetchStats, fetchPendingDeletes, canHardDelete]);

  const handleSave = async () => {
    if (!form.companyName && !form.contactName) {
      toast.error(t('crm.companyOrContactRequired'));
      return;
    }
    setSaving(true);
    try {
      const payload = {
        ...form,
        dealValue: parseFloat(form.dealValue) || 0,
        tags: form.tags
          ? form.tags
              .split(",")
              .map((t) => t.trim())
              .filter(Boolean)
          : [],
      };
      const d = editLead
        ? await apiFetch(`/admin/crm/leads/${editLead._id}`, {
            method: "PUT",
            body: JSON.stringify(payload),
          })
        : await apiFetch("/admin/crm/leads", {
            method: "POST",
            body: JSON.stringify(payload),
          });
      if (d.success) {
        toast.success(editLead ? t('crm.leadUpdated') : t('crm.leadCreated'));
        setShowForm(false);
        setEditLead(null);
        setForm(EMPTY_FORM);
        fetchLeads();
        fetchStats();
      } else toast.error(d.message || t("orders.statuses.FAILED"));
    } finally {
      setSaving(false);
    }
  };

  // ── Delete / request flow ──────────────────────────────────────────────────
  const handleDelete = (lead) => {
    if (canHardDelete) {
      if (
        !confirm(
          t('crm.permanentlyDeleteConfirm', { name: lead.companyName || lead.contactName }),
        )
      )
        return;
      apiFetch(`/admin/crm/leads/${lead._id}`, { method: "DELETE" }).then(
        (d) => {
          if (d.success) {
            toast.success(t('crm.leadDeleted'));
            fetchLeads();
            fetchStats();
            if (selectedLead?._id === lead._id) setSelectedLead(null);
          } else toast.error(d.message);
        },
      );
    } else {
      setDeleteRequestTarget(lead);
    }
  };

  const handleSubmitDeleteRequest = async (reason) => {
    const d = await apiFetch(`/admin/crm/leads/${deleteRequestTarget._id}`, {
      method: "DELETE",
      body: JSON.stringify({ reason }),
    });
    if (d.success) {
      toast.success(d.message);
      setDeleteRequestTarget(null);
      fetchLeads();
    } else {
      toast.error(d.message || t("orders.statuses.FAILED"));
    }
  };

  const handleReviewDeleteRequest = async (action, reviewNote) => {
    const d = await apiFetch(
      `/admin/crm/leads/${reviewTarget._id}/delete-request`,
      {
        method: "PUT",
        body: JSON.stringify({ action, reviewNote }),
      },
    );
    if (d.success) {
      toast.success(
        action === "approve"
          ? t('crm.leadDeletedNotified')
          : t('crm.requestRejected'),
      );
      setReviewTarget(null);
      fetchLeads();
      fetchStats();
      fetchPendingDeletes();
    } else toast.error(d.message || t("orders.statuses.FAILED"));
  };

  const handleStageMove = async (leadId, stage) => {
    const d = await apiFetch(`/admin/crm/leads/${leadId}/stage`, {
      method: "PUT",
      body: JSON.stringify({ stage }),
    });
    if (d.success) {
      toast.success(`→ ${stage}`);
      fetchLeads();
      fetchStats();
      if (selectedLead?._id === leadId)
        setSelectedLead({ ...selectedLead, stage });
    }
  };

  const handleAddActivity = async () => {
    if (!activityInput.trim()) return;
    setAddingActivity(true);
    try {
      const d = await apiFetch(
        `/admin/crm/leads/${selectedLead._id}/activity`,
        {
          method: "POST",
          body: JSON.stringify({ type: activityType, content: activityInput }),
        },
      );
      if (d.success) {
        setSelectedLead(d.data);
        setActivityInput("");
        toast.success(t('crm.activityLogged'));
      }
    } finally {
      setAddingActivity(false);
    }
  };

  const openEdit = (lead) => {
    setEditLead(lead);
    setForm({
      ...EMPTY_FORM,
      ...lead,
      tags: (lead.tags || []).join(", "),
      dealValue: lead.dealValue?.toString() || "",
      nextFollowUpDate: lead.nextFollowUpDate?.split("T")[0] || "",
      expectedCloseDate: lead.expectedCloseDate?.split("T")[0] || "",
    });
    setShowForm(true);
  };

  // ── Kanban Board ───────────────────────────────────────────────────────────
  const KanbanBoard = () => (
    <div className="flex gap-3 overflow-x-auto pb-4 min-h-[500px]">
      {meta.CRM_STAGES.map((stage) => {
        const stageLeads = leads.filter((l) => l.stage === stage);
        const sc = STAGE_COLORS[stage] || STAGE_COLORS["New"];
        const count = stageCounts[stage];
        return (
          <div
            key={stage}
            onDragOver={(e) => {
              e.preventDefault();
              setDragOver(stage);
            }}
            onDragLeave={() => setDragOver(null)}
            onDrop={(e) => {
              e.preventDefault();
              setDragOver(null);
              const id = e.dataTransfer.getData("leadId");
              if (id) handleStageMove(id, stage);
            }}
            className={`flex-shrink-0 w-60 rounded-xl border-2 transition-colors ${dragOver === stage ? "border-blue-400 bg-blue-50 dark:bg-blue-900/20" : sc.border + " " + sc.bg}`}
          >
            <div className="p-3 border-b border-black/5 dark:border-white/5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className={`w-2 h-2 rounded-full ${sc.dot}`} />
                  <span className="font-semibold text-sm text-gray-800 dark:text-white">
                    {stage}
                  </span>
                </div>
                <span
                  className={`text-xs px-1.5 py-0.5 rounded-full font-medium ${sc.badge}`}
                >
                  {stageLeads.length}
                </span>
              </div>
              {count?.totalDeal > 0 && (
                <p className="text-xs text-gray-400 mt-0.5">
                  {formatNGN(count.totalDeal)}
                </p>
              )}
            </div>
            <div className="p-2 space-y-2 max-h-[560px] overflow-y-auto">
              {stageLeads.map((lead) => (
                <div
                  key={lead._id}
                  draggable
                  onDragStart={(e) =>
                    e.dataTransfer.setData("leadId", lead._id)
                  }
                  onClick={() => setSelectedLead(lead)}
                  className="bg-white dark:bg-gray-800 rounded-lg p-3 shadow-sm border border-gray-100 dark:border-gray-700 cursor-pointer hover:shadow-md hover:border-blue-300 dark:hover:border-blue-600 transition-all group"
                >
                  <div className="flex items-start justify-between gap-1">
                    <p className="font-medium text-sm text-gray-900 dark:text-white truncate flex-1">
                      {lead.companyName || lead.contactName}
                    </p>
                    {lead.pendingDeleteRequest?.status === "pending" && (
                      <AlertTriangle
                        className="h-3.5 w-3.5 text-orange-400 flex-shrink-0"
                        title={t('crm.deleteRequestPending')}
                      />
                    )}
                  </div>
                  {lead.companyName && lead.contactName && (
                    <p className="text-xs text-gray-500 truncate">
                      {lead.contactName}
                    </p>
                  )}
                  {lead.phone && (
                    <p className="text-xs text-gray-400 flex items-center gap-1 mt-1">
                      <Phone className="h-3 w-3" />
                      {lead.phone}
                    </p>
                  )}
                  <div className="flex items-center justify-between mt-2">
                    {lead.dealValue > 0 && (
                      <span className="text-xs font-semibold text-green-600">
                        {formatNGN(lead.dealValue)}
                      </span>
                    )}
                    <span className="text-xs text-gray-300 dark:text-gray-600 ml-auto">
                      {timeAgo(lead.updatedAt)}
                    </span>
                  </div>
                  {/* Quick stage move on hover */}
                  <div className="hidden group-hover:flex gap-1 mt-2 flex-wrap">
                    {meta.CRM_STAGES.filter((s) => s !== stage)
                      .slice(0, 3)
                      .map((s) => (
                        <button
                          key={s}
                          onClick={(e) => {
                            e.stopPropagation();
                            handleStageMove(lead._id, s);
                          }}
                          className="text-xs px-1.5 py-0.5 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 rounded hover:bg-blue-100 hover:text-blue-700 truncate max-w-[5rem]"
                        >
                          → {s}
                        </button>
                      ))}
                  </div>
                </div>
              ))}
              {stageLeads.length === 0 && (
                <div className="text-center py-6 text-gray-300 dark:text-gray-600 text-xs">
                  {t('crm.dropHere')}
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );

  // ── List View ──────────────────────────────────────────────────────────────
  const ListView = () => (
    <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 dark:bg-gray-700/50">
            <tr>
              {[
                t('crm.colCompany'),
                t('crm.colContact'),
                t("common.email"),
                t("common.phone"),
                t('crm.colStage'),
                t('crm.colValue'),
                t('crm.colSource'),
                t('crm.colUpdated'),
                "",
              ].map((h) => (
                <th
                  key={h}
                  className="px-4 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide whitespace-nowrap"
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
            {leads.map((lead) => {
              const sc = STAGE_COLORS[lead.stage] || STAGE_COLORS["New"];
              return (
                <tr
                  key={lead._id}
                  onClick={() => setSelectedLead(lead)}
                  className="hover:bg-gray-50 dark:hover:bg-gray-700/30 cursor-pointer transition-colors"
                >
                  <td className="px-4 py-3 font-medium text-gray-900 dark:text-white max-w-36 truncate">
                    <div className="flex items-center gap-1">
                      {lead.pendingDeleteRequest?.status === "pending" && (
                        <AlertTriangle className="h-3.5 w-3.5 text-orange-400 flex-shrink-0" />
                      )}
                      {lead.companyName || "—"}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-gray-600 dark:text-gray-400 max-w-28 truncate">
                    {lead.contactName || "—"}
                  </td>
                  <td className="px-4 py-3 text-gray-500 max-w-36 truncate">
                    {lead.email || "—"}
                  </td>
                  <td className="px-4 py-3 text-gray-500 whitespace-nowrap">
                    {lead.phone || "—"}
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`text-xs px-2 py-0.5 rounded-full font-medium whitespace-nowrap ${sc.badge}`}
                    >
                      {lead.stage}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-green-600 font-medium whitespace-nowrap">
                    {lead.dealValue ? formatNGN(lead.dealValue) : "—"}
                  </td>
                  <td className="px-4 py-3 text-gray-400 text-xs">
                    {lead.source}
                  </td>
                  <td className="px-4 py-3 text-gray-400 text-xs whitespace-nowrap">
                    {timeAgo(lead.updatedAt)}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          openEdit(lead);
                        }}
                        className="p-1 text-gray-400 hover:text-blue-500 rounded"
                      >
                        <Edit className="h-3.5 w-3.5" />
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDelete(lead);
                        }}
                        className={`p-1 rounded ${canHardDelete ? "text-gray-400 hover:text-red-500" : "text-gray-400 hover:text-orange-500"}`}
                      >
                        {canHardDelete ? (
                          <Trash2 className="h-3.5 w-3.5" />
                        ) : (
                          <ShieldAlert className="h-3.5 w-3.5" />
                        )}
                      </button>
                      {canHardDelete &&
                        lead.pendingDeleteRequest?.status === "pending" && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setReviewTarget(lead);
                            }}
                            className="p-1 text-orange-400 hover:text-orange-600 rounded"
                            title={t('crm.review')}
                          >
                            <AlertTriangle className="h-3.5 w-3.5" />
                          </button>
                        )}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        {leads.length === 0 && (
          <div className="p-12 text-center text-gray-400">
            <Users className="h-10 w-10 mx-auto mb-3 opacity-30" />
            <p>{t('crm.noLeadsFound')}</p>
          </div>
        )}
      </div>
    </div>
  );

  // ── Pending Delete Requests Panel ──────────────────────────────────────────
  const PendingRequestsPanel = () => (
    <div className="space-y-3">
      {pendingDeletes.length === 0 ? (
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-10 text-center text-gray-400">
          <CheckCircle className="h-10 w-10 mx-auto mb-3 opacity-30 text-green-400" />
          <p>{t('crm.noPendingDeleteRequests')}</p>
        </div>
      ) : (
        pendingDeletes.map((lead) => {
          const req = lead.pendingDeleteRequest;
          return (
            <div
              key={lead._id}
              className="bg-white dark:bg-gray-800 rounded-xl border border-orange-200 dark:border-orange-800 p-5"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-2">
                    <AlertTriangle className="h-4 w-4 text-orange-500 flex-shrink-0" />
                    <span className="font-semibold text-gray-900 dark:text-white">
                      {lead.companyName || lead.contactName}
                    </span>
                    <span className="text-xs text-gray-400">{lead.email}</span>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-gray-500 mb-2">
                    <UserCircle className="h-3.5 w-3.5" />
                    <span>
                      {t('crm.requestedByRole', { name: req.requestedByName, role: req.requestedBySubRole, time: timeAgo(req.createdAt) })}
                    </span>
                  </div>
                  <div className="bg-orange-50 dark:bg-orange-900/10 border border-orange-100 dark:border-orange-800 rounded-lg p-3 text-sm text-gray-700 dark:text-gray-300">
                    <span className="font-medium text-orange-700 dark:text-orange-400 text-xs uppercase tracking-wide block mb-1">
                      {t('common.reason')}
                    </span>
                    {req.reason}
                  </div>
                </div>
                <div className="flex gap-2 flex-shrink-0">
                  <button
                    onClick={() => setReviewTarget(lead)}
                    className="flex items-center gap-1.5 px-4 py-2 bg-orange-600 hover:bg-orange-700 text-white rounded-lg text-sm font-medium"
                  >
                    <ShieldAlert className="h-4 w-4" /> {t('crm.review')}
                  </button>
                </div>
              </div>
            </div>
          );
        })
      )}
    </div>
  );

  // ── User Metrics Panel ─────────────────────────────────────────────────────
  const MetricsPanel = () => {
    const userMetrics = stats?.data?.userMetrics || stats?.userMetrics;
    if (!canSeeMetrics)
      return (
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-10 text-center text-gray-400">
          <ShieldAlert className="h-10 w-10 mx-auto mb-3 opacity-30" />
          <p>{t('crm.metricsVisibleTo')}</p>
        </div>
      );
    const metrics = stats?.data?.userMetrics || stats?.userMetrics || [];
    return (
      <div className="space-y-4">
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
          <div className="p-4 border-b border-gray-100 dark:border-gray-700">
            <h3 className="font-semibold text-gray-900 dark:text-white flex items-center gap-2">
              <BarChart3 className="h-4 w-4 text-blue-500" /> {t('crm.activityByUser')}
            </h3>
          </div>
          {metrics.length === 0 ? (
            <div className="p-8 text-center text-gray-400 text-sm">
              {t('crm.noDataYet')}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 dark:bg-gray-700/50">
                  <tr>
                    {[
                      t('crm.colTeamMember'),
                      t('crm.colTotalLeads'),
                      t('crm.colWon'),
                      t('crm.colLost'),
                      t('crm.colConversion'),
                      t('crm.colWonValue'),
                    ].map((h) => (
                      <th
                        key={h}
                        className="px-4 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide"
                      >
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                  {metrics.map((m, i) => {
                    const conversion = m.total
                      ? ((m.won / m.total) * 100).toFixed(0)
                      : 0;
                    return (
                      <tr
                        key={i}
                        className="hover:bg-gray-50 dark:hover:bg-gray-700/30"
                      >
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <div className="w-7 h-7 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                              {(m._id?.name || "?").charAt(0).toUpperCase()}
                            </div>
                            <span className="font-medium text-gray-800 dark:text-gray-200">
                              {m._id?.name || t('reports.unknown')}
                            </span>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-gray-600 dark:text-gray-400 font-medium">
                          {m.total}
                        </td>
                        <td className="px-4 py-3">
                          <span className="text-green-600 font-semibold">
                            {m.won}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <span className="text-red-500">{m.lost}</span>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <div className="flex-1 bg-gray-200 dark:bg-gray-700 rounded-full h-1.5 min-w-16">
                              <div
                                className="h-full bg-green-500 rounded-full"
                                style={{ width: `${conversion}%` }}
                              />
                            </div>
                            <span className="text-xs text-gray-500">
                              {conversion}%
                            </span>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-green-600 font-semibold">
                          {formatNGN(m.wonDealValue)}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-5">
      {/* ── Page Header ── */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <Users className="h-6 w-6 text-blue-600" /> {t('crm.title')}
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
            {t('crm.leadsPipelineSummary', { count: total, value: formatNGN(pipelineValue) })}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              fetchLeads();
              fetchStats();
              if (canHardDelete) fetchPendingDeletes();
            }}
            className="p-2 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700"
          >
            <RefreshCw
              className={`h-4 w-4 text-gray-500 ${loading ? "animate-spin" : ""}`}
            />
          </button>
          <div className="flex border border-gray-300 dark:border-gray-600 rounded-lg overflow-hidden">
            {[
              { id: "board", Icon: Kanban },
              { id: "list", Icon: List },
            ].map(({ id, Icon }) => (
              <button
                key={id}
                onClick={() => setViewMode(id)}
                className={`px-3 py-2 ${viewMode === id ? "bg-blue-600 text-white" : "text-gray-500 hover:bg-gray-50 dark:hover:bg-gray-700"}`}
              >
                <Icon className="h-4 w-4" />
              </button>
            ))}
          </div>
          <button
            onClick={handleDownloadTemplate}
            className="flex items-center gap-2 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 text-sm font-medium text-gray-700 dark:text-gray-300"
            title="Download CSV template"
          >
            <FileDown className="h-4 w-4" /> Template
          </button>
          <button
            onClick={() => setShowImportModal(true)}
            className="flex items-center gap-2 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 text-sm font-medium text-gray-700 dark:text-gray-300"
          >
            <Upload className="h-4 w-4" /> Import CSV
          </button>
          <button
            onClick={handleExportCsv}
            disabled={exporting}
            className="flex items-center gap-2 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 text-sm font-medium text-gray-700 dark:text-gray-300 disabled:opacity-50"
            title={isGlobalAdminForCrm ? "Exports every country" : "Exports your country only"}
          >
            {exporting ? <RefreshCw className="h-4 w-4 animate-spin" /> : <FileUp className="h-4 w-4" />} Export CSV
          </button>
          <button
            onClick={() => {
              setEditLead(null);
              setForm(EMPTY_FORM);
              setShowForm(true);
            }}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm font-medium"
          >
            <Plus className="h-4 w-4" /> {t('crm.addLead')}
          </button>
        </div>
      </div>

      {/* ── Stats Row ── */}
      {stats && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            {
              label: t('crm.colTotalLeads'),
              value: stats.data?.totalLeads || stats.totalLeads || 0,
              icon: Users,
              color: "text-blue-600",
              bg: "bg-blue-50 dark:bg-blue-900/20",
            },
            {
              label: t('crm.colWon'),
              value: stats.data?.wonLeads || stats.wonLeads || 0,
              icon: Award,
              color: "text-green-600",
              bg: "bg-green-50 dark:bg-green-900/20",
            },
            {
              label: t('crm.colLost'),
              value: stats.data?.lostLeads || stats.lostLeads || 0,
              icon: Target,
              color: "text-red-500",
              bg: "bg-red-50 dark:bg-red-900/20",
            },
            {
              label: t('crm.colConversion'),
              value: `${stats.data?.conversionRate || stats.conversionRate || 0}%`,
              icon: TrendingUp,
              color: "text-purple-600",
              bg: "bg-purple-50 dark:bg-purple-900/20",
            },
          ].map(({ label, value, icon: Icon, color, bg }) => (
            <div
              key={label}
              className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4"
            >
              <div className={`inline-flex p-2 rounded-lg ${bg} mb-2`}>
                <Icon className={`h-4 w-4 ${color}`} />
              </div>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {value}
              </p>
              <p className="text-xs text-gray-500">{label}</p>
            </div>
          ))}
        </div>
      )}

      {/* ── Tabs ── */}
      <div className="flex gap-1 border-b border-gray-200 dark:border-gray-700">
        {[
          { id: "pipeline", label: t('crm.tabPipeline') },
          canHardDelete && {
            id: "requests",
            label: `${t('crm.tabDeleteRequests')}${pendingDeleteCount > 0 ? ` (${pendingDeleteCount})` : ""}`,
            alert: pendingDeleteCount > 0,
          },
          canSeeMetrics && { id: "metrics", label: t('crm.tabUserMetrics') },
        ]
          .filter(Boolean)
          .map(({ id, label, alert }) => (
            <button
              key={id}
              onClick={() => setActiveTab(id)}
              className={`flex items-center gap-1.5 px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${
                activeTab === id
                  ? "border-blue-600 text-blue-600 dark:text-blue-400"
                  : "border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300"
              }`}
            >
              {label}
              {alert && <span className="w-2 h-2 rounded-full bg-orange-500" />}
            </button>
          ))}
      </div>

      {/* ── Pipeline Tab ── */}
      {activeTab === "pipeline" && (
        <>
          {/* Filters */}
          <div className="flex gap-2 flex-wrap bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4">
            <div className="relative flex-1 min-w-40">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder={t('crm.searchPlaceholder')}
                className="w-full pl-9 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300"
              />
            </div>
            <select
              value={filterStage}
              onChange={(e) => setFilterStage(e.target.value)}
              className="text-sm border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300"
            >
              <option value="">{t("crm.allStages")}</option>
              {meta.CRM_STAGES.map((s) => (
                <option key={s}>{s}</option>
              ))}
            </select>
            <select
              value={filterSource}
              onChange={(e) => setFilterSource(e.target.value)}
              className="text-sm border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300"
            >
              <option value="">{t("crm.allSources")}</option>
              {meta.LEAD_SOURCES.map((s) => (
                <option key={s}>{s}</option>
              ))}
            </select>
          </div>

          {viewMode === "board" ? <KanbanBoard /> : <ListView />}
        </>
      )}

      {activeTab === "requests" && canHardDelete && <PendingRequestsPanel />}
      {activeTab === "metrics" && canSeeMetrics && <MetricsPanel />}

      {/* ── Lead Detail Panel ── */}
      {selectedLead && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-end">
          <div className="bg-white dark:bg-gray-800 w-full max-w-lg h-full overflow-y-auto shadow-2xl flex flex-col">
            <div className="p-5 border-b border-gray-200 dark:border-gray-700 flex items-start justify-between gap-2 flex-shrink-0">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1 flex-wrap">
                  <span
                    className={`text-xs px-2 py-0.5 rounded-full font-medium ${(STAGE_COLORS[selectedLead.stage] || STAGE_COLORS["New"]).badge}`}
                  >
                    {selectedLead.stage}
                  </span>
                  <span className="text-xs text-gray-400">
                    {selectedLead.source}
                  </span>
                  {selectedLead.pendingDeleteRequest?.status === "pending" && (
                    <span className="flex items-center gap-1 text-xs bg-orange-100 text-orange-600 px-2 py-0.5 rounded-full">
                      <AlertTriangle className="h-3 w-3" /> {t('crm.deleteRequestPending')}
                    </span>
                  )}
                </div>
                <h3 className="font-bold text-gray-900 dark:text-white text-lg truncate">
                  {selectedLead.companyName || selectedLead.contactName}
                </h3>
                {selectedLead.contactName && selectedLead.companyName && (
                  <p className="text-sm text-gray-500">
                    {selectedLead.contactName} · {selectedLead.jobTitle}
                  </p>
                )}
                {selectedLead.dealValue > 0 && (
                  <p className="text-green-600 font-semibold mt-1">
                    {formatNGN(selectedLead.dealValue)}
                  </p>
                )}
              </div>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => openEdit(selectedLead)}
                  className="p-2 text-gray-400 hover:text-blue-500 rounded"
                >
                  <Edit className="h-4 w-4" />
                </button>
                <button
                  onClick={() => {
                    handleDelete(selectedLead);
                    setSelectedLead(null);
                  }}
                  className={`p-2 rounded ${canHardDelete ? "text-gray-400 hover:text-red-500" : "text-gray-400 hover:text-orange-500"}`}
                  title={canHardDelete ? t('common.delete') : t('crm.requestDeletion')}
                >
                  {canHardDelete ? (
                    <Trash2 className="h-4 w-4" />
                  ) : (
                    <ShieldAlert className="h-4 w-4" />
                  )}
                </button>
                {canHardDelete &&
                  selectedLead.pendingDeleteRequest?.status === "pending" && (
                    <button
                      onClick={() => setReviewTarget(selectedLead)}
                      className="p-2 text-orange-400 hover:text-orange-600 rounded"
                      title={t('crm.review')}
                    >
                      <AlertTriangle className="h-4 w-4" />
                    </button>
                  )}
                <button
                  onClick={() => setSelectedLead(null)}
                  className="p-2 text-gray-400 hover:text-gray-600 rounded"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
            </div>

            {/* Stage move */}
            <div className="px-5 py-3 border-b border-gray-100 dark:border-gray-700 flex-shrink-0">
              <p className="text-xs text-gray-400 mb-2 font-medium">
                {t('crm.moveStage')}
              </p>
              <div className="flex gap-1 flex-wrap">
                {meta.CRM_STAGES.map((s) => (
                  <button
                    key={s}
                    onClick={() => handleStageMove(selectedLead._id, s)}
                    className={`text-xs px-2 py-1 rounded-full border font-medium transition-colors ${selectedLead.stage === s ? (STAGE_COLORS[s] || STAGE_COLORS["New"]).badge + " border-transparent" : "border-gray-200 dark:border-gray-600 text-gray-500 hover:border-blue-400"}`}
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>

            {/* Contact info */}
            <div className="p-5 border-b border-gray-100 dark:border-gray-700 space-y-2 flex-shrink-0">
              {[
                [Phone, selectedLead.phone],
                [Mail, selectedLead.email],
                [Globe, selectedLead.website],
                [
                  MapPin,
                  [selectedLead.city, selectedLead.country]
                    .filter(Boolean)
                    .join(", "),
                ],
                [Building2, selectedLead.industry],
              ]
                .filter(([, v]) => v)
                .map(([Icon, val], i) => (
                  <div
                    key={i}
                    className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400"
                  >
                    <Icon className="h-4 w-4 text-gray-400 flex-shrink-0" />
                    <span className="truncate">{val}</span>
                  </div>
                ))}
              <div className="flex gap-3 pt-1">
                {selectedLead.linkedinUrl && (
                  <a
                    href={selectedLead.linkedinUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="text-blue-500 hover:text-blue-700"
                  >
                    <Linkedin className="h-4 w-4" />
                  </a>
                )}
                {selectedLead.facebookUrl && (
                  <a
                    href={selectedLead.facebookUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="text-blue-500 hover:text-blue-700"
                  >
                    <Facebook className="h-4 w-4" />
                  </a>
                )}
                {selectedLead.website && (
                  <a
                    href={selectedLead.website}
                    target="_blank"
                    rel="noreferrer"
                    className="text-gray-500 hover:text-gray-700"
                  >
                    <ExternalLink className="h-4 w-4" />
                  </a>
                )}
              </div>
            </div>

            {/* Activities */}
            <div className="flex-1 overflow-y-auto p-5">
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">
                {t('crm.activityLabel')}
              </p>
              <div className="space-y-3 mb-4">
                {(selectedLead.activities || [])
                  .slice()
                  .reverse()
                  .map((a) => (
                    <div key={a._id} className="flex gap-2 text-sm">
                      <span className="text-base flex-shrink-0">
                        {ACTIVITY_ICONS[a.type] || "📝"}
                      </span>
                      <div>
                        <p className="text-gray-700 dark:text-gray-300">
                          {a.content}
                        </p>
                        <p className="text-xs text-gray-400">
                          {a.performedByName} · {timeAgo(a.createdAt)}
                        </p>
                      </div>
                    </div>
                  ))}
                {!selectedLead.activities?.length && (
                  <p className="text-xs text-gray-400 italic">
                    {t('crm.noActivityYet')}
                  </p>
                )}
              </div>
              <div className="border border-gray-200 dark:border-gray-700 rounded-xl p-3 space-y-2">
                <div className="flex gap-1 flex-wrap">
                  {Object.keys(ACTIVITY_ICONS)
                    .filter((t) => t !== "system")
                    .map((t) => (
                      <button
                        key={t}
                        onClick={() => setActivityType(t)}
                        className={`text-xs px-2 py-1 rounded-full border capitalize ${activityType === t ? "bg-blue-600 text-white border-blue-600" : "border-gray-200 dark:border-gray-600 text-gray-500"}`}
                      >
                        {ACTIVITY_ICONS[t]} {t}
                      </button>
                    ))}
                </div>
                <div className="flex gap-2">
                  <textarea
                    value={activityInput}
                    onChange={(e) => setActivityInput(e.target.value)}
                    rows={2}
                    placeholder={t('crm.addActivityPlaceholder', { type: activityType })}
                    className="flex-1 border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-sm bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 resize-none"
                  />
                  <button
                    onClick={handleAddActivity}
                    disabled={!activityInput.trim() || addingActivity}
                    className="px-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-40 text-sm font-medium"
                  >
                    {t('common.add')}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── Create / Edit Modal ── */}
      {showForm && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-start justify-center p-4 overflow-y-auto">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl w-full max-w-2xl my-8">
            <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                {editLead ? t('crm.editLead') : t('crm.addLead')}
              </h2>
              <button
                onClick={() => {
                  setShowForm(false);
                  setEditLead(null);
                }}
                className="text-gray-400 hover:text-gray-600 text-2xl leading-none"
              >
                &times;
              </button>
            </div>
            <div className="p-6 space-y-4 max-h-[70vh] overflow-y-auto">
              <div className="grid grid-cols-2 gap-4">
                {[
                  ["companyName", t('crm.colCompanyName')],
                  ["contactName", t('crm.colContactName')],
                  ["jobTitle", t('crm.colJobTitle')],
                  ["email", t("common.email")],
                  ["phone", t("common.phone")],
                  ["website", t('crm.colWebsite')],
                ].map(([k, l]) => (
                  <div key={k}>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      {l}
                    </label>
                    <input
                      value={form[k] || ""}
                      onChange={(e) =>
                        setForm((f) => ({ ...f, [k]: e.target.value }))
                      }
                      className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-sm bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300"
                    />
                  </div>
                ))}
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    {t('crm.colStage')}
                  </label>
                  <select
                    value={form.stage}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, stage: e.target.value }))
                    }
                    className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-sm bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300"
                  >
                    {meta.CRM_STAGES.map((s) => (
                      <option key={s}>{s}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    {t('crm.colSource')}
                  </label>
                  <select
                    value={form.source}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, source: e.target.value }))
                    }
                    className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-sm bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300"
                  >
                    {meta.LEAD_SOURCES.map((s) => (
                      <option key={s}>{s}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    {t('crm.industryLabel')}
                  </label>
                  <select
                    value={form.industry}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, industry: e.target.value }))
                    }
                    className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-sm bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300"
                  >
                    {meta.LEAD_INDUSTRIES.map((i) => (
                      <option key={i}>{i}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    {t('crm.dealValueLabel')}
                  </label>
                  <input
                    type="number"
                    value={form.dealValue}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, dealValue: e.target.value }))
                    }
                    className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-sm bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    {t('crm.probabilityLabel')}
                  </label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    value={form.probability}
                    onChange={(e) =>
                      setForm((f) => ({
                        ...f,
                        probability: parseInt(e.target.value) || 0,
                      }))
                    }
                    className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-sm bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                {[
                  ["linkedinUrl", "LinkedIn"],
                  ["facebookUrl", "Facebook"],
                ].map(([k, l]) => (
                  <div key={k}>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      {t('crm.urlLabel', { platform: l })}
                    </label>
                    <input
                      value={form[k] || ""}
                      onChange={(e) =>
                        setForm((f) => ({ ...f, [k]: e.target.value }))
                      }
                      className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-sm bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300"
                    />
                  </div>
                ))}
              </div>
              <div className="grid grid-cols-2 gap-4">
                {[
                  ["nextFollowUpDate", t('crm.nextFollowUp')],
                  ["expectedCloseDate", t('crm.expectedClose')],
                ].map(([k, l]) => (
                  <div key={k}>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      {l}
                    </label>
                    <input
                      type="date"
                      value={form[k] || ""}
                      onChange={(e) =>
                        setForm((f) => ({ ...f, [k]: e.target.value }))
                      }
                      className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-sm bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300"
                    />
                  </div>
                ))}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  {t('crm.tagsCommaSeparated')}
                </label>
                <input
                  value={form.tags}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, tags: e.target.value }))
                  }
                  placeholder={t('crm.tagsPlaceholder')}
                  className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-sm bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  {t('common.notes')}
                </label>
                <textarea
                  value={form.notes}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, notes: e.target.value }))
                  }
                  rows={3}
                  className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-sm bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300"
                />
              </div>
            </div>
            <div className="flex items-center justify-end gap-3 p-6 border-t border-gray-200 dark:border-gray-700">
              <button
                onClick={() => {
                  setShowForm(false);
                  setEditLead(null);
                }}
                className="px-4 py-2 text-sm text-gray-600 dark:text-gray-400"
              >
                {t('common.cancel')}
              </button>
              <button
                onClick={handleSave}
                disabled={saving}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm font-medium disabled:opacity-50"
              >
                {saving ? t('crm.submittingEllipsis') : editLead ? t('crm.updateLead') : t('crm.addLead')}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Delete Request Modal (non-IT/Director users) ── */}
      {deleteRequestTarget && (
        <DeleteRequestModal
          lead={deleteRequestTarget}
          onClose={() => setDeleteRequestTarget(null)}
          onSubmit={handleSubmitDeleteRequest}
        />
      )}

      {/* ── Review Delete Request Modal (IT/Director) ── */}
      {reviewTarget && (
        <ReviewDeleteModal
          lead={reviewTarget}
          onClose={() => setReviewTarget(null)}
          onReview={handleReviewDeleteRequest}
        />
      )}

      {/* ── Import Leads CSV Modal ── */}
      {showImportModal && (
        <ImportLeadsModal
          onClose={() => setShowImportModal(false)}
          onDownloadTemplate={handleDownloadTemplate}
          onImport={handleImportCsv}
        />
      )}
    </div>
  );
}
