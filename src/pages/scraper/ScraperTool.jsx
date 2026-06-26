//admin
// src/pages/scraper/ScraperTool.jsx  (updated — row delete before import)
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
  Linkedin,
  Map,
  CheckSquare,
  Square,
  X,
  UserCircle,
} from "lucide-react";
import toast from "react-hot-toast";
import { getCurrentUser } from "../../utils/api";

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
  failed: { label: "Failed", color: "bg-red-100 text-red-700", icon: XCircle },
  cancelled: {
    label: "Cancelled",
    color: "bg-gray-100 text-gray-500",
    icon: XCircle,
  },
};

const EXTRACT_FIELDS = [
  { key: "emails", label: "Emails", icon: Mail },
  { key: "phones", label: "Phone Numbers", icon: Phone },
  { key: "companyName", label: "Company Names", icon: Building2 },
  { key: "website", label: "Websites", icon: Globe },
  { key: "address", label: "Addresses", icon: Map },
  { key: "socialLinks", label: "Social Links", icon: Linkedin },
];

const EMPTY_JOB = {
  name: "",
  platform: "Google Search",
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
  },
};

const SUPER_ROLES = ["IT", "DIRECTOR", "MANAGER"];

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

export default function ScraperTool() {
  const currentUser = getCurrentUser();
  const isSuperRole = SUPER_ROLES.includes(currentUser?.subRole);

  const [platforms, setPlatforms] = useState([]);
  const [capabilities, setCapabilities] = useState({});
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(false);

  const [showNewJob, setShowNewJob] = useState(false);
  const [jobForm, setJobForm] = useState(EMPTY_JOB);
  const [running, setRunning] = useState(false);

  const [selectedJob, setSelectedJob] = useState(null);
  const [jobResults, setJobResults] = useState([]);
  const [selectedIndices, setSelectedIndices] = useState(new Set());
  const [markedForDelete, setMarkedForDelete] = useState(new Set()); // rows staged for removal
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
    try {
      const d = await apiFetch("/admin/scraper/jobs");
      if (d.success) setJobs(d.data);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPlatforms();
    fetchJobs();
  }, [fetchPlatforms, fetchJobs]);

  // Poll running jobs
  useEffect(() => {
    const hasRunning = jobs.some((j) => j.status === "running");
    if (hasRunning) {
      pollRef.current = setInterval(fetchJobs, 4000);
    } else {
      clearInterval(pollRef.current);
    }
    return () => clearInterval(pollRef.current);
  }, [jobs, fetchJobs]);

  const handleRunJob = async () => {
    if (!jobForm.searchQuery && !jobForm.targetUrl) {
      toast.error("Enter a search query or target URL");
      return;
    }
    setRunning(true);
    try {
      const d = await apiFetch("/admin/scraper/jobs", {
        method: "POST",
        body: JSON.stringify(jobForm),
      });
      if (d.success) {
        toast.success("Scrape job started!");
        setShowNewJob(false);
        setJobForm(EMPTY_JOB);
        fetchJobs();
      } else toast.error(d.message || "Failed to start");
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
    if (!confirm("Delete this scrape job?")) return;
    const d = await apiFetch(`/admin/scraper/jobs/${id}`, { method: "DELETE" });
    if (d.success) {
      toast.success("Deleted");
      fetchJobs();
      if (selectedJob?._id === id) setSelectedJob(null);
    }
  };

  // ── Select for import ──────────────────────────────────────────────────
  const toggleSelect = (i) => {
    if (markedForDelete.has(i)) return; // can't select a row marked for delete
    setSelectedIndices((prev) => {
      const next = new Set(prev);
      next.has(i) ? next.delete(i) : next.add(i);
      return next;
    });
  };
  const toggleSelectAll = () => {
    const available = jobResults
      .map((_, i) => i)
      .filter((i) => !markedForDelete.has(i));
    if (selectedIndices.size === available.length) {
      setSelectedIndices(new Set());
    } else {
      setSelectedIndices(new Set(available));
    }
  };

  // ── Mark for deletion (client-side staging) ────────────────────────────
  const toggleMarkDelete = (e, i) => {
    e.stopPropagation();
    setMarkedForDelete((prev) => {
      const next = new Set(prev);
      next.has(i) ? next.delete(i) : next.add(i);
      return next;
    });
    // Remove from selection if present
    setSelectedIndices((prev) => {
      const next = new Set(prev);
      next.delete(i);
      return next;
    });
  };

  // ── Commit deletions to server ─────────────────────────────────────────
  const handleCommitDeletes = async () => {
    if (markedForDelete.size === 0) {
      toast.error("No rows marked for deletion");
      return;
    }
    if (
      !confirm(
        `Remove ${markedForDelete.size} row(s) from this job? This cannot be undone.`,
      )
    )
      return;
    setDeletingRows(true);
    try {
      const d = await apiFetch(
        `/admin/scraper/jobs/${selectedJob._id}/results/bulk`,
        {
          method: "DELETE",
          body: JSON.stringify({ indices: [...markedForDelete] }),
        },
      );
      if (d.success) {
        toast.success(`${markedForDelete.size} row(s) removed`);
        setJobResults(d.data);
        setMarkedForDelete(new Set());
        setSelectedIndices(new Set());
        // Refresh jobs list to update totalFound count
        fetchJobs();
      } else toast.error(d.message || "Failed");
    } finally {
      setDeletingRows(false);
    }
  };

  const handleImport = async (importAll = false) => {
    const toImport = importAll
      ? jobResults.map((_, i) => i).filter((i) => !markedForDelete.has(i))
      : [...selectedIndices].filter((i) => !markedForDelete.has(i));

    if (toImport.length === 0) {
      toast.error("Select results to import");
      return;
    }
    setImporting(true);
    try {
      const d = await apiFetch(
        `/admin/scraper/jobs/${selectedJob._id}/import`,
        {
          method: "POST",
          body: JSON.stringify({ selectedIndices: toImport, importAll: false }),
        },
      );
      if (d.success) {
        toast.success(d.message);
        setSelectedIndices(new Set());
        fetchJobs();
      } else toast.error(d.message || "Import failed");
    } finally {
      setImporting(false);
    }
  };

  const importableCount = jobResults.filter(
    (_, i) => !markedForDelete.has(i),
  ).length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <Zap className="h-6 w-6 text-yellow-500" /> Web Scraper
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
            Extract leads from Google, Facebook, LinkedIn & more
            {!isSuperRole && (
              <span className="ml-2 text-xs bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 px-2 py-0.5 rounded-full">
                Your jobs only
              </span>
            )}
          </p>
        </div>
        <div className="flex items-center gap-2">
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
            <Play className="h-4 w-4" /> New Scrape Job
          </button>
        </div>
      </div>

      {/* API key status */}
      <div
        className={`rounded-xl border p-4 flex items-start gap-3 ${capabilities.serpApi || capabilities.googleCse ? "bg-green-50 dark:bg-green-900/10 border-green-200 dark:border-green-800" : "bg-orange-50 dark:bg-orange-900/10 border-orange-200 dark:border-orange-800"}`}
      >
        {capabilities.serpApi || capabilities.googleCse ? (
          <CheckCircle className="h-5 w-5 text-green-500 flex-shrink-0 mt-0.5" />
        ) : (
          <AlertTriangle className="h-5 w-5 text-orange-500 flex-shrink-0 mt-0.5" />
        )}
        <div className="text-sm">
          <p className="font-medium text-gray-800 dark:text-gray-200">
            {capabilities.serpApi
              ? "✅ SerpAPI configured — Google, Maps, LinkedIn, Facebook available"
              : capabilities.googleCse
                ? "✅ Google CSE configured — basic Google search available"
                : "⚠️ No API key configured — only VConnect NG, Yellow Pages NG and Custom URL available"}
          </p>
          <p className="text-xs text-gray-500 mt-0.5">
            Add{" "}
            <code className="bg-gray-100 dark:bg-gray-700 px-1 rounded">
              SERP_API_KEY
            </code>{" "}
            to server .env. Get one free at{" "}
            <a
              href="https://serpapi.com"
              target="_blank"
              rel="noreferrer"
              className="text-blue-500 hover:underline"
            >
              serpapi.com
            </a>
          </p>
        </div>
      </div>

      <div className="flex gap-6">
        {/* Job list */}
        <div
          className={`${selectedJob ? "w-1/3" : "w-full"} space-y-3 transition-all`}
        >
          {jobs.length === 0 && !loading ? (
            <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-10 text-center text-gray-400">
              <Zap className="h-10 w-10 mx-auto mb-3 opacity-30" />
              <p>No scrape jobs yet</p>
            </div>
          ) : (
            jobs.map((job) => {
              const sc = STATUS_CONFIG[job.status] || STATUS_CONFIG.pending;
              const Icon = sc.icon;
              return (
                <div
                  key={job._id}
                  onClick={() => openJob(job)}
                  className={`bg-white dark:bg-gray-800 rounded-xl border cursor-pointer hover:shadow-md transition-all p-4 ${selectedJob?._id === job._id ? "border-yellow-400 dark:border-yellow-600 shadow" : "border-gray-200 dark:border-gray-700"}`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <span className="text-lg">
                          {PLATFORM_ICONS[job.platform] || "🌐"}
                        </span>
                        <span
                          className={`text-xs px-2 py-0.5 rounded-full font-medium flex items-center gap-1 ${sc.color}`}
                        >
                          <Icon
                            className={`h-3 w-3 ${job.status === "running" ? "animate-spin" : ""}`}
                          />{" "}
                          {sc.label}
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
                            {job.totalFound} found
                          </span>
                        )}
                        {job.totalImported > 0 && (
                          <span className="text-blue-600">
                            {job.totalImported} imported
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
                      {job.status === "failed" && job.errorMessage && (
                        <p className="text-xs text-red-500 mt-1 truncate">
                          {job.errorMessage}
                        </p>
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
            {/* Panel header */}
            <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex-shrink-0 space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-semibold text-gray-900 dark:text-white">
                    {selectedJob.name}
                  </h3>
                  <p className="text-xs text-gray-400 mt-0.5">
                    {jobResults.length} result
                    {jobResults.length !== 1 ? "s" : ""}
                    {markedForDelete.size > 0 && (
                      <span className="ml-2 text-red-500 font-medium">
                        {markedForDelete.size} marked for removal
                      </span>
                    )}
                  </p>
                </div>
                <button
                  onClick={() => setSelectedJob(null)}
                  className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 p-1"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              {/* Action toolbar — only shown for completed jobs with results */}
              {selectedJob.status === "completed" && jobResults.length > 0 && (
                <div className="flex items-center gap-2 flex-wrap">
                  {/* Select all (non-deleted) */}
                  <button
                    onClick={toggleSelectAll}
                    className="flex items-center gap-1 text-xs text-gray-500 hover:text-blue-600 dark:hover:text-blue-400 px-2 py-1.5 border border-gray-300 dark:border-gray-600 rounded-lg"
                  >
                    {selectedIndices.size > 0 &&
                    selectedIndices.size === importableCount ? (
                      <CheckSquare className="h-3.5 w-3.5" />
                    ) : (
                      <Square className="h-3.5 w-3.5" />
                    )}
                    {selectedIndices.size > 0
                      ? `${selectedIndices.size} selected`
                      : "Select all"}
                  </button>

                  {/* Commit pending row deletions */}
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
                      Remove {markedForDelete.size} row
                      {markedForDelete.size !== 1 ? "s" : ""}
                    </button>
                  )}

                  <div className="flex-1" />

                  {/* Import selected */}
                  {selectedIndices.size > 0 && (
                    <button
                      onClick={() => handleImport(false)}
                      disabled={importing}
                      className="flex items-center gap-1.5 text-xs bg-blue-600 hover:bg-blue-700 text-white px-3 py-1.5 rounded-lg disabled:opacity-50 font-medium"
                    >
                      <Upload className="h-3.5 w-3.5" /> Import{" "}
                      {selectedIndices.size}
                    </button>
                  )}

                  {/* Import all (excluding marked-for-delete) */}
                  <button
                    onClick={() => handleImport(true)}
                    disabled={importing || importableCount === 0}
                    className="flex items-center gap-1.5 text-xs bg-green-600 hover:bg-green-700 text-white px-3 py-1.5 rounded-lg disabled:opacity-50 font-medium"
                  >
                    <Upload className="h-3.5 w-3.5" /> Import all (
                    {importableCount})
                  </button>
                </div>
              )}

              {/* Hint bar */}
              {selectedJob.status === "completed" && jobResults.length > 0 && (
                <div className="flex items-center gap-2 text-xs text-gray-400 bg-gray-50 dark:bg-gray-700/50 rounded-lg px-3 py-2">
                  <span className="w-2 h-2 rounded-full bg-red-400 flex-shrink-0" />
                  Click <Trash2 className="h-3 w-3 inline mx-0.5" /> on a row to
                  mark it for removal before importing. Commit the removal
                  first, then import what remains.
                </div>
              )}
            </div>

            {/* Results list */}
            <div className="flex-1 overflow-y-auto">
              {selectedJob.status === "running" ? (
                <div className="p-10 text-center text-gray-400">
                  <RefreshCw className="h-8 w-8 mx-auto mb-3 animate-spin text-blue-500" />
                  <p>Scraping in progress...</p>
                  <p className="text-xs mt-1">
                    Results will appear when complete
                  </p>
                </div>
              ) : selectedJob.status === "failed" ? (
                <div className="p-8 text-center text-red-400">
                  <XCircle className="h-8 w-8 mx-auto mb-3" />
                  <p className="font-medium">Scrape failed</p>
                  <p className="text-xs mt-1 text-gray-400">
                    {selectedJob.errorMessage}
                  </p>
                </div>
              ) : jobResults.length === 0 ? (
                <div className="p-10 text-center text-gray-400">
                  <Globe className="h-8 w-8 mx-auto mb-3 opacity-30" />
                  <p>No results found</p>
                </div>
              ) : (
                <div className="divide-y divide-gray-100 dark:divide-gray-700">
                  {jobResults.map((r, i) => {
                    const isMarkedDelete = markedForDelete.has(i);
                    const isSelected = selectedIndices.has(i);
                    return (
                      <div
                        key={i}
                        onClick={() => !isMarkedDelete && toggleSelect(i)}
                        className={`p-4 transition-colors group relative ${
                          isMarkedDelete
                            ? "bg-red-50 dark:bg-red-900/10 opacity-50 cursor-not-allowed"
                            : isSelected
                              ? "bg-blue-50 dark:bg-blue-900/10 cursor-pointer hover:bg-blue-100 dark:hover:bg-blue-900/20"
                              : "cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700/30"
                        }`}
                      >
                        <div className="flex items-start gap-3">
                          {/* Checkbox */}
                          <div className="mt-0.5 flex-shrink-0">
                            {isMarkedDelete ? (
                              <Trash2 className="h-4 w-4 text-red-400" />
                            ) : isSelected ? (
                              <CheckSquare className="h-4 w-4 text-blue-600" />
                            ) : (
                              <Square className="h-4 w-4 text-gray-300" />
                            )}
                          </div>

                          {/* Content */}
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-gray-900 dark:text-white text-sm truncate">
                              {r.companyName || r.name || `Result ${i + 1}`}
                              {isMarkedDelete && (
                                <span className="ml-2 text-xs text-red-500 font-normal">
                                  Marked for removal
                                </span>
                              )}
                            </p>
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
                              {r.address && (
                                <span className="text-xs text-gray-400 truncate max-w-40">
                                  {r.address}
                                </span>
                              )}
                            </div>
                            {r.linkedinUrl && (
                              <p className="text-xs text-blue-500 mt-0.5 truncate">
                                {r.linkedinUrl}
                              </p>
                            )}
                            {r.description && (
                              <p className="text-xs text-gray-400 mt-1 line-clamp-1">
                                {r.description}
                              </p>
                            )}
                          </div>

                          {/* Per-row delete toggle button */}
                          {selectedJob.status === "completed" && (
                            <button
                              onClick={(e) => toggleMarkDelete(e, i)}
                              title={
                                isMarkedDelete
                                  ? "Unmark for removal"
                                  : "Mark for removal"
                              }
                              className={`flex-shrink-0 p-1.5 rounded-lg transition-colors opacity-0 group-hover:opacity-100 focus:opacity-100 ${
                                isMarkedDelete
                                  ? "bg-red-100 text-red-600 opacity-100"
                                  : "text-gray-400 hover:bg-red-50 dark:hover:bg-red-900/20 hover:text-red-500"
                              }`}
                            >
                              {isMarkedDelete ? (
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
                <Zap className="h-5 w-5 text-yellow-500" /> New Scrape Job
              </h2>
              <button
                onClick={() => setShowNewJob(false)}
                className="text-gray-400 hover:text-gray-600 text-2xl leading-none"
              >
                &times;
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Job Name
                </label>
                <input
                  value={jobForm.name}
                  onChange={(e) =>
                    setJobForm((f) => ({ ...f, name: e.target.value }))
                  }
                  placeholder="e.g. Coffee shops Lagos"
                  className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-sm bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Platform
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
                      className={`flex items-center gap-2 px-3 py-2 rounded-lg border text-xs font-medium transition-colors ${
                        jobForm.platform === p.name
                          ? "bg-yellow-500 text-white border-yellow-500"
                          : "bg-white dark:bg-gray-700 text-gray-600 dark:text-gray-300 border-gray-200 dark:border-gray-600 hover:border-yellow-400"
                      } ${p.requiresApiKey && !capabilities.serpApi && !capabilities.googleCse ? "opacity-40 cursor-not-allowed" : ""}`}
                    >
                      <span>{PLATFORM_ICONS[p.name] || "🌐"}</span>
                      <span className="truncate">{p.name}</span>
                      {p.requiresApiKey && (
                        <span className="ml-auto text-yellow-300">🔑</span>
                      )}
                    </button>
                  ))}
                </div>
              </div>

              {jobForm.platform === "Custom URL" ? (
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Target URL *
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
                    Search Query *
                  </label>
                  <input
                    value={jobForm.searchQuery}
                    onChange={(e) =>
                      setJobForm((f) => ({ ...f, searchQuery: e.target.value }))
                    }
                    placeholder="e.g. coffee importers Lagos Nigeria"
                    className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-sm bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300"
                  />
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Max Pages (1–10)
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
                    Max Results (1–200)
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

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Extract Fields
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {EXTRACT_FIELDS.map(({ key, label, icon: Icon }) => (
                    <label
                      key={key}
                      className="flex items-center gap-2 cursor-pointer text-sm"
                    >
                      <input
                        type="checkbox"
                        checked={jobForm.extractFields[key]}
                        onChange={(e) =>
                          setJobForm((f) => ({
                            ...f,
                            extractFields: {
                              ...f.extractFields,
                              [key]: e.target.checked,
                            },
                          }))
                        }
                        className="rounded text-yellow-500"
                      />
                      <Icon className="h-3.5 w-3.5 text-gray-400" />
                      <span className="text-xs text-gray-700 dark:text-gray-300">
                        {label}
                      </span>
                    </label>
                  ))}
                </div>
              </div>
            </div>
            <div className="flex items-center justify-end gap-3 p-6 border-t border-gray-200 dark:border-gray-700">
              <button
                onClick={() => setShowNewJob(false)}
                className="px-4 py-2 text-sm text-gray-600 dark:text-gray-400"
              >
                Cancel
              </button>
              <button
                onClick={handleRunJob}
                disabled={running}
                className="flex items-center gap-2 px-6 py-2 bg-yellow-500 hover:bg-yellow-600 text-white rounded-lg text-sm font-medium disabled:opacity-50"
              >
                <Play className="h-4 w-4" />{" "}
                {running ? "Starting..." : "Start Scraping"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
