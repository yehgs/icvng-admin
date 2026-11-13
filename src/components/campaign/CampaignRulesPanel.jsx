// admin/src/components/campaign/CampaignRulesPanel.jsx — discount rules CRUD for one campaign.
import React, { useEffect, useRef, useState } from "react";
import { Plus, Pause, Play, Trash2, Pencil, X, Search } from "lucide-react";
import toast from "react-hot-toast";
import { apiCall, handleApiError } from "../../utils/api";
import { useAdminTranslation } from "../../hooks/useAdminTranslation.js";
import { Field, Toggle, Card, ConfirmDialog, inputCls, btnPrimary, btnGhost, btnDanger } from "./ui.jsx";
import { formatInZone, isoToZonedInput, zonedInputToIso, money } from "./campaignUtils.js";

const EMPTY = {
  name: "", label: "", discountType: "PERCENTAGE", discountValue: "", scope: "ALL",
  productIds: [], categoryIds: [], brandIds: [], minQuantity: 1, maxDiscountAmount: "",
  applyToRegular: true,
  d3: { enabled: false, discountType: "PERCENTAGE", discountValue: "", maxDiscountAmount: "" },
  d5: { enabled: false, discountType: "PERCENTAGE", discountValue: "", maxDiscountAmount: "" },
  startsAt: "", endsAt: "", priority: 0,
};

const SAMPLE_PRICE = 50000;
/** Illustration only (never used for real pricing — the server is authoritative). */
function illustrate(spec) {
  const v = Number(spec.discountValue);
  if (!(v > 0)) return null;
  let off = spec.discountType === "PERCENTAGE" ? (SAMPLE_PRICE * v) / 100 : v;
  const cap = Number(spec.maxDiscountAmount);
  if (cap > 0) off = Math.min(off, cap);
  off = Math.max(0, Math.min(off, SAMPLE_PRICE));
  return { off, final: SAMPLE_PRICE - off };
}

/** One price (regular / 3-week / 5-week) with its own on-switch, type, value and cap. */
function PriceBlock({ title, help, enabled, onToggle, spec, onChange, t }) {
  const ex = enabled ? illustrate(spec) : null;
  return (
    <div className={`rounded-lg border p-3 ${enabled ? "border-blue-300 bg-blue-50/40 dark:border-blue-800 dark:bg-blue-950/20" : "border-gray-200 dark:border-gray-700"}`}>
      <Toggle checked={enabled} onChange={onToggle} label={title} />
      <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">{help}</p>
      {enabled && (
        <div className="mt-3 grid gap-3 sm:grid-cols-3">
          <Field label={t("campaigns.rules.type")} hint={spec.discountType === "PERCENTAGE" ? t("ruleHelp.typePctHint") : t("ruleHelp.typeFixedHint")}>
            <select className={inputCls} value={spec.discountType} onChange={(e) => onChange({ discountType: e.target.value })}>
              <option value="PERCENTAGE">{t("campaigns.rules.type_PERCENTAGE")}</option>
              <option value="FIXED_AMOUNT">{t("campaigns.rules.type_FIXED_AMOUNT")}</option>
            </select>
          </Field>
          <Field label={t("campaigns.rules.value")} hint={spec.discountType === "PERCENTAGE" ? t("campaigns.rules.valueHintPct") : t("campaigns.rules.valueHintFixed")}>
            <input className={inputCls} type="number" min="0" step="0.01" value={spec.discountValue} onChange={(e) => onChange({ discountValue: e.target.value })} />
          </Field>
          <Field label={t("campaigns.rules.maxDiscount")} hint={t("ruleHelp.capHint")}>
            <input className={inputCls} type="number" min="0" step="0.01" value={spec.maxDiscountAmount} onChange={(e) => onChange({ maxDiscountAmount: e.target.value })} />
          </Field>
          <p className="text-xs text-blue-700 dark:text-blue-300 sm:col-span-3">
            {ex ? t("ruleHelp.example", { price: money(SAMPLE_PRICE), final: money(ex.final), saved: money(ex.off) }) : t("ruleHelp.exampleEmpty")}
          </p>
        </div>
      )}
    </div>
  );
}

/** Compact "what does this rule discount" chips for the rules table. */
const specText = (type, value, cap, t) => `${type === "PERCENTAGE" ? `${value}%` : money(value)}${cap ? ` (${t("campaigns.rules.cap")} ${money(cap)})` : ""}`;
export function ruleSummary(r, t) {
  const out = [];
  const dd = r.deliveryDiscounts || {};
  const legacy = r.includeSpecialOrder === true;
  if (r.applyToRegular !== false) out.push([t("ruleHelp.regularShort"), specText(r.discountType, r.discountValue, r.maxDiscountAmount, t)]);
  const d3 = dd.threeWeeks?.enabled ? dd.threeWeeks : legacy && dd.threeWeeks?.enabled === undefined ? r : null;
  const d5 = dd.fiveWeeks?.enabled ? dd.fiveWeeks : legacy && dd.fiveWeeks?.enabled === undefined ? r : null;
  if (d3) out.push([t("ruleHelp.w3Short"), specText(d3.discountType, d3.discountValue, d3.maxDiscountAmount, t)]);
  if (d5) out.push([t("ruleHelp.w5Short"), specText(d5.discountType, d5.discountValue, d5.maxDiscountAmount, t)]);
  return out;
}

/** Search-and-pick list for products / categories / brands (country-scoped on the server). */
export function TargetPicker({ kind, countryCode, selected, onChange, disabled }) {
  const { t } = useAdminTranslation();
  const [q, setQ] = useState("");
  const [results, setResults] = useState([]);
  const [names, setNames] = useState({});
  const [open, setOpen] = useState(false);
  const boxRef = useRef(null);

  // Search only while the box is open (focused). The list is hidden again on outside click / Escape.
  useEffect(() => {
    if (disabled || !open) return undefined;
    const id = setTimeout(async () => {
      try {
        const res = await apiCall(`/campaign/admin/selector/${kind}?q=${encodeURIComponent(q)}&countryCode=${countryCode}`);
        if (res.success) {
          setResults(res.data || []);
          setNames((n) => ({ ...n, ...Object.fromEntries((res.data || []).map((r) => [r._id, r.name])) }));
        }
      } catch { setResults([]); }
    }, 250);
    return () => clearTimeout(id);
  }, [q, kind, countryCode, disabled, open]);

  useEffect(() => {
    if (!open) return undefined;
    const away = (e) => { if (boxRef.current && !boxRef.current.contains(e.target)) setOpen(false); };
    document.addEventListener("mousedown", away);
    document.addEventListener("touchstart", away);
    return () => { document.removeEventListener("mousedown", away); document.removeEventListener("touchstart", away); };
  }, [open]);

  // Already-saved selections arrive as bare ids: look their names up so chips are readable.
  const missing = selected.filter((id) => !names[id]);
  const missingKey = missing.join(",");
  useEffect(() => {
    if (!missingKey) return undefined;
    let cancelled = false;
    apiCall(`/campaign/admin/selector/${kind}?ids=${missingKey}&countryCode=${countryCode}`)
      .then((res) => { if (!cancelled && res.success) setNames((n) => ({ ...n, ...Object.fromEntries((res.data || []).map((r) => [r._id, r.name])) })); })
      .catch(() => {});
    return () => { cancelled = true; };
  }, [missingKey, kind, countryCode]);

  const add = (item) => {
    setNames((n) => ({ ...n, [item._id]: item.name }));
    if (!selected.includes(item._id)) onChange([...selected, item._id]);
  };
  return (
    <div className="space-y-2" ref={boxRef}>
      <div className="relative">
        <Search className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
        <input
          className={`${inputCls} pl-9`}
          value={q}
          onChange={(e) => { setQ(e.target.value); setOpen(true); }}
          onFocus={() => setOpen(true)}
          onKeyDown={(e) => { if (e.key === "Escape") setOpen(false); }}
          placeholder={t(`campaigns.rules.search_${kind}`)}
          disabled={disabled}
          autoComplete="off"
        />
        {open && results.length > 0 && (
          <ul className="absolute z-20 mt-1 max-h-48 w-full overflow-auto rounded-lg border border-gray-200 bg-white text-sm shadow-lg dark:border-gray-600 dark:bg-gray-800">
            {results.map((r) => (
              <li key={r._id}>
                <button type="button" className="flex w-full items-center justify-between px-3 py-1.5 text-left hover:bg-gray-50 dark:hover:bg-gray-700" onClick={() => add(r)} disabled={disabled}>
                  <span>{r.name}{r.sku ? <span className="ml-2 text-xs text-gray-400">{r.sku}</span> : null}{selected.includes(r._id) ? <span className="ml-2 text-xs text-green-600">✓</span> : null}</span>
                  {r.price ? <span className="text-xs text-gray-500">{money(r.price)}</span> : null}
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
      <div className="flex flex-wrap gap-1.5">
        {selected.map((id) => (
          <span key={id} className="inline-flex items-center gap-1 rounded-full bg-blue-50 px-2 py-0.5 text-xs text-blue-700 dark:bg-blue-900/30 dark:text-blue-200">
            {names[id] || "…"}
            {!disabled && (
              <button type="button" aria-label={t("common.delete")} onClick={() => onChange(selected.filter((x) => x !== id))}><X className="h-3 w-3" /></button>
            )}
          </span>
        ))}
      </div>
    </div>
  );
}

// Existing rules saved with the old "also discount special-order prices" switch show as explicit per-price settings.
function loadSpec(rule, key) {
  const c = rule.deliveryDiscounts?.[key];
  if (c?.enabled === true) return { enabled: true, discountType: c.discountType, discountValue: c.discountValue, maxDiscountAmount: c.maxDiscountAmount ?? "" };
  if (c?.enabled === undefined && rule.includeSpecialOrder === true) return { enabled: true, discountType: rule.discountType, discountValue: rule.discountValue, maxDiscountAmount: rule.maxDiscountAmount ?? "" };
  return { enabled: false, discountType: "PERCENTAGE", discountValue: "", maxDiscountAmount: "" };
}
const toSpecBody = (d) => ({ enabled: d.enabled === true, discountType: d.discountType, discountValue: Number(d.discountValue) || 0, maxDiscountAmount: d.maxDiscountAmount === "" || d.maxDiscountAmount == null ? null : Number(d.maxDiscountAmount) });

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
            applyToRegular: rule.applyToRegular !== false,
            d3: loadSpec(rule, "threeWeeks"), d5: loadSpec(rule, "fiveWeeks"),
            startsAt: isoToZonedInput(rule.startsAt, tz), endsAt: isoToZonedInput(rule.endsAt, tz),
          }
        : { ...EMPTY },
    );
  };

  const save = async () => {
    setSaving(true);
    setErrors([]);
    const { d3, d5, ...rest } = form;
    const body = {
      ...rest,
      deliveryDiscounts: { threeWeeks: toSpecBody(d3), fiveWeeks: toSpecBody(d5) },
      discountValue: form.applyToRegular ? Number(form.discountValue) : 0,
      minQuantity: Number(form.minQuantity) || 1,
      maxDiscountAmount: form.applyToRegular && form.maxDiscountAmount !== "" ? Number(form.maxDiscountAmount) : null,
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
                    <td className="pr-3"><div className="flex flex-col gap-0.5">{ruleSummary(r, t).map(([k, v]) => <span key={k} className="whitespace-nowrap text-xs"><b className="mr-1 rounded bg-gray-100 px-1 dark:bg-gray-700">{k}</b>{v}</span>)}</div></td>
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
          <p className="mb-4 rounded-lg bg-gray-50 p-3 text-xs text-gray-600 dark:bg-gray-700/40 dark:text-gray-300">{t("ruleHelp.intro")}</p>

          <h4 className="mb-2 text-sm font-semibold">{t("ruleHelp.secName")}</h4>
          <div className="mb-5 grid gap-3 md:grid-cols-2">
            <Field label={t("campaigns.rules.name")} hint={t("ruleHelp.nameHint")}><input className={inputCls} value={form.name} maxLength={120} onChange={(e) => set({ name: e.target.value })} /></Field>
            <Field label={t("campaigns.rules.label")} hint={t("ruleHelp.labelHint")}><input className={inputCls} value={form.label} maxLength={40} onChange={(e) => set({ label: e.target.value })} /></Field>
          </div>

          <h4 className="mb-1 text-sm font-semibold">{t("ruleHelp.secPrices")}</h4>
          <p className="mb-2 text-xs text-gray-500 dark:text-gray-400">{t("ruleHelp.pricesIntro")}</p>
          <div className="mb-5 space-y-3">
            <PriceBlock t={t} title={t("ruleHelp.regularTitle")} help={t("ruleHelp.regularHelp")} enabled={form.applyToRegular} onToggle={(v) => set({ applyToRegular: v })}
              spec={{ discountType: form.discountType, discountValue: form.discountValue, maxDiscountAmount: form.maxDiscountAmount }}
              onChange={(patch) => set(patch)} />
            <PriceBlock t={t} title={t("ruleHelp.w3Title")} help={t("ruleHelp.w3Help")} enabled={form.d3.enabled} onToggle={(v) => set({ d3: { ...form.d3, enabled: v } })}
              spec={form.d3} onChange={(patch) => set({ d3: { ...form.d3, ...patch } })} />
            <PriceBlock t={t} title={t("ruleHelp.w5Title")} help={t("ruleHelp.w5Help")} enabled={form.d5.enabled} onToggle={(v) => set({ d5: { ...form.d5, enabled: v } })}
              spec={form.d5} onChange={(patch) => set({ d5: { ...form.d5, ...patch } })} />
            {!form.applyToRegular && !form.d3.enabled && !form.d5.enabled && <p className="text-xs text-amber-600">{t("ruleHelp.nothingOn")}</p>}
          </div>

          <h4 className="mb-2 text-sm font-semibold">{t("ruleHelp.secWho")}</h4>
          <div className="mb-5 grid gap-3 md:grid-cols-2">
            <Field label={t("campaigns.rules.scope")} hint={t(`ruleHelp.scopeHint_${form.scope}`)}>
              <select className={inputCls} value={form.scope} onChange={(e) => set({ scope: e.target.value })}>
                {["ALL", "PRODUCT", "CATEGORY", "BRAND"].map((s) => <option key={s} value={s}>{t(`campaigns.rules.scope_${s}`)}</option>)}
              </select>
            </Field>
            <Field label={t("campaigns.rules.minQty")} hint={t("ruleHelp.minQtyHint")}><input className={inputCls} type="number" min="1" value={form.minQuantity} onChange={(e) => set({ minQuantity: e.target.value })} /></Field>
            {form.scope === "PRODUCT" && <div className="md:col-span-2"><TargetPicker kind="products" countryCode={campaign.countryCode} selected={form.productIds} onChange={(v) => set({ productIds: v })} /></div>}
            {form.scope === "CATEGORY" && <div className="md:col-span-2"><TargetPicker kind="categories" countryCode={campaign.countryCode} selected={form.categoryIds} onChange={(v) => set({ categoryIds: v })} /></div>}
            {form.scope === "BRAND" && <div className="md:col-span-2"><TargetPicker kind="brands" countryCode={campaign.countryCode} selected={form.brandIds} onChange={(v) => set({ brandIds: v })} /></div>}
          </div>

          <h4 className="mb-2 text-sm font-semibold">{t("ruleHelp.secTiming")}</h4>
          <div className="grid gap-3 md:grid-cols-2">
            <Field label={t("campaigns.rules.startsAt")} hint={`${t("ruleHelp.windowHint")} (${tz})`}><input className={inputCls} type="datetime-local" value={form.startsAt} onChange={(e) => set({ startsAt: e.target.value })} /></Field>
            <Field label={t("campaigns.rules.endsAt")} hint={t("ruleHelp.endsHint")}><input className={inputCls} type="datetime-local" value={form.endsAt} onChange={(e) => set({ endsAt: e.target.value })} /></Field>
            <Field label={t("campaigns.rules.priority")} hint={t("ruleHelp.priorityHint")}><input className={inputCls} type="number" min="0" max="1000" value={form.priority} onChange={(e) => set({ priority: Number(e.target.value) || 0 })} /></Field>
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
