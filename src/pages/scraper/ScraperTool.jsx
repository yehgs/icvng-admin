//admin
// src/pages/scraper/ScraperTool.jsx  (updated — quota display + management + B2C)
import React, { useState, useEffect, useCallback, useRef } from "react";
import {
  Play,
  RefreshCw,
  CheckCircle,
  XCircle,
  Clock,
  Upload,
  Trash2,
  Globe,
  Mail,
  Phone,
  Building2,
  AlertTriangle,
  Zap,
  X,
  CheckSquare,
  Square,
  UserCircle,
  Users,
  Gauge,
  Settings,
  ShieldAlert,
  TrendingUp,
  Lock,
  Unlock,
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

const PLATFORM_ICONS = {
  "Google Search": "🔍",
  "Google Maps": "🗺️",
  Facebook: "📘",
  LinkedIn: "💼",
  Instagram: "📸",
  "Twitter / X": "𝕏",
  "Yellow Pages NG": "📒",
  "VConnect NG": "🇳🇬",
  Jobberman: "💼",
  "Custom URL": "🌐",
};

const STATUS_CONFIG = {
  pending: {
    label: "Pending",
    color: "bg-gray-100 text-gray-600",
    icon: Clock,
  },
  running: {
    label: "Running",
    color: "bg-blue-100 text-blue-700",
    icon: RefreshCw,
  },
  completed: {
    label: "Completed",
    color: "bg-green-100 text-green-700",
    icon: CheckCircle,
  },
  failed: {
    label: "Failed",
    color: "bg-red-100 text-red-700",
    icon: XCircle,
  },
  cancelled: {
    label: "Cancelled",
    color: "bg-gray-100 text-gray-500",
    icon: XCircle,
  },
};

const EXTRACT_FIELDS = [
  { key: "emails", label: "Emails", icon: Mail },
  { key: "phones", label: "Phones", icon: Phone },
  { key: "companyName", label: "Companies", icon: Building2 },
  { key: "website", label: "Websites", icon: Globe },
  { key: "fullName", label: "Full Name (B2C)", icon: UserCircle },
  { key: "jobTitle", label: "Job Title (B2C)", icon: TrendingUp },
];

const EMPTY_JOB = {
  name: "",
  platform: "Google Search",
  leadType: "B2B",
  targetUrl: "",
  searchQuery: "",
  maxPages: 3,
  maxResults: 50,
  extractFields: {
    emails: true,
    phones: true,
    companyName: true,
    website: true,
    address: true,
    socialLinks: true,
    fullName: false,
    jobTitle: false,
  },
};

const QUOTA_ADMIN_ROLES = ["IT", "DIRECTOR", "MANAGER"];
const SUPER_ROLES = ["IT", "DIRECTOR", "MANAGER"];
const UNLIMITED_ROLES = ["IT", "DIRECTOR", "MANAGER"];

function timeAgo(d) {
  if (!d) return "";
  const diff = Date.now() - new Date(d).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return "just now";
  if (m < 60) return `${m}m`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

// ── Quota bar ────────────────────────────────────────────────────────────────
function QuotaBar({ quota }) {
  const { t } = useAdminTranslation();
  if (!quota) return null;
  if (quota.unlimited) {
    return (
      <div className="flex items-center gap-2 text-xs text-green-600 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg px-3 py-2">
        <Unlock className="h-3.5 w-3.5" /> {t('scraper.unlimitedApiAccess')}
      </div>
    );
  }
  if (quota.limit === 0) {
    return (
      <div className="flex items-center gap-2 text-xs text-orange-600 bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800 rounded-lg px-3 py-2">
        <Lock className="h-3.5 w-3.5" /> {t('scraper.noQuotaAssigned')}
      </div>
    );
  }
  const pct = quota.percentUsed || 0;
  const barColor =
    pct >= 90 ? "bg-red-500" : pct >= 70 ? "bg-orange-500" : "bg-green-500";
  return (
    <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-2 space-y-1">
      <div className="flex items-center justify-between text-xs">
        <span className="text-gray-500 dark:text-gray-400 flex items-center gap-1">
          <Gauge className="h-3 w-3" /> {t('scraper.monthlyQuota')}
        </span>
        <span
          className={`font-semibold ${pct >= 90 ? "text-red-600" : pct >= 70 ? "text-orange-600" : "text-gray-700 dark:text-gray-300"}`}
        >
          {t('scraper.callsUsed', { used: quota.used, limit: quota.limit })}
        </span>
      </div>
      <div className="h-1.5 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full transition-all ${barColor}`}
          style={{ width: `${Math.min(pct, 100)}%` }}
        />
      </div>
      <p className="text-xs text-gray-400">
        {t('scraper.remainingResets', { count: quota.remaining })}
      </p>
    </div>
  );
}

// ── Quota Management Modal (MANAGER / IT / DIRECTOR) ────────────────────────
function QuotaManagerModal({ onClose }) {
  const { t } = useAdminTranslation();
  const [allQuotas, setAllQuotas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState({}); // { [userId]: newLimit }
  const [saving, setSaving] = useState(null);

  useEffect(() => {
    apiFetch("/admin/scraper/quota/all").then((d) => {
      if (d.success) setAllQuotas(d.data);
      setLoading(false);
    });
  }, []);

  const handleSave = async (userId, name) => {
    const val = parseInt(editing[userId]);
    if (isNaN(val) || val < 0) {
      toast.error(t('scraper.enterValidNumber'));
      return;
    }
    setSaving(userId);
    const d = await apiFetch(`/admin/scraper/quota/${userId}`, {
      method: "PUT",
      body: JSON.stringify({ monthlyLimit: val }),
    });
    if (d.success) {
      toast.success(t('scraper.quotaSetTo', { name, value: val }));
      setAllQuotas((qs) =>
        qs.map((q) =>
          q._id === userId
            ? { ...q, limit: val, used: 0, remaining: val, percentUsed: 0 }
            : q,
        ),
      );
      setEditing((e) => {
        const n = { ...e };
        delete n[userId];
        return n;
      });
    } else toast.error(d.message || t("orders.statuses.FAILED"));
    setSaving(null);
  };

  const handleReset = async (userId, name) => {
    if (!confirm(t('scraper.resetUsageConfirm', { name }))) return;
    const d = await apiFetch(`/admin/scraper/quota/${userId}/reset`, {
      method: "POST",
    });
    if (d.success) {
      toast.success(t('scraper.usageResetFor', { name }));
      setAllQuotas((qs) =>
        qs.map((q) =>
          q._id === userId
            ? { ...q, used: 0, remaining: q.limit, percentUsed: 0 }
            : q,
        ),
      );
    } else toast.error(d.message || t("orders.statuses.FAILED"));
  };

  const ROLE_COLORS = {
    SALES: "bg-green-100 text-green-700",
    SALES_MANAGER: "bg-teal-100 text-teal-700",
    EDITOR: "bg-violet-100 text-violet-700",
    MANAGER: "bg-indigo-100 text-indigo-700",
    IT: "bg-blue-100 text-blue-700",
    DIRECTOR: "bg-purple-100 text-purple-700",
  };

  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl w-full max-w-2xl max-h-[85vh] flex flex-col">
        <div className="flex items-center justify-between p-5 border-b border-gray-200 dark:border-gray-700 flex-shrink-0">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
            <Gauge className="h-5 w-5 text-blue-500" /> {t('scraper.scraperQuotaManagement')}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 text-2xl leading-none"
          >
            &times;
          </button>
        </div>

        <div className="p-4 bg-blue-50 dark:bg-blue-900/10 border-b border-blue-100 dark:border-blue-800 flex-shrink-0">
          <p className="text-xs text-blue-700 dark:text-blue-400">
            {t('scraper.quotaModalDescription')}
          </p>
        </div>

        <div className="flex-1 overflow-y-auto">
          {loading ? (
            <div className="p-8 text-center text-gray-400">
              <RefreshCw className="h-6 w-6 animate-spin mx-auto" />
            </div>
          ) : (
            <table className="w-full text-sm">
              <thead className="bg-gray-50 dark:bg-gray-700/50 sticky top-0">
                <tr>
                  {[
                    t('crm.colTeamMember'),
                    t('scraper.colRole'),
                    t('scraper.colUsedLimit'),
                    t('scraper.colNewLimit'),
                    t("common.actions"),
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
                {allQuotas.map((q) => (
                  <tr
                    key={q._id}
                    className="hover:bg-gray-50 dark:hover:bg-gray-700/30"
                  >
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                          {q.name?.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <p className="font-medium text-gray-800 dark:text-gray-200">
                            {q.name}
                          </p>
                          <p className="text-xs text-gray-400">{q.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`text-xs px-2 py-0.5 rounded-full font-medium ${ROLE_COLORS[q.subRole] || "bg-gray-100 text-gray-600"}`}
                      >
                        {q.subRole}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      {q.unlimited ? (
                        <span className="text-xs text-green-600 font-medium flex items-center gap-1">
                          <Unlock className="h-3 w-3" /> {t('scraper.unlimitedLabel')}
                        </span>
                      ) : q.limit === 0 ? (
                        <span className="text-xs text-orange-500 flex items-center gap-1">
                          <Lock className="h-3 w-3" /> {t('scraper.notSet')}
                        </span>
                      ) : (
                        <div className="space-y-1">
                          <p className="text-xs font-medium">
                            {q.used ?? 0} / {q.limit} calls
                          </p>
                          <div className="w-24 h-1.5 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                            <div
                              className={`h-full rounded-full ${(q.percentUsed || 0) >= 90 ? "bg-red-500" : (q.percentUsed || 0) >= 70 ? "bg-orange-500" : "bg-green-500"}`}
                              style={{
                                width: `${Math.min(q.percentUsed || 0, 100)}%`,
                              }}
                            />
                          </div>
                        </div>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      {q.unlimited ? (
                        <span className="text-xs text-gray-400 italic">
                          {t('scraper.naLabel')}
                        </span>
                      ) : (
                        <input
                          type="number"
                          min="0"
                          value={editing[q._id] ?? (q.limit || "")}
                          onChange={(e) =>
                            setEditing((prev) => ({
                              ...prev,
                              [q._id]: e.target.value,
                            }))
                          }
                          placeholder={t('scraper.limitPlaceholder')}
                          className="w-24 border border-gray-300 dark:border-gray-600 rounded-lg px-2 py-1 text-sm bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300"
                        />
                      )}
                    </td>
                    <td className="px-4 py-3">
                      {!q.unlimited && (
                        <div className="flex gap-1">
                          <button
                            onClick={() => handleSave(q._id, q.name)}
                            disabled={
                              saving === q._id || editing[q._id] == null
                            }
                            className="text-xs px-2.5 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded-lg disabled:opacity-40 font-medium"
                          >
                            {saving === q._id ? '...' : t('common.save')}
                          </button>
                          {(q.used || 0) > 0 && (
                            <button
                              onClick={() => handleReset(q._id, q.name)}
                              className="text-xs px-2 py-1 border border-gray-300 dark:border-gray-600 text-gray-600 dark:text-gray-400 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700"
                            >
                              {t('scraper.resetBtn')}
                            </button>
                          )}
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Main ScraperTool ──────────────────────────────────────────────────────────
export default function ScraperTool() {
  const { t } = useAdminTranslation();
  const currentUser = getCurrentUser();
  const isSuperRole = SUPER_ROLES.includes(currentUser?.subRole);
  const isQuotaAdmin = QUOTA_ADMIN_ROLES.includes(currentUser?.subRole);
  const isUnlimited = UNLIMITED_ROLES.includes(currentUser?.subRole);

  const [platforms, setPlatforms] = useState([]);
  const [capabilities, setCapabilities] = useState({});
  const [jobs, setJobs] = useState([]);
  const [quota, setQuota] = useState(null);
  const [loading, setLoading] = useState(false);
  const [showNewJob, setShowNewJob] = useState(false);
  const [showQuotaMgr, setShowQuotaMgr] = useState(false);
  const [jobForm, setJobForm] = useState(EMPTY_JOB);
  const [running, setRunning] = useState(false);
  const [selectedJob, setSelectedJob] = useState(null);
  const [jobResults, setJobResults] = useState([]);
  const [selectedIndices, setSelectedIndices] = useState(new Set());
  const [markedForDelete, setMarkedForDelete] = useState(new Set());
  const [importing, setImporting] = useState(false);
  const [deletingRows, setDeletingRows] = useState(false);
  const pollRef = useRef(null);

  const fetchPlatforms = useCallback(async () => {
    const d = await apiFetch("/admin/scraper/platforms");
    if (d.success) {
      setPlatforms(d.data);
      setCapabilities(d.capabilities || {});
    }
  }, []);

  const fetchJobs = useCallback(async () => {
    setLoading(true);
    const d = await apiFetch("/admin/scraper/jobs");
    if (d.success) setJobs(d.data);
    setLoading(false);
  }, []);

  const fetchQuota = useCallback(async () => {
    const d = await apiFetch("/admin/scraper/quota/me");
    if (d.success) setQuota(d.data);
  }, []);

  useEffect(() => {
    fetchPlatforms();
    fetchJobs();
    fetchQuota();
  }, [fetchPlatforms, fetchJobs, fetchQuota]);

  useEffect(() => {
    const hasRunning = jobs.some((j) => j.status === "running");
    if (hasRunning) {
      pollRef.current = setInterval(fetchJobs, 4000);
    } else {
      clearInterval(pollRef.current);
    }
    return () => clearInterval(pollRef.current);
  }, [jobs, fetchJobs]);

  // When B2C toggled, auto-set fullName and jobTitle extract fields
  useEffect(() => {
    if (jobForm.leadType === "B2C") {
      setJobForm((f) => ({
        ...f,
        extractFields: {
          ...f.extractFields,
          fullName: true,
          jobTitle: true,
          companyName: false,
        },
      }));
    } else {
      setJobForm((f) => ({
        ...f,
        extractFields: {
          ...f.extractFields,
          fullName: false,
          jobTitle: false,
          companyName: true,
        },
      }));
    }
  }, [jobForm.leadType]);

  const handleRunJob = async () => {
    if (!jobForm.searchQuery && !jobForm.targetUrl) {
      toast.error(t('scraper.enterSearchOrUrl'));
      return;
    }

    // Check quota before opening the form
    if (!isUnlimited) {
      const check = await apiFetch("/admin/scraper/quota/check");
      if (!check.allowed) {
        toast.error(check.reason || t('scraper.quotaExhausted'));
        return;
      }
    }

    setRunning(true);
    try {
      const d = await apiFetch("/admin/scraper/jobs", {
        method: "POST",
        body: JSON.stringify(jobForm),
      });
      if (d.success) {
        toast.success(t('scraper.scrapeJobStarted'));
        setShowNewJob(false);
        setJobForm(EMPTY_JOB);
        fetchJobs();
        fetchQuota();
      } else toast.error(d.message || t('scraper.failedToStart'));
    } finally {
      setRunning(false);
    }
  };

  const openJob = async (job) => {
    setSelectedJob(job);
    setSelectedIndices(new Set());
    setMarkedForDelete(new Set());
    if (job.rawResults?.length > 0) {
      setJobResults(job.rawResults);
    } else {
      const d = await apiFetch(`/admin/scraper/jobs/${job._id}`);
      if (d.success) {
        setJobResults(d.data.rawResults || []);
        setSelectedJob(d.data);
      }
    }
  };

  const handleDeleteJob = async (id) => {
    if (!confirm(t('scraper.deleteScrapeJobConfirm'))) return;
    const d = await apiFetch(`/admin/scraper/jobs/${id}`, { method: "DELETE" });
    if (d.success) {
      toast.success(t('content.deletedGeneric'));
      fetchJobs();
      if (selectedJob?._id === id) setSelectedJob(null);
    }
  };

  const toggleSelect = (i) => {
    if (markedForDelete.has(i)) return;
    setSelectedIndices((prev) => {
      const n = new Set(prev);
      n.has(i) ? n.delete(i) : n.add(i);
      return n;
    });
  };
  const toggleSelectAll = () => {
    const available = jobResults
      .map((_, i) => i)
      .filter((i) => !markedForDelete.has(i));
    if (selectedIndices.size === available.length)
      setSelectedIndices(new Set());
    else setSelectedIndices(new Set(available));
  };
  const toggleMarkDelete = (e, i) => {
    e.stopPropagation();
    setMarkedForDelete((prev) => {
      const n = new Set(prev);
      n.has(i) ? n.delete(i) : n.add(i);
      return n;
    });
    setSelectedIndices((prev) => {
      const n = new Set(prev);
      n.delete(i);
      return n;
    });
  };

  const handleCommitDeletes = async () => {
    if (markedForDelete.size === 0) return;
    if (!confirm(t('scraper.removeRowsConfirm', { count: markedForDelete.size }))) return;
    setDeletingRows(true);
    const d = await apiFetch(
      `/admin/scraper/jobs/${selectedJob._id}/results/bulk`,
      {
        method: "DELETE",
        body: JSON.stringify({ indices: [...markedForDelete] }),
      },
    );
    if (d.success) {
      toast.success(t('scraper.rowsRemoved', { count: markedForDelete.size }));
      setJobResults(d.data);
      setMarkedForDelete(new Set());
      setSelectedIndices(new Set());
      fetchJobs();
    } else toast.error(d.message || t("orders.statuses.FAILED"));
    setDeletingRows(false);
  };

  const handleImport = async (importAll = false) => {
    const toImport = importAll
      ? jobResults.map((_, i) => i).filter((i) => !markedForDelete.has(i))
      : [...selectedIndices].filter((i) => !markedForDelete.has(i));
    if (!toImport.length) {
      toast.error(t('scraper.selectResultsToImport'));
      return;
    }
    setImporting(true);
    const d = await apiFetch(`/admin/scraper/jobs/${selectedJob._id}/import`, {
      method: "POST",
      body: JSON.stringify({ selectedIndices: toImport }),
    });
    if (d.success) {
      toast.success(d.message);
      setSelectedIndices(new Set());
      fetchJobs();
    } else toast.error(d.message || t('scraper.importFailed'));
    setImporting(false);
  };

  const importableCount = jobResults.filter(
    (_, i) => !markedForDelete.has(i),
  ).length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <Zap className="h-6 w-6 text-yellow-500" /> {t('scraper.title')}
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
            {t('scraper.extractLeadsDesc')}
            {!isSuperRole && (
              <span className="ml-2 text-xs bg-blue-50 dark:bg-blue-900/20 text-blue-600 px-2 py-0.5 rounded-full">
                {t('scraper.yourJobsOnly')}
              </span>
            )}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {isQuotaAdmin && (
            <button
              onClick={() => setShowQuotaMgr(true)}
              className="flex items-center gap-2 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 text-sm text-gray-600 dark:text-gray-400"
            >
              <Gauge className="h-4 w-4" /> {t('scraper.manageQuotas')}
            </button>
          )}
          <button
            onClick={fetchJobs}
            className="p-2 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700"
          >
            <RefreshCw
              className={`h-4 w-4 text-gray-500 ${loading ? "animate-spin" : ""}`}
            />
          </button>
          <button
            onClick={() => {
              setJobForm(EMPTY_JOB);
              setShowNewJob(true);
            }}
            className="flex items-center gap-2 px-4 py-2 bg-yellow-500 hover:bg-yellow-600 text-white rounded-lg text-sm font-medium"
          >
            <Play className="h-4 w-4" /> {t('scraper.newScrapeJob')}
          </button>
        </div>
      </div>

      {/* Quota bar */}
      <QuotaBar quota={quota} />

      {/* API key status */}
      <div
        className={`rounded-xl border p-3 flex items-start gap-3 ${capabilities.serpApi || capabilities.googleCse ? "bg-green-50 dark:bg-green-900/10 border-green-200 dark:border-green-800" : "bg-orange-50 dark:bg-orange-900/10 border-orange-200 dark:border-orange-800"}`}
      >
        {capabilities.serpApi || capabilities.googleCse ? (
          <CheckCircle className="h-4 w-4 text-green-500 flex-shrink-0 mt-0.5" />
        ) : (
          <AlertTriangle className="h-4 w-4 text-orange-500 flex-shrink-0 mt-0.5" />
        )}
        <p className="text-xs text-gray-700 dark:text-gray-300">
          {capabilities.serpApi
            ? t('scraper.serpApiConfigured')
            : capabilities.googleCse
              ? t('scraper.googleCseConfigured')
              : t('scraper.noApiKeyWarning')}
        </p>
      </div>

      {/* Job list + results panel */}
      <div className="flex gap-5">
        <div
          className={`${selectedJob ? "w-1/3" : "w-full"} space-y-3 transition-all`}
        >
          {jobs.length === 0 && !loading ? (
            <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-10 text-center text-gray-400">
              <Zap className="h-10 w-10 mx-auto mb-3 opacity-30" />
              <p>{t('scraper.noScrapeJobsYet')}</p>
            </div>
          ) : (
            jobs.map((job) => {
              const sc = STATUS_CONFIG[job.status] || STATUS_CONFIG.pending;
              const Icon = sc.icon;
              return (
                <div
                  key={job._id}
                  onClick={() => openJob(job)}
                  className={`bg-white dark:bg-gray-800 rounded-xl border cursor-pointer hover:shadow-md transition-all p-4 ${selectedJob?._id === job._id ? "border-yellow-400 shadow" : "border-gray-200 dark:border-gray-700"}`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <span className="text-base">
                          {PLATFORM_ICONS[job.platform] || "🌐"}
                        </span>
                        <span
                          className={`text-xs px-2 py-0.5 rounded-full font-medium flex items-center gap-1 ${sc.color}`}
                        >
                          <Icon
                            className={`h-3 w-3 ${job.status === "running" ? "animate-spin" : ""}`}
                          />{" "}
                          {t(`scraper.status${job.status.charAt(0).toUpperCase()}${job.status.slice(1)}`)}
                        </span>
                        <span
                          className={`text-xs px-1.5 py-0.5 rounded font-medium ${job.leadType === "B2C" ? "bg-purple-100 text-purple-700" : "bg-blue-100 text-blue-700"}`}
                        >
                          {job.leadType || "B2B"}
                        </span>
                        {isSuperRole && job.createdByName && (
                          <span className="text-xs text-gray-400 flex items-center gap-0.5">
                            <UserCircle className="h-3 w-3" />
                            {job.createdByName}
                          </span>
                        )}
                      </div>
                      <p className="font-semibold text-gray-900 dark:text-white truncate">
                        {job.name}
                      </p>
                      <p className="text-xs text-gray-400 truncate">
                        {job.searchQuery || job.targetUrl}
                      </p>
                      <div className="flex items-center gap-3 text-xs text-gray-400 mt-1 flex-wrap">
                        <span>{job.platform}</span>
                        {job.totalFound > 0 && (
                          <span className="text-green-600 font-medium">
                            {t('scraper.foundCount', { count: job.totalFound })}
                          </span>
                        )}
                        {job.totalImported > 0 && (
                          <span className="text-blue-600">
                            {t('scraper.importedCount', { count: job.totalImported })}
                          </span>
                        )}
                        {job.apiCallsUsed > 0 && (
                          <span className="text-orange-500">
                            {t('scraper.apiCallsCount', { count: job.apiCallsUsed })}
                          </span>
                        )}
                        <span>{timeAgo(job.createdAt)}</span>
                      </div>
                      {job.status === "running" && (
                        <div className="mt-2 h-1.5 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-blue-500 rounded-full animate-pulse"
                            style={{ width: `${job.progress || 30}%` }}
                          />
                        </div>
                      )}
                    </div>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteJob(job._id);
                      }}
                      className="p-1.5 text-gray-400 hover:text-red-500 flex-shrink-0 rounded hover:bg-red-50 dark:hover:bg-red-900/20"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Results panel */}
        {selectedJob && (
          <div
            className="flex-1 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden flex flex-col"
            style={{ maxHeight: "78vh" }}
          >
            <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex-shrink-0 space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-semibold text-gray-900 dark:text-white">
                      {selectedJob.name}
                    </h3>
                    <span
                      className={`text-xs px-2 py-0.5 rounded font-medium ${selectedJob.leadType === "B2C" ? "bg-purple-100 text-purple-700" : "bg-blue-100 text-blue-700"}`}
                    >
                      {selectedJob.leadType || "B2B"}
                    </span>
                  </div>
                  <p className="text-xs text-gray-400 mt-0.5">
                    {t('scraper.resultCount', { count: jobResults.length })}
                    {markedForDelete.size > 0 && (
                      <span className="ml-2 text-red-500 font-medium">
                        {t('scraper.markedCount', { count: markedForDelete.size })}
                      </span>
                    )}
                  </p>
                </div>
                <button
                  onClick={() => setSelectedJob(null)}
                  className="text-gray-400 hover:text-gray-600 p-1"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              {selectedJob.status === "completed" && jobResults.length > 0 && (
                <div className="flex items-center gap-2 flex-wrap">
                  <button
                    onClick={toggleSelectAll}
                    className="flex items-center gap-1 text-xs text-gray-500 hover:text-blue-600 px-2 py-1.5 border border-gray-300 dark:border-gray-600 rounded-lg"
                  >
                    {selectedIndices.size > 0 &&
                    selectedIndices.size === importableCount ? (
                      <CheckSquare className="h-3.5 w-3.5" />
                    ) : (
                      <Square className="h-3.5 w-3.5" />
                    )}
                    {selectedIndices.size > 0
                      ? t('scraper.selectedCount', { count: selectedIndices.size })
                      : t('scraper.selectAll')}
                  </button>

                  {markedForDelete.size > 0 && (
                    <button
                      onClick={handleCommitDeletes}
                      disabled={deletingRows}
                      className="flex items-center gap-1.5 text-xs bg-red-600 hover:bg-red-700 text-white px-3 py-1.5 rounded-lg disabled:opacity-50 font-medium"
                    >
                      {deletingRows ? (
                        <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                      ) : (
                        <Trash2 className="h-3.5 w-3.5" />
                      )}
                      {t('scraper.removeCount', { count: markedForDelete.size })}
                    </button>
                  )}

                  <div className="flex-1" />

                  {selectedIndices.size > 0 && (
                    <button
                      onClick={() => handleImport(false)}
                      disabled={importing}
                      className="flex items-center gap-1.5 text-xs bg-blue-600 hover:bg-blue-700 text-white px-3 py-1.5 rounded-lg disabled:opacity-50 font-medium"
                    >
                      <Upload className="h-3.5 w-3.5" /> {t('scraper.importCount', { count: selectedIndices.size })}
                    </button>
                  )}
                  <button
                    onClick={() => handleImport(true)}
                    disabled={importing || importableCount === 0}
                    className="flex items-center gap-1.5 text-xs bg-green-600 hover:bg-green-700 text-white px-3 py-1.5 rounded-lg disabled:opacity-50 font-medium"
                  >
                    <Upload className="h-3.5 w-3.5" /> {t('scraper.importAllCount', { count: importableCount })}
                  </button>
                </div>
              )}
            </div>

            <div className="flex-1 overflow-y-auto">
              {selectedJob.status === "running" ? (
                <div className="p-10 text-center text-gray-400">
                  <RefreshCw className="h-8 w-8 mx-auto mb-3 animate-spin text-blue-500" />
                  <p>{t('scraper.scrapingEllipsisAction')}</p>
                </div>
              ) : selectedJob.status === "failed" ? (
                <div className="p-8 text-center text-red-400">
                  <XCircle className="h-8 w-8 mx-auto mb-3" />
                  <p>{selectedJob.errorMessage}</p>
                </div>
              ) : jobResults.length === 0 ? (
                <div className="p-10 text-center text-gray-400">
                  <Globe className="h-8 w-8 mx-auto mb-3 opacity-30" />
                  <p>{t('scraper.noResultsShort')}</p>
                </div>
              ) : (
                <div className="divide-y divide-gray-100 dark:divide-gray-700">
                  {jobResults.map((r, i) => {
                    const isMarked = markedForDelete.has(i);
                    const isSelected = selectedIndices.has(i);
                    const isB2C = selectedJob.leadType === "B2C";
                    const displayName = isB2C
                      ? r.fullName || r.companyName || `Result ${i + 1}`
                      : r.companyName || r.name || `Result ${i + 1}`;
                    return (
                      <div
                        key={i}
                        onClick={() => !isMarked && toggleSelect(i)}
                        className={`p-4 transition-colors group relative ${isMarked ? "bg-red-50 dark:bg-red-900/10 opacity-50 cursor-not-allowed" : isSelected ? "bg-blue-50 dark:bg-blue-900/10 cursor-pointer" : "cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700/30"}`}
                      >
                        <div className="flex items-start gap-3">
                          <div className="mt-0.5 flex-shrink-0">
                            {isMarked ? (
                              <Trash2 className="h-4 w-4 text-red-400" />
                            ) : isSelected ? (
                              <CheckSquare className="h-4 w-4 text-blue-600" />
                            ) : (
                              <Square className="h-4 w-4 text-gray-300" />
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <p className="font-medium text-gray-900 dark:text-white text-sm truncate">
                                {displayName}
                              </p>
                              {isB2C && r.fullName && (
                                <span className="text-xs bg-purple-100 text-purple-700 px-1.5 py-0.5 rounded flex-shrink-0">
                                  {t('scraper.personLabel')}
                                </span>
                              )}
                            </div>
                            {isB2C && r.jobTitle && (
                              <p className="text-xs text-gray-500 mt-0.5">
                                {r.jobTitle}
                              </p>
                            )}
                            <div className="flex flex-wrap gap-3 mt-1">
                              {(Array.isArray(r.emails)
                                ? r.emails
                                : r.email
                                  ? [r.email]
                                  : []
                              ).map((e, ei) => (
                                <span
                                  key={ei}
                                  className="flex items-center gap-1 text-xs text-blue-600"
                                >
                                  <Mail className="h-3 w-3" />
                                  {e}
                                </span>
                              ))}
                              {(Array.isArray(r.phones)
                                ? r.phones
                                : r.phone
                                  ? [r.phone]
                                  : []
                              ).map((p, pi) => (
                                <span
                                  key={pi}
                                  className="flex items-center gap-1 text-xs text-green-600"
                                >
                                  <Phone className="h-3 w-3" />
                                  {p}
                                </span>
                              ))}
                              {r.website && (
                                <span className="flex items-center gap-1 text-xs text-gray-400 truncate max-w-32">
                                  <Globe className="h-3 w-3" />
                                  {r.website}
                                </span>
                              )}
                              {r.linkedinUrl && (
                                <span className="text-xs text-blue-500 truncate max-w-32">
                                  {r.linkedinUrl}
                                </span>
                              )}
                            </div>
                          </div>
                          {selectedJob.status === "completed" && (
                            <button
                              onClick={(e) => toggleMarkDelete(e, i)}
                              title={isMarked ? t('scraper.unmark') : t('scraper.markForRemoval')}
                              className={`flex-shrink-0 p-1.5 rounded-lg transition-colors opacity-0 group-hover:opacity-100 focus:opacity-100 ${isMarked ? "bg-red-100 text-red-600 opacity-100" : "text-gray-400 hover:bg-red-50 hover:text-red-500"}`}
                            >
                              {isMarked ? (
                                <X className="h-3.5 w-3.5" />
                              ) : (
                                <Trash2 className="h-3.5 w-3.5" />
                              )}
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* New Job Modal */}
      {showNewJob && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl w-full max-w-xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                <Zap className="h-5 w-5 text-yellow-500" /> {t('scraper.newScrapeJob')}
              </h2>
              <button
                onClick={() => setShowNewJob(false)}
                className="text-gray-400 hover:text-gray-600 text-2xl"
              >
                &times;
              </button>
            </div>
            <div className="p-6 space-y-4">
              {/* Lead type toggle */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  {t('scraper.leadTypeLabel')}
                </label>
                <div className="flex gap-2">
                  {[
                    {
                      val: "B2B",
                      label: t('scraper.b2bLabel'),
                      desc: t('scraper.b2bDesc'),
                    },
                    {
                      val: "B2C",
                      label: t('scraper.b2cLabel'),
                      desc: t('scraper.b2cDesc'),
                    },
                  ].map(({ val, label, desc }) => (
                    <button
                      key={val}
                      onClick={() =>
                        setJobForm((f) => ({ ...f, leadType: val }))
                      }
                      className={`flex-1 text-left p-3 rounded-lg border-2 transition-colors ${jobForm.leadType === val ? "border-yellow-500 bg-yellow-50 dark:bg-yellow-900/10" : "border-gray-200 dark:border-gray-700 hover:border-gray-300"}`}
                    >
                      <p className="text-sm font-semibold text-gray-800 dark:text-gray-200">
                        {label}
                      </p>
                      <p className="text-xs text-gray-500 mt-0.5">{desc}</p>
                    </button>
                  ))}
                </div>
                {jobForm.leadType === "B2C" && (
                  <div className="mt-2 p-3 bg-purple-50 dark:bg-purple-900/10 border border-purple-200 dark:border-purple-800 rounded-lg">
                    <p className="text-xs text-purple-700 dark:text-purple-400">
                      <strong>{t('scraper.b2cModeLabel')}</strong> {t('scraper.b2cModeInfo')}
                    </p>
                    <p className="text-xs text-purple-600 dark:text-purple-500 mt-1">
                      <strong>{t('scraper.exampleQueriesLabel')}</strong> {t('scraper.exampleQueriesText')}
                    </p>
                  </div>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  {t('scraper.jobNameLabel')}
                </label>
                <input
                  value={jobForm.name}
                  onChange={(e) =>
                    setJobForm((f) => ({ ...f, name: e.target.value }))
                  }
                  placeholder={
                    jobForm.leadType === "B2C"
                      ? t('scraper.jobNamePlaceholderB2C')
                      : t('scraper.jobNamePlaceholderB2B')
                  }
                  className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-sm bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  {t('scraper.platformLabel')}
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {platforms.map((p) => (
                    <button
                      key={p.name}
                      onClick={() =>
                        setJobForm((f) => ({ ...f, platform: p.name }))
                      }
                      disabled={
                        p.requiresApiKey &&
                        !capabilities.serpApi &&
                        !capabilities.googleCse
                      }
                      className={`flex items-center gap-1.5 px-2 py-2 rounded-lg border text-xs font-medium transition-colors ${jobForm.platform === p.name ? "bg-yellow-500 text-white border-yellow-500" : "bg-white dark:bg-gray-700 text-gray-600 dark:text-gray-300 border-gray-200 dark:border-gray-600 hover:border-yellow-400"} ${p.requiresApiKey && !capabilities.serpApi && !capabilities.googleCse ? "opacity-40 cursor-not-allowed" : ""}`}
                    >
                      <span className="text-sm">
                        {PLATFORM_ICONS[p.name] || "🌐"}
                      </span>
                      <span className="truncate">{p.name}</span>
                    </button>
                  ))}
                </div>
              </div>

              {jobForm.platform === "Custom URL" ? (
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    {t('scraper.targetUrlLabel')}
                  </label>
                  <input
                    value={jobForm.targetUrl}
                    onChange={(e) =>
                      setJobForm((f) => ({ ...f, targetUrl: e.target.value }))
                    }
                    placeholder="https://www.example.com/listings"
                    className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-sm bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300"
                  />
                </div>
              ) : (
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    {t('scraper.searchQueryLabel')}
                  </label>
                  <input
                    value={jobForm.searchQuery}
                    onChange={(e) =>
                      setJobForm((f) => ({ ...f, searchQuery: e.target.value }))
                    }
                    placeholder={
                      jobForm.leadType === "B2C"
                        ? t('scraper.searchQueryPlaceholderB2C')
                        : t('scraper.searchQueryPlaceholderB2B')
                    }
                    className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-sm bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300"
                  />
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    {t('scraper.maxPagesLabel')}
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="10"
                    value={jobForm.maxPages}
                    onChange={(e) =>
                      setJobForm((f) => ({
                        ...f,
                        maxPages: parseInt(e.target.value) || 3,
                      }))
                    }
                    className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-sm bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    {t('scraper.maxResultsLabel')}
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="200"
                    value={jobForm.maxResults}
                    onChange={(e) =>
                      setJobForm((f) => ({
                        ...f,
                        maxResults: parseInt(e.target.value) || 50,
                      }))
                    }
                    className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-sm bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300"
                  />
                </div>
              </div>

              {!isUnlimited && quota && !quota.unlimited && (
                <div
                  className={`rounded-lg p-3 text-xs ${(quota.remaining || 0) <= 5 ? "bg-red-50 border border-red-200 text-red-700" : "bg-gray-50 dark:bg-gray-700/50 text-gray-600 dark:text-gray-400"}`}
                >
                  {t('scraper.quotaInfoLine', { remaining: quota.remaining, used: quota.used, limit: quota.limit, pages: Math.min(jobForm.maxPages, 10) })}
                </div>
              )}
            </div>
            <div className="flex items-center justify-end gap-3 p-6 border-t border-gray-200 dark:border-gray-700">
              <button
                onClick={() => setShowNewJob(false)}
                className="px-4 py-2 text-sm text-gray-600 dark:text-gray-400"
              >
                {t('common.cancel')}
              </button>
              <button
                onClick={handleRunJob}
                disabled={running}
                className="flex items-center gap-2 px-6 py-2 bg-yellow-500 hover:bg-yellow-600 text-white rounded-lg text-sm font-medium disabled:opacity-50"
              >
                <Play className="h-4 w-4" />{" "}
                {running ? t('scraper.startingEllipsis') : t('scraper.startScraping')}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Quota Manager Modal */}
      {showQuotaMgr && (
        <QuotaManagerModal onClose={() => setShowQuotaMgr(false)} />
      )}
    </div>
  );
}
