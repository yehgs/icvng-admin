// admin/src/components/campaign/CampaignRulesPanel.jsx — discount rules CRUD for one campaign.
import React, { useEffect, useState } from "react";
import { Plus, Pause, Play, Trash2, Pencil, X, Search } from "lucide-react";
import toast from "react-hot-toast";
import { apiCall, handleApiError } from "../../utils/api";
import { useAdminTranslation } from "../../hooks/useAdminTranslation.js";
import { Field, Toggle, Card, ConfirmDialog, inputCls, btnPrimary, btnGhost, btnDanger } from "./ui.jsx";
import { formatInZone, isoToZonedInput, zonedInputToIso, money } from "./campaignUtils.js";

const EMPTY = {
  name: "", label: "", discountType: "PERCENTAGE", discountValue: "", scope: "ALL",
  productIds: [], categoryIds: [], brandIds: [], minQuantity: 1, maxDiscountAmount: "",
  includeSpecialOrder: false, startsAt: "", endsAt: "", priority: 0,
};

/** Search-and-pick list for products / categories / brands (country-scoped on the server). */
export function TargetPicker({ kind, countryCode, selected, onChange, disabled }) {
  const { t } = useAdminTranslation();
  const [q, setQ] = useState("");
  const [results, setResults] = useState([]);
  const [names, setNames] = useState({});
  useEffect(() => {
    if (disabled) return undefined;
    const id = setTimeout(async () => {
      try {
        const res = await apiCall(`/campaign/admin/selector/${kind}?q=${encodeURIComponent(q)}&countryCode=${countryCode}`);
        if (res.success) setResults(res.data || []);
      } catch { setResults([]); }
    }, 250);
    return () => clearTimeout(id);
  }, [q, kind, countryCode, disabled]);

  const add = (item) => {
    setNames((n) => ({ ...n, [item._id]: item.name }));
    if (!selected.includes(item._id)) onChange([...selected, item._id]);
  };
  return (
    <div className="space-y-2">
      <div className="relative">
        <Search className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
        <input className={`${inputCls} pl-9`} value={q} onChange={(e) => setQ(e.target.value)} placeholder={t(`campaigns.rules.search_${kind}`)} disabled={disabled} />
      </div>
      {results.length > 0 && (
        <ul className="max-h-36 overflow-auto rounded-lg border border-gray-200 text-sm dark:border-gray-600">
          {results.map((r) => (
            <li key={r._id}>
              <button type="button" className="flex w-full items-center justify-between px-3 py-1.5 text-left hover:bg-gray-50 dark:hover:bg-gray-700" onClick={() => add(r)} disabled={disabled}>
                <span>{r.name}{r.sku ? <span className="ml-2 text-xs text-gray-400">{r.sku}</span> : null}</span>
                {r.price ? <span className="text-xs text-gray-500">{money(r.price)}</span> : null}
              </button>
            </li>
          ))}
        </ul>
      )}
      <div className="flex flex-wrap gap-1.5">
        {selected.map((id) => (
          <span key={id} className="inline-flex items-center gap-1 rounded-full bg-blue-50 px-2 py-0.5 text-xs text-blue-700 dark:bg-blue-900/30 dark:text-blue-200">
            {names[id] || id.slice(-6)}
            {!disabled && (
              <button type="button" aria-label={t("common.delete")} onClick={() => onChange(selected.filter((x) => x !== id))}><X className="h-3 w-3" /></button>
            )}
          </span>
        ))}
      </div>
    </div>
  );
}

export default function CampaignRulesPanel({ campaign, rules, canEdit, reload }) {
  const { t } = useAdminTranslation();
  const [form, setForm] = useState(null); // null = closed
  const [editingId, setEditingId] = useState(null);
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState([]);
  const [confirmDelete, setConfirmDelete] = useState(null);
  const tz = campaign.timezone;

  const open = (rule) => {
    setErrors([]);
    setEditingId(rule?._id || null);
    setForm(
      rule
        ? {
            ...EMPTY, ...rule,
            productIds: (rule.productIds || []).map(String), categoryIds: (rule.categoryIds || []).map(String), brandIds: (rule.brandIds || []).map(String),
            maxDiscountAmount: rule.maxDiscountAmount ?? "",
            startsAt: isoToZonedInput(rule.startsAt, tz), endsAt: isoToZonedInput(rule.endsAt, tz),
          }
        : { ...EMPTY },
    );
  };

  const save = async () => {
    setSaving(true);
    setErrors([]);
    const body = {
      ...form,
      discountValue: Number(form.discountValue),
      minQuantity: Number(form.minQuantity) || 1,
      maxDiscountAmount: form.maxDiscountAmount === "" ? null : Number(form.maxDiscountAmount),
      startsAt: form.startsAt ? zonedInputToIso(form.startsAt, tz) : null,
      endsAt: form.endsAt ? zonedInputToIso(form.endsAt, tz) : null,
    };
    try {
      const res = await apiCall(editingId ? `/campaign/admin/${campaign._id}/rules/${editingId}` : `/campaign/admin/${campaign._id}/rules`, { method: editingId ? "PUT" : "POST", body });
      if (res.success) {
        toast.success(t("campaigns.rules.saved"));
        setForm(null);
        reload();
      }
    } catch (err) {
      const list = err?.response?.data?.errors;
      setErrors(Array.isArray(list) && list.length ? list : [handleApiError(err, t("campaigns.rules.saveFailed"))]);
    } finally {
      setSaving(false);
    }
  };

  const act = async (rule, action) => {
    try {
      const res = await apiCall(`/campaign/admin/${campaign._id}/rules/${rule._id}/${action}`, { method: "POST", body: {} });
      if (res.success) reload();
    } catch (err) { toast.error(handleApiError(err, t("campaigns.rules.saveFailed"))); }
  };

  const remove = async () => {
    try {
      const res = await apiCall(`/campaign/admin/${campaign._id}/rules/${confirmDelete._id}`, { method: "DELETE" });
      if (res.success) { toast.success(t("campaigns.rules.deleted")); reload(); }
    } catch (err) { toast.error(handleApiError(err, t("campaigns.rules.saveFailed"))); }
    setConfirmDelete(null);
  };

  const valueLabel = (r) => (r.discountType === "PERCENTAGE" ? `${r.discountValue}%` : money(r.discountValue));
  const set = (patch) => setForm((f) => ({ ...f, ...patch }));

  return (
    <div className="space-y-4">
      <Card
        title={t("campaigns.rules.title")}
        actions={canEdit && <button type="button" className={btnPrimary} onClick={() => open(null)}><Plus className="h-4 w-4" />{t("campaigns.rules.add")}</button>}
      >
        <p className="mb-3 text-xs text-gray-500 dark:text-gray-400">{t("campaigns.rules.policy")}</p>
        {rules.length === 0 ? (
          <p className="py-6 text-center text-sm text-gray-500">{t("campaigns.rules.empty")}</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-left text-xs uppercase text-gray-500 dark:border-gray-700">
                  <th className="py-2 pr-3">{t("campaigns.rules.name")}</th><th className="pr-3">{t("campaigns.rules.discount")}</th>
                  <th className="pr-3">{t("campaigns.rules.appliesTo")}</th><th className="pr-3">{t("campaigns.rules.window")}</th>
                  <th className="pr-3">{t("campaigns.rules.status")}</th><th />
                </tr>
              </thead>
              <tbody>
                {rules.map((r) => (
                  <tr key={r._id} className="border-b last:border-0 dark:border-gray-700">
                    <td className="py-2 pr-3 font-medium">{r.name}{r.label ? <span className="ml-2 rounded bg-gray-100 px-1.5 text-xs dark:bg-gray-700">{r.label}</span> : null}</td>
                    <td className="pr-3">{valueLabel(r)}{r.maxDiscountAmount ? <span className="ml-1 text-xs text-gray-400">({t("campaigns.rules.cap")} {money(r.maxDiscountAmount)})</span> : null}</td>
                    <td className="pr-3">{t(`campaigns.rules.scope_${r.scope}`)}{r.scope !== "ALL" ? ` (${(r.productIds?.length || r.categoryIds?.length || r.brandIds?.length || 0)})` : ""}{r.minQuantity > 1 ? ` · ≥${r.minQuantity}` : ""}</td>
                    <td className="pr-3 text-xs text-gray-500">{r.startsAt || r.endsAt ? `${formatInZone(r.startsAt, tz)} → ${formatInZone(r.endsAt, tz)}` : t("campaigns.rules.wholeCampaign")}</td>
                    <td className="pr-3"><span className={`rounded-full px-2 py-0.5 text-xs ${r.status === "ACTIVE" ? "bg-green-100 text-green-700" : r.status === "PAUSED" ? "bg-amber-100 text-amber-700" : "bg-gray-100 text-gray-600"}`}>{t(`campaigns.rules.status_${r.status}`)}</span></td>
                    <td className="py-2 text-right">
                      {canEdit && (
                        <span className="inline-flex gap-1">
                          <button type="button" className={btnGhost} onClick={() => open(r)} aria-label={t("common.edit")}><Pencil className="h-4 w-4" /></button>
                          {r.status === "ACTIVE" ? (
                            <button type="button" className={btnGhost} onClick={() => act(r, "pause")} aria-label={t("campaigns.rules.pause")}><Pause className="h-4 w-4" /></button>
                          ) : (
                            <button type="button" className={btnGhost} onClick={() => act(r, "activate")} aria-label={t("campaigns.rules.activate")}><Play className="h-4 w-4" /></button>
                          )}
                          <button type="button" className={btnDanger} onClick={() => setConfirmDelete(r)} aria-label={t("common.delete")}><Trash2 className="h-4 w-4" /></button>
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {form && (
        <Card title={editingId ? t("campaigns.rules.edit") : t("campaigns.rules.add")} actions={<button type="button" onClick={() => setForm(null)} aria-label={t("common.cancel")}><X className="h-4 w-4" /></button>}>
          {errors.length > 0 && (
            <ul className="mb-3 list-disc rounded-lg bg-red-50 p-3 pl-6 text-sm text-red-700" role="alert">{errors.map((e) => <li key={e}>{e}</li>)}</ul>
          )}
          <div className="grid gap-3 md:grid-cols-2">
            <Field label={t("campaigns.rules.name")}><input className={inputCls} value={form.name} maxLength={120} onChange={(e) => set({ name: e.target.value })} /></Field>
            <Field label={t("campaigns.rules.label")} hint={t("campaigns.rules.labelHint")}><input className={inputCls} value={form.label} maxLength={40} onChange={(e) => set({ label: e.target.value })} /></Field>
            <Field label={t("campaigns.rules.type")}>
              <select className={inputCls} value={form.discountType} onChange={(e) => set({ discountType: e.target.value })}>
                <option value="PERCENTAGE">{t("campaigns.rules.type_PERCENTAGE")}</option>
                <option value="FIXED_AMOUNT">{t("campaigns.rules.type_FIXED_AMOUNT")}</option>
              </select>
            </Field>
            <Field label={t("campaigns.rules.value")} hint={form.discountType === "PERCENTAGE" ? t("campaigns.rules.valueHintPct") : t("campaigns.rules.valueHintFixed")}>
              <input className={inputCls} type="number" min="0" step="0.01" value={form.discountValue} onChange={(e) => set({ discountValue: e.target.value })} />
            </Field>
            <Field label={t("campaigns.rules.scope")}>
              <select className={inputCls} value={form.scope} onChange={(e) => set({ scope: e.target.value })}>
                {["ALL", "PRODUCT", "CATEGORY", "BRAND"].map((s) => <option key={s} value={s}>{t(`campaigns.rules.scope_${s}`)}</option>)}
              </select>
            </Field>
            <Field label={t("campaigns.rules.minQty")}><input className={inputCls} type="number" min="1" value={form.minQuantity} onChange={(e) => set({ minQuantity: e.target.value })} /></Field>
            {form.scope === "PRODUCT" && <div className="md:col-span-2"><TargetPicker kind="products" countryCode={campaign.countryCode} selected={form.productIds} onChange={(v) => set({ productIds: v })} /></div>}
            {form.scope === "CATEGORY" && <div className="md:col-span-2"><TargetPicker kind="categories" countryCode={campaign.countryCode} selected={form.categoryIds} onChange={(v) => set({ categoryIds: v })} /></div>}
            {form.scope === "BRAND" && <div className="md:col-span-2"><TargetPicker kind="brands" countryCode={campaign.countryCode} selected={form.brandIds} onChange={(v) => set({ brandIds: v })} /></div>}
            <Field label={t("campaigns.rules.maxDiscount")} hint={t("campaigns.rules.maxDiscountHint")}><input className={inputCls} type="number" min="0" step="0.01" value={form.maxDiscountAmount} onChange={(e) => set({ maxDiscountAmount: e.target.value })} /></Field>
            <Field label={t("campaigns.rules.priority")}><input className={inputCls} type="number" value={form.priority} onChange={(e) => set({ priority: Number(e.target.value) || 0 })} /></Field>
            <Field label={t("campaigns.rules.startsAt")} hint={`${t("campaigns.rules.optionalWindow")} (${tz})`}><input className={inputCls} type="datetime-local" value={form.startsAt} onChange={(e) => set({ startsAt: e.target.value })} /></Field>
            <Field label={t("campaigns.rules.endsAt")}><input className={inputCls} type="datetime-local" value={form.endsAt} onChange={(e) => set({ endsAt: e.target.value })} /></Field>
            <div className="md:col-span-2"><Toggle checked={form.includeSpecialOrder} onChange={(v) => set({ includeSpecialOrder: v })} label={t("campaigns.rules.includeSpecial")} /></div>
          </div>
          <div className="mt-4 flex justify-end gap-2">
            <button type="button" className={btnGhost} onClick={() => setForm(null)}>{t("common.cancel")}</button>
            <button type="button" className={btnPrimary} onClick={save} disabled={saving}>{saving ? t("campaigns.saving") : t("common.save")}</button>
          </div>
        </Card>
      )}

      <ConfirmDialog
        open={!!confirmDelete} danger title={t("campaigns.rules.deleteTitle")} body={t("campaigns.rules.deleteBody", { name: confirmDelete?.name || "" })}
        confirmLabel={t("common.delete")} cancelLabel={t("common.cancel")} onConfirm={remove} onCancel={() => setConfirmDelete(null)}
      />
    </div>
  );
}
