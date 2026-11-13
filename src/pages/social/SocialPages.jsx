// admin/src/pages/social/SocialPages.jsx
//
// Social-media page cards shown first in the storefront's "Coffee Stories" section.
// Manager/Editor manage their own country (the server enforces it); IT/Director pick any country
// or publish an entry for ALL countries. Cards published for ALL are read-only for everyone else.
import React, { useCallback, useEffect, useState } from "react";
import { Plus, ArrowUp, ArrowDown, Pencil, Trash2, ExternalLink, Upload, ArrowLeft, Save, Globe2 } from "lucide-react";
import toast from "react-hot-toast";
import { apiCall, fileAPI, handleApiError } from "../../utils/api";
import { useAdminTranslation } from "../../hooks/useAdminTranslation.js";
import { Field, Toggle, Card, ConfirmDialog, inputCls, btnPrimary, btnGhost, btnDanger } from "../../components/campaign/ui.jsx";

const PLATFORM_COLOR = {
  FACEBOOK: "bg-blue-600", INSTAGRAM: "bg-pink-600", X: "bg-gray-900", TIKTOK: "bg-black", YOUTUBE: "bg-red-600",
  LINKEDIN: "bg-sky-700", WHATSAPP: "bg-green-600", TELEGRAM: "bg-sky-500", OTHER: "bg-gray-600",
};
const EMPTY = { platform: "FACEBOOK", name: "", handle: "", url: "", description: "", imageUrl: "", followersLabel: "", showFeed: false, isActive: true };
const req = (path, method, body) => apiCall(`/social${path}`, { method, ...(body ? { body } : {}) });

export default function SocialPages() {
  const { t } = useAdminTranslation();
  const [meta, setMeta] = useState(null);
  const [country, setCountry] = useState("");   // global admins only; "" = every country
  const [rows, setRows] = useState(null);
  const [form, setForm] = useState(null);       // null = list view
  const [editingId, setEditingId] = useState(null);
  const [formCountry, setFormCountry] = useState("");
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState([]);
  const [del, setDel] = useState(null);
  const [uploading, setUploading] = useState(false);

  useEffect(() => { req("/admin/meta", "GET").then((r) => r.success && setMeta(r.data)).catch((e) => toast.error(handleApiError(e, t("social.loadFailed")))); }, [t]);
  const load = useCallback(() => {
    const q = meta?.scope.isGlobal && country ? `?countryCode=${country}` : "";
    return req(`/admin/list${q}`, "GET").then((r) => r.success && setRows(r.data)).catch((e) => toast.error(handleApiError(e, t("social.loadFailed"))));
  }, [meta, country, t]);
  useEffect(() => { if (meta) load(); }, [meta, load]);

  if (!meta) return <div className="p-6 text-sm text-gray-500">{t("common.loading")}</div>;
  const isGlobal = meta.scope.isGlobal;
  const flag = (code) => (code === "ALL" ? "🌍" : meta.countries.find((c) => c.code === code)?.flag || "");
  const label = (code) => (code === "ALL" ? t("social.allCountries") : meta.countries.find((c) => c.code === code)?.name || code);

  const open = (row) => {
    setErrors([]); setEditingId(row?._id || null);
    setForm(row ? { ...EMPTY, ...row } : { ...EMPTY });
    setFormCountry(row?.countryCode || country || (isGlobal ? meta.countries[0]?.code : meta.scope.countryCode));
  };
  const set = (p) => setForm((f) => ({ ...f, ...p }));
  const save = async () => {
    setSaving(true); setErrors([]);
    try {
      const body = { platform: form.platform, name: form.name, handle: form.handle, url: form.url, description: form.description, imageUrl: form.imageUrl, followersLabel: form.followersLabel, showFeed: form.showFeed, isActive: form.isActive, ...(isGlobal ? { countryCode: formCountry } : {}) };
      const r = editingId ? await req(`/admin/${editingId}`, "PUT", body) : await req("/admin/create", "POST", body);
      if (r.success) { toast.success(t("social.saved")); setForm(null); load(); }
    } catch (e) { const l = e?.response?.data?.errors; setErrors(Array.isArray(l) && l.length ? l : [handleApiError(e, t("social.saveFailed"))]); }
    finally { setSaving(false); }
  };
  const upload = async (e) => {
    const file = e.target.files?.[0]; if (!file) return; setUploading(true);
    try { const r = await fileAPI.uploadImage(file); if (r?.data?.url) set({ imageUrl: r.data.url }); } catch { toast.error(t("social.uploadFailed")); } finally { setUploading(false); }
  };
  const remove = async () => { try { await req(`/admin/${del._id}`, "DELETE"); setDel(null); toast.success(t("social.deleted")); load(); } catch (e) { toast.error(handleApiError(e, t("social.saveFailed"))); } };
  const move = async (row, dir) => {
    const group = rows.filter((r) => r.countryCode === row.countryCode && r.editable);
    const i = group.findIndex((r) => r._id === row._id), j = i + dir;
    if (j < 0 || j >= group.length) return;
    const ids = group.map((r) => r._id); [ids[i], ids[j]] = [ids[j], ids[i]];
    try { await req("/admin/reorder", "POST", { ids }); load(); } catch (e) { toast.error(handleApiError(e, t("social.saveFailed"))); }
  };

  if (form) {
    const platforms = meta.platforms;
    return (
      <div className="mx-auto max-w-3xl space-y-4 p-4 md:p-6">
        <div className="flex items-center gap-3">
          <button type="button" className={btnGhost} onClick={() => setForm(null)}><ArrowLeft className="h-4 w-4" />{t("common.back")}</button>
          <h1 className="text-lg font-semibold">{editingId ? t("social.edit") : t("social.add")}</h1>
          <button type="button" className={`${btnPrimary} ml-auto`} disabled={saving || !form.name || !form.url} onClick={save}><Save className="h-4 w-4" />{t("common.save")}</button>
        </div>
        {errors.length > 0 && <ul className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">{errors.map((e) => <li key={e}>{e}</li>)}</ul>}
        <Card title={t("social.details")}>
          <div className="grid gap-3 md:grid-cols-2">
            {isGlobal && (
              <Field label={t("social.country")} hint={formCountry === "ALL" ? t("social.allHint") : ""}>
                <select className={inputCls} value={formCountry} onChange={(e) => setFormCountry(e.target.value)}>
                  <option value="ALL">🌍 {t("social.allCountries")}</option>
                  {meta.countries.map((c) => <option key={c.code} value={c.code}>{c.flag} {c.name}</option>)}
                </select>
              </Field>)}
            <Field label={t("social.platform")}>
              <select className={inputCls} value={form.platform} onChange={(e) => set({ platform: e.target.value, ...(e.target.value !== "FACEBOOK" ? { showFeed: false } : {}) })}>
                {platforms.map((p) => <option key={p} value={p}>{t(`social.platforms.${p}`)}</option>)}
              </select>
            </Field>
            <Field label={t("social.name")}><input className={inputCls} maxLength={80} value={form.name} onChange={(e) => set({ name: e.target.value })} placeholder="i-Coffee Nigeria" /></Field>
            <Field label={t("social.handle")}><input className={inputCls} maxLength={60} value={form.handle} onChange={(e) => set({ handle: e.target.value })} placeholder="@icoffeeng" /></Field>
            <Field label={t("social.url")} hint={t("social.urlHint")} className="md:col-span-2"><input className={inputCls} value={form.url} onChange={(e) => set({ url: e.target.value })} placeholder="https://www.facebook.com/…" /></Field>
            <Field label={t("social.description")} className="md:col-span-2"><input className={inputCls} maxLength={200} value={form.description} onChange={(e) => set({ description: e.target.value })} /></Field>
            <Field label={t("social.followers")} hint={t("social.followersHint")}><input className={inputCls} maxLength={30} value={form.followersLabel} onChange={(e) => set({ followersLabel: e.target.value })} placeholder="12K followers" /></Field>
            <Field label={t("social.image")}>
              <div className="flex items-center gap-2">
                {form.imageUrl && <img src={form.imageUrl} alt="" className="h-10 w-10 rounded-full object-cover" />}
                <input className={inputCls} placeholder="https://…" value={form.imageUrl} onChange={(e) => set({ imageUrl: e.target.value })} />
                <label className={`${btnGhost} cursor-pointer`}><Upload className="h-4 w-4" />{uploading ? "…" : t("marketing.upload")}<input type="file" accept="image/*" className="hidden" onChange={upload} /></label>
              </div>
            </Field>
            {form.platform === "FACEBOOK" && <div className="md:col-span-2"><Toggle checked={form.showFeed} onChange={(v) => set({ showFeed: v })} label={t("social.showFeed")} /><p className="mt-1 text-xs text-gray-500">{t("social.showFeedHint")}</p></div>}
            <Toggle checked={form.isActive} onChange={(v) => set({ isActive: v })} label={t("social.active")} />
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-5xl space-y-4 p-4 md:p-6">
      <div className="flex flex-wrap items-center gap-3">
        <div>
          <h1 className="text-xl font-semibold text-gray-900 dark:text-white">{t("social.title")}</h1>
          <p className="text-sm text-gray-500">{isGlobal ? t("social.subtitleGlobal") : t("social.subtitleCountry", { country: label(meta.scope.countryCode) })}</p>
        </div>
        <div className="ml-auto flex items-center gap-2">
          {isGlobal && (
            <select className={`${inputCls} w-auto`} value={country} onChange={(e) => setCountry(e.target.value)}>
              <option value="">{t("social.everyCountry")}</option>
              <option value="ALL">🌍 {t("social.allCountries")}</option>
              {meta.countries.map((c) => <option key={c.code} value={c.code}>{c.flag} {c.name}</option>)}
            </select>)}
          <button type="button" className={btnPrimary} onClick={() => open(null)}><Plus className="h-4 w-4" />{t("social.add")}</button>
        </div>
      </div>
      {!rows ? <p className="text-sm text-gray-500">{t("common.loading")}</p> : rows.length === 0 ? (
        <Card title=""><p className="text-sm text-gray-500">{t("social.empty")}</p></Card>
      ) : (
        <ul className="grid gap-3 md:grid-cols-2">
          {rows.map((r) => (
            <li key={r._id} className={`rounded-xl border bg-white p-4 dark:bg-gray-800 ${r.isActive ? "border-gray-200 dark:border-gray-700" : "border-dashed border-gray-300 opacity-70"}`}>
              <div className="flex items-start gap-3">
                {r.imageUrl ? <img src={r.imageUrl} alt="" className="h-12 w-12 rounded-full object-cover" /> : <div className={`flex h-12 w-12 items-center justify-center rounded-full text-lg font-bold text-white ${PLATFORM_COLOR[r.platform]}`}>{r.name.charAt(0)}</div>}
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2"><span className="truncate font-medium">{r.name}</span><span className={`rounded px-1.5 py-0.5 text-[10px] font-semibold uppercase text-white ${PLATFORM_COLOR[r.platform]}`}>{t(`social.platforms.${r.platform}`)}</span></div>
                  <div className="text-xs text-gray-500">{r.handle}{r.followersLabel ? ` · ${r.followersLabel}` : ""}</div>
                  <div className="mt-1 flex items-center gap-1 text-xs text-gray-500">{r.countryCode === "ALL" ? <Globe2 className="h-3.5 w-3.5" /> : <span>{flag(r.countryCode)}</span>}{label(r.countryCode)}{!r.isActive && <span className="ml-2 rounded bg-gray-200 px-1.5 text-gray-700">{t("social.inactive")}</span>}{r.showFeed && <span className="ml-2 rounded bg-blue-100 px-1.5 text-blue-700">{t("social.liveFeed")}</span>}</div>
                  {r.description && <p className="mt-1 line-clamp-2 text-sm text-gray-600 dark:text-gray-300">{r.description}</p>}
                  {r.countryCode === "ALL" && !r.editable && <p className="mt-1 text-xs text-amber-700">{t("social.readOnlyAll")}</p>}
                </div>
              </div>
              <div className="mt-3 flex items-center gap-1 border-t pt-2 dark:border-gray-700">
                <a href={r.url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 px-2 py-1 text-sm text-blue-600 hover:underline"><ExternalLink className="h-4 w-4" />{t("social.open")}</a>
                {r.editable && <>
                  <button type="button" aria-label={t("social.moveUp")} className="p-1.5 text-gray-500 hover:text-gray-900" onClick={() => move(r, -1)}><ArrowUp className="h-4 w-4" /></button>
                  <button type="button" aria-label={t("social.moveDown")} className="p-1.5 text-gray-500 hover:text-gray-900" onClick={() => move(r, 1)}><ArrowDown className="h-4 w-4" /></button>
                  <button type="button" className={`${btnGhost} ml-auto`} onClick={() => open(r)}><Pencil className="h-4 w-4" />{t("common.edit")}</button>
                  <button type="button" aria-label={t("common.delete")} className={btnDanger} onClick={() => setDel(r)}><Trash2 className="h-4 w-4" /></button>
                </>}
              </div>
            </li>
          ))}
        </ul>)}
      <ConfirmDialog open={!!del} danger title={t("social.deleteTitle")} body={t("social.deleteBody", { name: del?.name || "" })} confirmLabel={t("common.delete")} cancelLabel={t("common.cancel")} onConfirm={remove} onCancel={() => setDel(null)} />
    </div>
  );
}
