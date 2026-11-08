// admin/src/components/campaign/CampaignBlocksPanel.jsx — ordered storefront content blocks.
import React, { useState } from "react";
import { Plus, Trash2, Pencil, ArrowUp, ArrowDown, Eye, EyeOff, X } from "lucide-react";
import toast from "react-hot-toast";
import { apiCall, handleApiError, fileAPI } from "../../utils/api";
import { useAdminTranslation } from "../../hooks/useAdminTranslation.js";
import { Field, Toggle, Card, ConfirmDialog, inputCls, btnPrimary, btnGhost, btnDanger } from "./ui.jsx";
import { BLOCK_TYPES } from "./campaignUtils.js";
import { TargetPicker } from "./CampaignRulesPanel.jsx";

const EMPTY = { productIds: [], categoryIds: [], type: "HERO", heading: "", subtitle: "", ctaLabel: "", ctaUrl: "", image: "", mobileImage: "", imageWidth: 0, imageHeight: 0, isVisible: true };

export default function CampaignBlocksPanel({ campaign, blocks, canEdit, reload }) {
  const { t } = useAdminTranslation();
  const [form, setForm] = useState(null);
  const [editingId, setEditingId] = useState(null);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState("");
  const [errors, setErrors] = useState([]);
  const [confirmDelete, setConfirmDelete] = useState(null);
  const set = (patch) => setForm((f) => ({ ...f, ...patch }));

  const open = (b) => { setErrors([]); setEditingId(b?._id || null); setForm(b ? { ...EMPTY, ...b, productIds: (b.productIds || []).map(String), categoryIds: (b.categoryIds || []).map(String) } : { ...EMPTY }); };

  const upload = async (e, field) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(field);
    try {
      const res = await fileAPI.uploadImage(file);
      if (res?.data?.url) set({ [field]: res.data.url });
    } catch { toast.error(t("campaigns.uploadFailed")); }
    finally { setUploading(""); }
  };

  const save = async () => {
    setSaving(true); setErrors([]);
    const body = { ...form, imageWidth: Number(form.imageWidth) || 0, imageHeight: Number(form.imageHeight) || 0, order: editingId ? form.order : blocks.length };
    try {
      const res = await apiCall(editingId ? `/campaign/admin/${campaign._id}/blocks/${editingId}` : `/campaign/admin/${campaign._id}/blocks`, { method: editingId ? "PUT" : "POST", body });
      if (res.success) { toast.success(t("campaigns.blocks.saved")); setForm(null); reload(); }
    } catch (err) {
      const list = err?.response?.data?.errors;
      setErrors(Array.isArray(list) && list.length ? list : [handleApiError(err, t("campaigns.blocks.saveFailed"))]);
    } finally { setSaving(false); }
  };

  const move = async (index, dir) => {
    const next = [...blocks];
    const j = index + dir;
    if (j < 0 || j >= next.length) return;
    [next[index], next[j]] = [next[j], next[index]];
    try {
      await apiCall(`/campaign/admin/${campaign._id}/blocks/reorder`, { method: "PUT", body: { order: next.map((b) => b._id) } });
      reload();
    } catch (err) { toast.error(handleApiError(err, t("campaigns.blocks.saveFailed"))); }
  };

  const toggleVisible = async (b) => {
    try { await apiCall(`/campaign/admin/${campaign._id}/blocks/${b._id}`, { method: "PUT", body: { isVisible: !b.isVisible } }); reload(); }
    catch (err) { toast.error(handleApiError(err, t("campaigns.blocks.saveFailed"))); }
  };

  const remove = async () => {
    try { await apiCall(`/campaign/admin/${campaign._id}/blocks/${confirmDelete._id}`, { method: "DELETE" }); reload(); }
    catch (err) { toast.error(handleApiError(err, t("campaigns.blocks.saveFailed"))); }
    setConfirmDelete(null);
  };

  const needsCopy = ["HERO", "PROMO_STRIP", "GIFT_COLLECTION"].includes(form?.type);

  return (
    <div className="space-y-4">
      <Card title={t("campaigns.blocks.title")} actions={canEdit && <button type="button" className={btnPrimary} onClick={() => open(null)}><Plus className="h-4 w-4" />{t("campaigns.blocks.add")}</button>}>
        <p className="mb-3 text-xs text-gray-500 dark:text-gray-400">{t("campaigns.blocks.help")}</p>
        {blocks.length === 0 ? <p className="py-6 text-center text-sm text-gray-500">{t("campaigns.blocks.empty")}</p> : (
          <ul className="divide-y dark:divide-gray-700">
            {blocks.map((b, i) => (
              <li key={b._id} className="flex items-center gap-3 py-2">
                <span className="w-6 text-center text-xs text-gray-400">{i + 1}</span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">{b.heading || t(`campaigns.blocks.type_${b.type}`)}</p>
                  <p className="text-xs text-gray-500">{t(`campaigns.blocks.type_${b.type}`)}{!b.isVisible ? ` · ${t("campaigns.blocks.hidden")}` : ""}</p>
                </div>
                {canEdit && (
                  <span className="inline-flex gap-1">
                    <button type="button" className={btnGhost} onClick={() => move(i, -1)} disabled={i === 0} aria-label={t("campaigns.blocks.moveUp")}><ArrowUp className="h-4 w-4" /></button>
                    <button type="button" className={btnGhost} onClick={() => move(i, 1)} disabled={i === blocks.length - 1} aria-label={t("campaigns.blocks.moveDown")}><ArrowDown className="h-4 w-4" /></button>
                    <button type="button" className={btnGhost} onClick={() => toggleVisible(b)} aria-label={b.isVisible ? t("campaigns.blocks.hide") : t("campaigns.blocks.show")}>{b.isVisible ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}</button>
                    <button type="button" className={btnGhost} onClick={() => open(b)} aria-label={t("common.edit")}><Pencil className="h-4 w-4" /></button>
                    <button type="button" className={btnDanger} onClick={() => setConfirmDelete(b)} aria-label={t("common.delete")}><Trash2 className="h-4 w-4" /></button>
                  </span>
                )}
              </li>
            ))}
          </ul>
        )}
      </Card>

      {form && (
        <Card title={editingId ? t("campaigns.blocks.edit") : t("campaigns.blocks.add")} actions={<button type="button" onClick={() => setForm(null)} aria-label={t("common.cancel")}><X className="h-4 w-4" /></button>}>
          {errors.length > 0 && <ul className="mb-3 list-disc rounded-lg bg-red-50 p-3 pl-6 text-sm text-red-700" role="alert">{errors.map((e) => <li key={e}>{e}</li>)}</ul>}
          <div className="grid gap-3 md:grid-cols-2">
            <Field label={t("campaigns.blocks.type")}>
              <select className={inputCls} value={form.type} onChange={(e) => set({ type: e.target.value })} disabled={!!editingId}>
                {BLOCK_TYPES.map((x) => <option key={x} value={x}>{t(`campaigns.blocks.type_${x}`)}</option>)}
              </select>
            </Field>
            <div className="flex items-end"><Toggle checked={form.isVisible} onChange={(v) => set({ isVisible: v })} label={t("campaigns.blocks.visible")} /></div>
            <Field label={t("campaigns.blocks.heading")}><input className={inputCls} maxLength={140} value={form.heading} onChange={(e) => set({ heading: e.target.value })} /></Field>
            <Field label={t("campaigns.blocks.subtitle")}><input className={inputCls} maxLength={300} value={form.subtitle} onChange={(e) => set({ subtitle: e.target.value })} /></Field>
            {needsCopy && (
              <>
                <Field label={t("campaigns.blocks.ctaLabel")}><input className={inputCls} maxLength={40} value={form.ctaLabel} onChange={(e) => set({ ctaLabel: e.target.value })} /></Field>
                <Field label={t("campaigns.blocks.ctaUrl")} hint={t("campaigns.blocks.ctaUrlHint")}><input className={inputCls} value={form.ctaUrl} onChange={(e) => set({ ctaUrl: e.target.value })} placeholder="/shop" /></Field>
              </>
            )}
            {form.type === "HERO" && (
              <>
                {["image", "mobileImage"].map((f) => (
                  <Field key={f} label={t(`campaigns.blocks.${f}`)} hint={t("campaigns.blocks.imageHint")}>
                    <div className="flex items-center gap-2">
                      <input className={inputCls} value={form[f]} onChange={(e) => set({ [f]: e.target.value })} placeholder="https://…" />
                      <label className={`${btnGhost} cursor-pointer`}>{uploading === f ? "…" : t("campaigns.upload")}<input type="file" accept="image/*" className="hidden" onChange={(e) => upload(e, f)} /></label>
                    </div>
                    {form[f] && <img src={form[f]} alt="" className="mt-2 h-16 rounded object-cover" loading="lazy" />}
                  </Field>
                ))}
                <Field label={t("campaigns.blocks.imageWidth")} hint={t("campaigns.blocks.dimsHint")}><input className={inputCls} type="number" min="0" max="10000" value={form.imageWidth} onChange={(e) => set({ imageWidth: e.target.value })} /></Field>
                <Field label={t("campaigns.blocks.imageHeight")}><input className={inputCls} type="number" min="0" max="10000" value={form.imageHeight} onChange={(e) => set({ imageHeight: e.target.value })} /></Field>
              </>
            )}
            {["FEATURED_PRODUCTS", "GIFT_COLLECTION"].includes(form.type) && (
              <div className="md:col-span-2">
                <p className="mb-1 text-sm font-medium text-gray-700 dark:text-gray-200">{t("campaigns.blocks.pickProducts")}</p>
                <TargetPicker kind="products" countryCode={campaign.countryCode} selected={form.productIds} onChange={(v) => set({ productIds: v })} />
              </div>
            )}
            {form.type === "FEATURED_CATEGORIES" && (
              <div className="md:col-span-2">
                <p className="mb-1 text-sm font-medium text-gray-700 dark:text-gray-200">{t("campaigns.blocks.pickCategories")}</p>
                <TargetPicker kind="categories" countryCode={campaign.countryCode} selected={form.categoryIds} onChange={(v) => set({ categoryIds: v })} />
              </div>
            )}
          </div>
          <div className="mt-4 flex justify-end gap-2">
            <button type="button" className={btnGhost} onClick={() => setForm(null)}>{t("common.cancel")}</button>
            <button type="button" className={btnPrimary} onClick={save} disabled={saving}>{saving ? t("campaigns.saving") : t("common.save")}</button>
          </div>
        </Card>
      )}

      <ConfirmDialog open={!!confirmDelete} danger title={t("campaigns.blocks.deleteTitle")} body={t("campaigns.blocks.deleteBody")} confirmLabel={t("common.delete")} cancelLabel={t("common.cancel")} onConfirm={remove} onCancel={() => setConfirmDelete(null)} />
    </div>
  );
}
