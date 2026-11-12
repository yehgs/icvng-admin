// admin/src/pages/marketing/EmailMarketing.jsx
//
// Email marketing: compose one branded e-commerce e-mail and send it to a country's customers.
// Territory is decided by the SERVER (IT/Director pick a country; Manager/Sales/Editor are confined
// to their own). Sending is resumable: the browser drives /process-batch until the run is done.
import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Plus, Search, RefreshCw, ArrowLeft, Save, Send, Copy, Trash2, Mail, Users, StopCircle, Play, Eye } from "lucide-react";
import toast from "react-hot-toast";
import { apiCall, fileAPI, handleApiError } from "../../utils/api";
import { useAdminTranslation } from "../../hooks/useAdminTranslation.js";
import { Field, Toggle, Card, ConfirmDialog, inputCls, btnPrimary, btnGhost, btnDanger } from "../../components/campaign/ui.jsx";

const STATUS_STYLE = {
  DRAFT: "bg-gray-100 text-gray-700", SENDING: "bg-blue-100 text-blue-700", SENT: "bg-green-100 text-green-700",
  FAILED: "bg-red-100 text-red-700", CANCELLED: "bg-amber-100 text-amber-700",
};
const SOURCES = ["USERS", "CUSTOMERS", "SUBSCRIBERS"];
const EMPTY = {
  name: "", subject: "", preheader: "", language: "en", countryCode: "",
  template: { headline: "", body: "", ctaLabel: "", ctaUrl: "", heroImage: "", accentColor: "#8B4513", footerNote: "", productIds: [] },
  audience: { sources: [...SOURCES], customerTypes: [], verifiedOnly: true },
};
const pct = (s) => (s?.total ? Math.round(((s.sent + s.failed + s.skipped) / s.total) * 100) : 0);

function useDebounced(value, ms) {
  const [v, setV] = useState(value);
  useEffect(() => { const id = setTimeout(() => setV(value), ms); return () => clearTimeout(id); }, [value, ms]);
  return v;
}

export default function EmailMarketing() {
  const { t } = useAdminTranslation();
  const [meta, setMeta] = useState(null);
  const [rows, setRows] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, pages: 1, total: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [filters, setFilters] = useState({ search: "", status: "", countryCode: "" });
  const [page, setPage] = useState(1);
  const [editing, setEditing] = useState(null); // null = list, "new" or an id

  useEffect(() => {
    apiCall("/marketing/admin/meta").then((r) => r.success && setMeta(r.data)).catch((e) => setError(handleApiError(e, t("marketing.loadFailed"))));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchList = useCallback(async () => {
    setLoading(true); setError("");
    try {
      const q = new URLSearchParams({ page: String(page), limit: "20" });
      Object.entries(filters).forEach(([k, v]) => v && q.set(k, v));
      const res = await apiCall(`/marketing/admin/list?${q.toString()}`);
      if (res.success) { setRows(res.data || []); setPagination(res.pagination || { page: 1, pages: 1, total: 0 }); }
    } catch (err) { setError(handleApiError(err, t("marketing.loadFailed"))); }
    finally { setLoading(false); }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters, page]);
  useEffect(() => { if (editing === null) fetchList(); }, [fetchList, editing]);

  if (!meta && !error) return <div className="p-10 text-center text-gray-500">{t("common.loading")}</div>;
  if (!meta) return <div className="p-10 text-center text-red-600" role="alert">{error}</div>;

  if (editing !== null) {
    return <div className="p-4 md:p-6"><Editor key={editing} id={editing === "new" ? null : editing} meta={meta} onClose={(id) => setEditing(id || null)} /></div>;
  }

  const setFilter = (patch) => { setPage(1); setFilters((f) => ({ ...f, ...patch })); };
  return (
    <div className="space-y-4 p-4 md:p-6">
      <div className="flex flex-wrap items-center gap-3">
        <div>
          <h1 className="flex items-center gap-2 text-xl font-semibold text-gray-900 dark:text-white"><Mail className="h-5 w-5" />{t("marketing.title")}</h1>
          <p className="text-sm text-gray-500">{meta.isGlobal ? t("marketing.subtitleGlobal") : t("marketing.subtitleCountry", { country: meta.countries[0]?.name })}</p>
        </div>
        {meta.permissions.manage && <button type="button" className={`${btnPrimary} ml-auto`} onClick={() => setEditing("new")}><Plus className="h-4 w-4" />{t("marketing.newEmail")}</button>}
      </div>

      <div className="flex flex-wrap gap-2">
        <div className="relative min-w-[200px] flex-1">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
          <input className={`${inputCls} pl-9`} placeholder={t("common.search")} value={filters.search} onChange={(e) => setFilter({ search: e.target.value })} />
        </div>
        <select className={`${inputCls} w-auto`} value={filters.status} onChange={(e) => setFilter({ status: e.target.value })}>
          <option value="">{t("marketing.allStatuses")}</option>
          {Object.keys(STATUS_STYLE).map((s) => <option key={s} value={s}>{t(`marketing.status.${s}`)}</option>)}
        </select>
        {meta.isGlobal && (
          <select className={`${inputCls} w-auto`} value={filters.countryCode} onChange={(e) => setFilter({ countryCode: e.target.value })}>
            <option value="">{t("marketing.allCountries")}</option>
            {meta.countries.map((c) => <option key={c.code} value={c.code}>{c.flag} {c.name}</option>)}
          </select>
        )}
        <button type="button" className={btnGhost} onClick={fetchList} aria-label={t("common.refresh")}><RefreshCw className="h-4 w-4" /></button>
      </div>

      {error && <p className="rounded-lg bg-red-50 p-3 text-sm text-red-700" role="alert">{error}</p>}
      <div className="overflow-x-auto rounded-xl border border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-800">
        <table className="w-full text-left text-sm">
          <thead className="border-b text-xs uppercase text-gray-500 dark:border-gray-700"><tr>
            <th className="p-3">{t("marketing.name")}</th><th className="p-3">{t("marketing.country")}</th><th className="p-3">{t("common.status")}</th>
            <th className="p-3">{t("marketing.delivery")}</th><th className="p-3">{t("common.date")}</th>
          </tr></thead>
          <tbody>
            {loading && <tr><td colSpan={5} className="p-6 text-center text-gray-500">{t("common.loading")}</td></tr>}
            {!loading && rows.length === 0 && <tr><td colSpan={5} className="p-8 text-center text-gray-500">{t("marketing.empty")}</td></tr>}
            {rows.map((r) => (
              <tr key={r._id} className="cursor-pointer border-b last:border-0 hover:bg-gray-50 dark:border-gray-700 dark:hover:bg-gray-700/40" onClick={() => setEditing(r._id)}>
                <td className="p-3"><div className="font-medium text-gray-900 dark:text-white">{r.name}</div><div className="text-xs text-gray-500">{r.subject}</div></td>
                <td className="p-3">{r.countryCode}</td>
                <td className="p-3"><span className={`rounded-full px-2 py-0.5 text-xs font-medium ${STATUS_STYLE[r.status]}`}>{t(`marketing.status.${r.status}`)}</span></td>
                <td className="p-3">{r.status === "DRAFT" ? "—" : `${r.stats.sent}/${r.stats.total}${r.stats.failed ? ` · ${r.stats.failed} ✗` : ""}`}</td>
                <td className="p-3 text-gray-500">{new Date(r.sendCompletedAt || r.sendStartedAt || r.createdAt).toLocaleDateString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {pagination.pages > 1 && (
        <div className="flex items-center justify-center gap-3 text-sm">
          <button className={btnGhost} disabled={page <= 1} onClick={() => setPage(page - 1)}>‹</button>
          <span>{page} / {pagination.pages}</span>
          <button className={btnGhost} disabled={page >= pagination.pages} onClick={() => setPage(page + 1)}>›</button>
        </div>
      )}
    </div>
  );
}

function Editor({ id, meta, onClose }) {
  const { t } = useAdminTranslation();
  const isNew = !id;
  const [form, setForm] = useState({ ...EMPTY, countryCode: meta.isGlobal ? "" : meta.countryCode, language: meta.countries[0]?.language || "en" });
  const [doc, setDoc] = useState(null);
  const [loading, setLoading] = useState(!isNew);
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState([]);
  const [preview, setPreview] = useState({ subject: "", html: "" });
  const [audience, setAudience] = useState(null);
  const [products, setProducts] = useState([]);
  const [productQ, setProductQ] = useState("");
  const [productHits, setProductHits] = useState([]);
  const [testTo, setTestTo] = useState("");
  const [confirm, setConfirm] = useState(null);
  const [driving, setDriving] = useState(false);
  const [recips, setRecips] = useState(null);
  const stop = useRef(false);

  const status = doc?.status || "DRAFT";
  const editable = meta.permissions.manage && status === "DRAFT";
  const canSend = meta.permissions.send && status === "DRAFT" && !isNew;
  const set = (patch) => setForm((f) => ({ ...f, ...patch }));
  const setTpl = (patch) => setForm((f) => ({ ...f, template: { ...f.template, ...patch } }));
  const setAud = (patch) => setForm((f) => ({ ...f, audience: { ...f.audience, ...patch } }));
  const country = form.countryCode || (meta.isGlobal ? "" : meta.countryCode);

  const load = useCallback(async () => {
    if (isNew) return;
    setLoading(true);
    try {
      const res = await apiCall(`/marketing/admin/${id}`);
      if (res.success) {
        const d = res.data; setDoc(d);
        setForm({ name: d.name, subject: d.subject, preheader: d.preheader || "", language: d.language, countryCode: d.countryCode, template: { ...EMPTY.template, ...d.template, productIds: (d.template?.productIds || []).map(String) }, audience: { ...EMPTY.audience, ...d.audience } });
      }
    } catch (e) { toast.error(handleApiError(e, t("marketing.loadFailed"))); onClose(); }
    finally { setLoading(false); }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);
  useEffect(() => { load(); }, [load]);

  // live preview (rendered server-side with the real template; shown in a script-less sandbox)
  const debounced = useDebounced(JSON.stringify({ ...form, template: form.template }), 600);
  useEffect(() => {
    if (loading || !country) return;
    const f = JSON.parse(debounced);
    apiCall("/marketing/admin/preview", { method: "POST", body: { countryCode: country, name: f.name || "x", subject: f.subject || " ", language: f.language, template: f.template } })
      .then((r) => r.success && setPreview(r.data)).catch(() => {});
  }, [debounced, loading, country]);

  // audience size
  const audKey = JSON.stringify([country, form.audience]);
  useEffect(() => {
    if (!country) { setAudience(null); return; }
    const q = new URLSearchParams({ countryCode: country, sources: form.audience.sources.join(","), customerTypes: form.audience.customerTypes.join(","), verifiedOnly: String(form.audience.verifiedOnly) });
    const id2 = setTimeout(() => apiCall(`/marketing/admin/audience/count?${q}`).then((r) => r.success && setAudience(r.data)).catch(() => setAudience(null)), 300);
    return () => clearTimeout(id2);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [audKey]);

  // featured-product picker (re-uses the country-scoped selector; hidden if the role can't call it)
  useEffect(() => {
    if (!editable || !country) return;
    const tm = setTimeout(() => apiCall(`/campaign/admin/selector/products?q=${encodeURIComponent(productQ)}&countryCode=${country}`).then((r) => r.success && setProductHits(r.data || [])).catch(() => setProductHits([])), 300);
    return () => clearTimeout(tm);
  }, [productQ, country, editable]);
  const pickProduct = (p) => { if (form.template.productIds.length >= 6 || form.template.productIds.includes(p._id)) return; setProducts((x) => [...x, p]); setTpl({ productIds: [...form.template.productIds, p._id] }); };
  const dropProduct = (pid) => { setProducts((x) => x.filter((p) => p._id !== pid)); setTpl({ productIds: form.template.productIds.filter((x) => x !== pid) }); };

  const body = () => ({ ...(isNew ? { countryCode: country } : {}), name: form.name, subject: form.subject, preheader: form.preheader, language: form.language, template: form.template, audience: form.audience });
  const save = async () => {
    setSaving(true); setErrors([]);
    try {
      const res = await apiCall(isNew ? "/marketing/admin/create" : `/marketing/admin/${id}`, { method: isNew ? "POST" : "PUT", body: body() });
      if (res.success) { toast.success(t("marketing.saved")); if (isNew) onClose(res.data._id); else { setDoc(res.data); } return true; }
    } catch (err) { const l = err?.response?.data?.errors; setErrors(Array.isArray(l) && l.length ? l : [handleApiError(err, t("marketing.saveFailed"))]); }
    finally { setSaving(false); }
    return false;
  };

  const sendTest = async () => {
    try {
      const emails = testTo.split(/[,;\s]+/).filter(Boolean);
      const res = await apiCall(`/marketing/admin/${id}/test`, { method: "POST", body: emails.length ? { emails } : {} });
      if (res.success) toast.success(t("marketing.testSent", { to: res.data.sentTo.join(", ") }));
    } catch (e) { toast.error(handleApiError(e, t("marketing.saveFailed"))); }
  };

  // Drive the resumable send loop from the browser (Cloud Run only has CPU while a request is open).
  const drive = async (first) => {
    setDriving(true); stop.current = false;
    let res = first;
    try {
      while (!stop.current) {
        if (res?.success) { setDoc(res.data); if (res.done) break; }
        res = await apiCall(`/marketing/admin/${id}/process-batch`, { method: "POST", body: {} });
        if (res?.success && res.data.status !== "SENDING") { setDoc(res.data); break; }
        await new Promise((r) => setTimeout(r, 250));
      }
      toast.success(t("marketing.sendFinished"));
    } catch (e) { toast.error(handleApiError(e, t("marketing.saveFailed"))); }
    finally { setDriving(false); load(); }
  };
  const startSend = async () => {
    setConfirm(null);
    if (editable && !(await save())) return;
    try {
      const res = await apiCall(`/marketing/admin/${id}/send`, { method: "POST", body: { confirm: true } });
      if (res.success) drive(res);
    } catch (e) { toast.error(handleApiError(e, t("marketing.saveFailed"))); }
  };
  const cancel = async () => {
    stop.current = true;
    try { const res = await apiCall(`/marketing/admin/${id}/cancel`, { method: "POST", body: {} }); if (res.success) { setDoc(res.data); toast.success(t("marketing.cancelled")); } } catch (e) { toast.error(handleApiError(e, t("marketing.saveFailed"))); }
  };
  const duplicate = async () => { try { const res = await apiCall(`/marketing/admin/${id}/duplicate`, { method: "POST", body: {} }); if (res.success) { toast.success(t("marketing.duplicated")); onClose(res.data._id); } } catch (e) { toast.error(handleApiError(e, t("marketing.saveFailed"))); } };
  const remove = async () => { try { await apiCall(`/marketing/admin/${id}`, { method: "DELETE" }); toast.success(t("marketing.deleted")); onClose(); } catch (e) { toast.error(handleApiError(e, t("marketing.saveFailed"))); } };
  const upload = async (e) => { const file = e.target.files?.[0]; if (!file) return; try { const r = await fileAPI.uploadImage(file); if (r?.data?.url) setTpl({ heroImage: r.data.url }); } catch { toast.error(t("marketing.uploadFailed")); } };
  const loadRecipients = async (st = "") => { try { const r = await apiCall(`/marketing/admin/${id}/recipients?limit=50${st ? `&status=${st}` : ""}`); if (r.success) setRecips({ rows: r.data, filter: st }); } catch { /* ignore */ } };

  if (loading) return <div className="p-10 text-center text-gray-500">{t("common.loading")}</div>;
  const total = doc?.stats?.total || 0;
  const canSubmit = form.name && form.subject && (form.template.headline || form.template.body) && country && (!form.template.ctaLabel || form.template.ctaUrl);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-3">
        <button type="button" className={btnGhost} onClick={() => onClose()}><ArrowLeft className="h-4 w-4" />{t("common.back")}</button>
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white">{isNew ? t("marketing.newEmail") : form.name}</h2>
        {!isNew && <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${STATUS_STYLE[status]}`}>{t(`marketing.status.${status}`)}</span>}
        {country && <span className="rounded bg-gray-100 px-2 py-0.5 text-xs font-medium dark:bg-gray-700">{country}</span>}
        <div className="ml-auto flex flex-wrap gap-2">
          {!isNew && meta.permissions.manage && <button type="button" className={btnGhost} onClick={duplicate}><Copy className="h-4 w-4" />{t("marketing.duplicate")}</button>}
          {!isNew && meta.permissions.manage && ["DRAFT", "CANCELLED"].includes(status) && <button type="button" className={btnDanger} onClick={() => setConfirm("delete")}><Trash2 className="h-4 w-4" />{t("common.delete")}</button>}
          {editable && <button type="button" className={btnPrimary} onClick={save} disabled={saving || !canSubmit}><Save className="h-4 w-4" />{saving ? t("marketing.saving") : isNew ? t("marketing.createDraft") : t("common.save")}</button>}
          {canSend && <button type="button" className={btnPrimary} onClick={() => setConfirm("send")} disabled={!canSubmit || !audience?.total}><Send className="h-4 w-4" />{t("marketing.send")}</button>}
        </div>
      </div>
      {!editable && !isNew && <p className="rounded-lg bg-amber-50 p-3 text-sm text-amber-800 dark:bg-amber-900/20 dark:text-amber-200">{t("marketing.lockedNotice")}</p>}
      {errors.length > 0 && <ul className="list-disc rounded-lg bg-red-50 p-3 pl-6 text-sm text-red-700" role="alert">{errors.map((e) => <li key={e}>{e}</li>)}</ul>}

      {(status === "SENDING" || driving || (doc && status !== "DRAFT")) && doc && (
        <Card title={t("marketing.delivery")} actions={status === "SENDING" && meta.permissions.send && (
          <div className="flex gap-2">
            {!driving && <button type="button" className={btnPrimary} onClick={() => drive(null)}><Play className="h-4 w-4" />{t("marketing.resume")}</button>}
            <button type="button" className={btnDanger} onClick={cancel}><StopCircle className="h-4 w-4" />{t("marketing.cancel")}</button>
          </div>)}>
          <div className="h-2 overflow-hidden rounded-full bg-gray-200"><div className="h-full bg-blue-600 transition-all" style={{ width: `${pct(doc.stats)}%` }} /></div>
          <div className="mt-2 flex flex-wrap gap-4 text-sm text-gray-700 dark:text-gray-200">
            <span>{t("marketing.stat.total")}: <b>{total}</b></span><span>{t("marketing.stat.sent")}: <b className="text-green-600">{doc.stats.sent}</b></span>
            <span>{t("marketing.stat.failed")}: <b className="text-red-600">{doc.stats.failed}</b></span><span>{t("marketing.stat.skipped")}: <b>{doc.stats.skipped}</b></span>
            <span>{t("marketing.stat.pending")}: <b>{doc.stats.pending}</b></span>
          </div>
          {status === "SENDING" && !driving && <p className="mt-2 text-xs text-amber-700">{t("marketing.keepOpen")}</p>}
          <button type="button" className="mt-3 text-sm text-blue-600 hover:underline" onClick={() => loadRecipients("")}>{t("marketing.showRecipients")}</button>
          {recips && (
            <div className="mt-2 max-h-64 overflow-auto rounded border text-xs dark:border-gray-700">
              <div className="flex gap-1 border-b p-2 dark:border-gray-700">{["", "SENT", "FAILED", "SKIPPED", "PENDING"].map((s) => <button key={s} type="button" onClick={() => loadRecipients(s)} className={`rounded px-2 py-0.5 ${recips.filter === s ? "bg-blue-600 text-white" : "bg-gray-100 dark:bg-gray-700"}`}>{s ? t(`marketing.rstatus.${s}`) : t("marketing.allStatuses")}</button>)}</div>
              {recips.rows.map((r) => <div key={r._id} className="flex justify-between gap-2 border-b px-2 py-1 last:border-0 dark:border-gray-700"><span>{r.email}</span><span className="text-gray-500">{r.status}{r.error ? ` — ${r.error}` : ""}</span></div>)}
            </div>
          )}
        </Card>
      )}

      <div className="grid gap-4 lg:grid-cols-2">
        <div className="space-y-4">
          <Card title={t("marketing.sections.message")}>
            <div className="grid gap-3 md:grid-cols-2">
              {isNew && meta.isGlobal && (
                <Field label={t("marketing.country")} className="md:col-span-2">
                  <select className={inputCls} value={form.countryCode} onChange={(e) => { const c = meta.countries.find((x) => x.code === e.target.value); set({ countryCode: e.target.value, ...(c ? { language: c.language } : {}) }); }}>
                    <option value="">{t("marketing.chooseCountry")}</option>
                    {meta.countries.map((c) => <option key={c.code} value={c.code}>{c.flag} {c.name}</option>)}
                  </select>
                </Field>
              )}
              <Field label={t("marketing.internalName")}><input className={inputCls} maxLength={120} disabled={!editable} value={form.name} onChange={(e) => set({ name: e.target.value })} /></Field>
              <Field label={t("marketing.language")} hint={t("marketing.languageHint")}>
                <select className={inputCls} disabled={!editable} value={form.language} onChange={(e) => set({ language: e.target.value })}>{["en", "fr", "it"].map((l) => <option key={l} value={l}>{l.toUpperCase()}</option>)}</select>
              </Field>
              <Field label={t("marketing.subject")} hint={t("marketing.subjectHint")} className="md:col-span-2"><input className={inputCls} maxLength={150} disabled={!editable} value={form.subject} onChange={(e) => set({ subject: e.target.value })} /></Field>
              <Field label={t("marketing.preheader")} className="md:col-span-2"><input className={inputCls} maxLength={150} disabled={!editable} value={form.preheader} onChange={(e) => set({ preheader: e.target.value })} /></Field>
              <Field label={t("marketing.headline")} className="md:col-span-2"><input className={inputCls} maxLength={150} disabled={!editable} value={form.template.headline} onChange={(e) => setTpl({ headline: e.target.value })} /></Field>
              <Field label={t("marketing.message")} hint={t("marketing.messageHint")} className="md:col-span-2"><textarea className={inputCls} rows={7} maxLength={8000} disabled={!editable} value={form.template.body} onChange={(e) => setTpl({ body: e.target.value })} /></Field>
              <Field label={t("marketing.ctaLabel")}><input className={inputCls} maxLength={60} disabled={!editable} value={form.template.ctaLabel} onChange={(e) => setTpl({ ctaLabel: e.target.value })} /></Field>
              <Field label={t("marketing.ctaUrl")} hint="/shop · https://…"><input className={inputCls} disabled={!editable} value={form.template.ctaUrl} onChange={(e) => setTpl({ ctaUrl: e.target.value })} /></Field>
              <Field label={t("marketing.heroImage")} className="md:col-span-2">
                <div className="flex gap-2"><input className={inputCls} disabled={!editable} placeholder="https://…" value={form.template.heroImage} onChange={(e) => setTpl({ heroImage: e.target.value })} />
                  <label className={`${btnGhost} cursor-pointer`}>{t("marketing.upload")}<input type="file" accept="image/*" className="hidden" disabled={!editable} onChange={upload} /></label></div>
              </Field>
              <Field label={t("marketing.accent")}>
                <div className="flex gap-2"><input type="color" className="h-9 w-10 rounded border" disabled={!editable} value={form.template.accentColor} onChange={(e) => setTpl({ accentColor: e.target.value.toUpperCase() })} /><input className={inputCls} maxLength={7} disabled={!editable} value={form.template.accentColor} onChange={(e) => setTpl({ accentColor: e.target.value })} /></div>
              </Field>
              <Field label={t("marketing.footerNote")}><input className={inputCls} maxLength={300} disabled={!editable} value={form.template.footerNote} onChange={(e) => setTpl({ footerNote: e.target.value })} /></Field>
            </div>
          </Card>

          <Card title={t("marketing.sections.products")}>
            <p className="mb-2 text-xs text-gray-500">{t("marketing.productsHint")}</p>
            <div className="mb-2 flex flex-wrap gap-2">
              {form.template.productIds.map((pid) => { const p = products.find((x) => x._id === pid); return <span key={pid} className="inline-flex items-center gap-1 rounded-full bg-gray-100 px-2 py-1 text-xs dark:bg-gray-700">{p?.name || pid.slice(-6)}{editable && <button type="button" aria-label={t("common.delete")} onClick={() => dropProduct(pid)}>×</button>}</span>; })}
            </div>
            {editable && form.template.productIds.length < 6 && (
              <div className="relative">
                <input className={inputCls} placeholder={t("marketing.searchProducts")} value={productQ} onChange={(e) => setProductQ(e.target.value)} />
                {productQ && productHits.length > 0 && <ul className="absolute z-10 mt-1 max-h-48 w-full overflow-auto rounded-lg border bg-white shadow dark:border-gray-600 dark:bg-gray-800">{productHits.map((p) => <li key={p._id}><button type="button" className="w-full px-3 py-2 text-left text-sm hover:bg-gray-50 dark:hover:bg-gray-700" onClick={() => { pickProduct(p); setProductQ(""); }}>{p.name} <span className="text-xs text-gray-500">{p.sku}</span></button></li>)}</ul>}
              </div>
            )}
          </Card>

          <Card title={t("marketing.sections.audience")}>
            <div className="space-y-2">
              <div className="flex flex-wrap gap-4">
                {SOURCES.map((s) => <Toggle key={s} disabled={!editable} checked={form.audience.sources.includes(s)} onChange={(v) => setAud({ sources: v ? [...form.audience.sources, s] : form.audience.sources.filter((x) => x !== s) })} label={t(`marketing.source.${s}`)} />)}
              </div>
              <div className="flex flex-wrap gap-4">
                {["BTC", "BTB"].map((c) => <Toggle key={c} disabled={!editable} checked={form.audience.customerTypes.includes(c)} onChange={(v) => setAud({ customerTypes: v ? [...form.audience.customerTypes, c] : form.audience.customerTypes.filter((x) => x !== c) })} label={t(`marketing.customerType.${c}`)} />)}
                <span className="text-xs text-gray-500">{t("marketing.customerTypeHint")}</span>
              </div>
              <Toggle disabled={!editable} checked={form.audience.verifiedOnly} onChange={(v) => setAud({ verifiedOnly: v })} label={t("marketing.verifiedOnly")} />
              <p className="flex items-center gap-2 rounded-lg bg-blue-50 p-3 text-sm text-blue-800 dark:bg-blue-900/20 dark:text-blue-200"><Users className="h-4 w-4" />
                {!country ? t("marketing.chooseCountry") : audience ? t("marketing.audienceCount", { total: audience.total, suppressed: audience.suppressed }) : "…"}</p>
            </div>
          </Card>
        </div>

        <div className="space-y-4 lg:sticky lg:top-4 lg:self-start">
          <Card title={<span className="inline-flex items-center gap-2"><Eye className="h-4 w-4" />{t("marketing.preview")}</span>}>
            <p className="mb-2 truncate text-xs text-gray-500">{t("marketing.subject")}: <b>{preview.subject}</b></p>
            {/* sandbox with no flags: the e-mail HTML can never run script or navigate the admin app */}
            <iframe title={t("marketing.preview")} sandbox="" srcDoc={preview.html} className="h-[640px] w-full rounded-lg border bg-white" />
          </Card>
          {!isNew && meta.permissions.manage && (
            <Card title={t("marketing.sendTest")}>
              <div className="flex gap-2"><input className={inputCls} placeholder={t("marketing.testPlaceholder")} value={testTo} onChange={(e) => setTestTo(e.target.value)} /><button type="button" className={btnGhost} onClick={sendTest}><Mail className="h-4 w-4" />{t("marketing.sendTest")}</button></div>
              <p className="mt-1 text-xs text-gray-500">{t("marketing.testHint")}</p>
            </Card>
          )}
        </div>
      </div>

      <ConfirmDialog open={confirm === "send"} title={t("marketing.confirmSendTitle")} body={t("marketing.confirmSendBody", { total: audience?.total ?? 0, country })} confirmLabel={t("marketing.send")} cancelLabel={t("common.cancel")} onConfirm={startSend} onCancel={() => setConfirm(null)} />
      <ConfirmDialog open={confirm === "delete"} danger title={t("marketing.confirmDeleteTitle")} body={t("marketing.confirmDeleteBody")} confirmLabel={t("common.delete")} cancelLabel={t("common.cancel")} onConfirm={remove} onCancel={() => setConfirm(null)} />
    </div>
  );
}
