// admin/src/pages/content/HomeContentManagement.jsx
//
// "Site Content" — a generic, growing home for content blocks that are
// country-scoped and translatable but don't have a bespoke admin page of
// their own: the header preheader banner, footer contact details, the
// trust-badge strip, and customer testimonials today; more page sections
// will be added here over time using the same pattern, hence the generic
// naming (nav.siteContent) rather than anything home-page-specific.
import React, { useState, useEffect } from "react";
import { Heart, Plus, Edit2, Trash2, RefreshCw, Star, Megaphone, MapPin, Save } from "lucide-react";
import toast from "react-hot-toast";
import { apiCall, handleApiError } from "../../utils/api";
import { useAdminTranslation } from "../../hooks/useAdminTranslation.js";
import { useAdminCountry } from "../../contexts/AdminCountryContext.jsx";
import InlineTranslateFields from "../../components/translations/InlineTranslateFields";

const ICON_OPTIONS = ["truck", "repeat", "help-circle", "package", "shield", "star"];

const EMPTY_BADGE = { type: "trustBadge", icon: "truck", title: "", description: "", order: 0, isActive: true, countryCode: "NG" };
const EMPTY_TESTIMONIAL = {
  type: "testimonial", customerName: "", customerLocation: "", customerInitials: "",
  rating: 5, quote: "", badge: "", icon: "shield", order: 0, isActive: true, countryCode: "NG",
};
const EMPTY_HEADER = { type: "header", message: "", isActive: true, countryCode: "NG" };
const EMPTY_FOOTER = {
  type: "footer", contactAddress: "", contactPhone: "", contactEmail: "", contactWhatsapp: "",
  isActive: true, countryCode: "NG",
};

const TABS = [
  { id: "header", label: "Header", icon: Megaphone },
  { id: "footer", label: "Footer", icon: MapPin },
  { id: "trustBadge", label: "Trust Badges", icon: Heart },
  { id: "testimonial", label: "Testimonials", icon: Star },
];

const SINGLETON_TYPES = ["header", "footer"];

const HomeContentManagement = () => {
  const { t } = useAdminTranslation();
  const { isGlobalAdmin, countryScope, allCountries } = useAdminCountry();
  const [tab, setTab] = useState("header");
  const [blocks, setBlocks] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(EMPTY_HEADER);
  const [submitting, setSubmitting] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [countryFilter, setCountryFilter] = useState("ALL");
  // Which market's singleton (header/footer) is being edited in-place —
  // defaults to the admin's own scope, or NG for GLOBAL admins.
  const [singletonCountry, setSingletonCountry] = useState(countryScope || "NG");

  const isSingleton = SINGLETON_TYPES.includes(tab);
  const emptyForTab = { trustBadge: EMPTY_BADGE, testimonial: EMPTY_TESTIMONIAL, header: EMPTY_HEADER, footer: EMPTY_FOOTER }[tab];

  useEffect(() => {
    if (!isGlobalAdmin && countryScope) setSingletonCountry(countryScope);
  }, [isGlobalAdmin, countryScope]);

  useEffect(() => { fetchBlocks(); }, [tab, singletonCountry]);

  const fetchBlocks = async () => {
    setLoading(true);
    try {
      const countryParam = isSingleton && isGlobalAdmin ? `&countryCode=${singletonCountry}` : "";
      const res = await apiCall(`/home-content/admin?type=${tab}${countryParam}`);
      if (res.success) setBlocks(res.data || []);
    } catch (err) {
      toast.error(handleApiError(err, "Failed to load content"));
    } finally {
      setLoading(false);
    }
  };

  const openCreate = () => {
    setEditing(null);
    setForm({ ...emptyForTab, countryCode: countryScope || (countryFilter !== "ALL" ? countryFilter : "NG") });
    setShowForm(true);
  };
  const openEdit = (b) => { setEditing(b); setForm({ ...emptyForTab, ...b }); setShowForm(true); };

  const handleSubmit = async () => {
    if (tab === "trustBadge" && !form.title?.trim()) { toast.error("Title is required"); return; }
    if (tab === "testimonial" && (!form.customerName?.trim() || !form.quote?.trim())) {
      toast.error("Customer name and quote are required");
      return;
    }
    if (tab === "header" && !form.message?.trim()) { toast.error("Message is required"); return; }
    if (tab === "footer" && !form.contactAddress?.trim() && !form.contactEmail?.trim() && !form.contactPhone?.trim()) {
      toast.error("Add at least an address, phone, or email");
      return;
    }
    setSubmitting(true);
    try {
      const res = editing
        ? await apiCall("/home-content/update", { method: "PUT", body: { ...form, _id: editing._id } })
        : await apiCall("/home-content/add", { method: "POST", body: form });
      if (res.success) {
        toast.success(editing ? "Updated" : "Created");
        setShowForm(false);
        fetchBlocks();
      } else toast.error(res.message || "Failed");
    } catch (err) {
      toast.error(handleApiError(err, "Save failed"));
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      const res = await apiCall("/home-content/delete", { method: "DELETE", body: { _id: deleteTarget._id } });
      if (res.success) { toast.success("Deleted"); setDeleteTarget(null); fetchBlocks(); }
    } catch { toast.error("Delete failed"); }
  };

  const toggleActive = async (b) => {
    try {
      const res = await apiCall("/home-content/update", { method: "PUT", body: { _id: b._id, isActive: !b.isActive } });
      if (res.success) fetchBlocks();
    } catch { toast.error("Toggle failed"); }
  };

  // ── Singleton save (header/footer) — edit in place, no modal ───────────
  const [singletonForm, setSingletonForm] = useState(null);
  const [singletonSaving, setSingletonSaving] = useState(false);
  const singletonDoc = blocks[0] || null;

  useEffect(() => {
    if (!isSingleton) return;
    setSingletonForm(singletonDoc ? { ...emptyForTab, ...singletonDoc } : { ...emptyForTab, countryCode: singletonCountry });
  }, [tab, blocks, singletonCountry]);

  const saveSingleton = async () => {
    if (!singletonForm) return;
    setSingletonSaving(true);
    try {
      const payload = { ...singletonForm, countryCode: singletonCountry };
      const res = singletonDoc
        ? await apiCall("/home-content/update", { method: "PUT", body: { ...payload, _id: singletonDoc._id } })
        : await apiCall("/home-content/add", { method: "POST", body: payload });
      if (res.success) {
        toast.success("Saved");
        fetchBlocks();
      } else toast.error(res.message || "Save failed");
    } catch (err) {
      toast.error(handleApiError(err, "Save failed"));
    } finally {
      setSingletonSaving(false);
    }
  };

  const visible = countryFilter === "ALL" ? blocks : blocks.filter((b) => b.countryCode === countryFilter);

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <Heart className="w-6 h-6 text-rose-600" />
            Site Content
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Country-scoped, translatable content blocks used across the site — header banner, footer contact
            details, trust badges, testimonials, and more sections as they're added.
          </p>
        </div>
        {!isSingleton && (
          <div className="flex items-center gap-2">
            {isGlobalAdmin ? (
              <select value={countryFilter} onChange={(e) => setCountryFilter(e.target.value)}
                className="border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-sm bg-white dark:bg-gray-800">
                <option value="ALL">All markets</option>
                {allCountries.map((c) => (
                  <option key={c.code} value={c.code}>{c.flagEmoji ? `${c.flagEmoji} ` : ""}{c.name}</option>
                ))}
              </select>
            ) : (
              <span className="text-xs font-semibold text-rose-700 bg-rose-50 border border-rose-200 rounded-lg px-3 py-2">
                {countryScope} only
              </span>
            )}
            <button onClick={fetchBlocks} className="p-2 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50">
              <RefreshCw className="w-4 h-4 text-gray-500" />
            </button>
            <button onClick={openCreate} className="flex items-center gap-2 px-4 py-2 bg-rose-600 text-white rounded-lg hover:bg-rose-700 text-sm">
              <Plus className="w-4 h-4" /> Add
            </button>
          </div>
        )}
      </div>

      {/* Tabs */}
      <div className="flex border-b border-gray-200 dark:border-gray-700">
        {TABS.map((tb) => (
          <button key={tb.id} onClick={() => setTab(tb.id)}
            className={`flex items-center gap-1.5 px-4 py-2 text-sm font-medium border-b-2 -mb-px ${tab === tb.id ? "border-rose-600 text-rose-600" : "border-transparent text-gray-500 hover:text-gray-700"}`}>
            <tb.icon className="w-4 h-4" />
            {tb.label}
          </button>
        ))}
      </div>

      {/* ── Header / Footer: singleton in-place editor ──────────────────── */}
      {isSingleton && (
        <div className="max-w-2xl">
          <div className="flex items-center gap-3 mb-4">
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Market</label>
            {isGlobalAdmin ? (
              <select value={singletonCountry} onChange={(e) => setSingletonCountry(e.target.value)}
                className="border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-1.5 text-sm bg-white dark:bg-gray-800">
                {allCountries.map((c) => (
                  <option key={c.code} value={c.code}>{c.flagEmoji ? `${c.flagEmoji} ` : ""}{c.name} ({c.code})</option>
                ))}
              </select>
            ) : (
              <span className="text-xs font-semibold text-rose-700 bg-rose-50 border border-rose-200 rounded-lg px-3 py-1.5">
                {countryScope} only
              </span>
            )}
            {singletonCountry !== "NG" && (
              <span className="text-xs text-gray-400">
                Falls back to HQ's (Nigeria's) {tab === "header" ? "banner" : "contact details"} until this market has its own.
              </span>
            )}
          </div>

          {loading || !singletonForm ? (
            <div className="flex justify-center py-12"><RefreshCw className="w-6 h-6 text-rose-500 animate-spin" /></div>
          ) : (
            <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-5 space-y-4">
              {tab === "header" ? (
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Preheader banner message
                  </label>
                  <input type="text" value={singletonForm.message}
                    onChange={(e) => setSingletonForm((p) => ({ ...p, message: e.target.value }))}
                    placeholder="Free shipping on orders over ₦100,000 within Lagos!"
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm dark:bg-gray-700 dark:text-white" />
                </div>
              ) : (
                <>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Address</label>
                    <input type="text" value={singletonForm.contactAddress}
                      onChange={(e) => setSingletonForm((p) => ({ ...p, contactAddress: e.target.value }))}
                      placeholder="3 Kaffi Street, Alausa, Ikeja, Lagos, Nigeria"
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm dark:bg-gray-700 dark:text-white" />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Phone</label>
                      <input type="text" value={singletonForm.contactPhone}
                        onChange={(e) => setSingletonForm((p) => ({ ...p, contactPhone: e.target.value }))}
                        placeholder="+234 805 242 3935"
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm dark:bg-gray-700 dark:text-white" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Email</label>
                      <input type="text" value={singletonForm.contactEmail}
                        onChange={(e) => setSingletonForm((p) => ({ ...p, contactEmail: e.target.value }))}
                        placeholder="customercare@i-coffee.ng"
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm dark:bg-gray-700 dark:text-white" />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">WhatsApp</label>
                    <input type="text" value={singletonForm.contactWhatsapp}
                      onChange={(e) => setSingletonForm((p) => ({ ...p, contactWhatsapp: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm dark:bg-gray-700 dark:text-white" />
                  </div>
                </>
              )}

              {singletonDoc && (
                <InlineTranslateFields
                  entityType="homeContentBlock"
                  entity={singletonDoc}
                  fields={tab === "header" ? ["message"] : ["contactAddress"]}
                  fieldLabels={tab === "header" ? { message: "Preheader message" } : { contactAddress: "Address" }}
                />
              )}

              <div className="pt-2">
                <button onClick={saveSingleton} disabled={singletonSaving}
                  className="flex items-center gap-2 px-5 py-2 bg-rose-600 text-white rounded-lg text-sm hover:bg-rose-700 disabled:opacity-50">
                  {singletonSaving ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                  Save
                </button>
                {!singletonDoc && (
                  <p className="text-xs text-gray-400 mt-2">
                    Not saved yet for {singletonCountry} — the storefront is currently showing HQ's (Nigeria's) content for this market.
                  </p>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── Trust badges / Testimonials: list + modal ───────────────────── */}
      {!isSingleton && (
        loading ? (
          <div className="flex justify-center py-12"><RefreshCw className="w-6 h-6 text-rose-500 animate-spin" /></div>
        ) : visible.length === 0 ? (
          <div className="border border-dashed border-gray-200 dark:border-gray-700 rounded-xl p-8 text-center text-gray-400 text-sm">
            Nothing here yet for this market — the storefront falls back to HQ's (Nigeria's) content until you add some.
            <button onClick={openCreate} className="block mx-auto mt-2 text-rose-500 hover:underline text-xs">+ Add one</button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {visible.map((b) => (
              <div key={b._id} className={`bg-white dark:bg-gray-800 rounded-xl border p-4 ${b.isActive ? "border-gray-200 dark:border-gray-700" : "border-dashed border-gray-300 opacity-60"}`}>
                <div className="flex items-start justify-between mb-2">
                  <span className="text-xs font-semibold bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 px-2 py-0.5 rounded-full">
                    {b.countryCode || "NG"}
                  </span>
                  <button onClick={() => toggleActive(b)} className={`text-xs px-2 py-0.5 rounded-full ${b.isActive ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"}`}>
                    {b.isActive ? "Active" : "Inactive"}
                  </button>
                </div>
                {tab === "trustBadge" ? (
                  <>
                    <h3 className="font-semibold text-gray-900 dark:text-white text-sm">{b.title}</h3>
                    <p className="text-xs text-gray-500 mt-0.5">{b.description}</p>
                  </>
                ) : (
                  <>
                    <div className="flex items-center gap-1 mb-1">
                      {[1, 2, 3, 4, 5].map((n) => (
                        <Star key={n} size={12} className={n <= (b.rating || 5) ? "fill-amber-400 text-amber-400" : "text-gray-200"} />
                      ))}
                    </div>
                    <p className="text-xs text-gray-600 italic line-clamp-3">"{b.quote}"</p>
                    <p className="text-xs font-semibold text-gray-800 mt-2">{b.customerName} — {b.customerLocation}</p>
                  </>
                )}
                <div className="flex gap-2 mt-3">
                  <button onClick={() => openEdit(b)} className="flex items-center gap-1 px-3 py-1.5 text-xs bg-blue-50 text-blue-700 rounded-lg hover:bg-blue-100">
                    <Edit2 className="w-3 h-3" />Edit
                  </button>
                  <button onClick={() => setDeleteTarget(b)} className="flex items-center gap-1 px-3 py-1.5 text-xs bg-red-50 text-red-600 rounded-lg hover:bg-red-100">
                    <Trash2 className="w-3 h-3" />Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        )
      )}

      {/* Form modal (trust badge / testimonial only) */}
      {showForm && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-5 border-b border-gray-200 dark:border-gray-700">
              <h2 className="text-lg font-bold text-gray-900 dark:text-white">
                {editing ? "Edit" : "Add"} {tab === "trustBadge" ? "Trust Badge" : "Testimonial"}
              </h2>
              <button onClick={() => setShowForm(false)} className="text-gray-400 hover:text-gray-600 text-xl">✕</button>
            </div>
            <div className="p-5 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Market</label>
                {isGlobalAdmin ? (
                  <select value={form.countryCode} onChange={(e) => setForm((p) => ({ ...p, countryCode: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm dark:bg-gray-700 dark:text-white">
                    {allCountries.map((c) => (
                      <option key={c.code} value={c.code}>{c.flagEmoji ? `${c.flagEmoji} ` : ""}{c.name} ({c.code})</option>
                    ))}
                  </select>
                ) : (
                  <div className="px-3 py-2 border border-gray-200 dark:border-gray-700 rounded-lg text-sm bg-gray-50 dark:bg-gray-700 text-gray-600 dark:text-gray-300">
                    {countryScope} (your assigned market)
                  </div>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Icon</label>
                <select value={form.icon} onChange={(e) => setForm((p) => ({ ...p, icon: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm dark:bg-gray-700 dark:text-white">
                  {ICON_OPTIONS.map((i) => <option key={i} value={i}>{i}</option>)}
                </select>
              </div>

              {tab === "trustBadge" ? (
                <>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Title <span className="text-red-500">*</span></label>
                    <input type="text" value={form.title} onChange={(e) => setForm((p) => ({ ...p, title: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm dark:bg-gray-700 dark:text-white" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t("common.description")}</label>
                    <input type="text" value={form.description} onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm dark:bg-gray-700 dark:text-white" />
                  </div>
                  {editing && (
                    <InlineTranslateFields
                      entityType="homeContentBlock"
                      entity={editing}
                      fields={["title", "description"]}
                      fieldLabels={{ title: "Title", description: t("common.description") }}
                    />
                  )}
                </>
              ) : (
                <>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Customer name <span className="text-red-500">*</span></label>
                      <input type="text" value={form.customerName} onChange={(e) => setForm((p) => ({ ...p, customerName: e.target.value }))}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm dark:bg-gray-700 dark:text-white" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Location</label>
                      <input type="text" value={form.customerLocation} onChange={(e) => setForm((p) => ({ ...p, customerLocation: e.target.value }))}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm dark:bg-gray-700 dark:text-white" />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Quote <span className="text-red-500">*</span></label>
                    <textarea rows={3} value={form.quote} onChange={(e) => setForm((p) => ({ ...p, quote: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm dark:bg-gray-700 dark:text-white resize-none" />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Badge label</label>
                      <input type="text" value={form.badge} onChange={(e) => setForm((p) => ({ ...p, badge: e.target.value }))}
                        placeholder="e.g. Fast delivery"
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm dark:bg-gray-700 dark:text-white" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Rating</label>
                      <select value={form.rating} onChange={(e) => setForm((p) => ({ ...p, rating: Number(e.target.value) }))}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm dark:bg-gray-700 dark:text-white">
                        {[5, 4, 3, 2, 1].map((n) => <option key={n} value={n}>{n} star{n !== 1 ? "s" : ""}</option>)}
                      </select>
                    </div>
                  </div>
                  {editing && (
                    <InlineTranslateFields
                      entityType="homeContentBlock"
                      entity={editing}
                      fields={["quote", "badge"]}
                      fieldLabels={{ quote: "Quote", badge: "Badge label" }}
                    />
                  )}
                </>
              )}

              <label className="flex items-center gap-2 cursor-pointer select-none">
                <div onClick={() => setForm((p) => ({ ...p, isActive: !p.isActive }))}
                  className={`relative w-11 h-6 rounded-full transition-colors ${form.isActive ? "bg-green-500" : "bg-gray-300"}`}>
                  <div className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${form.isActive ? "translate-x-5" : ""}`} />
                </div>
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">{t("common.active")}</span>
              </label>
            </div>
            <div className="flex justify-end gap-3 p-5 pt-0">
              <button onClick={() => setShowForm(false)} className="px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg text-sm">{t("common.cancel")}</button>
              <button onClick={handleSubmit} disabled={submitting}
                className="px-5 py-2 bg-rose-600 text-white rounded-lg text-sm hover:bg-rose-700 disabled:opacity-50 flex items-center gap-2">
                {submitting && <RefreshCw className="w-3 h-3 animate-spin" />}
                {editing ? "Save Changes" : "Create"}
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
            <h3 className="text-lg font-bold mb-2 dark:text-white">Delete this item?</h3>
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

export default HomeContentManagement;
