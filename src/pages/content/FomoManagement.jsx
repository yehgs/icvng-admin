// admin/src/pages/content/FomoManagement.jsx
import React, { useState, useEffect, useRef } from "react";
import {
  Zap,
  Settings,
  Users,
  Plus,
  Edit2,
  Trash2,
  RefreshCw,
  Eye,
  Save,
  ToggleLeft,
  ToggleRight,
  Clock,
  Search,
  Package,
  X,
  Upload,
  Image as ImageIcon,
} from "lucide-react";
import toast from "react-hot-toast";
import { apiCall, handleApiError, productAPI, fileAPI } from "../../utils/api";
import { useAdminTranslation } from "../../hooks/useAdminTranslation.js";

// Simple NGN currency formatter (no external dependency needed)
const formatPrice = (price) =>
  new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency: "NGN",
    minimumFractionDigits: 0,
  }).format(price || 0);

const ANIMATION_TYPES = ["fade", "slide", "bounce"];
const POSITIONS = ["bottom-left", "bottom-right", "top-left", "top-right"];
const NIGERIA_STATES = [
  "Abia",
  "Adamawa",
  "Akwa Ibom",
  "Anambra",
  "Bauchi",
  "Bayelsa",
  "Benue",
  "Borno",
  "Cross River",
  "Delta",
  "Ebonyi",
  "Edo",
  "Ekiti",
  "Enugu",
  "FCT",
  "Gombe",
  "Imo",
  "Jigawa",
  "Kaduna",
  "Kano",
  "Katsina",
  "Kebbi",
  "Kogi",
  "Kwara",
  "Lagos",
  "Nasarawa",
  "Niger",
  "Ogun",
  "Ondo",
  "Osun",
  "Oyo",
  "Plateau",
  "Rivers",
  "Sokoto",
  "Taraba",
  "Yobe",
  "Zamfara",
];

// ── Helper: format a Date as the value expected by <input type="datetime-local"> ──
const toDatetimeLocal = (date) => {
  const d = date ? new Date(date) : new Date();
  const pad = (n) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
};

// ── Helper: human "time ago" preview, capped at 11 months ──────────────────────
const timeAgoPreview = (date) => {
  const diffMs = Date.now() - new Date(date).getTime();
  if (diffMs < 0) return "in the future";
  const seconds = Math.floor(diffMs / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);
  const months = Math.floor(days / 30);

  if (seconds < 60) return `${seconds}s ago`;
  if (minutes < 60) return `${minutes}m ago`;
  if (hours < 24) return `${hours}h ago`;
  if (days < 30) return `${days}d ago`;
  return `${Math.min(months, 11)}mo ago`;
};

const EMPTY_DUMMY = {
  name: "",
  avatar: "",
  state: "Lagos",
  product: "",
  productName: "",
  productImage: "",
  price: 0,
  quantity: 1,
  purchasedAt: toDatetimeLocal(new Date()),
};

const FomoManagement = () => {
  const [settings, setSettings] = useState(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState("settings"); // 'settings' | 'users'
  const [dummyForm, setDummyForm] = useState(EMPTY_DUMMY);
  const [editingUser, setEditingUser] = useState(null); // user _id being edited
  const [showDummyForm, setShowDummyForm] = useState(false);
  const [submittingUser, setSubmittingUser] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);

  // ── Product search ──────────────────────────────────────────────────────
  const [productQuery, setProductQuery] = useState("");
  const [productResults, setProductResults] = useState([]);
  const [searchingProducts, setSearchingProducts] = useState(false);
  const [showProductDropdown, setShowProductDropdown] = useState(false);
  const searchTimerRef = useRef(null);
  const dropdownRef = useRef(null);

  const { t } = useAdminTranslation();

  useEffect(() => {
    fetchSettings();
  }, []);

  // Close product dropdown when clicking outside
  useEffect(() => {
    const handler = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setShowProductDropdown(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const fetchSettings = async () => {
    setLoading(true);
    try {
      const res = await apiCall("/fomo/settings");
      if (res.success) setSettings(res.data);
    } catch (err) {
      toast.error(handleApiError(err, "Failed to load FOMO settings"));
    } finally {
      setLoading(false);
    }
  };

  const handleSaveSettings = async () => {
    if (!settings) return;
    setSaving(true);
    try {
      const res = await apiCall("/fomo/settings", {
        method: "PUT",
        body: {
          enabled: settings.enabled,
          animationType: settings.animationType,
          position: settings.position,
          displayDurationMs: settings.displayDurationMs,
          pauseBetweenMs: settings.pauseBetweenMs,
          fadeInMs: settings.fadeInMs,
          fadeOutMs: settings.fadeOutMs,
          useDummyUsers: settings.useDummyUsers,
          maxRealPurchases: settings.maxRealPurchases,
        },
      });
      if (res.success) {
        toast.success("FOMO settings saved");
        setSettings(res.data);
      } else toast.error(res.message || "Save failed");
    } catch (err) {
      toast.error(handleApiError(err, "Failed to save"));
    } finally {
      setSaving(false);
    }
  };

  const update = (field, value) =>
    setSettings((prev) => ({ ...prev, [field]: value }));

  // ── Product search (debounced) ──────────────────────────────────────────
  const handleProductSearch = (q) => {
    setProductQuery(q);
    setShowProductDropdown(true);
    if (searchTimerRef.current) clearTimeout(searchTimerRef.current);
    if (!q.trim()) {
      setProductResults([]);
      return;
    }
    searchTimerRef.current = setTimeout(async () => {
      setSearchingProducts(true);
      try {
        const res = await productAPI.searchProductAdmin({
          search: q,
          page: 1,
          limit: 8,
        });
        if (res.success) setProductResults(res.data || []);
      } catch (_) {
        setProductResults([]);
      } finally {
        setSearchingProducts(false);
      }
    }, 350);
  };

  const handleSelectProduct = (product) => {
    const price =
      (product.btcPrice > 0 ? product.btcPrice : product.price) || 0;
    setDummyForm((p) => ({
      ...p,
      product: product._id,
      productName: product.name,
      productImage: product.image?.[0] || "",
      price,
    }));
    setProductQuery(product.name);
    setShowProductDropdown(false);
  };

  const clearSelectedProduct = () => {
    setDummyForm((p) => ({
      ...p,
      product: "",
      productName: "",
      productImage: "",
      price: 0,
    }));
    setProductQuery("");
  };

  // ── Avatar image upload ──────────────────────────────────────────────────
  const handleAvatarUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingAvatar(true);
    try {
      const res = await fileAPI.uploadImage(file);
      if (res?.data?.url) {
        setDummyForm((p) => ({ ...p, avatar: res.data.url }));
        toast.success("Avatar uploaded");
      } else {
        toast.error("Upload failed");
      }
    } catch (err) {
      toast.error(handleApiError(err, "Avatar upload failed"));
    } finally {
      setUploadingAvatar(false);
      e.target.value = "";
    }
  };

  // ── Dummy user CRUD ──────────────────────────────────────────────────────
  const openAddDummy = () => {
    setEditingUser(null);
    setDummyForm(EMPTY_DUMMY);
    setProductQuery("");
    setProductResults([]);
    setShowDummyForm(true);
  };

  const openEditDummy = (u) => {
    setEditingUser(u._id);
    setDummyForm({
      name: u.name,
      avatar: u.avatar || "",
      state: u.state || "Lagos",
      product: u.product || "",
      productName: u.productName || "",
      productImage: u.productImage || "",
      price: u.price || 0,
      quantity: u.quantity || 1,
      purchasedAt: toDatetimeLocal(u.purchasedAt),
    });
    setProductQuery(u.productName || "");
    setProductResults([]);
    setShowDummyForm(true);
  };

  const handleSaveDummy = async () => {
    if (!dummyForm.name?.trim()) {
      toast.error("Name is required");
      return;
    }
    setSubmittingUser(true);
    try {
      const method = editingUser ? "PUT" : "POST";
      const body = {
        name: dummyForm.name,
        avatar: dummyForm.avatar,
        state: dummyForm.state,
        product: dummyForm.product || null,
        quantity: dummyForm.quantity,
        purchasedAt: new Date(dummyForm.purchasedAt).toISOString(),
        ...(editingUser ? { userId: editingUser } : {}),
      };
      const res = await apiCall("/fomo/dummy-user", { method, body });
      if (res.success) {
        toast.success(editingUser ? "User updated" : "User added");
        setShowDummyForm(false);
        fetchSettings();
      } else toast.error(res.message);
    } catch (err) {
      toast.error(handleApiError(err, "Failed"));
    } finally {
      setSubmittingUser(false);
    }
  };

  const handleDeleteDummy = async (userId) => {
    try {
      const res = await apiCall("/fomo/dummy-user", {
        method: "DELETE",
        body: { userId },
      });
      if (res.success) {
        toast.success("User removed");
        fetchSettings();
      }
    } catch (err) {
      toast.error("Failed to delete");
    }
  };

  const toggleDummyActive = async (u) => {
    try {
      const res = await apiCall("/fomo/dummy-user", {
        method: "PUT",
        body: { userId: u._id, isActive: !u.isActive },
      });
      if (res.success) fetchSettings();
    } catch {
      toast.error("Toggle failed");
    }
  };

  if (loading)
    return (
      <div className="flex items-center justify-center h-64">
        <RefreshCw className="w-6 h-6 text-orange-500 animate-spin" />
      </div>
    );

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <Zap className="w-6 h-6 text-orange-500" />
            FOMO Management
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Configure the "someone just bought" social proof widget shown on the
            website
          </p>
        </div>
        <div className="flex items-center gap-3">
          {/* Master toggle */}
          {settings && (
            <button
              onClick={() => update("enabled", !settings.enabled)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium border transition ${settings.enabled ? "bg-green-50 border-green-300 text-green-700" : "bg-gray-50 border-gray-300 text-gray-500"}`}
            >
              {settings.enabled ? (
                <ToggleRight className="w-4 h-4" />
              ) : (
                <ToggleLeft className="w-4 h-4" />
              )}
              {settings.enabled ? "Widget ON" : "Widget OFF"}
            </button>
          )}
          <button
            onClick={handleSaveSettings}
            disabled={saving}
            className="flex items-center gap-2 px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 text-sm disabled:opacity-50"
          >
            {saving ? (
              <RefreshCw className="w-4 h-4 animate-spin" />
            ) : (
              <Save className="w-4 h-4" />
            )}
            Save Settings
          </button>
        </div>
      </div>

      {/* Hint if widget enabled but no data yet */}
      {settings && settings.enabled && !settings.useDummyUsers && (
        <div className="bg-blue-50 border border-blue-200 text-blue-700 text-sm rounded-lg p-3">
          The widget only shows real purchases unless{" "}
          <strong>t("fomo.mixInDummy")</strong> is enabled below. If you have no
          PAID orders yet, the widget will not appear — turn on dummy users to
          test it.
        </div>
      )}

      {/* Tabs */}
      <div className="flex border-b border-gray-200 dark:border-gray-700">
        {[
          { id: "settings", label: "Animation & Display", icon: Settings },
          { id: "users", label: "Dummy Users", icon: Users },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-2 px-5 py-3 text-sm font-medium border-b-2 transition -mb-px ${activeTab === tab.id ? "border-orange-500 text-orange-600" : "border-transparent text-gray-500 hover:text-gray-700"}`}
          >
            <tab.icon className="w-4 h-4" />
            {tab.label}
          </button>
        ))}
      </div>

      {settings && (
        <>
          {/* ── Settings tab ──────────────────────────────────────────── */}
          {activeTab === "settings" && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Position */}
              <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-5 space-y-3">
                <h3 className="font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                  <Eye className="w-4 h-4 text-orange-500" /> Position
                </h3>
                <div className="grid grid-cols-2 gap-2">
                  {POSITIONS.map((pos) => (
                    <button
                      key={pos}
                      onClick={() => update("position", pos)}
                      className={`px-3 py-2 rounded-lg text-sm border transition ${settings.position === pos ? "bg-orange-50 border-orange-400 text-orange-700 font-medium" : "border-gray-200 dark:border-gray-600 text-gray-600 dark:text-gray-400 hover:border-orange-300"}`}
                    >
                      {pos}
                    </button>
                  ))}
                </div>
              </div>

              {/* Animation */}
              <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-5 space-y-3">
                <h3 className="font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                  <Zap className="w-4 h-4 text-orange-500" /> Animation Type
                </h3>
                <div className="flex gap-2">
                  {ANIMATION_TYPES.map((type) => (
                    <button
                      key={type}
                      onClick={() => update("animationType", type)}
                      className={`flex-1 px-3 py-2 rounded-lg text-sm border capitalize transition ${settings.animationType === type ? "bg-orange-50 border-orange-400 text-orange-700 font-medium" : "border-gray-200 dark:border-gray-600 text-gray-600 dark:text-gray-400 hover:border-orange-300"}`}
                    >
                      {type}
                    </button>
                  ))}
                </div>
              </div>

              {/* Timing sliders */}
              {[
                {
                  field: "displayDurationMs",
                  label: "Display Duration",
                  min: 1000,
                  max: 15000,
                  step: 500,
                },
                {
                  field: "pauseBetweenMs",
                  label: "Pause Between",
                  min: 1000,
                  max: 30000,
                  step: 500,
                },
                {
                  field: "fadeInMs",
                  label: "Fade-in Duration",
                  min: 100,
                  max: 2000,
                  step: 100,
                },
                {
                  field: "fadeOutMs",
                  label: "Fade-out Duration",
                  min: 100,
                  max: 2000,
                  step: 100,
                },
              ].map(({ field, label, min, max, step }) => (
                <div
                  key={field}
                  className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-5"
                >
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="font-medium text-gray-900 dark:text-white text-sm flex items-center gap-2">
                      <Clock className="w-4 h-4 text-orange-400" />
                      {label}
                    </h3>
                    <span className="text-sm font-mono text-orange-600">
                      {(settings[field] / 1000).toFixed(1)}s
                    </span>
                  </div>
                  <input
                    type="range"
                    min={min}
                    max={max}
                    step={step}
                    value={settings[field]}
                    onChange={(e) => update(field, Number(e.target.value))}
                    className="w-full accent-orange-500"
                  />
                  <div className="flex justify-between text-xs text-gray-400 mt-1">
                    <span>{min / 1000}s</span>
                    <span>{max / 1000}s</span>
                  </div>
                </div>
              ))}

              {/* Data options */}
              <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-5 space-y-4 md:col-span-2">
                <h3 className="font-semibold text-gray-900 dark:text-white">
                  Data Options
                </h3>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      Mix in Dummy Users
                    </p>
                    <p className="text-xs text-gray-500">
                      Supplement real purchases with the dummy users below
                    </p>
                  </div>
                  <div
                    onClick={() =>
                      update("useDummyUsers", !settings.useDummyUsers)
                    }
                    className={`relative w-11 h-6 rounded-full cursor-pointer transition-colors ${settings.useDummyUsers ? "bg-orange-500" : "bg-gray-300"}`}
                  >
                    <div
                      className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${settings.useDummyUsers ? "translate-x-5" : ""}`}
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Max Real Purchases to Show
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="100"
                    value={settings.maxRealPurchases}
                    onChange={(e) =>
                      update("maxRealPurchases", Number(e.target.value))
                    }
                    className="w-32 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm dark:bg-gray-700 dark:text-white"
                  />
                </div>
              </div>
            </div>
          )}

          {/* ── Dummy users tab ────────────────────────────────────────── */}
          {activeTab === "users" && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Dummy users appear in the FOMO widget with a chosen product,
                  quantity, price, and purchase time. They are NOT linked to
                  real customers.
                </p>
                <button
                  onClick={openAddDummy}
                  className="flex items-center gap-2 px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 text-sm"
                >
                  <Plus className="w-4 h-4" /> Add User
                </button>
              </div>

              {!settings.dummyUsers?.length ? (
                <div className="flex flex-col items-center py-12 text-gray-400">
                  <Users className="w-12 h-12 mb-3 opacity-30" />
                  <p>No dummy users yet.</p>
                </div>
              ) : (
                <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="bg-gray-50 dark:bg-gray-700 border-b border-gray-200 dark:border-gray-600">
                        {[
                          "Avatar",
                          "Name",
                          "State",
                          "Product",
                          "Qty",
                          "Price",
                          "Purchased",
                          "Active",
                          "Actions",
                        ].map((h) => (
                          <th
                            key={h}
                            className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase"
                          >
                            {h}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                      {settings.dummyUsers.map((u) => (
                        <tr
                          key={u._id}
                          className={`hover:bg-gray-50 dark:hover:bg-gray-750 transition-colors ${!u.isActive ? "opacity-50" : ""}`}
                        >
                          <td className="px-4 py-3">
                            {u.avatar ? (
                              <img
                                src={u.avatar}
                                alt={u.name}
                                className="w-8 h-8 rounded-full object-cover"
                              />
                            ) : (
                              <div className="w-8 h-8 rounded-full bg-orange-100 flex items-center justify-center text-orange-700 font-bold text-sm">
                                {u.name?.charAt(0)?.toUpperCase()}
                              </div>
                            )}
                          </td>
                          <td className="px-4 py-3 font-medium text-gray-900 dark:text-white">
                            {u.name}
                          </td>
                          <td className="px-4 py-3 text-gray-500 dark:text-gray-400">
                            {u.state}
                          </td>
                          <td className="px-4 py-3">
                            {u.productName ? (
                              <div className="flex items-center gap-2 max-w-[160px]">
                                {u.productImage ? (
                                  <img
                                    src={u.productImage}
                                    alt=""
                                    className="w-6 h-6 rounded object-cover flex-shrink-0"
                                  />
                                ) : (
                                  <Package className="w-4 h-4 text-gray-400 flex-shrink-0" />
                                )}
                                <span className="truncate text-gray-700 dark:text-gray-300">
                                  {u.productName}
                                </span>
                              </div>
                            ) : (
                              <span className="text-gray-400 italic text-xs">
                                No product
                              </span>
                            )}
                          </td>
                          <td className="px-4 py-3 text-gray-700 dark:text-gray-300">
                            {u.quantity || 1}
                          </td>
                          <td className="px-4 py-3 text-gray-700 dark:text-gray-300 whitespace-nowrap">
                            {u.price ? formatPrice(u.price) : "—"}
                          </td>
                          <td className="px-4 py-3 text-gray-500 dark:text-gray-400 whitespace-nowrap">
                            {timeAgoPreview(u.purchasedAt)}
                          </td>
                          <td className="px-4 py-3">
                            <div
                              onClick={() => toggleDummyActive(u)}
                              className={`relative w-9 h-5 rounded-full cursor-pointer transition-colors ${u.isActive ? "bg-green-500" : "bg-gray-300"}`}
                            >
                              <div
                                className={`absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform ${u.isActive ? "translate-x-4" : ""}`}
                              />
                            </div>
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex gap-2">
                              <button
                                onClick={() => openEditDummy(u)}
                                className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition"
                              >
                                <Edit2 className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={() => handleDeleteDummy(u._id)}
                                className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg transition"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}
        </>
      )}

      {/* Dummy user form modal */}
      {showDummyForm && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl w-full max-w-md p-6 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-gray-900 dark:text-white">
                {editingUser ? "Edit Dummy User" : "Add Dummy User"}
              </h2>
              <button
                onClick={() => setShowDummyForm(false)}
                className="text-gray-400 hover:text-gray-600 text-xl"
              >
                ✕
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={dummyForm.name}
                  onChange={(e) =>
                    setDummyForm((p) => ({ ...p, name: e.target.value }))
                  }
                  placeholder="e.g. Amaka O."
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm dark:bg-gray-700 dark:text-white"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Avatar{" "}
                  <span className="text-gray-400 font-normal">(optional)</span>
                </label>
                <div className="flex items-center gap-3">
                  {/* Preview */}
                  <div className="w-12 h-12 rounded-full bg-gray-100 dark:bg-gray-700 flex items-center justify-center overflow-hidden flex-shrink-0 border border-gray-200 dark:border-gray-600">
                    {dummyForm.avatar ? (
                      <img
                        src={dummyForm.avatar}
                        alt="avatar preview"
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <ImageIcon className="w-5 h-5 text-gray-400" />
                    )}
                  </div>
                  {/* Upload button */}
                  <label className="flex items-center gap-2 px-3 py-2 border border-dashed border-gray-300 dark:border-gray-600 rounded-lg text-sm text-gray-500 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700 flex-1">
                    {uploadingAvatar ? (
                      <RefreshCw className="w-4 h-4 animate-spin" />
                    ) : (
                      <Upload className="w-4 h-4" />
                    )}
                    {uploadingAvatar ? "Uploading…" : "Upload image"}
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={handleAvatarUpload}
                      disabled={uploadingAvatar}
                    />
                  </label>
                  {/* Clear */}
                  {dummyForm.avatar && (
                    <button
                      onClick={() =>
                        setDummyForm((p) => ({ ...p, avatar: "" }))
                      }
                      className="text-gray-400 hover:text-red-500 flex-shrink-0"
                      title="Remove avatar"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  )}
                </div>
                <input
                  type="url"
                  value={dummyForm.avatar}
                  onChange={(e) =>
                    setDummyForm((p) => ({ ...p, avatar: e.target.value }))
                  }
                  placeholder="…or paste an image URL — leave blank for initials"
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm dark:bg-gray-700 dark:text-white mt-2"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  State
                </label>
                <select
                  value={dummyForm.state}
                  onChange={(e) =>
                    setDummyForm((p) => ({ ...p, state: e.target.value }))
                  }
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm dark:bg-gray-700 dark:text-white"
                >
                  {NIGERIA_STATES.map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </select>
              </div>

              {/* ── Product search/select ─────────────────────────────────── */}
              <div ref={dropdownRef} className="relative">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Product{" "}
                  <span className="text-gray-400 font-normal">
                    (shown as "purchased ___")
                  </span>
                </label>

                {dummyForm.product ? (
                  <div className="flex items-center gap-2 border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 bg-gray-50 dark:bg-gray-700">
                    {dummyForm.productImage ? (
                      <img
                        src={dummyForm.productImage}
                        alt=""
                        className="w-8 h-8 rounded object-cover flex-shrink-0"
                      />
                    ) : (
                      <Package className="w-5 h-5 text-gray-400 flex-shrink-0" />
                    )}
                    <span className="flex-1 text-sm text-gray-800 dark:text-gray-200 truncate">
                      {dummyForm.productName}
                    </span>
                    <span className="text-xs font-semibold text-green-600 whitespace-nowrap">
                      {formatPrice(dummyForm.price)}
                    </span>
                    <button
                      onClick={clearSelectedProduct}
                      className="text-gray-400 hover:text-red-500 flex-shrink-0"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ) : (
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                      type="text"
                      value={productQuery}
                      onChange={(e) => handleProductSearch(e.target.value)}
                      onFocus={() => setShowProductDropdown(true)}
                      placeholder={t("products.searchPlaceholder")}
                      className="w-full pl-9 pr-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm dark:bg-gray-700 dark:text-white"
                    />
                    {showProductDropdown &&
                      (productQuery.trim() || searchingProducts) && (
                        <div className="absolute z-10 mt-1 w-full bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg max-h-56 overflow-y-auto">
                          {searchingProducts ? (
                            <div className="flex items-center justify-center py-4 text-gray-400 text-sm gap-2">
                              <RefreshCw className="w-4 h-4 animate-spin" />{" "}
                              Searching…
                            </div>
                          ) : productResults.length === 0 ? (
                            <div className="py-4 text-center text-gray-400 text-sm">
                              {t("common.noData")}
                            </div>
                          ) : (
                            productResults.map((p) => {
                              const price =
                                (p.btcPrice > 0 ? p.btcPrice : p.price) || 0;
                              return (
                                <button
                                  key={p._id}
                                  onClick={() => handleSelectProduct(p)}
                                  className="w-full flex items-center gap-2 px-3 py-2 hover:bg-orange-50 dark:hover:bg-gray-700 text-left"
                                >
                                  {p.image?.[0] ? (
                                    <img
                                      src={p.image[0]}
                                      alt=""
                                      className="w-8 h-8 rounded object-cover flex-shrink-0"
                                    />
                                  ) : (
                                    <Package className="w-5 h-5 text-gray-400 flex-shrink-0" />
                                  )}
                                  <span className="flex-1 text-sm text-gray-800 dark:text-gray-200 truncate">
                                    {p.name}
                                  </span>
                                  <span className="text-xs font-semibold text-green-600 whitespace-nowrap">
                                    {formatPrice(price)}
                                  </span>
                                </button>
                              );
                            })
                          )}
                        </div>
                      )}
                  </div>
                )}
              </div>
              {/* ─────────────────────────────────────────────────────────── */}

              {/* Quantity + Purchase time */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Quantity
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={dummyForm.quantity}
                    onChange={(e) =>
                      setDummyForm((p) => ({
                        ...p,
                        quantity: Math.max(1, parseInt(e.target.value) || 1),
                      }))
                    }
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm dark:bg-gray-700 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Purchase Time{" "}
                    <span className="text-gray-400 font-normal">
                      ({timeAgoPreview(dummyForm.purchasedAt)})
                    </span>
                  </label>
                  <input
                    type="datetime-local"
                    value={dummyForm.purchasedAt}
                    max={toDatetimeLocal(new Date())}
                    onChange={(e) =>
                      setDummyForm((p) => ({
                        ...p,
                        purchasedAt: e.target.value,
                      }))
                    }
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm dark:bg-gray-700 dark:text-white"
                  />
                </div>
              </div>
              <p className="text-xs text-gray-400">
                The widget shows this as "x secs/minutes/hours/days/months ago"
                — capped at 11 months.
              </p>
            </div>
            <div className="flex justify-end gap-3 mt-5">
              <button
                onClick={() => setShowDummyForm(false)}
                className="px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg text-sm"
              >
                {t("common.cancel")}
              </button>
              <button
                onClick={handleSaveDummy}
                disabled={submittingUser}
                className="px-5 py-2 bg-orange-500 text-white rounded-lg text-sm hover:bg-orange-600 disabled:opacity-50 flex items-center gap-2"
              >
                {submittingUser && (
                  <RefreshCw className="w-3 h-3 animate-spin" />
                )}
                {editingUser ? "Save Changes" : "Add User"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default FomoManagement;
