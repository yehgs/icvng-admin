import React, { useCallback, useEffect, useState } from "react";
import toast from "react-hot-toast";
import { Check, X, Plus } from "lucide-react";
import { useAdminTranslation } from "../../hooks/useAdminTranslation.js";
import { handleApiError } from "../../utils/api";
import { Card, Field, inputCls, btnPrimary, btnGhost } from "../../components/campaign/ui.jsx";
import { useHr, hrGet, hrSend, Spinner } from "./hrApi.js";

const TONE = { PENDING: "bg-amber-100 text-amber-800", APPROVED: "bg-green-100 text-green-700", REJECTED: "bg-red-100 text-red-700", CANCELLED: "bg-gray-100 text-gray-600" };

export default function HrLeave() {
  const { t } = useAdminTranslation();
  const { country, meta, can } = useHr();
  const [status, setStatus] = useState("PENDING");
  const [rows, setRows] = useState(null);
  const [staff, setStaff] = useState([]);
  const [form, setForm] = useState(null);
  const load = useCallback(() => hrGet("/leave", { countryCode: country, status: status || undefined, limit: 50 }).then((r) => r.success && setRows(r.data)).catch((e) => toast.error(handleApiError(e, t("hr.loadFailed")))), [country, status, t]);
  useEffect(() => { setRows(null); load(); }, [load]);
  useEffect(() => { if (can.manage) hrGet("/staff", { countryCode: country, status: "ACTIVE", limit: 100 }).then((r) => r.success && setStaff(r.data)).catch(() => {}); }, [country, can.manage]);

  const decide = async (id, st) => { try { await hrSend(`/leave/${id}/decision`, "PUT", { status: st }); toast.success(t("hr.saved")); load(); } catch (e) { toast.error(handleApiError(e, t("hr.saveFailed"))); } };
  const create = async () => { try { await hrSend("/leave", "POST", form); toast.success(t("hr.saved")); setForm(null); load(); } catch (e) { toast.error(handleApiError(e, t("hr.saveFailed"))); } };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        {["PENDING", "APPROVED", "REJECTED", ""].map((s) => <button key={s} type="button" className={`${btnGhost} ${status === s ? "ring-2 ring-blue-500" : ""}`} onClick={() => setStatus(s)}>{s ? t(`hr.leave.status.${s}`) : t("hr.all")}</button>)}
        {can.manage && <button type="button" className={`${btnPrimary} ml-auto`} onClick={() => setForm({ staffId: "", type: "ANNUAL", from: "", to: "", reason: "" })}><Plus className="h-4 w-4" />{t("hr.leave.record")}</button>}
      </div>
      {form && (
        <Card title={t("hr.leave.record")}>
          <div className="grid gap-3 md:grid-cols-5">
            <Field label={t("hr.staff.one")}><select className={inputCls} value={form.staffId} onChange={(e) => setForm({ ...form, staffId: e.target.value })}><option value="" />{staff.map((s) => <option key={s._id} value={s._id}>{s.fullName}</option>)}</select></Field>
            <Field label={t("hr.leave.type")}><select className={inputCls} value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })}>{meta.enums.leaveTypes.map((x) => <option key={x} value={x}>{t(`hr.leave.types.${x}`)}</option>)}</select></Field>
            <Field label={t("hr.leave.from")}><input type="date" className={inputCls} value={form.from} onChange={(e) => setForm({ ...form, from: e.target.value })} /></Field>
            <Field label={t("hr.leave.to")}><input type="date" className={inputCls} value={form.to} min={form.from} onChange={(e) => setForm({ ...form, to: e.target.value })} /></Field>
            <Field label={t("hr.leave.reason")}><input className={inputCls} maxLength={500} value={form.reason} onChange={(e) => setForm({ ...form, reason: e.target.value })} /></Field>
          </div>
          <div className="mt-3 flex gap-2"><button type="button" className={btnPrimary} disabled={!form.staffId || !form.from || !form.to} onClick={create}>{t("common.save")}</button><button type="button" className={btnGhost} onClick={() => setForm(null)}>{t("common.cancel")}</button></div>
        </Card>)}
      {!rows ? <Spinner /> : (
        <div className="overflow-x-auto rounded-xl border border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-800">
          <table className="w-full text-left text-sm"><thead className="border-b text-xs uppercase text-gray-500 dark:border-gray-700"><tr><th className="p-3">{t("hr.staff.one")}</th><th className="p-3">{t("hr.leave.type")}</th><th className="p-3">{t("hr.leave.period")}</th><th className="p-3">{t("hr.leave.days")}</th><th className="p-3">{t("common.status")}</th><th /></tr></thead>
            <tbody>
              {rows.length === 0 && <tr><td colSpan={6} className="p-6 text-center text-gray-500">{t("hr.leave.none")}</td></tr>}
              {rows.map((r) => (
                <tr key={r._id} className="border-b last:border-0 dark:border-gray-700">
                  <td className="p-3"><div className="font-medium">{r.staffId?.fullName}</div><div className="text-xs text-gray-500">{r.reason}</div></td>
                  <td className="p-3">{t(`hr.leave.types.${r.type}`)}</td><td className="p-3">{r.from} → {r.to}</td><td className="p-3">{r.days}</td>
                  <td className="p-3"><span className={`rounded-full px-2 py-0.5 text-xs ${TONE[r.status]}`}>{t(`hr.leave.status.${r.status}`)}</span></td>
                  <td className="p-3 text-right">{can.manage && r.status === "PENDING" && <span className="inline-flex gap-1"><button type="button" aria-label={t("hr.leave.approve")} className="rounded p-1.5 text-green-700 hover:bg-green-50" onClick={() => decide(r._id, "APPROVED")}><Check className="h-4 w-4" /></button><button type="button" aria-label={t("hr.leave.reject")} className="rounded p-1.5 text-red-700 hover:bg-red-50" onClick={() => decide(r._id, "REJECTED")}><X className="h-4 w-4" /></button></span>}</td>
                </tr>))}
            </tbody></table>
        </div>)}
    </div>
  );
}
