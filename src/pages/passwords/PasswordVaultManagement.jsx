//admin
// src/pages/passwords/PasswordVaultManagement.jsx  (UPDATED — subscription reminders)
import React, { useState, useEffect, useCallback } from "react";
import {
  Lock,
  Plus,
  Eye,
  EyeOff,
  Edit,
  Trash2,
  RefreshCw,
  Search,
  Globe,
  Calendar,
  AlertTriangle,
  Package,
  X,
  ChevronDown,
  ChevronRight,
  Copy,
  Bell,
  BellOff,
  RefreshCcw,
  CheckCircle,
} from "lucide-react";
import { getCurrentUser } from "../../utils/api";
import toast from "react-hot-toast";
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

const CATEGORIES = [
  "Domain & Hosting",
  "Email Account",
  "Social Media",
  "E-commerce Platform",
  "Payment Gateway",
  "Cloud Service",
  "Software License",
  "Database",
  "API Key",
  "Subscription",
  "Other",
];
const PRODUCT_TYPES = ["hosting", "domain", "ssl", "email", "other"];
const SUB_PERIODS = ["monthly", "quarterly", "biannual", "yearly", "lifetime"];

const STATUS_BADGE = {
  active: "bg-green-100 text-green-700",
  expiring_soon: "bg-orange-100 text-orange-700",
  expired: "bg-red-100 text-red-700",
};

function daysDiff(dateStr) {
  if (!dateStr) return null;
  return Math.ceil((new Date(dateStr) - Date.now()) / (1000 * 60 * 60 * 24));
}

const EMPTY_ENTRY = {
  category: "Domain & Hosting",
  platformName: "",
  websiteUrl: "",
  accountEmail: "",
  accountUsername: "",
  password: "",
  notes: "",
  tags: "",
  isSubscription: false,
  subscriptionPlan: "",
  subscriptionCost: "",
  subscriptionCurrency: "USD",
  subscriptionPeriod: "monthly",
  subscriptionStartDate: "",
  subscriptionExpiryDate: "",
  subscriptionAutoRenew: false,
  subscriptionReminderEnabled: false,
  subscriptionReminderDaysBefore: 30,
};
const EMPTY_PRODUCT = {
  name: "",
  type: "hosting",
  username: "",
  password: "",
  purchaseDate: "",
  expiryDate: "",
  renewalCost: "",
  autoRenew: false,
  reminderEnabled: false,
  reminderDaysBefore: 30,
  notes: "",
};

export default function PasswordVaultManagement() {
  const { t } = useAdminTranslation();
  const [entries, setEntries] = useState([]);
  const [expiringItems, setExpiringItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [filterCategory, setFilterCategory] = useState("");
  const [showPasswords, setShowPasswords] = useState({});
  const [expandedEntries, setExpandedEntries] = useState({});

  const [showCreate, setShowCreate] = useState(false);
  const [editEntry, setEditEntry] = useState(null);
  const [entryForm, setEntryForm] = useState(EMPTY_ENTRY);
  const [saving, setSaving] = useState(false);

  const [showAddProduct, setShowAddProduct] = useState(null);
  const [productForm, setProductForm] = useState(EMPTY_PRODUCT);
  const [addingProduct, setAddingProduct] = useState(false);
  const [sendingReminders, setSendingReminders] = useState(false);

  const fetchEntries = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ limit: 100 });
      if (search) params.set("search", search);
      if (filterCategory) params.set("category", filterCategory);
      const data = await apiFetch(`/admin/password-vault?${params}`);
      if (data.success) setEntries(data.data);
    } finally {
      setLoading(false);
    }
  }, [search, filterCategory]);

  const fetchExpiring = useCallback(async () => {
    const data = await apiFetch("/admin/password-vault/expiring?days=60");
    if (data.success) setExpiringItems(data.data);
  }, []);

  useEffect(() => {
    fetchEntries();
    fetchExpiring();
  }, [fetchEntries, fetchExpiring]);

  const togglePassword = (id) =>
    setShowPasswords((p) => ({ ...p, [id]: !p[id] }));
  const toggleExpand = (id) =>
    setExpandedEntries((p) => ({ ...p, [id]: !p[id] }));

  const copyToClipboard = (text, label = "Copied!") => {
    navigator.clipboard.writeText(text);
    toast.success(label);
  };

  const handleSendReminders = async () => {
    setSendingReminders(true);
    try {
      const data = await apiFetch(
        "/admin/password-vault/send-reminders?days=30",
        { method: "POST" },
      );
      if (data.success) toast.success(data.message);
      else toast.error(data.message || t("orders.statuses.FAILED"));
    } finally {
      setSendingReminders(false);
    }
  };

  const handleSaveEntry = async () => {
    if (!entryForm.platformName.trim()) {
      toast.error("Platform name required");
      return;
    }
    setSaving(true);
    try {
      const payload = {
        ...entryForm,
        tags: entryForm.tags
          ? entryForm.tags
              .split(",")
              .map((t) => t.trim())
              .filter(Boolean)
          : [],
        subscriptionCost: entryForm.subscriptionCost
          ? parseFloat(entryForm.subscriptionCost)
          : null,
      };
      let data;
      if (editEntry) {
        data = await apiFetch(`/admin/password-vault/${editEntry._id}`, {
          method: "PUT",
          body: JSON.stringify(payload),
        });
      } else {
        data = await apiFetch("/admin/password-vault", {
          method: "POST",
          body: JSON.stringify(payload),
        });
      }
      if (data.success) {
        toast.success(editEntry ? "Entry updated" : "Entry created");
        setShowCreate(false);
        setEditEntry(null);
        setEntryForm(EMPTY_ENTRY);
        fetchEntries();
        fetchExpiring();
      } else toast.error(data.message || t("orders.statuses.FAILED"));
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteEntry = async (id) => {
    if (!window.confirm("Remove this entry?")) return;
    const data = await apiFetch(`/admin/password-vault/${id}`, {
      method: "DELETE",
    });
    if (data.success) {
      toast.success("Removed");
      fetchEntries();
    }
  };

  const startEdit = (entry) => {
    setEditEntry(entry);
    setEntryForm({
      category: entry.category,
      platformName: entry.platformName,
      websiteUrl: entry.websiteUrl || "",
      accountEmail: entry.accountEmail || "",
      accountUsername: entry.accountUsername || "",
      password: entry.password || "",
      notes: entry.notes || "",
      tags: (entry.tags || []).join(", "),
      isSubscription: entry.isSubscription || false,
      subscriptionPlan: entry.subscriptionPlan || "",
      subscriptionCost: entry.subscriptionCost?.toString() || "",
      subscriptionCurrency: entry.subscriptionCurrency || "USD",
      subscriptionPeriod: entry.subscriptionPeriod || "monthly",
      subscriptionStartDate: entry.subscriptionStartDate
        ? entry.subscriptionStartDate.split("T")[0]
        : "",
      subscriptionExpiryDate: entry.subscriptionExpiryDate
        ? entry.subscriptionExpiryDate.split("T")[0]
        : "",
      subscriptionAutoRenew: entry.subscriptionAutoRenew || false,
      subscriptionReminderEnabled: entry.subscriptionReminderEnabled || false,
      subscriptionReminderDaysBefore:
        entry.subscriptionReminderDaysBefore || 30,
    });
    setShowCreate(true);
  };

  const handleAddProduct = async () => {
    if (!productForm.name.trim()) {
      toast.error("Product name required");
      return;
    }
    setAddingProduct(true);
    try {
      const data = await apiFetch(
        `/admin/password-vault/${showAddProduct}/products`,
        {
          method: "POST",
          body: JSON.stringify(productForm),
        },
      );
      if (data.success) {
        toast.success("Product added");
        setShowAddProduct(null);
        setProductForm(EMPTY_PRODUCT);
        fetchEntries();
        fetchExpiring();
      }
    } finally {
      setAddingProduct(false);
    }
  };

  const handleDeleteProduct = async (entryId, productId) => {
    const data = await apiFetch(
      `/admin/password-vault/${entryId}/products/${productId}`,
      { method: "DELETE" },
    );
    if (data.success) {
      toast.success("Product removed");
      fetchEntries();
    }
  };

  return (
    <div className="space-y-6">
      {/* ── Header ── */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <Lock className="h-6 w-6 text-blue-600" /> Password Vault
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
            IT & Director Access Only
          </p>
        </div>
        <div className="flex items-center gap-2">
          {expiringItems.length > 0 && (
            <div className="flex items-center gap-1 px-3 py-1.5 bg-orange-100 dark:bg-orange-900/20 text-orange-700 dark:text-orange-400 rounded-lg text-sm font-medium">
              <AlertTriangle className="h-4 w-4" /> {expiringItems.length}{" "}
              expiring/expired
            </div>
          )}
          <button
            onClick={handleSendReminders}
            disabled={sendingReminders}
            className="flex items-center gap-1 px-3 py-2 text-sm bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 disabled:opacity-50"
          >
            <Bell className="h-4 w-4" />
            {sendingReminders ? "Sending..." : "Send Reminders"}
          </button>
          <button
            onClick={fetchEntries}
            className="p-2 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700"
          >
            <RefreshCw
              className={`h-4 w-4 text-gray-500 ${loading ? "animate-spin" : ""}`}
            />
          </button>
          <button
            onClick={() => {
              setEditEntry(null);
              setEntryForm(EMPTY_ENTRY);
              setShowCreate(true);
            }}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm font-medium"
          >
            <Plus className="h-4 w-4" /> Add Entry
          </button>
        </div>
      </div>

      {/* ── Expiring alerts ── */}
      {expiringItems.length > 0 && (
        <div className="bg-orange-50 dark:bg-orange-900/10 border border-orange-200 dark:border-orange-800 rounded-xl p-4">
          <h3 className="text-sm font-semibold text-orange-700 dark:text-orange-400 mb-3 flex items-center gap-2">
            <AlertTriangle className="h-4 w-4" /> Expiring / Expired Items
          </h3>
          <div className="space-y-2">
            {expiringItems.map((item, i) => (
              <div
                key={i}
                className="flex items-center justify-between text-sm"
              >
                <div>
                  <span className="font-medium text-gray-800 dark:text-gray-200">
                    {item.platformName}
                  </span>
                  {item.name && (
                    <span className="text-gray-500 dark:text-gray-400">
                      {" "}
                      — {item.name}
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <span
                    className={`px-2 py-0.5 rounded-full text-xs font-medium ${item.isExpired ? "bg-red-100 text-red-700" : "bg-orange-100 text-orange-700"}`}
                  >
                    {item.isExpired ? "Expired" : `${item.daysLeft}d left`}
                  </span>
                  <span className="text-xs text-gray-400">
                    {new Date(item.expiryDate).toLocaleDateString()}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Filters ── */}
      <div className="flex gap-3 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={t("passwords.searchPlaceholder")}
            className="w-full pl-9 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300"
          />
        </div>
        <select
          value={filterCategory}
          onChange={(e) => setFilterCategory(e.target.value)}
          className="text-sm border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300"
        >
          <option value="">{t("products.allCategories")}</option>
          {CATEGORIES.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>
      </div>

      {/* ── Entries ── */}
      <div className="space-y-3">
        {loading && entries.length === 0 ? (
          <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-10 text-center text-gray-400">
            Loading...
          </div>
        ) : entries.length === 0 ? (
          <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-10 text-center text-gray-400">
            <Lock className="h-10 w-10 mx-auto mb-3 opacity-30" />
            <p>No entries yet</p>
          </div>
        ) : (
          entries.map((entry) => (
            <div
              key={entry._id}
              className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden"
            >
              <div className="p-4 flex items-center gap-3">
                <button
                  onClick={() => toggleExpand(entry._id)}
                  className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
                >
                  {expandedEntries[entry._id] ? (
                    <ChevronDown className="h-4 w-4" />
                  ) : (
                    <ChevronRight className="h-4 w-4" />
                  )}
                </button>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <Globe className="h-4 w-4 text-blue-500 flex-shrink-0" />
                    <span className="font-semibold text-gray-900 dark:text-white">
                      {entry.platformName}
                    </span>
                    <span className="text-xs px-2 py-0.5 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 rounded-full">
                      {entry.category}
                    </span>
                    {entry.isSubscription && (
                      <span className="text-xs px-2 py-0.5 bg-purple-100 dark:bg-purple-900/20 text-purple-700 dark:text-purple-400 rounded-full flex items-center gap-1">
                        <RefreshCcw className="h-3 w-3" /> Subscription
                      </span>
                    )}
                    {entry.subscriptionStatus === "expired" && (
                      <span className="text-xs px-2 py-0.5 bg-red-100 text-red-700 rounded-full flex items-center gap-1">
                        <AlertTriangle className="h-3 w-3" /> Sub Expired
                      </span>
                    )}
                    {entry.subscriptionStatus === "expiring_soon" && (
                      <span className="text-xs px-2 py-0.5 bg-orange-100 text-orange-700 rounded-full flex items-center gap-1">
                        <AlertTriangle className="h-3 w-3" /> Sub Expiring
                      </span>
                    )}
                    {entry.subscriptionReminderEnabled && (
                      <span className="text-xs text-blue-400 flex items-center gap-0.5">
                        <Bell className="h-3 w-3" />
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-3 mt-1 text-xs text-gray-500 dark:text-gray-400">
                    {entry.websiteUrl && (
                      <a
                        href={entry.websiteUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="hover:text-blue-500 truncate max-w-xs"
                      >
                        {entry.websiteUrl}
                      </a>
                    )}
                    {entry.accountEmail && <span>{entry.accountEmail}</span>}
                    {entry.isSubscription && entry.subscriptionExpiryDate && (
                      <span>
                        Renews{" "}
                        {new Date(
                          entry.subscriptionExpiryDate,
                        ).toLocaleDateString()}
                      </span>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <button
                    onClick={() => setShowAddProduct(entry._id)}
                    className="p-1.5 text-gray-400 hover:text-green-600 rounded"
                    title="Add service"
                  >
                    <Package className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => startEdit(entry)}
                    className="p-1.5 text-gray-400 hover:text-blue-600 rounded"
                  >
                    <Edit className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => handleDeleteEntry(entry._id)}
                    className="p-1.5 text-gray-400 hover:text-red-600 rounded"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>

              {expandedEntries[entry._id] && (
                <div className="border-t border-gray-100 dark:border-gray-700 p-4 space-y-4">
                  {/* Credentials */}
                  <div className="grid grid-cols-2 gap-3">
                    {entry.accountUsername && (
                      <div>
                        <p className="text-xs text-gray-400 mb-0.5">{t("settings.username")}</p>
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-mono text-gray-700 dark:text-gray-300">
                            {entry.accountUsername}
                          </span>
                          <button
                            onClick={() =>
                              copyToClipboard(
                                entry.accountUsername,
                                "Username copied",
                              )
                            }
                            className="text-gray-400 hover:text-blue-500"
                          >
                            <Copy className="h-3 w-3" />
                          </button>
                        </div>
                      </div>
                    )}
                    {entry.password && (
                      <div>
                        <p className="text-xs text-gray-400 mb-0.5">Password</p>
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-mono text-gray-700 dark:text-gray-300">
                            {showPasswords[entry._id]
                              ? entry.password
                              : "••••••••"}
                          </span>
                          <button
                            onClick={() => togglePassword(entry._id)}
                            className="text-gray-400 hover:text-blue-500"
                          >
                            {showPasswords[entry._id] ? (
                              <EyeOff className="h-3 w-3" />
                            ) : (
                              <Eye className="h-3 w-3" />
                            )}
                          </button>
                          <button
                            onClick={() =>
                              copyToClipboard(entry.password, "Password copied")
                            }
                            className="text-gray-400 hover:text-blue-500"
                          >
                            <Copy className="h-3 w-3" />
                          </button>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Subscription info */}
                  {entry.isSubscription && (
                    <div
                      className={`rounded-lg p-3 border ${entry.subscriptionStatus === "expired" ? "border-red-200 bg-red-50 dark:bg-red-900/10" : entry.subscriptionStatus === "expiring_soon" ? "border-orange-200 bg-orange-50 dark:bg-orange-900/10" : "border-purple-100 bg-purple-50 dark:bg-purple-900/10"}`}
                    >
                      <p className="text-xs font-semibold text-gray-500 uppercase mb-2 flex items-center gap-1">
                        <RefreshCcw className="h-3 w-3" /> Subscription
                      </p>
                      <div className="grid grid-cols-2 gap-2 text-xs text-gray-600 dark:text-gray-400">
                        {entry.subscriptionPlan && (
                          <div>
                            <span className="text-gray-400">Plan:</span>{" "}
                            {entry.subscriptionPlan}
                          </div>
                        )}
                        {entry.subscriptionCost && (
                          <div>
                            <span className="text-gray-400">Cost:</span>{" "}
                            {entry.subscriptionCurrency}{" "}
                            {entry.subscriptionCost}/{entry.subscriptionPeriod}
                          </div>
                        )}
                        {entry.subscriptionExpiryDate && (
                          <div className="col-span-2 flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            Expires:{" "}
                            {new Date(
                              entry.subscriptionExpiryDate,
                            ).toLocaleDateString()}
                            {(() => {
                              const d = daysDiff(entry.subscriptionExpiryDate);
                              return d !== null ? (
                                <span
                                  className={
                                    d <= 0
                                      ? "text-red-600 font-medium"
                                      : d <= 30
                                        ? "text-orange-600 font-medium"
                                        : "text-gray-400"
                                  }
                                >
                                  {" "}
                                  ({d <= 0 ? "Expired" : `${d}d left`})
                                </span>
                              ) : null;
                            })()}
                          </div>
                        )}
                        <div className="flex items-center gap-1">
                          {entry.subscriptionReminderEnabled ? (
                            <Bell className="h-3 w-3 text-blue-500" />
                          ) : (
                            <BellOff className="h-3 w-3 text-gray-400" />
                          )}
                          Reminder:{" "}
                          {entry.subscriptionReminderEnabled
                            ? `${entry.subscriptionReminderDaysBefore}d before`
                            : "Off"}
                        </div>
                        {entry.subscriptionAutoRenew && (
                          <div className="flex items-center gap-1 text-green-600">
                            <CheckCircle className="h-3 w-3" /> Auto-renew on
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {entry.notes && (
                    <p className="text-sm text-gray-500 dark:text-gray-400 italic">
                      {entry.notes}
                    </p>
                  )}

                  {/* Products */}
                  {entry.products?.length > 0 && (
                    <div>
                      <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-2">
                        Services / Products
                      </p>
                      <div className="space-y-2">
                        {entry.products.map((product) => {
                          const days = daysDiff(product.expiryDate);
                          return (
                            <div
                              key={product._id}
                              className={`rounded-lg p-3 border ${product.status === "expired" ? "border-red-200 bg-red-50 dark:bg-red-900/10" : product.status === "expiring_soon" ? "border-orange-200 bg-orange-50 dark:bg-orange-900/10" : "border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-700/30"}`}
                            >
                              <div className="flex items-start justify-between gap-2">
                                <div>
                                  <div className="flex items-center gap-2">
                                    <span className="font-medium text-sm text-gray-800 dark:text-gray-200">
                                      {product.name}
                                    </span>
                                    <span
                                      className={`text-xs px-1.5 py-0.5 rounded font-medium ${STATUS_BADGE[product.status] || STATUS_BADGE.active}`}
                                    >
                                      {product.status?.replace("_", " ")}
                                    </span>
                                    <span className="text-xs text-gray-400 capitalize">
                                      {product.type}
                                    </span>
                                  </div>
                                  {product.expiryDate && (
                                    <div className="flex items-center gap-1 text-xs text-gray-500 mt-1">
                                      <Calendar className="h-3 w-3" />
                                      Expires{" "}
                                      {new Date(
                                        product.expiryDate,
                                      ).toLocaleDateString()}
                                      {days !== null && (
                                        <span
                                          className={
                                            days <= 0
                                              ? "text-red-600"
                                              : "text-orange-600"
                                          }
                                        >
                                          {" "}
                                          ({days <= 0 ? "expired" : `${days}d`})
                                        </span>
                                      )}
                                      {product.reminderEnabled && (
                                        <span className="ml-1 flex items-center gap-0.5 text-blue-400">
                                          <Bell className="h-3 w-3" />
                                          {product.reminderDaysBefore}d
                                        </span>
                                      )}
                                    </div>
                                  )}
                                  {product.password && (
                                    <div className="flex items-center gap-2 mt-1">
                                      <span className="text-xs font-mono text-gray-500">
                                        {showPasswords[product._id]
                                          ? product.password
                                          : "••••••"}
                                      </span>
                                      <button
                                        onClick={() =>
                                          togglePassword(product._id)
                                        }
                                        className="text-gray-400 hover:text-blue-500"
                                      >
                                        {showPasswords[product._id] ? (
                                          <EyeOff className="h-3 w-3" />
                                        ) : (
                                          <Eye className="h-3 w-3" />
                                        )}
                                      </button>
                                      <button
                                        onClick={() =>
                                          copyToClipboard(
                                            product.password,
                                            "Password copied",
                                          )
                                        }
                                        className="text-gray-400 hover:text-blue-500"
                                      >
                                        <Copy className="h-3 w-3" />
                                      </button>
                                    </div>
                                  )}
                                </div>
                                <button
                                  onClick={() =>
                                    handleDeleteProduct(entry._id, product._id)
                                  }
                                  className="text-gray-400 hover:text-red-500"
                                >
                                  <Trash2 className="h-3.5 w-3.5" />
                                </button>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          ))
        )}
      </div>

      {/* ── Create / Edit Entry Modal ── */}
      {showCreate && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl w-full max-w-lg my-8">
            <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                {editEntry ? "Edit" : "Add"} Vault Entry
              </h2>
              <button
                onClick={() => {
                  setShowCreate(false);
                  setEditEntry(null);
                }}
                className="text-gray-400 hover:text-gray-600 text-2xl leading-none"
              >
                &times;
              </button>
            </div>
            <div className="p-6 space-y-4 max-h-[70vh] overflow-y-auto">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Category
                  </label>
                  <select
                    value={entryForm.category}
                    onChange={(e) =>
                      setEntryForm((f) => ({ ...f, category: e.target.value }))
                    }
                    className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-sm bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300"
                  >
                    {CATEGORIES.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Platform Name *
                  </label>
                  <input
                    value={entryForm.platformName}
                    onChange={(e) =>
                      setEntryForm((f) => ({
                        ...f,
                        platformName: e.target.value,
                      }))
                    }
                    placeholder="e.g. Namecheap"
                    className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-sm bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Website URL
                </label>
                <input
                  value={entryForm.websiteUrl}
                  onChange={(e) =>
                    setEntryForm((f) => ({ ...f, websiteUrl: e.target.value }))
                  }
                  placeholder="https://www.namecheap.com"
                  className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-sm bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Account Email
                  </label>
                  <input
                    value={entryForm.accountEmail}
                    onChange={(e) =>
                      setEntryForm((f) => ({
                        ...f,
                        accountEmail: e.target.value,
                      }))
                    }
                    className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-sm bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Username
                  </label>
                  <input
                    value={entryForm.accountUsername}
                    onChange={(e) =>
                      setEntryForm((f) => ({
                        ...f,
                        accountUsername: e.target.value,
                      }))
                    }
                    className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-sm bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Password
                </label>
                <input
                  type="text"
                  value={entryForm.password}
                  onChange={(e) =>
                    setEntryForm((f) => ({ ...f, password: e.target.value }))
                  }
                  className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-sm font-mono bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300"
                />
              </div>

              {/* Subscription toggle */}
              <div className="border border-purple-200 dark:border-purple-800 rounded-xl p-4 space-y-3">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={entryForm.isSubscription}
                    onChange={(e) =>
                      setEntryForm((f) => ({
                        ...f,
                        isSubscription: e.target.checked,
                      }))
                    }
                    className="rounded text-purple-600"
                  />
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300 flex items-center gap-1">
                    <RefreshCcw className="h-4 w-4 text-purple-500" /> This is a
                    Subscription Account
                  </span>
                </label>
                {entryForm.isSubscription && (
                  <div className="space-y-3 pt-2">
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
                          Plan Name
                        </label>
                        <input
                          value={entryForm.subscriptionPlan}
                          onChange={(e) =>
                            setEntryForm((f) => ({
                              ...f,
                              subscriptionPlan: e.target.value,
                            }))
                          }
                          placeholder="Pro Monthly"
                          className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-1.5 text-sm bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
                          Period
                        </label>
                        <select
                          value={entryForm.subscriptionPeriod}
                          onChange={(e) =>
                            setEntryForm((f) => ({
                              ...f,
                              subscriptionPeriod: e.target.value,
                            }))
                          }
                          className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-1.5 text-sm bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300"
                        >
                          {SUB_PERIODS.map((p) => (
                            <option key={p} value={p}>
                              {p}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
                          Cost
                        </label>
                        <input
                          type="number"
                          value={entryForm.subscriptionCost}
                          onChange={(e) =>
                            setEntryForm((f) => ({
                              ...f,
                              subscriptionCost: e.target.value,
                            }))
                          }
                          placeholder="0.00"
                          className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-1.5 text-sm bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
                          Currency
                        </label>
                        <select
                          value={entryForm.subscriptionCurrency}
                          onChange={(e) =>
                            setEntryForm((f) => ({
                              ...f,
                              subscriptionCurrency: e.target.value,
                            }))
                          }
                          className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-1.5 text-sm bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300"
                        >
                          {["USD", "EUR", "GBP", "NGN"].map((c) => (
                            <option key={c} value={c}>
                              {c}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
                          Start Date
                        </label>
                        <input
                          type="date"
                          value={entryForm.subscriptionStartDate}
                          onChange={(e) =>
                            setEntryForm((f) => ({
                              ...f,
                              subscriptionStartDate: e.target.value,
                            }))
                          }
                          className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-1.5 text-sm bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
                          Expiry / Renewal Date
                        </label>
                        <input
                          type="date"
                          value={entryForm.subscriptionExpiryDate}
                          onChange={(e) =>
                            setEntryForm((f) => ({
                              ...f,
                              subscriptionExpiryDate: e.target.value,
                            }))
                          }
                          className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-1.5 text-sm bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300"
                        />
                      </div>
                    </div>
                    <div className="flex items-center gap-6">
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={entryForm.subscriptionAutoRenew}
                          onChange={(e) =>
                            setEntryForm((f) => ({
                              ...f,
                              subscriptionAutoRenew: e.target.checked,
                            }))
                          }
                          className="rounded text-purple-600"
                        />
                        <span className="text-sm text-gray-700 dark:text-gray-300">
                          Auto-renew
                        </span>
                      </label>
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={entryForm.subscriptionReminderEnabled}
                          onChange={(e) =>
                            setEntryForm((f) => ({
                              ...f,
                              subscriptionReminderEnabled: e.target.checked,
                            }))
                          }
                          className="rounded text-blue-600"
                        />
                        <span className="text-sm text-gray-700 dark:text-gray-300 flex items-center gap-1">
                          <Bell className="h-4 w-4 text-blue-500" /> Remind me
                        </span>
                      </label>
                    </div>
                    {entryForm.subscriptionReminderEnabled && (
                      <div>
                        <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
                          Remind how many days before?
                        </label>
                        <input
                          type="number"
                          value={entryForm.subscriptionReminderDaysBefore}
                          onChange={(e) =>
                            setEntryForm((f) => ({
                              ...f,
                              subscriptionReminderDaysBefore:
                                parseInt(e.target.value) || 30,
                            }))
                          }
                          className="w-32 border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-1.5 text-sm bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300"
                        />
                        <span className="text-xs text-gray-400 ml-2">
                          days before expiry
                        </span>
                      </div>
                    )}
                  </div>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Tags (comma-separated)
                </label>
                <input
                  value={entryForm.tags}
                  onChange={(e) =>
                    setEntryForm((f) => ({ ...f, tags: e.target.value }))
                  }
                  placeholder="icvng, production"
                  className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-sm bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Notes
                </label>
                <textarea
                  value={entryForm.notes}
                  onChange={(e) =>
                    setEntryForm((f) => ({ ...f, notes: e.target.value }))
                  }
                  rows={2}
                  className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-sm bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300"
                />
              </div>
            </div>
            <div className="flex items-center justify-end gap-3 p-6 border-t border-gray-200 dark:border-gray-700">
              <button
                onClick={() => {
                  setShowCreate(false);
                  setEditEntry(null);
                }}
                className="px-4 py-2 text-sm text-gray-600 dark:text-gray-400"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveEntry}
                disabled={saving}
                className="px-5 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm font-medium disabled:opacity-50"
              >
                {saving ? "Saving..." : editEntry ? "Update" : "Save Entry"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Add Product Modal ── */}
      {showAddProduct && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl w-full max-w-lg my-8">
            <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                Add Service / Product
              </h2>
              <button
                onClick={() => {
                  setShowAddProduct(null);
                  setProductForm(EMPTY_PRODUCT);
                }}
                className="text-gray-400 hover:text-gray-600 text-2xl leading-none"
              >
                &times;
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Service Name *
                  </label>
                  <input
                    value={productForm.name}
                    onChange={(e) =>
                      setProductForm((f) => ({ ...f, name: e.target.value }))
                    }
                    placeholder="Business Hosting"
                    className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-sm bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Type
                  </label>
                  <select
                    value={productForm.type}
                    onChange={(e) =>
                      setProductForm((f) => ({ ...f, type: e.target.value }))
                    }
                    className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-sm bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300"
                  >
                    {PRODUCT_TYPES.map((t) => (
                      <option key={t} value={t}>
                        {t}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Password (if any)
                </label>
                <input
                  type="text"
                  value={productForm.password}
                  onChange={(e) =>
                    setProductForm((f) => ({ ...f, password: e.target.value }))
                  }
                  className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-sm font-mono bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Purchase Date
                  </label>
                  <input
                    type="date"
                    value={productForm.purchaseDate}
                    onChange={(e) =>
                      setProductForm((f) => ({
                        ...f,
                        purchaseDate: e.target.value,
                      }))
                    }
                    className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-sm bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Expiry Date
                  </label>
                  <input
                    type="date"
                    value={productForm.expiryDate}
                    onChange={(e) =>
                      setProductForm((f) => ({
                        ...f,
                        expiryDate: e.target.value,
                      }))
                    }
                    className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-sm bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Renewal Cost
                  </label>
                  <input
                    type="number"
                    value={productForm.renewalCost}
                    onChange={(e) =>
                      setProductForm((f) => ({
                        ...f,
                        renewalCost: e.target.value,
                      }))
                    }
                    className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-sm bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Reminder days before
                  </label>
                  <input
                    type="number"
                    value={productForm.reminderDaysBefore}
                    onChange={(e) =>
                      setProductForm((f) => ({
                        ...f,
                        reminderDaysBefore: parseInt(e.target.value),
                      }))
                    }
                    disabled={!productForm.reminderEnabled}
                    className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-sm bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 disabled:opacity-40"
                  />
                </div>
              </div>
              <div className="flex items-center gap-6">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={productForm.autoRenew}
                    onChange={(e) =>
                      setProductForm((f) => ({
                        ...f,
                        autoRenew: e.target.checked,
                      }))
                    }
                    className="rounded text-blue-600"
                  />
                  <span className="text-sm text-gray-700 dark:text-gray-300">
                    Auto-renew
                  </span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={productForm.reminderEnabled}
                    onChange={(e) =>
                      setProductForm((f) => ({
                        ...f,
                        reminderEnabled: e.target.checked,
                      }))
                    }
                    className="rounded text-blue-600"
                  />
                  <span className="text-sm text-gray-700 dark:text-gray-300 flex items-center gap-1">
                    <Bell className="h-4 w-4 text-blue-500" /> Enable reminder
                  </span>
                </label>
              </div>
            </div>
            <div className="flex items-center justify-end gap-3 p-6 border-t border-gray-200 dark:border-gray-700">
              <button
                onClick={() => {
                  setShowAddProduct(null);
                  setProductForm(EMPTY_PRODUCT);
                }}
                className="px-4 py-2 text-sm text-gray-600 dark:text-gray-400"
              >
                Cancel
              </button>
              <button
                onClick={handleAddProduct}
                disabled={addingProduct}
                className="px-5 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm font-medium disabled:opacity-50"
              >
                {addingProduct ? "Adding..." : "Add Service"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
