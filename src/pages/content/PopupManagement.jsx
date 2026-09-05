// admin/src/pages/content/PopupManagement.jsx
import React, { useState, useEffect } from "react";
import { MessageSquareText, Plus, Edit2, Trash2, RefreshCw, Image as ImageIcon, Clock } from "lucide-react";
import toast from "react-hot-toast";
import { apiCall, handleApiError, fileAPI } from "../../utils/api";
import { useAdminTranslation } from "../../hooks/useAdminTranslation.js";
import { useAdminCountry } from "../../contexts/AdminCountryContext.jsx";
import InlineTranslateFields from "../../components/translations/InlineTranslateFields";

const EMPTY_FORM = {
  title: "",
  bodyText: "",
  image: "",
  ctaText: "",
  ctaLink: "",
  displayPages: ["all"],
  displaySeconds: 0,
  delaySeconds: 0,
  showOncePerSession: true,
  startDate: "",
  endDate: "",
  isActive: true,
  priority: 0,
  countryCode: "NG",
};

const PopupManagement = () => {
  const { t } = useAdminTranslation();
  const { isGlobalAdmin, countryScope, allCountries } = useAdminCountry();

  const PAGE_OPTIONS = [
    { value: "all", label: t("popups.pageAll") },
    { value: "home", label: t("popups.pageHome") },
    { value: "shop", label: t("popups.pageShop") },
    { value: "category", label: t("popups.pageCategory") },
    { value: "product", label: t("popups.pageProduct") },
    { value: "cart", label: t("popups.pageCart") },
    { value: "checkout", label: t("popups.pageCheckout") },
    { value: "blog", label: t("popups.pageBlog") },
  ];

  const [popups, setPopups] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [submitting, setSubmitting] = useState(false);
  const [uploadingImg, setUploadingImg] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [countryFilter, setCountryFilter] = useState("ALL");

  useEffect(() => {
    fetchPopups();
  }, []);

  const fetchPopups = async () => {
    setLoading(true);
    try {
      const res = await apiCall("/popup/get");
      if (res.success) setPopups(res.data || []);
    } catch (err) {
      toast.error(handleApiError(err, t("popups.failedToLoad")));
    } finally {
      setLoading(false);
    }
  };

  const openCreate = () => {
    setEditing(null);
    setForm({
      ...EMPTY_FORM,
      countryCode: countryScope || (countryFilter !== "ALL" ? countryFilter : "NG"),
    });
    setShowForm(true);
  };

  const openEdit = (p) => {
    setEditing(p);
    setForm({
      ...EMPTY_FORM,
      ...p,
      startDate: p.startDate ? p.startDate.slice(0, 10) : "",
      endDate: p.endDate ? p.endDate.slice(0, 10) : "",
      displayPages: p.displayPages?.length ? p.displayPages : ["all"],
    });
    setShowForm(true);
  };

  const handleImageUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingImg(true);
    try {
      const res = await fileAPI.uploadImage(file);
      if (res?.data?.url) {
        setForm((p) => ({ ...p, image: res.data.url }));
        toast.success(t("content.imageUploaded"));
      }
    } catch {
      toast.error(t("content.uploadFailed"));
    } finally {
      setUploadingImg(false);
    }
  };

  const togglePage = (value) => {
    setForm((p) => {
      if (value === "all") return { ...p, displayPages: ["all"] };
      const withoutAll = p.displayPages.filter((v) => v !== "all");
      const has = withoutAll.includes(value);
      const next = has ? withoutAll.filter((v) => v !== value) : [...withoutAll, value];
      return { ...p, displayPages: next.length ? next : ["all"] };
    });
  };

  const handleSubmit = async () => {
    if (!form.title?.trim()) {
      toast.error(t("popups.titleRequired"));
      return;
    }
    setSubmitting(true);
    try {
      const payload = {
        ...form,
        displaySeconds: Number(form.displaySeconds) || 0,
        delaySeconds: Number(form.delaySeconds) || 0,
        priority: Number(form.priority) || 0,
        startDate: form.startDate || null,
        endDate: form.endDate || null,
      };
      const res = editing
        ? await apiCall("/popup/update", { method: "PUT", body: { ...payload, _id: editing._id } })
        : await apiCall("/popup/add", { method: "POST", body: payload });
      if (res.success) {
        toast.success(editing ? t("popups.updated") : t("popups.created"));
        setShowForm(false);
        fetchPopups();
      } else {
        toast.error(res.message || t("content.failed"));
      }
    } catch (err) {
      toast.error(handleApiError(err, t("content.saveFailed")));
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      const res = await apiCall("/popup/delete", { method: "DELETE", body: { _id: deleteTarget._id } });
      if (res.success) {
        toast.success(t("popups.deleted"));
        setDeleteTarget(null);
        fetchPopups();
      }
    } catch {
      toast.error(t("content.deleteFailed"));
    }
  };

  const pageLabel = (pages) =>
    (pages || ["all"])
      .map((v) => PAGE_OPTIONS.find((o) => o.value === v)?.label || v)
      .join(", ");

  const visiblePopups =
    countryFilter === "ALL" ? popups : popups.filter((p) => p.countryCode === countryFilter);

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <MessageSquareText className="w-6 h-6 text-indigo-600" />
            {t("popups.title")}
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{t("popups.subtitle")}</p>
        </div>
        <div className="flex items-center gap-2">
          {isGlobalAdmin ? (
            <select
              value={countryFilter}
              onChange={(e) => setCountryFilter(e.target.value)}
              className="border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-sm bg-white dark:bg-gray-800"
            >
              <option value="ALL">{t("content.allMarkets")}</option>
              {allCountries.map((c) => (
                <option key={c.code} value={c.code}>{c.name}</option>
              ))}
            </select>
          ) : (
            <span className="text-xs font-semibold text-indigo-700 bg-indigo-50 border border-indigo-200 rounded-lg px-3 py-2">
              {t("dashboard.scopeCountry", { country: countryScope })}
            </span>
          )}
          <button onClick={fetchPopups} className="p-2 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50">
            <RefreshCw className="w-4 h-4 text-gray-500" />
          </button>
          <button onClick={openCreate} className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 text-sm">
            <Plus className="w-4 h-4" />
            {t("popups.add")}
          </button>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <RefreshCw className="w-6 h-6 text-indigo-500 animate-spin" />
        </div>
      ) : visiblePopups.length === 0 ? (
        <div className="text-center py-16 border border-dashed border-gray-300 dark:border-gray-700 rounded-xl">
          <MessageSquareText className="w-10 h-10 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500 dark:text-gray-400">{t("popups.none")}</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {visiblePopups.map((p) => (
            <div key={p._id} className="border border-gray-200 dark:border-gray-700 rounded-xl overflow-hidden bg-white dark:bg-gray-800">
              {p.image ? (
                <img src={p.image} alt={p.title} className="w-full h-32 object-cover" />
              ) : (
                <div className="w-full h-16 bg-gray-100 dark:bg-gray-900 flex items-center justify-center">
                  <ImageIcon className="w-6 h-6 text-gray-300" />
                </div>
              )}
              <div className="p-4 space-y-2">
                <div className="flex items-start justify-between gap-2">
                  <h3 className="font-semibold text-gray-900 dark:text-white text-sm">{p.title}</h3>
                  <span className={`shrink-0 text-[10px] font-semibold px-2 py-0.5 rounded-full ${p.isActive ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"}`}>
                    {p.isActive ? t("common.active") : t("common.inactive")}
                  </span>
                </div>
                {p.bodyText && (
                  <p className="text-xs text-gray-500 dark:text-gray-400 line-clamp-2">{p.bodyText}</p>
                )}
                <div className="flex flex-wrap gap-1">
                  {(p.displayPages || ["all"]).map((pg) => (
                    <span key={pg} className="text-[10px] px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700 dark:bg-indigo-900/40 dark:text-indigo-300">
                      {PAGE_OPTIONS.find((o) => o.value === pg)?.label || pg}
                    </span>
                  ))}
                </div>
                <div className="flex items-center gap-1 text-[11px] text-gray-400">
                  <Clock className="w-3 h-3" />
                  {p.displaySeconds > 0
                    ? t("popups.durationSeconds", { seconds: p.displaySeconds })
                    : t("popups.durationUntilDismissed")}
                </div>
                <div className="flex items-center gap-2 pt-2">
                  <button onClick={() => openEdit(p)} className="flex items-center gap-1 px-3 py-1.5 text-xs bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100">
                    <Edit2 className="w-3 h-3" />{t("common.edit")}
                  </button>
                  <button onClick={() => setDeleteTarget(p)} className="flex items-center gap-1 px-3 py-1.5 text-xs bg-red-50 text-red-600 rounded-lg hover:bg-red-100">
                    <Trash2 className="w-3 h-3" />{t("common.delete")}
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Form modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-5 border-b border-gray-200 dark:border-gray-700">
              <h2 className="text-lg font-bold text-gray-900 dark:text-white">
                {editing ? t("popups.edit") : t("popups.add")}
              </h2>
              <button onClick={() => setShowForm(false)} className="text-gray-400 hover:text-gray-600 text-xl">✕</button>
            </div>
            <div className="p-5 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  {t("common.title")} <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={form.title}
                  onChange={(e) => setForm((p) => ({ ...p, title: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm dark:bg-gray-700 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  {t("popups.bodyText")} <span className="text-gray-400 font-normal">({t("common.optional")})</span>
                </label>
                <textarea
                  rows={3}
                  value={form.bodyText}
                  onChange={(e) => setForm((p) => ({ ...p, bodyText: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm dark:bg-gray-700 dark:text-white"
                />
              </div>

              {/* Image — optional */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  {t("popups.backgroundImage")} <span className="text-gray-400 font-normal">({t("common.optional")})</span>
                </label>
                {form.image && <img src={form.image} alt="preview" className="w-full h-28 object-cover rounded-lg mb-2 border" />}
                <input
                  type="text"
                  placeholder={t("content.pasteImageUrl")}
                  value={form.image}
                  onChange={(e) => setForm((p) => ({ ...p, image: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm dark:bg-gray-700 dark:text-white mb-2"
                />
                <label className="flex items-center gap-2 px-3 py-2 border border-dashed border-gray-300 dark:border-gray-600 rounded-lg text-sm text-gray-500 cursor-pointer hover:bg-gray-50">
                  {uploadingImg ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                  {uploadingImg ? t("content.uploading") : t("content.uploadImage")}
                  <input type="file" accept="image/*" className="hidden" onChange={handleImageUpload} disabled={uploadingImg} />
                </label>
              </div>

              {/* CTA — optional */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    {t("popups.ctaText")} <span className="text-gray-400 font-normal">({t("common.optional")})</span>
                  </label>
                  <input
                    type="text"
                    value={form.ctaText}
                    onChange={(e) => setForm((p) => ({ ...p, ctaText: e.target.value }))}
                    placeholder={t("content.shopNow")}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm dark:bg-gray-700 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    {t("popups.ctaLink")} <span className="text-gray-400 font-normal">({t("common.optional")})</span>
                  </label>
                  <input
                    type="text"
                    value={form.ctaLink}
                    onChange={(e) => setForm((p) => ({ ...p, ctaLink: e.target.value }))}
                    placeholder="/shop"
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm dark:bg-gray-700 dark:text-white"
                  />
                </div>
              </div>

              {/* Pages */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  {t("popups.pagesLabel")}
                </label>
                <div className="flex flex-wrap gap-2">
                  {PAGE_OPTIONS.map((opt) => {
                    const active = form.displayPages.includes(opt.value);
                    return (
                      <button
                        type="button"
                        key={opt.value}
                        onClick={() => togglePage(opt.value)}
                        className={`text-xs px-3 py-1.5 rounded-full border ${
                          active
                            ? "bg-indigo-600 border-indigo-600 text-white"
                            : "border-gray-300 dark:border-gray-600 text-gray-600 dark:text-gray-300 hover:bg-gray-50"
                        }`}
                      >
                        {opt.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Duration / delay */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    {t("popups.displaySeconds")}
                  </label>
                  <input
                    type="number"
                    min={0}
                    value={form.displaySeconds}
                    onChange={(e) => setForm((p) => ({ ...p, displaySeconds: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm dark:bg-gray-700 dark:text-white"
                  />
                  <p className="text-[11px] text-gray-400 mt-1">{t("popups.displaySecondsHint")}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    {t("popups.delaySeconds")}
                  </label>
                  <input
                    type="number"
                    min={0}
                    value={form.delaySeconds}
                    onChange={(e) => setForm((p) => ({ ...p, delaySeconds: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm dark:bg-gray-700 dark:text-white"
                  />
                </div>
              </div>

              {/* Schedule */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    {t("popups.startDate")} <span className="text-gray-400 font-normal">({t("common.optional")})</span>
                  </label>
                  <input
                    type="date"
                    value={form.startDate}
                    onChange={(e) => setForm((p) => ({ ...p, startDate: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm dark:bg-gray-700 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    {t("popups.endDate")} <span className="text-gray-400 font-normal">({t("common.optional")})</span>
                  </label>
                  <input
                    type="date"
                    value={form.endDate}
                    onChange={(e) => setForm((p) => ({ ...p, endDate: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm dark:bg-gray-700 dark:text-white"
                  />
                </div>
              </div>

              {/* Market */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t("content.marketLabel")}</label>
                {isGlobalAdmin ? (
                  <select
                    value={form.countryCode}
                    onChange={(e) => setForm((p) => ({ ...p, countryCode: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm dark:bg-gray-700 dark:text-white"
                  >
                    {allCountries.map((c) => (
                      <option key={c.code} value={c.code}>{c.name} ({c.code})</option>
                    ))}
                  </select>
                ) : (
                  <div className="px-3 py-2 border border-gray-200 dark:border-gray-700 rounded-lg text-sm bg-gray-50 dark:bg-gray-700 text-gray-600 dark:text-gray-300">
                    {t("content.yourAssignedMarket", { country: countryScope })}
                  </div>
                )}
              </div>

              {editing && (
                <InlineTranslateFields
                  entityType="popup"
                  entity={editing}
                  fields={["title", "bodyText", "ctaText"]}
                  fieldLabels={{
                    title: t("common.title"),
                    bodyText: t("popups.bodyText"),
                    ctaText: t("popups.ctaText"),
                  }}
                />
              )}

              <div className="flex items-center justify-between pt-1">
                <label className="flex items-center gap-2 cursor-pointer select-none">
                  <div
                    onClick={() => setForm((p) => ({ ...p, showOncePerSession: !p.showOncePerSession }))}
                    className={`relative w-11 h-6 rounded-full transition-colors ${form.showOncePerSession ? "bg-indigo-500" : "bg-gray-300"}`}
                  >
                    <div className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${form.showOncePerSession ? "translate-x-5" : ""}`} />
                  </div>
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">{t("popups.oncePerSession")}</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer select-none">
                  <div
                    onClick={() => setForm((p) => ({ ...p, isActive: !p.isActive }))}
                    className={`relative w-11 h-6 rounded-full transition-colors ${form.isActive ? "bg-green-500" : "bg-gray-300"}`}
                  >
                    <div className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${form.isActive ? "translate-x-5" : ""}`} />
                  </div>
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">{t("common.active")}</span>
                </label>
              </div>
            </div>
            <div className="flex justify-end gap-3 p-5 pt-0">
              <button onClick={() => setShowForm(false)} className="px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg text-sm">
                {t("common.cancel")}
              </button>
              <button
                onClick={handleSubmit}
                disabled={submitting}
                className="px-5 py-2 bg-indigo-600 text-white rounded-lg text-sm hover:bg-indigo-700 disabled:opacity-50 flex items-center gap-2"
              >
                {submitting && <RefreshCw className="w-3 h-3 animate-spin" />}
                {editing ? t("content.saveChanges") : t("popups.create")}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete confirm */}
      {deleteTarget && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 max-w-sm w-full text-center shadow-xl">
            <Trash2 className="w-10 h-10 text-red-500 mx-auto mb-3" />
            <h3 className="text-lg font-bold mb-2 dark:text-white">{t("popups.delete")}</h3>
            <p className="text-sm text-gray-500 mb-5">{t("popups.deleteConfirm", { title: deleteTarget.title })}</p>
            <div className="flex gap-3 justify-center">
              <button onClick={() => setDeleteTarget(null)} className="px-4 py-2 border rounded-lg text-sm">{t("common.cancel")}</button>
              <button onClick={handleDelete} className="px-4 py-2 bg-red-600 text-white rounded-lg text-sm hover:bg-red-700">{t("common.delete")}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PopupManagement;
