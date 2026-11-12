// admin/src/components/campaign/CampaignEditor.jsx
//
// Create / edit one campaign. Tabs: General · Country & schedule · Theme & effects
// · Content · Discount rules · Preview & publish.
// Permissions are DECIDED BY THE SERVER (meta.permissions + 403s); the UI only hides
// what the caller cannot do so nobody clicks into a guaranteed refusal.
import React, { useCallback, useEffect, useMemo, useState } from "react";
import { ArrowLeft, Save, Rocket, Pause, Play, Flag, Archive, RotateCcw, AlertTriangle, CheckCircle2, Copy } from "lucide-react";
import toast from "react-hot-toast";
import { apiCall, handleApiError, fileAPI } from "../../utils/api";
import { useAdminTranslation } from "../../hooks/useAdminTranslation.js";
import { Field, Toggle, Card, ConfirmDialog, inputCls, btnPrimary, btnGhost, btnDanger } from "./ui.jsx";
import CampaignThemePreview from "./CampaignThemePreview.jsx";
import CampaignRulesPanel from "./CampaignRulesPanel.jsx";
import CampaignBlocksPanel from "./CampaignBlocksPanel.jsx";
import {
  CAMPAIGN_TYPES, EFFECTS, FONTS, THEME_COLOR_FIELDS, STATUS_STYLE, HEX,
  isoToZonedInput, zonedInputToIso, formatInZone, contrastIssues, slugify, money,
} from "./campaignUtils.js";

const TABS = ["general", "schedule", "theme", "content", "rules", "publish"];
const isoPlus = (days) => new Date(Date.now() + days * 86400000).toISOString();

export default function CampaignEditor({ campaignId, meta, onClose, onChanged }) {
  const { t, language } = useAdminTranslation();
  const isNew = !campaignId;
  const [tab, setTab] = useState(!meta.permissions?.manage && meta.permissions?.discounts ? "rules" : "general");
  const [loading, setLoading] = useState(!isNew);
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState([]);
  const [data, setData] = useState({ campaign: null, rules: [], blocks: [], conflicts: [], warnings: [] });
  const [perf, setPerf] = useState(null);
  const [frame, setFrame] = useState("desktop");
  const [confirm, setConfirm] = useState(null); // { action, danger }
  const [uploading, setUploading] = useState("");

  const defaultCountry = meta.countryCode || meta.countries?.[0]?.code || "NG";
  const tzOf = useCallback((code) => meta.countries?.find((c) => c.code === code)?.timezone || "Africa/Lagos", [meta]);

  // form state mirrors the editable parts of the campaign; dates held as zoned wall-clock strings
  const [form, setForm] = useState(() => ({
    name: "", slug: "", slugTouched: false, type: "BLACK_FRIDAY", tagline: "", description: "", priority: 0,
    showCountdown: false, landingEnabled: true, countryCode: defaultCountry, timezone: tzOf(defaultCountry),
    startsAt: isoToZonedInput(isoPlus(1), tzOf(defaultCountry)), endsAt: isoToZonedInput(isoPlus(8), tzOf(defaultCountry)),
    theme: { ...(meta.presets?.BLACK_FRIDAY || {}) },
  }));

  const load = useCallback(async () => {
    if (isNew) return;
    setLoading(true);
    try {
      const res = await apiCall(`/campaign/admin/${campaignId}`);
      if (res.success) {
        const c = res.data.campaign;
        setData(res.data);
        setForm({
          name: c.name, slug: c.slug, slugTouched: true, type: c.type, tagline: c.tagline || "", description: c.description || "",
          priority: c.priority || 0, showCountdown: !!c.showCountdown, landingEnabled: c.landingEnabled !== false,
          countryCode: c.countryCode, timezone: c.timezone,
          startsAt: isoToZonedInput(c.startsAt, c.timezone), endsAt: isoToZonedInput(c.endsAt, c.timezone),
          theme: { ...c.theme },
        });
        apiCall(`/campaign/admin/${campaignId}/performance`).then((r) => r.success && setPerf(r.data)).catch(() => {});
      }
    } catch (err) {
      toast.error(handleApiError(err, t("campaigns.loadFailed")));
      onClose();
    } finally {
      setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [campaignId, isNew]);
  useEffect(() => { load(); }, [load]);

  const campaign = data.campaign;
  const status = campaign?.status || "DRAFT";
  const publishState = campaign?.publishState || "DRAFT";
  const canManage = !!meta.permissions?.manage;
  const canPublish = !!meta.permissions?.publish;
  // Non-publishers may only edit drafts; nobody edits an archived campaign.
  const canEditContent = canManage && publishState !== "ARCHIVED" && (canPublish || publishState === "DRAFT" || isNew);
  const readOnly = !canEditContent;
  // Accountant: campaigns.discounts only — sees the Discounts tab and nothing else (country-bound by the server).
  const discountsOnly = !canManage && !!meta.permissions?.discounts;
  const canEditRules = (canEditContent || discountsOnly) && publishState !== "ARCHIVED";
  const visibleTabs = discountsOnly ? ["rules"] : TABS;

  const set = (patch) => setForm((f) => ({ ...f, ...patch }));
  const setTheme = (patch) => setForm((f) => ({ ...f, theme: { ...f.theme, ...patch } }));

  const issues = useMemo(() => contrastIssues(form.theme), [form.theme]);
  const tz = form.timezone;
  const startIso = zonedInputToIso(form.startsAt, tz);
  const endIso = zonedInputToIso(form.endsAt, tz);
  const datesOk = startIso && endIso && new Date(endIso) > new Date(startIso);

  const applyPreset = (key) => {
    const p = meta.presets?.[key];
    if (p) setForm((f) => ({ ...f, theme: { ...p } }));
  };

  const body = () => ({
    name: form.name, slug: form.slug || slugify(form.name), type: form.type, tagline: form.tagline, description: form.description,
    priority: Number(form.priority) || 0, showCountdown: form.showCountdown, landingEnabled: form.landingEnabled, timezone: form.timezone,
    startsAt: startIso, endsAt: endIso, theme: form.theme,
    ...(isNew ? { countryCode: form.countryCode } : {}),
  });

  const save = async () => {
    setSaving(true); setErrors([]);
    try {
      const res = await apiCall(isNew ? "/campaign/admin/create" : `/campaign/admin/${campaignId}`, { method: isNew ? "POST" : "PUT", body: body() });
      if (res.success) {
        toast.success(isNew ? t("campaigns.created") : t("campaigns.saved"));
        onChanged();
        if (isNew) onClose(res.data._id); else load();
      }
    } catch (err) {
      const list = err?.response?.data?.errors;
      setErrors(Array.isArray(list) && list.length ? list : [handleApiError(err, t("campaigns.saveFailed"))]);
    } finally { setSaving(false); }
  };

  const transition = async (action) => {
    try {
      const res = await apiCall(`/campaign/admin/${campaignId}/${action}`, { method: "POST", body: {} });
      if (res.success) { toast.success(t(`campaigns.action.${action}Done`)); onChanged(); load(); }
    } catch (err) {
      const conflicts = err?.response?.data?.conflicts;
      toast.error(handleApiError(err, t("campaigns.saveFailed")) + (conflicts?.length ? "" : ""), { duration: 6000 });
    }
    setConfirm(null);
  };

  const duplicate = async () => {
    try {
      const res = await apiCall(`/campaign/admin/${campaignId}/duplicate`, { method: "POST", body: { countryCode: form.countryCode } });
      if (res.success) { toast.success(t("campaigns.duplicated")); onChanged(); onClose(res.data._id); }
    } catch (err) { toast.error(handleApiError(err, t("campaigns.saveFailed"))); }
  };

  const upload = async (e, field) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(field);
    try {
      const res = await fileAPI.uploadImage(file);
      if (res?.data?.url) setTheme({ [field]: res.data.url });
    } catch { toast.error(t("campaigns.uploadFailed")); }
    finally { setUploading(""); }
  };

  if (loading) return <div className="p-10 text-center text-gray-500">{t("common.loading")}</div>;

  const checklist = [
    { ok: !!campaign && data.rules.some((r) => r.status === "ACTIVE"), label: t("campaigns.publish.checkRules") },
    { ok: !!datesOk && new Date(endIso) > new Date(), label: t("campaigns.publish.checkDates") },
    { ok: issues.length === 0, label: t("campaigns.publish.checkTheme") },
    { ok: (data.conflicts || []).length === 0, label: t("campaigns.publish.checkConflicts") },
  ];

  const tabDisabled = (id) => isNew && id !== "general" && id !== "schedule" && id !== "theme";

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-3">
        <button type="button" className={btnGhost} onClick={() => onClose()}><ArrowLeft className="h-4 w-4" />{t("common.back")}</button>
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white">{isNew ? t("campaigns.newCampaign") : form.name}</h2>
        {!isNew && <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${STATUS_STYLE[status]}`}>{t(`campaigns.status.${status}`)}</span>}
        {!isNew && <span className="rounded bg-gray-100 px-2 py-0.5 text-xs font-medium dark:bg-gray-700">{campaign.country?.name || campaign.countryCode} · {campaign.countryCode}</span>}
        <div className="ml-auto flex gap-2">
          {!isNew && canManage && <button type="button" className={btnGhost} onClick={duplicate}><Copy className="h-4 w-4" />{t("campaigns.duplicate")}</button>}
          {canEditContent && <button type="button" className={btnPrimary} onClick={save} disabled={saving || !form.name || !datesOk}><Save className="h-4 w-4" />{saving ? t("campaigns.saving") : isNew ? t("campaigns.createDraft") : t("campaigns.saveChanges")}</button>}
        </div>
      </div>

      {discountsOnly && (
        <p className="rounded-lg bg-blue-50 p-3 text-sm text-blue-800 dark:bg-blue-900/20 dark:text-blue-200">{t("campaigns.discountsOnlyNotice")}</p>
      )}
      {!isNew && !canPublish && !discountsOnly && publishState !== "DRAFT" && (
        <p className="rounded-lg bg-amber-50 p-3 text-sm text-amber-800 dark:bg-amber-900/20 dark:text-amber-200">{t("campaigns.draftOnlyNotice")}</p>
      )}
      {errors.length > 0 && <ul className="list-disc rounded-lg bg-red-50 p-3 pl-6 text-sm text-red-700" role="alert">{errors.map((e) => <li key={e}>{e}</li>)}</ul>}

      <div role="tablist" className="flex gap-1 overflow-x-auto border-b border-gray-200 dark:border-gray-700">
        {visibleTabs.map((id) => (
          <button key={id} role="tab" aria-selected={tab === id} type="button" disabled={tabDisabled(id)} onClick={() => setTab(id)}
            className={`whitespace-nowrap px-4 py-2 text-sm font-medium disabled:opacity-40 ${tab === id ? "border-b-2 border-blue-600 text-blue-600" : "text-gray-600 hover:text-gray-900 dark:text-gray-300"}`}>
            {t(`campaigns.tabs.${id}`)}
          </button>
        ))}
      </div>

      {tab === "general" && (
        <Card title={t("campaigns.tabs.general")}>
          <div className="grid gap-3 md:grid-cols-2">
            <Field label={t("campaigns.fields.name")}><input className={inputCls} value={form.name} maxLength={120} disabled={readOnly}
              onChange={(e) => set({ name: e.target.value, ...(form.slugTouched ? {} : { slug: slugify(e.target.value) }) })} /></Field>
            <Field label={t("campaigns.fields.slug")} hint={t("campaigns.fields.slugHint")}><input className={inputCls} value={form.slug} disabled={readOnly} onChange={(e) => set({ slug: slugify(e.target.value), slugTouched: true })} /></Field>
            <Field label={t("campaigns.fields.type")}>
              <select className={inputCls} value={form.type} disabled={readOnly} onChange={(e) => { set({ type: e.target.value }); if (isNew && meta.presets?.[e.target.value]) applyPreset(e.target.value); }}>
                {CAMPAIGN_TYPES.map((x) => <option key={x} value={x}>{t(`campaigns.type.${x}`)}</option>)}
              </select>
            </Field>
            <Field label={t("campaigns.fields.priority")} hint={t("campaigns.fields.priorityHint")}><input className={inputCls} type="number" value={form.priority} disabled={readOnly} onChange={(e) => set({ priority: e.target.value })} /></Field>
            <Field label={t("campaigns.fields.tagline")} className="md:col-span-2"><input className={inputCls} maxLength={200} value={form.tagline} disabled={readOnly} onChange={(e) => set({ tagline: e.target.value })} /></Field>
            <Field label={t("campaigns.fields.description")} className="md:col-span-2"><textarea className={inputCls} rows={3} maxLength={2000} value={form.description} disabled={readOnly} onChange={(e) => set({ description: e.target.value })} /></Field>
            <Toggle checked={form.showCountdown} disabled={readOnly} onChange={(v) => set({ showCountdown: v })} label={t("campaigns.fields.showCountdown")} />
            <Toggle checked={form.landingEnabled} disabled={readOnly} onChange={(v) => set({ landingEnabled: v })} label={t("campaigns.fields.landingEnabled")} />
          </div>
        </Card>
      )}

      {tab === "schedule" && (
        <Card title={t("campaigns.tabs.schedule")}>
          <div className="grid gap-3 md:grid-cols-2">
            <Field label={t("campaigns.fields.country")} hint={isNew ? (meta.isGlobal ? t("campaigns.fields.countryHintGlobal") : t("campaigns.fields.countryHintLocked")) : t("campaigns.fields.countryLocked")}>
              <select className={inputCls} value={form.countryCode} disabled={!isNew || !meta.isGlobal}
                onChange={(e) => set({ countryCode: e.target.value, timezone: tzOf(e.target.value), startsAt: isoToZonedInput(startIso, tzOf(e.target.value)), endsAt: isoToZonedInput(endIso, tzOf(e.target.value)) })}>
                {(meta.countries || []).map((c) => <option key={c.code} value={c.code}>{c.name || c.code} ({c.code})</option>)}
              </select>
            </Field>
            <Field label={t("campaigns.fields.timezone")} hint={t("campaigns.fields.timezoneHint")}><input className={inputCls} value={form.timezone} disabled={readOnly} onChange={(e) => set({ timezone: e.target.value })} /></Field>
            <Field label={t("campaigns.fields.startsAt")}><input className={inputCls} type="datetime-local" value={form.startsAt} disabled={readOnly} onChange={(e) => set({ startsAt: e.target.value })} /></Field>
            <Field label={t("campaigns.fields.endsAt")} error={form.startsAt && form.endsAt && !datesOk ? t("campaigns.fields.endAfterStart") : ""}><input className={inputCls} type="datetime-local" value={form.endsAt} disabled={readOnly} onChange={(e) => set({ endsAt: e.target.value })} /></Field>
          </div>
          {datesOk && <p className="mt-3 text-xs text-gray-500">{t("campaigns.fields.scheduleSummary", { start: formatInZone(startIso, tz, language), end: formatInZone(endIso, tz, language), tz })}</p>}
        </Card>
      )}

      {tab === "theme" && (
        <div className="grid gap-4 lg:grid-cols-2">
          <Card title={t("campaigns.tabs.theme")}>
            <div className="mb-3 flex flex-wrap gap-2">
              {Object.keys(meta.presets || {}).map((k) => (
                <button key={k} type="button" disabled={readOnly} onClick={() => applyPreset(k)} className={`${btnGhost} ${form.theme.preset === k ? "ring-2 ring-blue-500" : ""}`}>{t(`campaigns.type.${k}`)}</button>
              ))}
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              {THEME_COLOR_FIELDS.map((f) => (
                <Field key={f} label={t(`campaigns.theme.${f}`)} error={form.theme[f] && !HEX.test(form.theme[f]) ? t("campaigns.theme.badHex") : ""}>
                  <div className="flex items-center gap-2">
                    <input type="color" aria-label={t(`campaigns.theme.${f}`)} className="h-9 w-10 rounded border" value={HEX.test(form.theme[f] || "") ? form.theme[f] : "#000000"} disabled={readOnly} onChange={(e) => setTheme({ [f]: e.target.value.toUpperCase() })} />
                    <input className={inputCls} value={form.theme[f] || ""} maxLength={7} disabled={readOnly} onChange={(e) => setTheme({ [f]: e.target.value })} />
                  </div>
                </Field>
              ))}
              <Field label={t("campaigns.theme.fontFamily")}>
                <select className={inputCls} value={form.theme.fontFamily || "DEFAULT"} disabled={readOnly} onChange={(e) => setTheme({ fontFamily: e.target.value })}>
                  {FONTS.map((x) => <option key={x} value={x}>{t(`campaigns.theme.font_${x}`)}</option>)}
                </select>
              </Field>
              <Field label={t("campaigns.theme.effect")}>
                <select className={inputCls} value={form.theme.effect || "NONE"} disabled={readOnly} onChange={(e) => setTheme({ effect: e.target.value })}>
                  {EFFECTS.map((x) => <option key={x} value={x}>{t(`campaigns.theme.effect_${x}`)}</option>)}
                </select>
              </Field>
              <Toggle checked={form.theme.effectEnabled} disabled={readOnly} onChange={(v) => setTheme({ effectEnabled: v })} label={t("campaigns.theme.effectEnabled")} />
              <Field label={`${t("campaigns.theme.effectIntensity")}: ${form.theme.effectIntensity ?? 4}`} hint={t("campaigns.theme.effectHint")}>
                <input type="range" min="1" max="10" className="w-full" value={form.theme.effectIntensity ?? 4} disabled={readOnly} onChange={(e) => setTheme({ effectIntensity: Number(e.target.value) })} />
              </Field>
              {["bannerImage", "mobileBannerImage"].map((f) => (
                <Field key={f} label={t(`campaigns.theme.${f}`)} className="sm:col-span-2">
                  <div className="flex items-center gap-2">
                    <input className={inputCls} value={form.theme[f] || ""} disabled={readOnly} onChange={(e) => setTheme({ [f]: e.target.value })} placeholder="https://…" />
                    <label className={`${btnGhost} cursor-pointer`}>{uploading === f ? "…" : t("campaigns.upload")}<input type="file" accept="image/*" className="hidden" disabled={readOnly} onChange={(e) => upload(e, f)} /></label>
                  </div>
                </Field>
              ))}
            </div>
            {issues.length > 0 && (
              <ul className="mt-3 space-y-1 rounded-lg bg-amber-50 p-3 text-xs text-amber-800 dark:bg-amber-900/20 dark:text-amber-200" role="alert">
                {issues.map((i) => <li key={`${i.fg}${i.bg}`}><AlertTriangle className="mr-1 inline h-3 w-3" />{t("campaigns.theme.contrastIssue", { fg: t(`campaigns.theme.${i.fg}`), bg: t(`campaigns.theme.${i.bg}`), ratio: i.ratio.toFixed(2), min: i.min })}</li>)}
              </ul>
            )}
            <p className="mt-3 text-xs text-gray-500">{t("campaigns.theme.noCustomCss")}</p>
          </Card>
          <Card title={t("campaigns.preview.title")}>
            <div className="mb-3 flex gap-2">
              {["desktop", "mobile", "app"].map((f) => <button key={f} type="button" onClick={() => setFrame(f)} className={`${btnGhost} ${frame === f ? "ring-2 ring-blue-500" : ""}`}>{t(`campaigns.preview.frame_${f}`)}</button>)}
            </div>
            <CampaignThemePreview theme={form.theme} name={form.name} tagline={form.tagline} endsAt={endIso} showCountdown={form.showCountdown} frame={frame} />
          </Card>
        </div>
      )}

      {tab === "content" && campaign && <CampaignBlocksPanel campaign={campaign} blocks={data.blocks} canEdit={canEditContent} reload={load} />}
      {tab === "rules" && campaign && <CampaignRulesPanel campaign={campaign} rules={data.rules} canEdit={canEditRules} reload={load} />}

      {tab === "publish" && campaign && (
        <div className="grid gap-4 lg:grid-cols-2">
          <Card title={t("campaigns.publish.readiness")}>
            <ul className="space-y-2 text-sm">
              {checklist.map((c) => (
                <li key={c.label} className="flex items-center gap-2">
                  {c.ok ? <CheckCircle2 className="h-4 w-4 text-green-600" /> : <AlertTriangle className="h-4 w-4 text-amber-500" />}
                  <span className={c.ok ? "" : "text-amber-700 dark:text-amber-300"}>{c.label}</span>
                </li>
              ))}
            </ul>
            {(data.conflicts || []).length > 0 && <p className="mt-3 rounded-lg bg-red-50 p-3 text-sm text-red-700">{t("campaigns.publish.conflictWith", { name: data.conflicts.map((c) => c.name).join(", ") })}</p>}
            {(data.warnings || []).length > 0 && <p className="mt-3 rounded-lg bg-amber-50 p-3 text-sm text-amber-800">{t("campaigns.publish.overlapWarning", { name: data.warnings.map((c) => c.name).join(", ") })}</p>}
            <p className="mt-3 text-xs text-gray-500">{t("campaigns.publish.when", { start: formatInZone(campaign.startsAt, campaign.timezone, language), end: formatInZone(campaign.endsAt, campaign.timezone, language) })}</p>

            {canPublish ? (
              <div className="mt-4 flex flex-wrap gap-2">
                {publishState === "DRAFT" && <button type="button" className={btnPrimary} onClick={() => setConfirm({ action: "publish" })}><Rocket className="h-4 w-4" />{publishState === "DRAFT" && new Date(campaign.startsAt) > new Date() ? t("campaigns.action.schedule") : t("campaigns.action.publish")}</button>}
                {publishState === "PUBLISHED" && status !== "ENDED" && <button type="button" className={btnGhost} onClick={() => setConfirm({ action: "pause" })}><Pause className="h-4 w-4" />{t("campaigns.action.pause")}</button>}
                {publishState === "PAUSED" && <button type="button" className={btnPrimary} onClick={() => setConfirm({ action: "resume" })}><Play className="h-4 w-4" />{t("campaigns.action.resume")}</button>}
                {["PUBLISHED", "PAUSED"].includes(publishState) && status !== "ENDED" && <button type="button" className={btnDanger} onClick={() => setConfirm({ action: "end", danger: true })}><Flag className="h-4 w-4" />{t("campaigns.action.end")}</button>}
                {publishState !== "ARCHIVED" && publishState !== "PUBLISHED" && <button type="button" className={btnGhost} onClick={() => setConfirm({ action: "archive", danger: true })}><Archive className="h-4 w-4" />{t("campaigns.action.archive")}</button>}
                {publishState === "PUBLISHED" && status === "ENDED" && <button type="button" className={btnGhost} onClick={() => setConfirm({ action: "archive", danger: true })}><Archive className="h-4 w-4" />{t("campaigns.action.archive")}</button>}
                {publishState === "ARCHIVED" && <button type="button" className={btnGhost} onClick={() => setConfirm({ action: "restore" })}><RotateCcw className="h-4 w-4" />{t("campaigns.action.restore")}</button>}
              </div>
            ) : <p className="mt-4 text-sm text-gray-500">{t("campaigns.publish.noPublishRight")}</p>}
          </Card>

          <Card title={t("campaigns.preview.title")}>
            <div className="mb-3 flex gap-2">
              {["desktop", "mobile", "app"].map((f) => <button key={f} type="button" onClick={() => setFrame(f)} className={`${btnGhost} ${frame === f ? "ring-2 ring-blue-500" : ""}`}>{t(`campaigns.preview.frame_${f}`)}</button>)}
            </div>
            <CampaignThemePreview theme={campaign.theme} name={campaign.name} tagline={campaign.tagline} endsAt={campaign.endsAt} showCountdown={campaign.showCountdown} frame={frame} />
          </Card>

          <Card title={t("campaigns.performance.title")}>
            {perf && perf.totals.orderLines > 0 ? (
              <dl className="grid grid-cols-2 gap-3 text-sm">
                <div><dt className="text-xs text-gray-500">{t("campaigns.performance.orders")}</dt><dd className="text-lg font-semibold">{perf.totals.orderLines}</dd></div>
                <div><dt className="text-xs text-gray-500">{t("campaigns.performance.units")}</dt><dd className="text-lg font-semibold">{perf.totals.units}</dd></div>
                <div><dt className="text-xs text-gray-500">{t("campaigns.performance.discount")}</dt><dd className="text-lg font-semibold">{money(perf.totals.discountGiven, perf.currency)}</dd></div>
                <div><dt className="text-xs text-gray-500">{t("campaigns.performance.revenue")}</dt><dd className="text-lg font-semibold">{money(perf.totals.revenue, perf.currency)}</dd></div>
              </dl>
            ) : <p className="text-sm text-gray-500">{t("campaigns.performance.none")}</p>}
          </Card>

          <Card title={t("campaigns.history.title")}>
            <ul className="max-h-64 space-y-2 overflow-auto text-sm">
              {[...(campaign.history || [])].reverse().map((h, i) => (
                <li key={i} className="flex justify-between gap-3 border-b pb-1 last:border-0 dark:border-gray-700">
                  <span>{t(`campaigns.history.${h.action}`)}{h.note ? ` — ${h.note}` : ""}</span>
                  <span className="whitespace-nowrap text-xs text-gray-500">{h.byName || "—"} · {formatInZone(h.at, campaign.timezone, language)}</span>
                </li>
              ))}
            </ul>
          </Card>
        </div>
      )}

      <ConfirmDialog
        open={!!confirm} danger={confirm?.danger}
        title={confirm ? t(`campaigns.confirm.${confirm.action}Title`) : ""} body={confirm ? t(`campaigns.confirm.${confirm.action}Body`, { name: form.name }) : ""}
        confirmLabel={confirm ? t(`campaigns.action.${confirm.action}`) : ""} cancelLabel={t("common.cancel")}
        onConfirm={() => transition(confirm.action)} onCancel={() => setConfirm(null)}
      />
    </div>
  );
}
