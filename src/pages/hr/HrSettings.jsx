import React, { useCallback, useEffect, useState } from "react";
import toast from "react-hot-toast";
import { Plus, Trash2, LocateFixed, Upload } from "lucide-react";
import { useAdminTranslation } from "../../hooks/useAdminTranslation.js";
import { handleApiError, fileAPI } from "../../utils/api";
import { Card, ConfirmDialog, Field, Toggle, inputCls, btnPrimary, btnGhost, btnDanger } from "../../components/campaign/ui.jsx";
import { useHr, hrGet, hrSend, Spinner } from "./hrApi.js";

const blankOffice = () => ({ name: "", address: "", lat: "", lng: "", radiusMeters: 150, notifyEmails: "", enforceGeofence: false, isActive: true });

export default function HrSettings() {
  const { t } = useAdminTranslation();
  const { country, can } = useHr();
  const [settings, setSettings] = useState(null);
  const [offices, setOffices] = useState(null);
  const [holidays, setHolidays] = useState([]);
  const [office, setOffice] = useState(null);
  const [holiday, setHoliday] = useState({ name: "", date: "" });
  const [del, setDel] = useState(null);
  const [uploading, setUploading] = useState("");

  const load = useCallback(async () => {
    try {
      const [s, o, h] = await Promise.all([hrGet("/settings", { countryCode: country }), hrGet("/offices", { countryCode: country }), hrGet("/holidays", { countryCode: country, year: new Date().getFullYear() })]);
      setSettings({ ...s.data, payrollNotifyEmails: (s.data.payrollNotifyEmails || []).join(", ") }); setOffices(o.data); setHolidays(h.data);
    } catch (e) { toast.error(handleApiError(e, t("hr.loadFailed"))); }
  }, [country, t]);
  useEffect(() => { load(); }, [load]);

  const saveSettings = async () => { try { await hrSend("/settings", "PUT", { ...settings, countryCode: country }); toast.success(t("hr.saved")); } catch (e) { toast.error(handleApiError(e, t("hr.saveFailed"))); } };
  const upload = async (e, field) => { const file = e.target.files?.[0]; if (!file) return; setUploading(field); try { const r = await fileAPI.uploadImage(file); if (r?.data?.url) setSettings((s) => ({ ...s, [field]: r.data.url })); } catch { toast.error(t("hr.staff.uploadFailed")); } finally { setUploading(""); } };
  const saveOffice = async () => {
    try { const body = { ...office, lat: Number(office.lat), lng: Number(office.lng), radiusMeters: Number(office.radiusMeters), countryCode: country };
      if (office._id) await hrSend(`/offices/${office._id}`, "PUT", body); else await hrSend("/offices", "POST", body);
      toast.success(t("hr.saved")); setOffice(null); load(); } catch (e) { toast.error(handleApiError(e, t("hr.saveFailed"))); }
  };
  // Asks the browser for permission, then fills the office coordinates with the HR user's CURRENT position.
  const useMyLocation = () => {
    if (!navigator.geolocation) return toast.error(t("hr.geo.unsupported"));
    navigator.geolocation.getCurrentPosition(
      (p) => setOffice((o) => ({ ...o, lat: p.coords.latitude.toFixed(6), lng: p.coords.longitude.toFixed(6) })),
      (err) => toast.error(err.code === 1 ? t("hr.geo.denied") : t("hr.geo.failed")),
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 },
    );
  };
  const addHoliday = async () => { try { await hrSend("/holidays", "POST", { ...holiday, countryCode: country }); setHoliday({ name: "", date: "" }); load(); } catch (e) { toast.error(handleApiError(e, t("hr.saveFailed"))); } };
  const remove = async () => { try { await hrSend(`/${del.kind}/${del.id}`, "DELETE"); setDel(null); load(); } catch (e) { toast.error(handleApiError(e, t("hr.saveFailed"))); } };

  if (!settings || !offices) return <Spinner />;
  const set = (p) => setSettings((s) => ({ ...s, ...p }));
  const imgField = (field, label) => (
    <Field label={label}><div className="flex items-center gap-2">{settings[field] && <img src={settings[field]} alt="" className="h-10 max-w-[120px] rounded border bg-white object-contain" />}<input className={inputCls} placeholder="https://…" value={settings[field] || ""} onChange={(e) => set({ [field]: e.target.value })} /><label className={`${btnGhost} cursor-pointer`}><Upload className="h-4 w-4" />{uploading === field ? "…" : t("marketing.upload")}<input type="file" accept="image/png,image/jpeg" className="hidden" onChange={(e) => upload(e, field)} /></label></div></Field>
  );
  return (
    <div className="space-y-4">
      <Card title={t("hr.settings.payrollIdentity")}>
        <p className="mb-3 text-xs text-gray-500">{t("hr.settings.identityHint")}</p>
        <div className="grid gap-3 md:grid-cols-2">
          <Field label={t("hr.settings.companyName")}><input className={inputCls} maxLength={120} value={settings.companyName || ""} onChange={(e) => set({ companyName: e.target.value })} /></Field>
          <Field label={t("hr.settings.companyAddress")}><input className={inputCls} maxLength={300} value={settings.companyAddress || ""} onChange={(e) => set({ companyAddress: e.target.value })} /></Field>
          {imgField("logoUrl", t("hr.settings.logo"))}{imgField("signatureUrl", t("hr.settings.signature"))}
          <Field label={t("hr.settings.signerName")}><input className={inputCls} maxLength={100} value={settings.signerName || ""} onChange={(e) => set({ signerName: e.target.value })} /></Field>
          <Field label={t("hr.settings.signerTitle")}><input className={inputCls} maxLength={100} value={settings.signerTitle || ""} onChange={(e) => set({ signerTitle: e.target.value })} /></Field>
          <Field label={t("hr.settings.notifyEmails")} hint={t("hr.settings.notifyHint")}><input className={inputCls} value={settings.payrollNotifyEmails} onChange={(e) => set({ payrollNotifyEmails: e.target.value })} /></Field>
          <Field label={t("hr.settings.workingDays")}><input type="number" min="15" max="31" className={inputCls} value={settings.workingDaysPerMonth || 22} onChange={(e) => set({ workingDaysPerMonth: e.target.value })} /></Field>
          <Field label={t("hr.settings.footer")} className="md:col-span-2"><input className={inputCls} maxLength={300} value={settings.payslipFooter || ""} onChange={(e) => set({ payslipFooter: e.target.value })} /></Field>
        </div>
        {can.manage && <button type="button" className={`${btnPrimary} mt-3`} onClick={saveSettings}>{t("common.save")}</button>}
      </Card>

      <Card title={t("hr.settings.offices")} actions={can.manage && <button type="button" className={btnPrimary} onClick={() => setOffice(blankOffice())}><Plus className="h-4 w-4" />{t("hr.settings.addOffice")}</button>}>
        {office && (
          <div className="mb-4 rounded-lg border border-blue-200 p-3 dark:border-blue-900">
            <div className="grid gap-3 md:grid-cols-3">
              <Field label={t("hr.settings.officeName")}><input className={inputCls} maxLength={100} value={office.name} onChange={(e) => setOffice({ ...office, name: e.target.value })} /></Field>
              <Field label={t("hr.settings.officeAddress")} className="md:col-span-2"><input className={inputCls} maxLength={300} value={office.address} onChange={(e) => setOffice({ ...office, address: e.target.value })} /></Field>
              <Field label={t("hr.settings.lat")}><input className={inputCls} value={office.lat} onChange={(e) => setOffice({ ...office, lat: e.target.value })} /></Field>
              <Field label={t("hr.settings.lng")}><input className={inputCls} value={office.lng} onChange={(e) => setOffice({ ...office, lng: e.target.value })} /></Field>
              <div className="flex items-end"><button type="button" className={btnGhost} onClick={useMyLocation}><LocateFixed className="h-4 w-4" />{t("hr.settings.useMyLocation")}</button></div>
              <Field label={t("hr.settings.radius")} hint={t("hr.settings.radiusHint")}><input type="number" min="20" max="5000" className={inputCls} value={office.radiusMeters} onChange={(e) => setOffice({ ...office, radiusMeters: e.target.value })} /></Field>
              <Field label={t("hr.settings.officeNotify")} hint={t("hr.settings.officeNotifyHint")} className="md:col-span-2"><input className={inputCls} value={Array.isArray(office.notifyEmails) ? office.notifyEmails.join(", ") : office.notifyEmails} onChange={(e) => setOffice({ ...office, notifyEmails: e.target.value })} /></Field>
              <Toggle checked={office.enforceGeofence} onChange={(v) => setOffice({ ...office, enforceGeofence: v })} label={t("hr.settings.enforce")} />
              <Toggle checked={office.isActive} onChange={(v) => setOffice({ ...office, isActive: v })} label={t("hr.settings.active")} />
            </div>
            <div className="mt-3 flex gap-2"><button type="button" className={btnPrimary} disabled={!office.name || !office.lat || !office.lng} onClick={saveOffice}>{t("common.save")}</button><button type="button" className={btnGhost} onClick={() => setOffice(null)}>{t("common.cancel")}</button></div>
          </div>)}
        {offices.length === 0 ? <p className="text-sm text-gray-500">{t("hr.settings.noOffices")}</p> : (
          <ul className="divide-y dark:divide-gray-700">{offices.map((o) => (
            <li key={o._id} className="flex flex-wrap items-center gap-3 py-2 text-sm">
              <div className="min-w-[200px] flex-1"><div className="font-medium">{o.name} {!o.isActive && <span className="rounded bg-gray-200 px-1.5 text-xs">{t("hr.settings.inactive")}</span>}</div><div className="text-xs text-gray-500">{o.address} · {o.location.lat.toFixed(5)}, {o.location.lng.toFixed(5)} · {o.radiusMeters} m{o.enforceGeofence ? ` · ${t("hr.settings.enforced")}` : ""}</div><div className="text-xs text-gray-500">{(o.notifyEmails || []).join(", ")}</div></div>
              {can.manage && <><button type="button" className="text-blue-600 hover:underline" onClick={() => setOffice({ ...o, lat: o.location.lat, lng: o.location.lng, notifyEmails: (o.notifyEmails || []).join(", ") })}>{t("common.edit")}</button><button type="button" aria-label={t("common.delete")} className="p-1 text-red-600" onClick={() => setDel({ kind: "offices", id: o._id })}><Trash2 className="h-4 w-4" /></button></>}
            </li>))}</ul>)}
      </Card>

      <Card title={t("hr.settings.holidays")}>
        {can.manage && <div className="mb-3 flex flex-wrap items-end gap-2"><Field label={t("hr.settings.holidayName")}><input className={inputCls} maxLength={100} value={holiday.name} onChange={(e) => setHoliday({ ...holiday, name: e.target.value })} /></Field><Field label={t("common.date")}><input type="date" className={inputCls} value={holiday.date} onChange={(e) => setHoliday({ ...holiday, date: e.target.value })} /></Field><button type="button" className={btnPrimary} disabled={!holiday.name || !holiday.date} onClick={addHoliday}><Plus className="h-4 w-4" />{t("common.add")}</button></div>}
        {holidays.length === 0 ? <p className="text-sm text-gray-500">{t("hr.settings.noHolidays")}</p> : <ul className="grid gap-1 text-sm md:grid-cols-2">{holidays.map((h) => <li key={h._id} className="flex items-center justify-between rounded bg-gray-50 px-3 py-1.5 dark:bg-gray-700/40"><span>{h.date} — {h.name}</span>{can.manage && <button type="button" aria-label={t("common.delete")} className="text-red-600" onClick={() => setDel({ kind: "holidays", id: h._id })}><Trash2 className="h-4 w-4" /></button>}</li>)}</ul>}
      </Card>
      <ConfirmDialog open={!!del} danger title={t("hr.settings.deleteTitle")} body={t("hr.settings.deleteBody")} confirmLabel={t("common.delete")} cancelLabel={t("common.cancel")} onConfirm={remove} onCancel={() => setDel(null)} />
    </div>
  );
}
void btnDanger;
