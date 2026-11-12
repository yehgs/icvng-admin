import React, { useCallback, useEffect, useState } from "react";
import toast from "react-hot-toast";
import { MapPin, Home, AlertTriangle, Plus } from "lucide-react";
import { useAdminTranslation } from "../../hooks/useAdminTranslation.js";
import { handleApiError } from "../../utils/api";
import { Card, Field, inputCls, btnPrimary, btnGhost } from "../../components/campaign/ui.jsx";
import { useHr, hrGet, hrSend, Spinner } from "./hrApi.js";

const today = () => new Date().toISOString().slice(0, 10);

export default function HrAttendance() {
  const { t } = useAdminTranslation();
  const { country, can } = useHr();
  const [view, setView] = useState("day");
  const [date, setDate] = useState(today());
  const [period, setPeriod] = useState(today().slice(0, 7));
  const [flagged, setFlagged] = useState(false);
  const [rows, setRows] = useState(null);
  const [summary, setSummary] = useState(null);
  const [staff, setStaff] = useState([]);
  const [manual, setManual] = useState(null);

  const load = useCallback(async () => {
    try {
      if (view === "day") { const r = await hrGet("/attendance", { countryCode: country, date, flagged: flagged || undefined, limit: 100 }); if (r.success) setRows(r.data); }
      else { const r = await hrGet("/attendance/summary", { countryCode: country, period }); if (r.success) setSummary(r.data.rows); }
    } catch (e) { toast.error(handleApiError(e, t("hr.loadFailed"))); }
  }, [view, date, period, flagged, country, t]);
  useEffect(() => { setRows(null); setSummary(null); load(); }, [load]);
  useEffect(() => { if (can.manage) hrGet("/staff", { countryCode: country, status: "ACTIVE", limit: 100 }).then((r) => r.success && setStaff(r.data)).catch(() => {}); }, [country, can.manage]);

  const saveManual = async () => {
    try { await hrSend("/attendance/manual", "POST", manual); toast.success(t("hr.saved")); setManual(null); load(); }
    catch (e) { toast.error(handleApiError(e, t("hr.saveFailed"))); }
  };
  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        {["day", "month"].map((v) => <button key={v} type="button" className={`${btnGhost} ${view === v ? "ring-2 ring-blue-500" : ""}`} onClick={() => setView(v)}>{t(`hr.att.${v}`)}</button>)}
        {view === "day" ? <input type="date" className={`${inputCls} w-auto`} value={date} onChange={(e) => setDate(e.target.value)} /> : <input type="month" className={`${inputCls} w-auto`} value={period} onChange={(e) => setPeriod(e.target.value)} />}
        {view === "day" && <label className="inline-flex items-center gap-2 text-sm"><input type="checkbox" checked={flagged} onChange={(e) => setFlagged(e.target.checked)} />{t("hr.att.flaggedOnly")}</label>}
        {can.manage && <button type="button" className={`${btnPrimary} ml-auto`} onClick={() => setManual({ staffId: "", date: today(), type: "OFFICE", note: "" })}><Plus className="h-4 w-4" />{t("hr.att.manual")}</button>}
      </div>

      {manual && (
        <Card title={t("hr.att.manual")}>
          <div className="grid gap-3 md:grid-cols-4">
            <Field label={t("hr.staff.one")}><select className={inputCls} value={manual.staffId} onChange={(e) => setManual({ ...manual, staffId: e.target.value })}><option value="" />{staff.map((s) => <option key={s._id} value={s._id}>{s.fullName}</option>)}</select></Field>
            <Field label={t("common.date")}><input type="date" max={today()} className={inputCls} value={manual.date} onChange={(e) => setManual({ ...manual, date: e.target.value })} /></Field>
            <Field label={t("hr.att.type")}><select className={inputCls} value={manual.type} onChange={(e) => setManual({ ...manual, type: e.target.value })}>{["OFFICE", "REMOTE", "LEAVE", "HOLIDAY", "ABSENT"].map((x) => <option key={x} value={x}>{t(`hr.att.types.${x}`)}</option>)}</select></Field>
            <Field label={t("hr.att.note")}><input className={inputCls} maxLength={300} value={manual.note} onChange={(e) => setManual({ ...manual, note: e.target.value })} /></Field>
          </div>
          <div className="mt-3 flex gap-2"><button type="button" className={btnPrimary} disabled={!manual.staffId} onClick={saveManual}>{t("common.save")}</button><button type="button" className={btnGhost} onClick={() => setManual(null)}>{t("common.cancel")}</button></div>
        </Card>
      )}

      {view === "day" && (rows ? (
        <div className="overflow-x-auto rounded-xl border border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-800">
          <table className="w-full text-left text-sm"><thead className="border-b text-xs uppercase text-gray-500 dark:border-gray-700"><tr><th className="p-3">{t("hr.staff.one")}</th><th className="p-3">{t("hr.att.type")}</th><th className="p-3">{t("hr.att.time")}</th><th className="p-3">{t("hr.att.location")}</th></tr></thead>
            <tbody>
              {rows.length === 0 && <tr><td colSpan={4} className="p-6 text-center text-gray-500">{t("hr.att.none")}</td></tr>}
              {rows.map((r) => (
                <tr key={r._id} className="border-b last:border-0 dark:border-gray-700">
                  <td className="p-3"><div className="font-medium">{r.staffId?.fullName}</div><div className="text-xs text-gray-500">{r.staffId?.employeeId} · {t(`hr.workMode.${r.workModeAtTime || r.staffId?.employment?.workMode}`)}</div></td>
                  <td className="p-3"><span className="inline-flex items-center gap-1">{r.type === "OFFICE" ? <MapPin className="h-3.5 w-3.5 text-green-600" /> : <Home className="h-3.5 w-3.5 text-indigo-600" />}{t(`hr.att.types.${r.type}`)}</span></td>
                  <td className="p-3 text-gray-600">{r.checkInAt ? new Date(r.checkInAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : "—"}{r.checkOutAt ? ` → ${new Date(r.checkOutAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}` : ""}</td>
                  <td className="p-3 text-xs">
                    {r.officeId?.name && <div className="font-medium">{r.officeId.name}{r.geo?.distanceMeters != null ? ` · ${r.geo.distanceMeters} m` : ""}</div>}
                    {r.geo?.address && <div className="text-gray-500">{r.geo.address}</div>}
                    {r.flags?.filter((f) => f !== "MANUAL_ENTRY").map((f) => <span key={f} className="mr-1 inline-flex items-center gap-1 rounded bg-amber-100 px-1.5 py-0.5 text-amber-800"><AlertTriangle className="h-3 w-3" />{t(`hr.att.flags.${f}`)}</span>)}
                    {r.manual && <span className="rounded bg-gray-100 px-1.5 py-0.5 dark:bg-gray-700">{t("hr.att.manualTag")}</span>}
                  </td>
                </tr>))}
            </tbody></table>
        </div>) : <Spinner />)}

      {view === "month" && (summary ? (
        <div className="overflow-x-auto rounded-xl border border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-800">
          <table className="w-full text-left text-sm"><thead className="border-b text-xs uppercase text-gray-500 dark:border-gray-700"><tr><th className="p-3">{t("hr.staff.one")}</th><th className="p-3">{t("hr.staff.workMode")}</th><th className="p-3 text-right">{t("hr.att.office")}</th><th className="p-3 text-right">{t("hr.att.remote")}</th><th className="p-3 text-right">{t("hr.att.leave")}</th><th className="p-3 text-right">{t("hr.att.absent")}</th><th className="p-3 text-right">{t("hr.att.flagged")}</th></tr></thead>
            <tbody>{summary.map((s) => <tr key={s.staffId} className="border-b last:border-0 dark:border-gray-700"><td className="p-3"><div className="font-medium">{s.fullName}</div><div className="text-xs text-gray-500">{s.employeeId}</div></td><td className="p-3">{t(`hr.workMode.${s.workMode}`)}</td><td className="p-3 text-right">{s.officeDays}</td><td className="p-3 text-right">{s.remoteDays}</td><td className="p-3 text-right">{s.leaveDays}</td><td className={`p-3 text-right ${s.absentDays ? "font-semibold text-red-600" : ""}`}>{s.absentDays}</td><td className="p-3 text-right">{s.flagged || "—"}</td></tr>)}</tbody></table>
        </div>) : <Spinner />)}
    </div>
  );
}
